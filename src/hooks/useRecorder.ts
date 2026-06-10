import { useState, useRef, useCallback } from 'react';

export interface AudioEntry {
  id: string;
  blob: Blob;
  transcript: string | null;
  transcribing: boolean;
}

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<AudioEntry[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const readyRef = useRef(false);

  const init = useCallback(async () => {
    if (readyRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        setRecordings((prev) => [
          ...prev,
          { id: crypto.randomUUID(), blob, transcript: null, transcribing: false },
        ]);
      };

      recorderRef.current = recorder;
      readyRef.current = true;
    } catch (err) {
      console.error('Micrófono no disponible:', err);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!readyRef.current || !recorderRef.current) return;
    recorderRef.current.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const deleteRecording = useCallback((id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRecording = useCallback((id: string, updates: Partial<AudioEntry>) => {
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  return {
    isRecording,
    recordings,
    init,
    toggleRecording,
    deleteRecording,
    updateRecording,
  };
}
