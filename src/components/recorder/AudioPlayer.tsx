import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Trash2, FileText, Check } from 'lucide-react';
import { AudioEntry } from '@/hooks/useRecorder';
import styles from './AudioPlayer.module.css';

function formatTime(secs: number): string {
  if (isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface Props {
  entry: AudioEntry;
  index: number;
  onDelete: () => void;
  onTranscribe: () => void;
}

export function AudioPlayer({ entry, index, onDelete, onTranscribe }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioUrl = useMemo(() => URL.createObjectURL(entry.blob), [entry.blob]);

  useEffect(() => {
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.card}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
      />

      <div className={styles.header}>
        <span className={styles.label}>Audio {index + 1}</span>
        <button
          className={styles.deleteBtn}
          onClick={onDelete}
          aria-label="Eliminar audio"
          type="button"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className={styles.player}>
        <button
          className={styles.playBtn}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          type="button"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <div className={styles.track} onClick={handleTrackClick}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>

        <span className={styles.time}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className={styles.footer}>
        {entry.transcript ? (
          <>
            <span className={styles.transcribedLabel}>
              <Check size={12} /> Transcrito
            </span>
            <p className={styles.transcriptText}>{entry.transcript}</p>
          </>
        ) : (
          <button
            className={styles.transcribeBtn}
            onClick={onTranscribe}
            disabled={entry.transcribing}
            type="button"
          >
            <FileText size={12} />
            {entry.transcribing ? 'Transcribiendo…' : 'Transcribir'}
          </button>
        )}
      </div>
    </div>
  );
}
