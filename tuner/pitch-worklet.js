// AudioWorkletProcessor del afinador. Corre en el hilo de audio realtime
// (AudioWorkletGlobalScope), por lo que debe permanecer ligero: solo acumula
// las muestras entrantes en un buffer de tamaño fijo y, al llenarse, lo envía
// al hilo principal vía postMessage. El cálculo de pitch (MPM, costoso) se
// hace deliberadamente fuera de aquí, en tuner.js — ver pitch-detector.js.

const BUFFER_SIZE = 4096;

class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(BUFFER_SIZE);
    this._writeIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    const channel = input && input[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._writeIndex++] = channel[i];

      if (this._writeIndex === BUFFER_SIZE) {
        // Copia del buffer: postMessage con transferable dejaría el array
        // "neutered" y no podríamos seguir escribiendo en él.
        this.port.postMessage({ buffer: this._buffer.slice(), sampleRate });
        this._writeIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
