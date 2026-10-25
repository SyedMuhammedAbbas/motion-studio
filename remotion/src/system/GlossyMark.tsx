// A glossy object built from a logo's mark: the mark itself, a short extruded edge for thickness, a moving specular
// band and a soft glow behind, all cut by the mark's own alpha (CSS mask from the logo file), so it reads as one
// solid object. Deterministic: the highlight position comes from `sweep` (0..1), not from time.
import { Img, staticFile } from 'remotion';
import type { LockupArt } from './Lockup';

export type GlossColors = { edge: string; glow: string; highlight: string };

export const GlossyMark = ({ art, x, y, size, rot = 0, sweep = 0, colors, depth = 10, qa }: { art: LockupArt; x: number; y: number; size: number; rot?: number; sweep?: number; colors: GlossColors; depth?: number; qa?: string }) => {
  const s = size / art.h;
  const w = art.markW * s;
  const src = staticFile(art.file);
  const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: `${art.w * s}px ${art.h * s}px`, maskSize: `${art.w * s}px ${art.h * s}px`, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: '0 0', maskPosition: '0 0' } as const;
  const box = { position: 'absolute', left: 0, top: 0, width: w, height: size, overflow: 'hidden' } as const;
  const band = -60 + 220 * sweep; // percent across the mark
  return (
    <div data-qa={qa} style={{ position: 'absolute', left: x - w / 2, top: y - size / 2, width: w, height: size, transform: rot ? `rotate(${rot}deg)` : undefined, filter: 'drop-shadow(0 34px 44px rgba(20, 36, 29, 0.24))' }}>
      <div style={{ position: 'absolute', left: -w * 0.35, top: -size * 0.35, width: w * 1.7, height: size * 1.7, background: `radial-gradient(closest-side, ${colors.glow}, transparent)` }} />
      {Array.from({ length: depth }, (_, i) => depth - i).map((d) => (
        <div key={d} style={{ ...box, transform: `translate(${d * 0.9}px, ${d * 1.3}px)` }}>
          <div style={{ ...box, background: colors.edge, ...mask }} />
        </div>
      ))}
      <div style={box}>
        <Img src={src} style={{ position: 'absolute', left: 0, top: 0, width: art.w * s, height: art.h * s }} />
      </div>
      <div style={box}>
        <div style={{ ...box, background: `linear-gradient(115deg, transparent ${band - 18}%, ${colors.highlight} ${band}%, transparent ${band + 18}%)`, ...mask }} />
      </div>
    </div>
  );
};
