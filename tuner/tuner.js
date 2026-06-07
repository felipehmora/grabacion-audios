// Motor de audio del afinador: gestiona su propio AudioContext, completamente
// independiente del MediaRecorder usado por el grabador (src/recorder.js).
// No toca el DOM — eso es responsabilidad de tuner-ui.js.

import { detectPitch } from './pitch-detector.js';

const SMOOTHING_ALPHA = 0.2;

export class Tuner {
  constructor({ onPitch, onError } = {}) {
    this._onPitch = onPitch;
    this._onError = onError;

    this._ctx = null;
    this._stream = null;
    this._source = null;
    this._analyser = null;
    this._worklet = null;
    this._smoothedFreq = null;
    this._running = false;
  }

  get isRunning() {
    return this._running;
  }

  // Debe invocarse de forma síncrona dentro de un gesto de usuario (click):
  // los navegadores (en particular iOS Safari) bloquean la creación/arranque
  // de AudioContext y getUserMedia fuera de un user gesture.
  async start() {
    if (this._running) return;

    try {
      this._ctx = new AudioContext();

      this._stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this._source = this._ctx.createMediaStreamSource(this._stream);

      this._analyser = this._ctx.createAnalyser();
      this._analyser.fftSize = 8192;

      await this._ctx.audioWorklet.addModule(new URL('./pitch-worklet.js', import.meta.url));
      this._worklet = new AudioWorkletNode(this._ctx, 'pitch-processor');
      this._worklet.port.onmessage = (event) => this._handleWorkletMessage(event.data);

      // Conectados solo entre sí: NUNCA a `destination`, para no producir
      // realimentación acústica del micrófono hacia los parlantes.
      this._source.connect(this._analyser);
      this._source.connect(this._worklet);

      this._smoothedFreq = null;
      this._running = true;
    } catch (err) {
      await this.stop();
      this._onError?.(err);
    }
  }

  // Idempotente: libera micrófono, nodos y AudioContext. Seguro de llamar
  // sin haber arrancado o más de una vez (p. ej. al cambiar de vista).
  async stop() {
    if (this._worklet) {
      this._worklet.port.onmessage = null;
      this._worklet.disconnect();
    }
    this._analyser?.disconnect();
    this._source?.disconnect();

    // Detener los tracks es lo que realmente libera el micrófono a nivel de
    // navegador/SO — cerrar el AudioContext por sí solo no basta.
    this._stream?.getTracks().forEach((track) => track.stop());

    if (this._ctx && this._ctx.state !== 'closed') {
      await this._ctx.close();
    }

    this._ctx = null;
    this._stream = null;
    this._source = null;
    this._analyser = null;
    this._worklet = null;
    this._smoothedFreq = null;
    this._running = false;
  }

  _handleWorkletMessage({ buffer, sampleRate }) {
    const rawFrequency = detectPitch(buffer, sampleRate);
    if (!rawFrequency) return;

    this._smoothedFreq =
      this._smoothedFreq == null
        ? rawFrequency
        : SMOOTHING_ALPHA * rawFrequency + (1 - SMOOTHING_ALPHA) * this._smoothedFreq;

    this._onPitch?.({ frequency: this._smoothedFreq, rawFrequency });
  }
}
