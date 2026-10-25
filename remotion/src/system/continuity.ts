// Scene config with explicit start and end states, and the continuity state (light pool, recurring object, paper or
// dark, camera) carried across the joins. Within a scene the state springs from its start to its end over `settle` frames and
// then holds exactly; a scene's start state is the previous scene's end state, so nothing jumps at a join unless the
// join is declared a hard cut (only `bg` may switch on a hard cut). remotion/qa/run.mjs checks the config for gaps,
// overlaps and broken continuity, and takes the hard-cut list from it.
import { lerp, sp } from './springs';

export type PoolState = { x: number; y: number; r: number; i: number };
export type ObjectState = { x: number; y: number; s: number; rot: number };
export type CamState = { x: number; y: number; z: number }; // world offset in frame widths/heights, zoom
export type ContinuityState = { pool: PoolState; object: ObjectState; cam: CamState; bg: number };
export type SceneSpec = { id: string; from: number; to: number; cut: 'start' | 'hard' | 'morph'; settle: number; start: ContinuityState; end: ContinuityState };

const lerpObj = <T extends Record<string, number>>(a: T, b: T, k: number) => Object.fromEntries(Object.keys(a).map((key) => [key, lerp(a[key], b[key], k)])) as T;

export const sceneAt = <S extends SceneSpec>(f: number, scenes: S[]): S => scenes.filter((s) => f >= s.from).pop() ?? scenes[0];

export const stateAt = (f: number, scenes: SceneSpec[]): ContinuityState => {
  const s = sceneAt(f, scenes);
  const k = sp(f, s.from, 'camera', s.settle);
  return { pool: lerpObj(s.start.pool, s.end.pool, k), object: lerpObj(s.start.object, s.end.object, k), cam: lerpObj(s.start.cam, s.end.cam, k), bg: lerp(s.start.bg, s.end.bg, k) };
};
