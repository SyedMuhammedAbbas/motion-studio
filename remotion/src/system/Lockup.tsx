// Logo lockup with one entrance: the mark's four quarters unfold from its centre like a pinwheel, then the wordmark
// slides out from behind the mark. Everything is cut from the one logo image, so at rest it is the logo file exactly,
// at any size and in any scene. `speed` > 1 runs the same entrance faster.
import { Img, staticFile } from 'remotion';
import { sp } from './springs';

export type LockupArt = {
  file: string;
  w: number; // image size in px
  h: number;
  markW: number; // the mark occupies x 0..markW
  wordX: number; // the wordmark starts at this x
  centre: [number, number]; // the empty point between the four quarters (the split lines run through it)
};

// Pinwheel order: top-left, top-right, bottom-right, bottom-left.
const QUARTERS: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];

export const lockupCentre = (art: LockupArt, x: number, y: number, width: number): [number, number] => {
  const s = width / art.w;
  return [x + art.centre[0] * s, y + art.centre[1] * s];
};
// Frame at which the wordmark has fully settled, for scenes that cue after the logo.
export const lockupDone = (at: number, speed = 1) => at + Math.round(70 / speed);

export const Lockup = ({ art, x, y, width, frame, at, speed = 1, jit }: { art: LockupArt; x: number; y: number; width: number; frame: number; at: number; speed?: number; jit?: string }) => {
  if (frame < at) return null;
  const s = width / art.w;
  const [cx, cy] = art.centre;
  const dur = Math.round(45 / speed);
  const k = sp(frame, at + Math.round(14 / speed), 'soft', dur);
  const src = staticFile(art.file);
  return (
    <div data-jit={jit} style={{ position: 'absolute', left: x, top: y, width, height: art.h * s }}>
      {QUARTERS.map(([qx, qy], i) => {
        const p = sp(frame, at + Math.round((i * 3) / speed), 'soft', dur);
        if (p <= 0) return null;
        const x0 = qx ? cx : 0;
        const y0 = qy ? cy : 0;
        const w = (qx ? art.markW - cx : cx) * s;
        const h = (qy ? art.h - cy : cy) * s;
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x0 * s, top: y0 * s, width: w, height: h, overflow: 'hidden',
              transformOrigin: `${(cx - x0) * s}px ${(cy - y0) * s}px`, transform: p >= 1 ? undefined : `rotate(${-90 * (1 - p)}deg) scale(${p})`,
            }}
          >
            <Img src={src} style={{ position: 'absolute', left: -x0 * s, top: -y0 * s, width: art.w * s, height: art.h * s }} />
          </div>
        );
      })}
      {k > 0 && (
        <div style={{ position: 'absolute', left: (art.wordX - 8) * s, top: 0, width: (art.w - art.wordX + 8) * s, height: art.h * s, overflow: 'hidden' }}>
          <Img src={src} style={{ position: 'absolute', left: -(art.wordX - 8) * s, top: 0, width: art.w * s, height: art.h * s, transform: k >= 1 ? undefined : `translateX(${-(1 - k) * 0.35 * width}px)` }} />
        </div>
      )}
    </div>
  );
};
