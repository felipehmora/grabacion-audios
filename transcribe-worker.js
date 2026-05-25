import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2/dist/transformers.min.js';

let transcriber = null;

self.onmessage = async ({ data: { id, audio } }) => {
  try {
    if (!transcriber) {
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        quantized: true,
      });
    }
    self.postMessage({ id, status: 'transcribing' });
    const result = await transcriber(audio, { language: 'spanish', task: 'transcribe' });
    self.postMessage({ id, status: 'done', text: result.text });
  } catch (err) {
    self.postMessage({ id, status: 'error', message: err.message });
  }
};
