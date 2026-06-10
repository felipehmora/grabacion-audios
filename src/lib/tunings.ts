// Catálogo de instrumentos y afinaciones.

export interface AltNote {
  note: string;
  freq: number;
}

export interface StringDef {
  note: string;
  freq: number;
  altNotes?: AltNote[];
}

export interface TuningVariant {
  id: string;
  name: string;
  strings: StringDef[];
}

export interface Instrument {
  name: string;
  variants: TuningVariant[];
}

export interface NoteResult {
  name: string;
  cents: number;
  midi: number;
}

export const CUATRO_VENEZOLANO: Instrument = {
  name: 'Cuatro Venezolano',
  variants: [
    {
      id: 'estandar',
      name: 'Estándar (B E A D)',
      strings: [
        { note: 'B3', freq: 246.94, altNotes: [{ note: 'B2', freq: 123.47 }] },
        { note: 'E3', freq: 164.81 },
        { note: 'A3', freq: 220.0 },
        { note: 'D4', freq: 293.66 },
      ],
    },
    {
      id: 'llanero',
      name: 'Llanero (A D F# B)',
      strings: [
        { note: 'A3', freq: 220.0 },
        { note: 'D4', freq: 293.66 },
        { note: 'F#4', freq: 369.99 },
        { note: 'B3', freq: 246.94 },
      ],
    },
  ],
};

export const INSTRUMENTS: Instrument[] = [CUATRO_VENEZOLANO];

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function freqToNote(freq: number): NoteResult {
  const midi = 69 + 12 * Math.log2(freq / 440);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { name: `${name}${octave}`, cents, midi: rounded };
}

const MATCH_TOLERANCE_HZ = 15;

export function matchString(detectedFreq: number, stringDef: StringDef): boolean {
  const candidates = [{ freq: stringDef.freq }, ...(stringDef.altNotes ?? [])];
  return candidates.some((c) => Math.abs(c.freq - detectedFreq) <= MATCH_TOLERANCE_HZ);
}
