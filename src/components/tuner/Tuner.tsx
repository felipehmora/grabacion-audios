import { useState } from 'react';
import { usePitchDetector } from '@/hooks/usePitchDetector';
import { CUATRO_VENEZOLANO, Instrument, TuningVariant } from '@/lib/tunings';
import { PitchGauge } from './PitchGauge';
import { StringSelector } from './StringSelector';
import { InstrumentPicker } from './InstrumentPicker';
import styles from './Tuner.module.css';

export function Tuner() {
  const { isActive, pitch, start, stop } = usePitchDetector();
  const [instrument, setInstrument] = useState<Instrument>(CUATRO_VENEZOLANO);
  const [variant, setVariant] = useState<TuningVariant>(CUATRO_VENEZOLANO.variants[0]);

  const handleToggle = async () => {
    if (isActive) await stop();
    else await start();
  };

  const cents = pitch?.cents ?? 0;
  const inTune = isActive && pitch != null && Math.abs(cents) <= 5;

  return (
    <div className={styles.container}>
      <h1 className={styles.viewTitle}>Afinador</h1>

      <div className={styles.card}>
        <InstrumentPicker
          instrument={instrument}
          variant={variant}
          onInstrumentChange={(i) => {
            setInstrument(i);
            setVariant(i.variants[0]);
          }}
          onVariantChange={setVariant}
        />

        <StringSelector
          strings={variant.strings}
          detectedFreq={isActive && pitch ? pitch.frequency : null}
        />

        <PitchGauge cents={isActive ? cents : 0} inTune={inTune} />

        <div className={styles.noteDisplay}>
          {isActive && pitch ? pitch.note : '—'}
        </div>
        <div className={styles.freqDisplay}>
          {isActive && pitch ? `${pitch.frequency.toFixed(1)} Hz` : '0.0 Hz'}
        </div>

        <button
          className={`${styles.startBtn} ${isActive ? styles.startBtnActive : ''}`}
          onClick={handleToggle}
          type="button"
        >
          {isActive ? 'Detener' : 'Iniciar afinador'}
        </button>
      </div>
    </div>
  );
}
