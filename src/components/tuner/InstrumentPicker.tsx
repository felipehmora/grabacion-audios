import { INSTRUMENTS, Instrument, TuningVariant } from '@/lib/tunings';
import styles from './InstrumentPicker.module.css';

interface Props {
  instrument: Instrument;
  variant: TuningVariant;
  onInstrumentChange: (instrument: Instrument) => void;
  onVariantChange: (variant: TuningVariant) => void;
}

export function InstrumentPicker({
  instrument,
  variant,
  onInstrumentChange,
  onVariantChange,
}: Props) {
  return (
    <div className={styles.container}>
      <select
        className={styles.select}
        value={instrument.name}
        onChange={(e) => {
          const found = INSTRUMENTS.find((i) => i.name === e.target.value);
          if (found) {
            onInstrumentChange(found);
            onVariantChange(found.variants[0]);
          }
        }}
        aria-label="Instrumento"
      >
        {INSTRUMENTS.map((i) => (
          <option key={i.name} value={i.name}>
            {i.name}
          </option>
        ))}
      </select>

      <select
        className={styles.select}
        value={variant.id}
        onChange={(e) => {
          const found = instrument.variants.find((v) => v.id === e.target.value);
          if (found) onVariantChange(found);
        }}
        aria-label="Afinación"
      >
        {instrument.variants.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}
