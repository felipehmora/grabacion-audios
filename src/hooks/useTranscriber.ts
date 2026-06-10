import { useRef, useCallback } from 'react';

interface Pending {
  resolve: (text: string) => void;
  reject: (msg: string) => void;
}

export function useTranscriber() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, Pending>>(new Map());

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      // transcribe-worker.js está en public/ y carga Whisper-Tiny vía CDN.
      const w = new Worker('/transcribe-worker.js', { type: 'module' });
      w.onmessage = ({ data }) => {
        const { id, status, text, message } = data as {
          id: string;
          status: 'transcribing' | 'done' | 'error';
          text?: string;
          message?: string;
        };
        const pending = pendingRef.current.get(id);
        if (!pending) return;

        if (status === 'done') {
          pending.resolve(text ?? '');
          pendingRef.current.delete(id);
        } else if (status === 'error') {
          pending.reject(message ?? 'Error desconocido');
          pendingRef.current.delete(id);
        }
      };
      workerRef.current = w;
    }
    return workerRef.current;
  }, []);

  const transcribe = useCallback(
    async (blob: Blob): Promise<string> => {
      const arrayBuffer = await blob.arrayBuffer();
      const ctx = new AudioContext({ sampleRate: 16000 });
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const audio = audioBuffer.getChannelData(0);
      await ctx.close();

      const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

      return new Promise<string>((resolve, reject) => {
        pendingRef.current.set(id, { resolve, reject });
        getWorker().postMessage({ id, audio });
      });
    },
    [getWorker]
  );

  return { transcribe };
}
