// Capa de DOM/SVG del afinador. Traduce las lecturas de `Tuner` (frecuencia
// suavizada) en la interfaz: gauge de afinación, nota detectada, selector de
// afinación e indicador de cuerdas activas. Asume que `#tuner-view` ya existe
// en index.html con la estructura descrita más abajo.

import { Tuner } from './tuner.js';
import { CUATRO_VENEZOLANO, freqToNote, matchString } from './tunings.js';

const IN_TUNE_CENTS = 5;
const GAUGE_RANGE_CENTS = 50;
const GAUGE_RANGE_DEGREES = 90;

let tuner = null;
let selectedVariant = CUATRO_VENEZOLANO.variants[0];

let tuningSelect;
let startBtn;
let stringsEl;
let needleEl;
let noteEl;
let freqEl;

export function initTunerView() {
  tuningSelect = document.querySelector('#tuner-tuning-select');
  startBtn = document.querySelector('#tuner-start-btn');
  stringsEl = document.querySelector('#tuner-strings');
  needleEl = document.querySelector('#gauge-needle');
  noteEl = document.querySelector('#tuner-note-display');
  freqEl = document.querySelector('#tuner-freq-display');

  if (!tuningSelect) return; // #tuner-view no presente (por si se usa fuera de la app)

  populateTuningSelect();
  renderStrings(selectedVariant);

  tuningSelect.addEventListener('change', (e) => {
    selectedVariant = CUATRO_VENEZOLANO.variants.find((v) => v.id === e.target.value);
    renderStrings(selectedVariant);
  });

  startBtn.addEventListener('click', handleStartStopClick);
}

// Llamado por nav.js al entrar a la vista del afinador. Deliberadamente NO
// arranca el AudioContext: eso debe ocurrir dentro del click en "Iniciar
// afinador" para cumplir el requisito de gesto de usuario (iOS Safari).
export function showTuner() {}

// Llamado por nav.js al salir de la vista del afinador: libera el micrófono
// y detiene el procesamiento de audio para no dejarlo corriendo en segundo plano.
export function hideTuner() {
  if (tuner?.isRunning) {
    tuner.stop();
    setStartButtonLabel(false);
  }
}

async function handleStartStopClick() {
  if (!tuner) {
    tuner = new Tuner({ onPitch: handlePitch, onError: handleTunerError });
  }

  if (tuner.isRunning) {
    await tuner.stop();
    setStartButtonLabel(false);
    resetDisplays();
  } else {
    await tuner.start();
    setStartButtonLabel(tuner.isRunning);
  }
}

function handleTunerError(err) {
  console.error('Error iniciando el afinador:', err);
  setStartButtonLabel(false);
  if (noteEl) noteEl.textContent = 'Sin acceso al micrófono';
}

function setStartButtonLabel(running) {
  startBtn.textContent = running ? 'Detener afinador' : 'Iniciar afinador';
  startBtn.classList.toggle('active', running);
}

function resetDisplays() {
  noteEl.textContent = '--';
  freqEl.textContent = '0.0 Hz';
  updateGauge(0);
  highlightActiveString(null);
}

function handlePitch({ frequency, rawFrequency }) {
  const { name, cents } = freqToNote(frequency);
  noteEl.textContent = name;
  freqEl.textContent = `${rawFrequency.toFixed(1)} Hz`;
  updateGauge(cents);
  highlightActiveString(frequency);
}

function updateGauge(cents) {
  const clamped = Math.max(-GAUGE_RANGE_CENTS, Math.min(GAUGE_RANGE_CENTS, cents));
  const angle = (clamped / GAUGE_RANGE_CENTS) * GAUGE_RANGE_DEGREES;
  needleEl.style.transform = `rotate(${angle}deg)`;
  needleEl.classList.toggle('in-tune', Math.abs(cents) <= IN_TUNE_CENTS);
}

function populateTuningSelect() {
  tuningSelect.innerHTML = CUATRO_VENEZOLANO.variants
    .map((variant) => `<option value="${variant.id}">${variant.name}</option>`)
    .join('');
  tuningSelect.value = selectedVariant.id;
}

function renderStrings(variant) {
  stringsEl.innerHTML = variant.strings
    .map((s, index) => `<span class="tuner-string" data-index="${index}">${s.note}</span>`)
    .join('');
}

function highlightActiveString(detectedFreq) {
  const chips = stringsEl.querySelectorAll('.tuner-string');
  const activeIndex =
    detectedFreq != null
      ? selectedVariant.strings.findIndex((s) => matchString(detectedFreq, s))
      : -1;

  chips.forEach((chip, index) => chip.classList.toggle('active', index === activeIndex));
}
