import { state } from './state.js';
import { renderPage, renderTranscriptsList } from './pagination.js';
import { showTuner, hideTuner } from '../tuner/tuner-ui.js';

const audio_container = document.querySelector(".audio-container");
const paginationControls = document.querySelector("#pagination-controls");
const transcriptsView = document.getElementById('transcripts-view');
const tunerView = document.getElementById('tuner-view');

export function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

export function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}

// index.html los invoca con onclick="openNav()"/"closeNav()" inline
window.openNav = openNav;
window.closeNav = closeNav;

// Centraliza el alternado entre vistas: oculta todas las áreas, sincroniza
// state.transcriptsViewOpen (del que recorder.js depende) y libera el
// afinador si se abandona su vista.
export function showView(name) {
  const previous = state.currentView;
  state.currentView = name;
  state.transcriptsViewOpen = name === 'transcripts';

  audio_container.style.display = 'none';
  paginationControls.style.display = 'none';
  transcriptsView.style.display = 'none';
  tunerView.style.display = 'none';

  if (previous === 'tuner' && name !== 'tuner') hideTuner();

  switch (name) {
    case 'transcripts':
      transcriptsView.style.display = 'block';
      renderTranscriptsList();
      break;
    case 'tuner':
      tunerView.style.display = 'block';
      showTuner();
      break;
    case 'recorder':
    default:
      audio_container.style.display = 'flex';
      renderPage();
      break;
  }
}

document.getElementById('nav-transcripciones').addEventListener('click', () => {
  showView(state.currentView === 'transcripts' ? 'recorder' : 'transcripts');
  closeNav();
});

document.getElementById('nav-afinador').addEventListener('click', () => {
  showView(state.currentView === 'tuner' ? 'recorder' : 'tuner');
  closeNav();
});
