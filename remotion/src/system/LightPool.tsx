// The light pool: a soft coloured glow on the paper (or on the dark interlude) that moves between shots as the
// continuity device. Plain CSS radial gradients, so it renders the same in headless Chrome.
import { interpolateColors } from 'remotion';
import type { PoolState } from './continuity';

export type PoolColors = { paper: string; dark: string; inner: string; outer: string; innerOnDark: string };

export const LightPool = ({ pool, bg, w, h, colors }: { pool: PoolState; bg: number; w: number; h: number; colors: PoolColors }) => {
  const R = pool.r * Math.max(w, h);
  const x = pool.x * w;
  const y = pool.y * h;
  const inner = bg > 0.5 ? colors.innerOnDark : colors.inner;
  return (
    <div style={{ position: 'absolute', inset: 0, background: interpolateColors(bg, [0, 1], [colors.paper, colors.dark]) }}>
      <div
        style={{
          position: 'absolute', inset: 0, opacity: Math.max(0, Math.min(1, pool.i)),
          background: `radial-gradient(${R * 0.55}px ${R * 0.42}px at ${x}px ${y}px, ${inner}, transparent), radial-gradient(${R}px ${R * 0.75}px at ${x}px ${y}px, ${colors.outer}, transparent)`,
        }}
      />
    </div>
  );
};
