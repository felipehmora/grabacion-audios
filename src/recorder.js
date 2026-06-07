import { recordedAudios, state, AUDIOS_PER_PAGE } from './state.js';
import { renderPage } from './pagination.js';

const mic_btn = document.querySelector("#mic");

let can_record = false;
let is_recording = false;
let recorder = null;
let chunks = [];

export function SetUpAudio() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(SetUpStream)
      .catch((err) => console.log(err));
  }
}

function SetUpStream(stream) {
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = function (e) {
    chunks.push(e.data);
  };

  recorder.onstop = function () {
    let blob = new Blob(chunks, { type: "audio/webm" });
    chunks = [];
    displayAudio(blob);
  };

  can_record = true;
}

export function ToogleMic() {
  if (!can_record) return;

  is_recording = !is_recording;

  if (is_recording) {
    recorder.start();
    mic_btn.classList.add("recording");
  } else {
    recorder.stop();
    mic_btn.classList.remove("recording");
  }
}

function displayAudio(blob) {
  recordedAudios.push({ blob, transcript: null, transcribing: false });
  const totalPages = Math.ceil(recordedAudios.length / AUDIOS_PER_PAGE);
  state.currentPage = totalPages;
  if (!state.transcriptsViewOpen) renderPage();
}

mic_btn.addEventListener("click", ToogleMic);
