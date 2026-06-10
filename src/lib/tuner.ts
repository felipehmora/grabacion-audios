// Motor de audio del afinador. No toca el DOM.
// El AudioWorklet vive en public/pitch-worklet.js, servido como asset estático.

import { detectPitch } from './pitch-detector';

const SMOOTHING_ALPHA = 0.2;

interface PitchData {
  frequency: number;
  rawFrequency: number;
}

interface TunerCallbacks {
  onPitch?: (data: PitchData) => void;
  onError?: (err: Error) => void;
}

export class Tuner {
  private _onPitch?: (data: PitchData) => void;
  private _onError?: (err: Error) => void;

  private _ctx: AudioContext | null = null;
  private _stream: MediaStream | null = null;
  private _source: MediaStreamAudioSourceNode | null = null;
  private _analyser: AnalyserNode | null = null;
  private _worklet: AudioWorkletNode | null = null;
  private _smoothedFreq: number | null = null;
  private _running = false;

  constructor({ onPitch, onError }: TunerCallbacks = {}) {
    this._onPitch = onPitch;
    this._onError = onError;
  }

  get isRunning(): boolean {
    return this._running;
  }

  // Debe invocarse dentro de un gesto de usuario (iOS Safari requiere AudioContext
  // y getUserMedia dentro de un user gesture).
  async start(): Promise<void> {
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

      // pitch-worklet.js está en public/ y se sirve desde la raíz del origen.
      await this._ctx.audioWorklet.addModule('/pitch-worklet.js');
      this._worklet = new AudioWorkletNode(this._ctx, 'pitch-processor');
      this._worklet.port.onmessage = (event: MessageEvent) =>
        this._handleWorkletMessage(event.data);

      // Nunca conectar a destination para evitar realimentación del micrófono.
      this._source.connect(this._analyser);
      this._source.connect(this._worklet);

      this._smoothedFreq = null;
      this._running = true;
    } catch (err) {
      await this.stop();
      this._onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  async stop(): Promise<void> {
    if (this._worklet) {
      this._worklet.port.onmessage = null;
      this._worklet.disconnect();
    }
    this._analyser?.disconnect();
    this._source?.disconnect();

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

  private _handleWorkletMessage({ buffer, sampleRate }: { buffer: Float32Array; sampleRate: number }): void {
    const rawFrequency = detectPitch(buffer, sampleRate);
    if (!rawFrequency) return;

    this._smoothedFreq =
      this._smoothedFreq == null
        ? rawFrequency
        : SMOOTHING_ALPHA * rawFrequency + (1 - SMOOTHING_ALPHA) * this._smoothedFreq;

    this._onPitch?.({ frequency: this._smoothedFreq, rawFrequency });
  }
}
