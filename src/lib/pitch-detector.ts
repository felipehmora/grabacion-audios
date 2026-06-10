// Detección de tono mediante el algoritmo MPM (McLeod Pitch Method).
// Función pura: no toca el DOM ni APIs de audio.

const MIN_FREQ = 70;
const MAX_FREQ = 500;
const PEAK_THRESHOLD = 0.8;
const CLARITY_THRESHOLD = 0.5;
const RMS_THRESHOLD = 0.01;

export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  if (rms(buffer) < RMS_THRESHOLD) return null;

  const minLag = Math.max(1, Math.floor(sampleRate / MAX_FREQ));
  const maxLag = Math.min(buffer.length - 1, Math.ceil(sampleRate / MIN_FREQ));

  const nsdf = computeNSDF(buffer, minLag, maxLag);
  const peakIndex = pickPeak(nsdf, minLag, maxLag, PEAK_THRESHOLD);
  if (peakIndex === -1 || nsdf[peakIndex] < CLARITY_THRESHOLD) return null;

  const refinedIndex = parabolicInterpolation(nsdf, peakIndex);
  if (refinedIndex <= 0) return null;

  return sampleRate / refinedIndex;
}

function rms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

// NSDF: NSDF(τ) = 2·ACF(τ) / [Σx[i]² + Σx[i+τ]²]
// Más robusta que autocorrelación cruda frente a cambios de amplitud.
function computeNSDF(buffer: Float32Array, minLag: number, maxLag: number): Float32Array {
  const n = buffer.length;
  const nsdf = new Float32Array(maxLag + 1);

  for (let lag = minLag; lag <= maxLag; lag++) {
    let acf = 0;
    let energy = 0;
    for (let i = 0; i < n - lag; i++) {
      acf += buffer[i] * buffer[i + lag];
      energy += buffer[i] * buffer[i] + buffer[i + lag] * buffer[i + lag];
    }
    nsdf[lag] = energy === 0 ? 0 : (2 * acf) / energy;
  }

  return nsdf;
}

// Selecciona el primer pico que supere threshold * máximo global.
// Favorece la fundamental sobre armónicos.
function pickPeak(nsdf: Float32Array, minLag: number, maxLag: number, threshold: number): number {
  const maxima: number[] = [];
  let i = minLag;

  while (i < maxLag) {
    while (i < maxLag && nsdf[i] <= 0) i++;

    let maxIdx = -1;
    while (i < maxLag && nsdf[i] > 0) {
      if (maxIdx === -1 || nsdf[i] > nsdf[maxIdx]) maxIdx = i;
      i++;
    }
    if (maxIdx !== -1) maxima.push(maxIdx);
  }

  if (maxima.length === 0) return -1;

  const globalMax = Math.max(...maxima.map((idx) => nsdf[idx]));
  const cutoff = globalMax * threshold;

  for (const idx of maxima) {
    if (nsdf[idx] >= cutoff) return idx;
  }
  return maxima[0];
}

function parabolicInterpolation(nsdf: Float32Array, x: number): number {
  const x0 = x - 1;
  const x2 = x + 1;
  if (x0 < 0 || x2 >= nsdf.length) return x;

  const s0 = nsdf[x0];
  const s1 = nsdf[x];
  const s2 = nsdf[x2];

  const denom = s0 - 2 * s1 + s2;
  if (denom === 0) return x;

  return x + (s0 - s2) / (2 * denom);
}
