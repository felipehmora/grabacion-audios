// Detección de tono mediante el algoritmo MPM (McLeod Pitch Method).
// Función pura: no toca el DOM ni APIs de audio, solo recibe un buffer de
// muestras PCM (Float32Array, rango [-1, 1]) y la frecuencia de muestreo.

// Rango de frecuencias de interés (cubre las cuerdas del Cuatro Venezolano,
// incluyendo su octava alternativa más grave B2 ≈ 123 Hz, con margen).
const MIN_FREQ = 70;
const MAX_FREQ = 500;

// Umbral de "paralelismo" del MPM: solo se aceptan picos cuya altura sea al
// menos esta fracción del pico global, evitando elegir armónicos.
const PEAK_THRESHOLD = 0.8;

// Por debajo de esta claridad (altura del NSDF en el pico elegido) se
// considera que no hay un tono predominante claro.
const CLARITY_THRESHOLD = 0.5;

// Por debajo de esta energía RMS se considera silencio/ruido de fondo.
const RMS_THRESHOLD = 0.01;

export function detectPitch(buffer, sampleRate) {
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

function rms(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
  return Math.sqrt(sum / buffer.length);
}

// Función de diferencia cuadrática normalizada:
//   NSDF(τ) = 2 · ACF(τ) / [ Σ x[i]² + Σ x[i+τ]² ]   para i = 0..N-τ-1
// Combina autocorrelación con un término de normalización de energía, lo que
// la hace más robusta que la autocorrelación cruda frente a cambios de
// amplitud. Solo se calcula para el rango [minLag, maxLag] de interés.
function computeNSDF(buffer, minLag, maxLag) {
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

// Selección de "key maxima": recorre los lóbulos positivos del NSDF (entre
// cruces ascendentes y descendentes por cero), guarda el máximo local de cada
// uno, y elige el PRIMERO cuya altura supere `threshold * máximoGlobal`. Esto
// favorece la frecuencia fundamental sobre sus armónicos (que producen picos
// más altos pero más tarde en el eje de lags).
function pickPeak(nsdf, minLag, maxLag, threshold) {
  const maxima = [];
  let i = minLag;

  while (i < maxLag) {
    // avanzar hasta un cruce ascendente por cero
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

// Refina el índice entero del pico a un valor sub-muestra ajustando una
// parábola a los tres puntos vecinos (x-1, x, x+1).
function parabolicInterpolation(nsdf, x) {
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
