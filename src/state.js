export const AUDIOS_PER_PAGE = 5;

export const recordedAudios = [];

export const state = {
  currentPage: 1,
  draggingElement: null,
  draggingAudioIndex: null,
  // 'recorder' | 'transcripts' | 'tuner' — fuente de verdad de la vista activa.
  currentView: 'recorder',
  // Derivado de currentView por showView(); se mantiene porque recorder.js
  // lo consulta para decidir si re-renderizar la página de audios.
  transcriptsViewOpen: false,
};
