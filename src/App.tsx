import { useState, useCallback } from 'react';
import { Nav, View } from './components/shared/Nav';
import { Tuner } from './components/tuner/Tuner';
import { Recorder } from './components/recorder/Recorder';
import { TranscriptView } from './components/transcripts/TranscriptView';
import { useRecorder, AudioEntry } from './hooks/useRecorder';
import { useTranscriber } from './hooks/useTranscriber';
import { toastSuccess, toastError } from './lib/toast';
import styles from './App.module.css';

const AUDIOS_PER_PAGE = 5;

export function App() {
  const [view, setView] = useState<View>('tuner');
  const [page, setPage] = useState(1);

  const {
    isRecording,
    recordings,
    init,
    toggleRecording,
    deleteRecording,
    updateRecording,
  } = useRecorder();

  const { transcribe } = useTranscriber();

  const totalPages = Math.max(1, Math.ceil(recordings.length / AUDIOS_PER_PAGE));

  const handleTranscribe = useCallback(
    async (entry: AudioEntry) => {
      updateRecording(entry.id, { transcribing: true });
      try {
        const text = await transcribe(entry.blob);
        updateRecording(entry.id, { transcript: text, transcribing: false });
        toastSuccess('Transcripción completada');
      } catch (msg) {
        updateRecording(entry.id, { transcribing: false });
        toastError(`Error al transcribir: ${msg}`);
      }
    },
    [transcribe, updateRecording]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteRecording(id);
      const newTotal = Math.max(1, Math.ceil((recordings.length - 1) / AUDIOS_PER_PAGE));
      if (page > newTotal) setPage(newTotal);
    },
    [deleteRecording, recordings.length, page]
  );

  return (
    <div className={styles.app}>
      <Nav view={view} onViewChange={setView} />

      <main className={styles.content}>
        {view === 'tuner' && <Tuner />}

        {view === 'recorder' && (
          <Recorder
            recordings={recordings}
            isRecording={isRecording}
            page={page}
            totalPages={totalPages}
            onInit={init}
            onToggle={toggleRecording}
            onDelete={handleDelete}
            onTranscribe={handleTranscribe}
            onPageChange={setPage}
          />
        )}

        {view === 'transcripts' && <TranscriptView recordings={recordings} />}
      </main>
    </div>
  );
}
