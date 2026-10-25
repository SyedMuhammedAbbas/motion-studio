// Mask and clip reveals. MaskReveal lifts content out of a mask under its baseline; Wipe uncovers a box from one edge.
// Only transform and clip-path are animated, so nothing reflows or snaps to whole pixels while it moves.
import type { CSSProperties, ReactNode } from 'react';
import { clamp } from './springs';

// The mask box extends 0.24 em above and below the line box, so at rest no ascender, descender or accent touches it.
export const MASK_PAD = '0.24em';

// `progress` 0..1 brings the content up into view; `out` 0..1 lifts it out of the top of the mask again.
export const MaskReveal = ({ progress, out = 0, children, style }: { progress: number; out?: number; children: ReactNode; style?: CSSProperties }) => {
  if (progress <= 0 || out >= 1) return <span style={{ display: 'inline-block', visibility: 'hidden', ...style }}>{children}</span>;
  const y = (1 - clamp(progress)) * 150 - clamp(out) * 150;
  return (
    <span data-mask="" style={{ display: 'inline-block', overflow: 'hidden', padding: `${MASK_PAD} 0.06em`, margin: `-${MASK_PAD} -0.06em`, verticalAlign: 'top', ...style }}>
      <span style={{ display: 'inline-block', transform: y ? `translateY(${y}%)` : undefined }}>{children}</span>
    </span>
  );
};

type Edge = 'left' | 'right' | 'top' | 'bottom';
// Hard-edged wipe from one edge; progress outside 0..1 is clamped so overshooting springs never re-hide content.
export const wipeClip = (progress: number, from: Edge = 'left') => {
  const k = (1 - clamp(progress)) * 100;
  const inset = { left: `0 ${k}% 0 0`, right: `0 0 0 ${k}%`, top: `0 0 ${k}% 0`, bottom: `${k}% 0 0 0` }[from];
  return `inset(${inset})`;
};

export const Wipe = ({ progress, from = 'left', children, style }: { progress: number; from?: Edge; children: ReactNode; style?: CSSProperties }) =>
  progress <= 0 ? null : <div style={{ clipPath: progress >= 1 ? undefined : wipeClip(progress, from), ...style }}>{children}</div>;

// A box that rises into view from behind its own lower edge (for chips and fields that carry a shadow).
export const RiseIn = ({ progress, children, style, pad = 24 }: { progress: number; children: ReactNode; style?: CSSProperties; pad?: number }) =>
  progress <= 0 ? null : (
    <div style={{ overflow: 'hidden', padding: pad, margin: -pad, ...style }}>
      <div style={{ transform: progress >= 1 ? undefined : `translateY(${(1 - clamp(progress)) * 140}%)` }}>{children}</div>
    </div>
  );
