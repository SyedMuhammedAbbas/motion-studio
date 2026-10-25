// Kinetic type and word-to-icon cuts. Type only ever scales down to its final size (from scaleFrom >= 1), letter
// spacing is pulled in by per-letter transforms (no letter-spacing animation, so nothing reflows), and every
// change is transform, opacity or clip-path.
import type { CSSProperties, ReactNode } from 'react';
import { clamp, sp } from './springs';
import { MASK_PAD } from './Reveal';

// One word landing. `progress` 0..1 comes from a slam or a soft spring started on the spoken word.
export const KineticWord = ({ text, progress, scaleFrom = 1, track = 0, style }: { text: string; progress: number; scaleFrom?: number; track?: number; style?: CSSProperties }) => {
  if (progress <= 0) return <span style={{ display: 'inline-block', visibility: 'hidden', ...style }}>{text}</span>;
  const k = clamp(progress);
  const s = 1 + (scaleFrom - 1) * (1 - k);
  const letters = [...text];
  const mid = (letters.length - 1) / 2;
  const y = (1 - k) * 150;
  return (
    <span data-mask="" style={{ display: 'inline-block', overflow: 'hidden', padding: `${MASK_PAD} 1em`, margin: `-${MASK_PAD} -1em`, verticalAlign: 'top', ...style }}>
      <span style={{ display: 'inline-block', transform: y || s !== 1 ? `translateY(${y}%) scale(${s})` : undefined, transformOrigin: '50% 60%' }}>
        {track > 0
          ? letters.map((ch, i) => (
              <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', transform: k < 1 ? `translateX(${((i - mid) * track * (1 - k)).toFixed(4)}em)` : undefined }}>
                {ch}
              </span>
            ))
          : text}
      </span>
    </span>
  );
};

// A word that becomes an icon: at `at` the word's clip closes onto its centre in 6 frames while the icon pops in
// from the same centre. `icon` gets the icon pop (0..1, may overshoot) and its draw-on progress.
export const CrossCut = ({ frame, at, word, icon, style }: { frame: number; at: number; word: ReactNode; icon: (pop: number, drawOn: number) => ReactNode; style?: CSSProperties }) => {
  const c = clamp((frame - at) / 6);
  const pop = sp(frame, at + 2, 'snappy');
  const drawOn = sp(frame, at + 2, 'soft', 24);
  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      {c < 1 && <div style={{ clipPath: c > 0 ? `inset(-30% ${50 * c}% -30% ${50 * c}%)` : undefined }}>{word}</div>}
      {pop > 0 && (
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0 }}>
          <div style={{ transform: `translate(-50%, -50%) scale(${pop})` }}>{icon(pop, drawOn)}</div>
        </div>
      )}
    </div>
  );
};
