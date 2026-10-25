// A polyline that draws on. `to` is how much of the path is drawn (0..1); `from` trims its tail for travelling segments.
import type { CSSProperties } from 'react';

export type Pt = [number, number];

export const pathLength = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

// Point at fraction k of the path length.
export const pointAt = (pts: Pt[], k: number): Pt => {
  let d = Math.max(0, Math.min(1, k)) * pathLength(pts);
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= seg || i === pts.length - 1) {
      const u = seg ? Math.min(1, d / seg) : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
    }
    d -= seg;
  }
  return pts[pts.length - 1];
};

export const DrawLine = ({ points, to, from = 0, width, color, style }: { points: Pt[]; to: number; from?: number; width: number; color: string; style?: CSSProperties }) => {
  if (to - from <= 0.0001) return null;
  return (
    <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style }}>
      <polyline
        points={points.map((p) => p.join(',')).join(' ')}
        pathLength={1}
        strokeDasharray={`${to - from} 2`}
        strokeDashoffset={-from}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
