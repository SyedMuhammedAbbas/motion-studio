// Duration tokens, stagger and the music grid, all in frames at 60 fps.
import { FPS } from './springs';

export const DUR = { micro: 8, microMax: 12, macro: 24, macroMax: 30 };
export const STAGGER = 3;
export const STAGGER_CAP = 18;

export const stagger = (i: number, step = STAGGER) => Math.min(i * step, STAGGER_CAP);
export const sec = (s: number) => Math.round(s * FPS);

// Beat grid: pulse is 1 on the beat and gone in about a third of a second.
export const beatLength = (bpm: number) => (FPS * 60) / bpm;
export const beatAge = (frame: number, bpm: number, offset = 0) => {
  const b = beatLength(bpm);
  return (((frame - offset) % b) + b) % b;
};
export const beatPulse = (frame: number, bpm: number, offset = 0) => Math.exp((-beatAge(frame, bpm, offset) / FPS) * 10);
// Frame of the n-th grid line at or after `frame` (division 1 = beats, 2 = eighths).
export const nextBeat = (frame: number, bpm: number, division = 1, offset = 0) => {
  const b = beatLength(bpm) / division;
  return Math.round(offset + Math.ceil((frame - offset) / b) * b);
};

// Beat grid from detected beat times (seconds), for music that does not sit on a fixed tempo from frame 0.
export const beatGrid = (beatsSec: number[]) => {
  const frames = beatsSec.map((s) => s * FPS);
  const last = (frame: number) => {
    let lo = -1;
    for (const b of frames) if (b <= frame) lo++; else break;
    return lo;
  };
  return {
    frames,
    index: last,
    // 1 on a beat, gone in about a third of a second; 0 before the first beat
    pulse: (frame: number) => {
      const i = last(frame);
      return i < 0 ? 0 : Math.exp(((frames[i] - frame) / FPS) * 10);
    },
    // the first beat frame at or after `frame`
    next: (frame: number) => Math.round(frames.find((b) => b >= frame - 0.5) ?? frame),
  };
};
