import { AUDIOS_PER_PAGE, recordedAudios, state } from './state.js';
import { createPlayer } from './player.js';

const audio_container = document.querySelector(".audio-container");
const garbage = document.querySelector("#delete-button");
const paginationControls = document.querySelector("#pagination-controls");
const prevPageBtn = document.querySelector("#prev-page");
const nextPageBtn = document.querySelector("#next-page");
const pageIndicator = document.querySelector("#page-indicator");

prevPageBtn.addEventListener("click", () => {
  if (state.currentPage > 1) {
    state.currentPage--;
    renderPage();
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(recordedAudios.length / AUDIOS_PER_PAGE);
  if (state.currentPage < totalPages) {
    state.currentPage++;
    renderPage();
  }
});

export function renderPage() {
  audio_container.innerHTML = "";

  if (recordedAudios.length === 0) {
    paginationControls.style.display = "none";
    return;
  }

  paginationControls.style.display = "flex";

  const startIndex = (state.currentPage - 1) * AUDIOS_PER_PAGE;
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
      state.draggingElement = wrapper;
      state.draggingAudioIndex = realIndex;
      garbage.classList.add("drag-active");
    });

    wrapper.addEventListener("dragend", () => {
      state.draggingElement = null;
      state.draggingAudioIndex = null;
      garbage.classList.remove("drag-active");
    });
  });

  const totalPages = Math.ceil(recordedAudios.length / AUDIOS_PER_PAGE);
  pageIndicator.textContent = `Page ${state.currentPage} of ${totalPages}`;

  prevPageBtn.disabled = state.currentPage === 1;
  nextPageBtn.disabled = state.currentPage === totalPages;
}

export function renderTranscriptsList() {
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
