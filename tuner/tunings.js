// Catálogo de afinaciones del afinador.
//
// Forma de cada entrada de instrumento:
//   { name: string, variants: Variant[] }
// Variant:
//   { id: string, name: string, strings: StringDef[] }
// StringDef (de la cuerda más grave a la más aguda):
//   { note: string, freq: number, altNotes?: { note: string, freq: number }[] }
//
// - `note`/`freq`: nota científica y frecuencia de referencia (A4 = 440 Hz) de la cuerda.
// - `altNotes`: octavas alternativas igualmente válidas para esa cuerda. Úsalo cuando el
//   instrumento tiene cuerdas reentrantes o variación real de octava entre ejemplares
//   (p. ej. el Cuatro Venezolano: su cuerda B suena como B3 o como B2 según el cuatro).
//
// Para agregar un nuevo instrumento: añade una entrada hermana de CUATRO_VENEZOLANO con
// su propio `name` y `variants`, y regístrala en INSTRUMENTS. Si pasas a tener más de
// un instrumento, ajusta tuner-ui.js para mostrar también un selector de instrumento
// (hoy, al ser MVP de un solo instrumento, solo se muestra el selector de afinación).

export const CUATRO_VENEZOLANO = {
  name: 'Cuatro Venezolano',
  variants: [
    {
      id: 'estandar',
      name: 'Estándar (B E A D)',
      strings: [
        { note: 'B3', freq: 246.94, altNotes: [{ note: 'B2', freq: 123.47 }] },
        { note: 'E3', freq: 164.81 },
        { note: 'A3', freq: 220.00 },
        { note: 'D4', freq: 293.66 },
      ],
    },
    {
      id: 'llanero',
      name: 'Llanero (A D F# B)',
      strings: [
        { note: 'A3', freq: 220.00 },
        { note: 'D4', freq: 293.66 },
        { note: 'F#4', freq: 369.99 },
        { note: 'B3', freq: 246.94 },
      ],
    },
  ],
};

export const INSTRUMENTS = [CUATRO_VENEZOLANO];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Convierte una frecuencia detectada a la nota científica más cercana y su
// desviación en cents respecto a esa nota (afinación estándar A4 = 440 Hz).
export function freqToNote(freq) {
  const midi = 69 + 12 * Math.log2(freq / 440);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { name: `${name}${octave}`, cents, midi: rounded };
}

const MATCH_TOLERANCE_HZ = 15;

// Indica si una frecuencia detectada corresponde a la cuerda dada, comparando
// tanto contra su frecuencia principal como contra sus octavas alternativas.
export function matchString(detectedFreq, stringDef) {
  const candidates = [{ freq: stringDef.freq }, ...(stringDef.altNotes ?? [])];
  return candidates.some((c) => Math.abs(c.freq - detectedFreq) <= MATCH_TOLERANCE_HZ);
}
