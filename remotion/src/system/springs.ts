// Spring tokens and the helpers every scene uses. Progress values are 0..1; only `snappy` may overshoot (dots, buttons).
// Every spring reaches exact rest: once the residual is below REST_THRESHOLD it returns exactly 1, so nothing keeps
// creeping by fractions of a pixel after a move has visibly settled.
import { measureSpring, spring, type SpringConfig } from 'remotion';

export const FPS = 60;

export const SPRINGS = {
  snappy: { damping: 20, stiffness: 200, mass: 1 }, // dots and buttons: about 4 % overshoot
  snappyClamp: { damping: 20, stiffness: 200, mass: 1, overshootClamping: true }, // containers: same speed, no overshoot
  soft: { damping: 200, stiffness: 100, mass: 1 }, // type and logos; no overshoot, settles in 45 frames
  camera: { damping: 30, stiffness: 60, mass: 1.2 }, // camera moves; no overshoot, settles in about 64 frames
} satisfies Record<string, Partial<SpringConfig>>;

export type SpringName = keyof typeof SPRINGS;

const REST_THRESHOLD = 0.0002; // 0.3 px on a 1500 px camera move
const restCache = new Map<SpringName, { coarse: number; ratio: number }>();
// Frames Remotion counts as "settled" (threshold 0.005), and how much longer it takes to get below REST_THRESHOLD.
// Measured once per spring: measureSpring simulates the whole curve, too slow to repeat on every call.
const rest = (name: SpringName) => {
  if (!restCache.has(name)) {
    const fine = measureSpring({ fps: FPS, config: SPRINGS[name], threshold: REST_THRESHOLD });
    const coarse = measureSpring({ fps: FPS, config: SPRINGS[name] });
    restCache.set(name, { coarse, ratio: fine / coarse });
  }
  return restCache.get(name)!;
};

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Spring progress for an event that starts at frame `at`. `stretch` sets the settle duration in frames for slow moves.
export const sp = (frame: number, at: number, name: SpringName = 'soft', stretch?: number) => {
  if (frame < at) return 0;
  const t = frame - at;
  const r = rest(name);
  // A stretched spring runs the natural curve at a scaled time. Remotion's own durationInFrames jumps from 0.9953 to 1
  // on its last frame (a 9 px snap on a 1920 px move), so it is not used; fractional times interpolate linearly.
  const tt = stretch ? (t * r.coarse) / stretch : t;
  if (tt >= r.coarse * r.ratio) return 1;
  const curve = (x: number) => spring({ frame: x, fps: FPS, config: SPRINGS[name] });
  const lo = Math.floor(tt);
  return lo === tt ? curve(lo) : lerp(curve(lo), curve(lo + 1), tt - lo);
};

// Slam: key words appear through a hard 4-frame mask.
export const SLAM_FRAMES = 4;
export const slam = (frame: number, at: number) => clamp((frame - at) / SLAM_FRAMES);

// Frame punch for slams: rises with the 4-frame mask and is back to exactly 1 about 15 frames later, so the frame
// never spends a long tail creeping by fractions of a pixel.
export const punch = (frame: number, ats: number[], amount = 0.02) =>
  1 + ats.reduce((z, at) => z + amount * Math.max(0, slam(frame, at) - sp(frame, at + 2, 'snappyClamp')), 0);

// A value that springs from key to key: keys are [startFrame, value]; the first key's frame is ignored.
export const track = (frame: number, keys: [number, number][], name: SpringName = 'camera', stretch?: number) =>
  keys.slice(1).reduce((v, [at, val], i) => v + (val - keys[i][1]) * sp(frame, at, name, stretch), keys[0][1]);
