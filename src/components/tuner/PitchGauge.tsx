import styles from './PitchGauge.module.css';

const GAUGE_RANGE_CENTS = 50;
const GAUGE_RANGE_DEGREES = 90;
const IN_TUNE_CENTS = 5;

interface Props {
  cents: number;
  inTune: boolean;
}

export function PitchGauge({ cents, inTune }: Props) {
  const clamped = Math.max(-GAUGE_RANGE_CENTS, Math.min(GAUGE_RANGE_CENTS, cents));
  const angle = (clamped / GAUGE_RANGE_CENTS) * GAUGE_RANGE_DEGREES;
  const isInTune = inTune && Math.abs(cents) <= IN_TUNE_CENTS;

  return (
    <svg
      className={styles.gauge}
      viewBox="0 0 200 110"
      aria-hidden="true"
    >
      <path
        className={styles.track}
        d="M 10 100 A 90 90 0 0 1 190 100"
        fill="none"
        strokeWidth="8"
      />
      <line
        className={`${styles.needle} ${isInTune ? styles.inTune : ''}`}
        x1="100"
        y1="100"
        x2="100"
        y2="18"
        strokeWidth="3"
        strokeLinecap="round"
        style={{ transform: `rotate(${angle}deg)` }}
      />
      <circle className={styles.pivot} cx="100" cy="100" r="6" />
    </svg>
  );
}
