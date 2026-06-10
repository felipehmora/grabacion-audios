import { useState, useRef, useCallback, useEffect } from 'react';
import { Tuner } from '@/lib/tuner';
import { freqToNote } from '@/lib/tunings';

export interface PitchState {
  note: string;
  cents: number;
  frequency: number;
}

export function usePitchDetector() {
  const tunerRef = useRef<Tuner | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [pitch, setPitch] = useState<PitchState | null>(null);

  const start = useCallback(async () => {
    if (!tunerRef.current) {
      tunerRef.current = new Tuner({
        onPitch: ({ frequency, rawFrequency }) => {
          const { name, cents } = freqToNote(frequency);
          setPitch({ note: name, cents, frequency: rawFrequency });
        },
        onError: () => {
          setIsActive(false);
          setPitch(null);
        },
      });
    }
    await tunerRef.current.start();
    setIsActive(tunerRef.current.isRunning);
  }, []);

  const stop = useCallback(async () => {
    await tunerRef.current?.stop();
    setIsActive(false);
    setPitch(null);
  }, []);

  // Libera el micrófono al desmontar el componente que usa el hook.
  useEffect(() => {
    return () => {
      tunerRef.current?.stop();
    };
  }, []);

  return { isActive, pitch, start, stop };
}
