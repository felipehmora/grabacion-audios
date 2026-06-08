# Afinador

Vista de afinador cromático, independiente del grabador, con detección de tono
en tiempo real mediante el algoritmo MPM (McLeod Pitch Method). El alcance
actual (MVP) cubre únicamente el **Cuatro Venezolano** (afinaciones Estándar y
Llanero); el resto de instrumentos contemplados originalmente en el issue
NV-002 quedó fuera de este alcance y puede agregarse incrementalmente sobre
esta misma base — ver "Cómo agregar una nueva afinación" más abajo.

## Arquitectura / pipeline de audio

```
getUserMedia({ echoCancellation: false, noiseSuppression: false, autoGainControl: false })
  → MediaStreamSource → AnalyserNode (fftSize 8192)
                      → AudioWorkletNode (pitch-worklet.js, buffer 4096 muestras)
                          → postMessage → detectPitch (MPM, hilo principal)
                              → smoothing EMA (α = 0.2) → UI
```

El `AudioContext` del afinador es un **singleton independiente** del
`MediaRecorder` que usa el grabador (`src/recorder.js`) — ambos pipelines no se
tocan entre sí. Nada se conecta a `destination`, para evitar realimentación
acústica del micrófono hacia los parlantes.

**Por qué el MPM corre en el hilo principal y no dentro del worklet**: el
`AudioWorkletProcessor` corre en `AudioWorkletGlobalScope`, un hilo realtime
donde un cálculo costoso (la NSDF del MPM es O(n²)) puede producir *glitches*
de audio. Por eso `pitch-worklet.js` se limita a acumular muestras en un buffer
de 4096 y enviarlas con `port.postMessage`; `pitch-detector.js` es una función
**pura** `(buffer, sampleRate) => frequency|null` que se invoca desde el hilo
principal (en `tuner.js`, dentro de `worklet.port.onmessage`). Esto además
permite testear el algoritmo de forma aislada con buffers sintéticos.

### Rol de cada archivo

| Archivo | Responsabilidad |
| --- | --- |
| `pitch-detector.js` | Función pura: implementa MPM (NSDF, peak picking, interpolación parabólica). Sin DOM, sin Web Audio API. |
| `pitch-worklet.js` | `AudioWorkletProcessor` que acumula muestras y las pasa al hilo principal. Debe cargarse como módulo separado (`audioContext.audioWorklet.addModule(...)`) — requisito de la Web Audio API. |
| `tunings.js` | Catálogo de datos: instrumentos → variantes → cuerdas, más los helpers `freqToNote` (frecuencia → nota + cents) y `matchString` (¿esta frecuencia corresponde a esta cuerda?). |
| `tuner.js` | Clase `Tuner`: gestiona el ciclo de vida del `AudioContext`/`AudioWorkletNode`/`getUserMedia`, aplica el suavizado EMA y expone `start()`/`stop()`. Sin DOM. |
| `tuner-ui.js` | Capa de DOM/SVG: gauge de afinación, display de nota/frecuencia, selector de afinación, indicador de cuerdas activas. Conecta con `Tuner` y `tunings.js`. |

### Ciclo de vida y liberación de recursos

- `tuner.start()` solo debe invocarse de forma síncrona dentro de un gesto de
  usuario (click en "Iniciar afinador"), nunca al navegar a la vista — los
  navegadores (especialmente iOS Safari) bloquean la creación de
  `AudioContext`/`getUserMedia` fuera de un user gesture.
- `nav.js` invoca `hideTuner()` (que llama a `tuner.stop()`) cada vez que se
  abandona la vista del afinador. `stop()` detiene los tracks del stream
  (`stream.getTracks().forEach(t => t.stop())`, lo único que realmente libera
  el micrófono a nivel de navegador/SO) y cierra el `AudioContext`.

## Cómo agregar una nueva afinación o instrumento

`tunings.js` está diseñado como un catálogo extensible. La forma de cada
entrada de instrumento es:

```js
{
  name: 'Nombre del instrumento',
  variants: [
    {
      id: 'identificador-unico',
      name: 'Nombre visible (p. ej. "Standard (E A D G B e)")',
      strings: [
        // de la cuerda más grave a la más aguda
        { note: 'E2', freq: 82.41 },
        // ...
        // `altNotes` es opcional: úsalo cuando la cuerda admite más de una
        // octava válida (cuerdas reentrantes, variación real entre instrumentos)
        { note: 'B3', freq: 246.94, altNotes: [{ note: 'B2', freq: 123.47 }] },
      ],
    },
  ],
}
```

Pasos para agregar un nuevo instrumento:

1. Define una constante hermana de `CUATRO_VENEZOLANO` con su `name` y
   `variants`, y agrégala a `INSTRUMENTS`.
2. **Importante**: en cuanto `INSTRUMENTS` tenga más de una entrada, hay que
   ajustar `tuner-ui.js` para mostrar también un selector de instrumento
   (selectores encadenados instrumento → afinación), ya que hoy — al ser MVP de
   un solo instrumento — solo se muestra el selector de afinación
   (`#tuner-tuning-select`, poblado directamente desde `CUATRO_VENEZOLANO.variants`).
   Esto implica también agregar el `<select>` correspondiente en `index.html`
   (`#tuner-view`) y los estilos asociados en `style.css`.
3. Si el rango de frecuencias del nuevo instrumento queda fuera de
   `MIN_FREQ`/`MAX_FREQ` definidos en `pitch-detector.js` (hoy acotados al
   rango del Cuatro Venezolano para reducir el costo del cálculo de NSDF),
   ajusta esas constantes para cubrirlo.

No es necesario tocar `pitch-detector.js`, `pitch-worklet.js` ni `tuner.js`
para agregar afinaciones — el algoritmo MPM y el pipeline de audio son
independientes del catálogo de instrumentos.
