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
  recordedAudios.push(blob);
  const totalPages = Math.ceil(recordedAudios.length / AUDIOS_PER_PAGE);
  currentPage = totalPages;
  renderPage();
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

  audiosForPage.forEach((blob, pageIndex) => {
    const realIndex = startIndex + pageIndex;
    const audioURL = window.URL.createObjectURL(blob);
    const audioElement = document.createElement("audio");

    audio_container.appendChild(audioElement);
    audioElement.src = audioURL;
    audioElement.controls = true;
    audioElement.classList.add("playback");
    audioElement.draggable = true;
    audioElement.dataset.audioIndex = realIndex;

    audioElement.addEventListener("dragstart", () => {
      draggingElement = audioElement;
      draggingAudioIndex = realIndex;
      garbage.classList.add("drag-active");
    });

    audioElement.addEventListener("dragend", () => {
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
