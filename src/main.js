import { recordedAudios, state, AUDIOS_PER_PAGE } from './state.js';
import { renderPage } from './pagination.js';
import { SetUpAudio } from './recorder.js';
import './nav.js';

const garbage = document.querySelector("#delete-button");

garbage.addEventListener("dragover", (e) => {
  e.preventDefault();
});

garbage.addEventListener("drop", (e) => {
  e.preventDefault();
  if (state.draggingElement && state.draggingAudioIndex !== null) {
    recordedAudios.splice(state.draggingAudioIndex, 1);
    state.draggingElement = null;
    state.draggingAudioIndex = null;
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
    if (state.currentPage > totalPages) {
      state.currentPage = Math.max(1, totalPages);
    }
    renderPage();
  }
});

garbage.addEventListener("dragleave", () => {
  garbage.classList.remove("drag-active");
});

SetUpAudio();
