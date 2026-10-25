// Kinetic word replacement at a fixed centre: the group is laid out once, centred, so words that join later never
// shift the ones already shown. Each word cuts in on its frame and settles from 1.04x its final size (never from small).
// Accent words take a gradient fill; the drop shadow is a filter on the line, so it also works under gradient text.
import type { CSSProperties } from 'react';
import { sp } from './springs';
import { textStyle, type TypeSpec } from './type';

export type CenterWord = { t: string; at: number; accent?: boolean };

export const CenterWords = ({ words, frame, family, type, color, gradient, shadow, x, y, width, qa, style }: { words: CenterWord[]; frame: number; family: string; type: TypeSpec; color: string; gradient: string; shadow: string; x: number; y: number; width: number; qa?: string; style?: CSSProperties }) => (
  <div style={{ position: 'absolute', left: x - width / 2, top: y, width, textAlign: 'center', transform: 'translateY(-50%)', filter: shadow, ...textStyle(family, type), color, ...style }}>
    {words.map((wd, i) => {
      const on = frame >= wd.at;
      const k = sp(frame, wd.at, 'soft', 12);
      const fill: CSSProperties = wd.accent ? { backgroundImage: gradient, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' } : {};
      return (
        <span key={i}>
          {i > 0 && ' '}
          <span data-qa={on && qa ? `${qa}-${i}` : undefined} style={{ display: 'inline-block', visibility: on ? 'visible' : 'hidden', transform: on && k < 1 ? `scale(${1 + 0.04 * (1 - k)})` : undefined, ...fill }}>{wd.t}</span>
        </span>
      );
    })}
  </div>
);
