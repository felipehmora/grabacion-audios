// AudioWorkletProcessor del afinador. Corre en el hilo de audio realtime
// (AudioWorkletGlobalScope): acumula muestras y las envía al hilo principal.

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
        this.port.postMessage({ buffer: this._buffer.slice(), sampleRate });
        this._writeIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
