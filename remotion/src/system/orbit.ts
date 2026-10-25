// Orbit to network: nodes circle a centre until `lockAt`, then spring from wherever they are into fixed positions.
import { lerp, sp } from './springs';
import type { Pt } from './DrawLine';

export type OrbitSpec = { cx: number; cy: number; rx: number; ry: number; speed: number; lockAt: number; targets: Pt[] };

// Position of node i at frame f.
export const orbitPos = (f: number, i: number, o: OrbitSpec): Pt => {
  const n = o.targets.length;
  const a = -Math.PI / 2 + (2 * Math.PI * i) / n + o.speed * f;
  const ring: Pt = [o.cx + o.rx * Math.cos(a), o.cy + o.ry * Math.sin(a)];
  const k = sp(f, o.lockAt + i * 2, 'snappyClamp');
  return [lerp(ring[0], o.targets[i][0], k), lerp(ring[1], o.targets[i][1], k)];
};

// Regular polygon of n points (first at the top), for network targets.
export const polygon = (n: number, cx: number, cy: number, r: number): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
