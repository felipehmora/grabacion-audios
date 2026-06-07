import { recordedAudios } from './state.js';
import { transcribeAudio } from './transcription.js';

export const ICON_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
export const ICON_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

export function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function createPlayer(audioElement, audioIndex) {
  const player = document.createElement("div");
  player.classList.add("player");

  const playBtn = document.createElement("button");
  playBtn.classList.add("player-play-btn");
  playBtn.innerHTML = ICON_PLAY;

  const track = document.createElement("div");
  track.classList.add("player-progress-track");
  const fill = document.createElement("div");
  fill.classList.add("player-progress-fill");
  track.appendChild(fill);

  const time = document.createElement("span");
  time.classList.add("player-time");
  time.textContent = "0:00 / 0:00";

  player.appendChild(playBtn);
  player.appendChild(track);
  player.appendChild(time);

  playBtn.addEventListener("click", () => {
    document.querySelectorAll("audio.playback").forEach(a => {
      if (a !== audioElement) a.pause();
    });
    audioElement.paused ? audioElement.play() : audioElement.pause();
  });

  audioElement.addEventListener("loadedmetadata", () => {
    time.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
  });

  audioElement.addEventListener("play",  () => { playBtn.innerHTML = ICON_PAUSE; });
  audioElement.addEventListener("pause", () => { playBtn.innerHTML = ICON_PLAY; });
  audioElement.addEventListener("ended", () => {
    playBtn.innerHTML = ICON_PLAY;
    fill.style.width = "0%";
    time.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
  });
  audioElement.addEventListener("timeupdate", () => {
    if (!audioElement.duration) return;
    fill.style.width = `${(audioElement.currentTime / audioElement.duration) * 100}%`;
    time.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
  });

  track.addEventListener("click", (e) => {
    if (!audioElement.duration) return;
    const rect = track.getBoundingClientRect();
    audioElement.currentTime = ((e.clientX - rect.left) / rect.width) * audioElement.duration;
  });

  // Botón y área de transcripción
  const transcribeBtn = document.createElement('button');
  transcribeBtn.classList.add('transcribe-btn');

  const transcriptEl = document.createElement('p');
  transcriptEl.classList.add('transcript-text');
  transcriptEl.style.display = 'none';

  const audioData = recordedAudios[audioIndex];
  if (audioData?.transcript) {
    transcribeBtn.textContent = 'Transcrito ✓';
    transcribeBtn.disabled = true;
    transcriptEl.textContent = audioData.transcript;
    transcriptEl.style.display = 'block';
  } else {
    transcribeBtn.textContent = 'Transcribir';
    transcribeBtn.addEventListener('click', () => transcribeAudio(audioIndex, transcribeBtn, transcriptEl));
  }

  player._transcribeBtn = transcribeBtn;
  player._transcriptEl = transcriptEl;

  return player;
}
