import { recordedAudios } from './state.js';

export const worker = new Worker('../transcribe-worker.js', { type: 'module' });
export const pendingTranscriptions = {};

worker.onmessage = ({ data }) => {
  const { id, status, text, message } = data;
  const pending = pendingTranscriptions[id];
  if (!pending) return;

  const { audioIndex, btn, el } = pending;
  const audioData = recordedAudios[audioIndex];

  if (status === 'transcribing') {
    btn.textContent = 'Transcribiendo...';
  } else if (status === 'done') {
    audioData.transcript = text;
    audioData.transcribing = false;
    btn.textContent = 'Transcrito ✓';
    el.textContent = text;
    el.style.display = 'block';
    delete pendingTranscriptions[id];
    Toastify({
      text: 'Transcripción completada',
      duration: 3000,
      gravity: 'bottom',
      position: 'right',
      style: { background: '#4a3f35' },
    }).showToast();
  } else if (status === 'error') {
    audioData.transcribing = false;
    btn.disabled = false;
    btn.textContent = 'Transcribir';
    delete pendingTranscriptions[id];
    Toastify({
      text: `Error al transcribir: ${message}`,
      duration: 5000,
      gravity: 'bottom',
      position: 'right',
      style: { background: '#c0392b' },
    }).showToast();
  }
};

export async function blobToFloat32(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  const data = audioBuffer.getChannelData(0);
  ctx.close();
  return data;
}

export async function transcribeAudio(audioIndex, btn, el) {
  const audioData = recordedAudios[audioIndex];
  if (!audioData || audioData.transcribing) return;

  audioData.transcribing = true;
  btn.disabled = true;
  btn.textContent = 'Cargando modelo...';

  try {
    const audio = await blobToFloat32(audioData.blob);
    const id = `${Date.now()}_${audioIndex}`;
    pendingTranscriptions[id] = { audioIndex, btn, el };
    worker.postMessage({ id, audio });
  } catch (err) {
    audioData.transcribing = false;
    btn.disabled = false;
    btn.textContent = 'Transcribir';
    Toastify({
      text: `Error al preparar audio: ${err.message}`,
      duration: 5000,
      gravity: 'bottom',
      position: 'right',
      style: { background: '#c0392b' },
    }).showToast();
  }
}
