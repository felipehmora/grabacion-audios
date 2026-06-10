import { StringDef, matchString } from '@/lib/tunings';
import styles from './StringSelector.module.css';

interface Props {
  strings: StringDef[];
  detectedFreq: number | null;
}

export function StringSelector({ strings, detectedFreq }: Props) {
  return (
    <div className={styles.container}>
      {strings.map((s, i) => {
        const isActive =
          detectedFreq != null ? matchString(detectedFreq, s) : false;
        return (
          <span
            key={i}
            className={`${styles.chip} ${isActive ? styles.active : ''}`}
          >
            {s.note}
          </span>
        );
      })}
    </div>
  );
}
