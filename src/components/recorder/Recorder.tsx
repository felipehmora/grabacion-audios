import { useEffect } from 'react';
import { Mic } from 'lucide-react';
import { AudioEntry, useRecorder } from '@/hooks/useRecorder';
import { AudioPlayer } from './AudioPlayer';
import styles from './Recorder.module.css';

const AUDIOS_PER_PAGE = 5;

interface Props {
  recordings: AudioEntry[];
  isRecording: boolean;
  page: number;
  totalPages: number;
  onInit: () => Promise<void>;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onTranscribe: (entry: AudioEntry) => void;
  onPageChange: (page: number) => void;
}

export function Recorder({
  recordings,
  isRecording,
  page,
  totalPages,
  onInit,
  onToggle,
  onDelete,
  onTranscribe,
  onPageChange,
}: Props) {
  useEffect(() => {
    onInit();
  }, [onInit]);

  const pageRecordings = recordings.slice(
    (page - 1) * AUDIOS_PER_PAGE,
    page * AUDIOS_PER_PAGE
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.viewTitle}>Grabadora</h1>

      <button
        className={`${styles.micBtn} ${isRecording ? styles.recording : ''}`}
        onClick={onToggle}
        type="button"
        aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
      >
        <Mic size={64} />
      </button>

      {recordings.length === 0 ? (
        <p className={styles.empty}>
          Presiona el micrófono para grabar un audio.
        </p>
      ) : (
        <>
          <div className={styles.list}>
            {pageRecordings.map((entry, i) => (
              <AudioPlayer
                key={entry.id}
                entry={entry}
                index={(page - 1) * AUDIOS_PER_PAGE + i}
                onDelete={() => onDelete(entry.id)}
                onTranscribe={() => onTranscribe(entry)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                type="button"
              >
                ←
              </button>
              <span className={styles.pageIndicator}>
                {page} / {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                type="button"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
