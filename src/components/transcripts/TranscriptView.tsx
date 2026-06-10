import { AudioEntry } from '@/hooks/useRecorder';
import styles from './TranscriptView.module.css';

interface Props {
  recordings: AudioEntry[];
}

export function TranscriptView({ recordings }: Props) {
  const withTranscripts = recordings.filter((r) => r.transcript);

  return (
    <div className={styles.container}>
      <h1 className={styles.viewTitle}>Transcripciones</h1>

      {withTranscripts.length === 0 ? (
        <p className={styles.empty}>
          No hay transcripciones aún.
          <br />
          Ve a la Grabadora, graba un audio y pulsa «Transcribir».
        </p>
      ) : (
        <div className={styles.list}>
          {withTranscripts.map((entry, i) => (
            <div key={entry.id} className={styles.card}>
              <span className={styles.label}>Audio {i + 1}</span>
              <p className={styles.text}>{entry.transcript}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
