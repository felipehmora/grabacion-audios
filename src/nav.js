import { state } from './state.js';
import { renderPage, renderTranscriptsList } from './pagination.js';

const audio_container = document.querySelector(".audio-container");
const paginationControls = document.querySelector("#pagination-controls");

export function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

export function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}

// index.html los invoca con onclick="openNav()"/"closeNav()" inline
window.openNav = openNav;
window.closeNav = closeNav;

document.getElementById('nav-transcripciones').addEventListener('click', () => {
  state.transcriptsViewOpen = !state.transcriptsViewOpen;
  const transcriptsView = document.getElementById('transcripts-view');

  if (state.transcriptsViewOpen) {
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
