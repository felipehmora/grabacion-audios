const mic_btn = document.querySelector("#mic");
const audio_container = document.querySelector(".audio-container");
const aside = document.querySelector("aside");
const deleteAudio = document.querySelectorAll(".playback");
const garbage = document.querySelector("#delete-button");
const paginationControls = document.querySelector("#pagination-controls");
const prevPageBtn = document.querySelector("#prev-page");
const nextPageBtn = document.querySelector("#next-page");
const pageIndicator = document.querySelector("#page-indicator");

const AUDIOS_PER_PAGE = 5;
let recordedAudios = [];
let currentPage = 1;
let draggingElement = null;
let draggingAudioIndex = null;
let transcriptsViewOpen = false;

const ICON_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
const ICON_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

// ——— Whisper (Transformers.js en browser) ———

const worker = new Worker('./transcribe-worker.js', { type: 'module' });
const pendingTranscriptions = {};

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

async function blobToFloat32(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext({ sampleRate: 16000 });
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  const data = audioBuffer.getChannelData(0);
  ctx.close();
  return data;
}

async function transcribeAudio(audioIndex, btn, el) {
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

// ——— Reproductor ———

function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function createPlayer(audioElement, audioIndex) {
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

// ——— Eventos de grabación y navegación ———

mic_btn.addEventListener("click", ToogleMic);

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(recordedAudios.length / AUDIOS_PER_PAGE);
  if (currentPage < totalPages) {
    currentPage++;
    renderPage();
  }
});

garbage.addEventListener("dragover", (e) => {
  e.preventDefault();
});

garbage.addEventListener("drop", (e) => {
  e.preventDefault();
  if (draggingElement && draggingAudioIndex !== null) {
    recordedAudios.splice(draggingAudioIndex, 1);
    draggingElement = null;
    draggingAudioIndex = null;
    garbage.classList.remove("drag-active");

    Toastify({
      text: "Audio eliminado",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      style: {
        background: "#ef4444",
      },
      stopOnFocus: true,
    }).showToast();

    const totalPages = Math.ceil(recordedAudios.length / AUDIOS_PER_PAGE);
    if (currentPage > totalPages) {
      currentPage = Math.max(1, totalPages);
    }
    renderPage();
  }
});

garbage.addEventListener("dragleave", () => {
  garbage.classList.remove("drag-active");
});

function changeHover() {
  console.log("hola soy change");
}

function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}

garbage.addEventListener("click", () => {
  console.log("hola mundo");
});

// ——— Vista de transcripciones (sidenav) ———

document.getElementById('nav-transcripciones').addEventListener('click', () => {
  transcriptsViewOpen = !transcriptsViewOpen;
  const transcriptsView = document.getElementById('transcripts-view');

  if (transcriptsViewOpen) {
    audio_container.style.display = 'none';
    paginationControls.style.display = 'none';
    transcriptsView.style.display = 'block';
    renderTranscriptsList();
  } else {
    transcriptsView.style.display = 'none';
    audio_container.style.display = 'flex';
    renderPage();
  }
  closeNav();
});

function renderTranscriptsList() {
  const list = document.getElementById('transcripts-list');
  const withTranscripts = recordedAudios.filter(a => a.transcript);

  if (withTranscripts.length === 0) {
    list.innerHTML = '<p class="no-transcripts">No hay transcripciones disponibles aún.<br>Graba un audio y haz clic en "Transcribir".</p>';
    return;
  }

  list.innerHTML = withTranscripts.map((a, i) =>
    `<div class="transcript-card">
       <span class="transcript-num">Audio ${i + 1}</span>
       <p>${a.transcript}</p>
     </div>`
  ).join('');
}

// ——— Setup de grabación ———

let can_record = false;
let is_recording = false;
let recorder = null;
let chunks = [];

function SetUpAudio() {
  console.log("Setup");
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(SetUpStream)
      .catch((err) => console.log(err));
  }
}

SetUpAudio();

function SetUpStream(stream) {
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = function (e) {
    console.log(e.data);
    chunks.push(e.data);
  };

  recorder.onstop = function () {
    let blob = new Blob(chunks, { type: "audio/webm" });
    chunks = [];
    displayAudio(blob);
  };

  can_record = true;
}

function ToogleMic() {
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
  console.log("display audio funciona");
  recordedAudios.push({ blob, transcript: null, transcribing: false });
  const totalPages = Math.ceil(recordedAudios.length / AUDIOS_PER_PAGE);
  currentPage = totalPages;
  if (!transcriptsViewOpen) renderPage();
}

function renderPage() {
  audio_container.innerHTML = "";

  if (recordedAudios.length === 0) {
    paginationControls.style.display = "none";
    return;
  }

  paginationControls.style.display = "flex";

  const startIndex = (currentPage - 1) * AUDIOS_PER_PAGE;
  const endIndex = startIndex + AUDIOS_PER_PAGE;
  const audiosForPage = recordedAudios.slice(startIndex, endIndex);

  audiosForPage.forEach((audioData, pageIndex) => {
    const realIndex = startIndex + pageIndex;
    const audioURL = window.URL.createObjectURL(audioData.blob);
    const audioElement = document.createElement("audio");
    const wrapper = document.createElement("div");

    wrapper.classList.add("playback-wrapper");
    wrapper.draggable = true;
    audio_container.appendChild(wrapper);

    audioElement.src = audioURL;
    audioElement.classList.add("playback");
    audioElement.dataset.audioIndex = realIndex;
    wrapper.appendChild(audioElement);

    const player = createPlayer(audioElement, realIndex);
    wrapper.appendChild(player);
    wrapper.appendChild(player._transcribeBtn);
    wrapper.appendChild(player._transcriptEl);

    wrapper.addEventListener("dragstart", () => {
      draggingElement = wrapper;
      draggingAudioIndex = realIndex;
      garbage.classList.add("drag-active");
    });

    wrapper.addEventListener("dragend", () => {
      draggingElement = null;
      draggingAudioIndex = null;
      garbage.classList.remove("drag-active");
    });
  });

  const totalPages = Math.ceil(recordedAudios.length / AUDIOS_PER_PAGE);
  pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;

  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}
