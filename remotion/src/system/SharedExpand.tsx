// Shared-element expand: a box grows from one rect to another, so the small element visibly becomes the big one.
// The content is laid out once at the final size and only transformed (uniform cover scale) and clipped to the
// current rect, so nothing reflows while it grows. The drop shadow follows the clipped shape.
import type { ReactNode } from 'react';
import { lerp } from './springs';

export type Rect = { x: number; y: number; w: number; h: number };

export const lerpRect = (a: Rect, b: Rect, k: number): Rect => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });

export const SharedExpand = ({ from, to, progress, radius = [24, 24], background, shadow, children }: { from: Rect; to: Rect; progress: number; radius?: [number, number]; background: string; shadow?: string; children: ReactNode }) => {
  const r = lerpRect(from, to, progress);
  const s = Math.max(r.w / to.w, r.h / to.h);
  const tx = r.x + r.w / 2 - (to.w * s) / 2;
  const ty = r.y + r.h / 2 - (to.h * s) / 2;
  // the visible rect in the content's own (unscaled) coordinates
  const l = (r.x - tx) / s;
  const t = (r.y - ty) / s;
  const rr = lerp(radius[0], radius[1], progress) / s;
  const clip = `inset(${t}px ${to.w - l - r.w / s}px ${to.h - t - r.h / s}px ${l}px round ${rr}px)`;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, filter: shadow }}>
      <div data-jit="expand" style={{ position: 'absolute', left: 0, top: 0, width: to.w, height: to.h, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${s})`, clipPath: clip, background, overflow: 'hidden', willChange: 'transform' }}>
        {children}
      </div>
    </div>
  );
};
