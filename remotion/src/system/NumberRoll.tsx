// Odometer: each digit column rolls on its own; `value` may be fractional while it counts.
import type { CSSProperties } from 'react';
import { clamp, sp } from './springs';

export const digitPositions = (value: number, digits: number) => {
  const pos: number[] = [];
  let p = Math.max(0, value);
  for (let i = digits - 1; i >= 0; i--) {
    pos[i] = p % 10;
    const ones = p % 10;
    p = Math.floor(p / 10) + clamp(ones - 9, 0, 1); // the next column turns while this one rolls 9 -> 0
  }
  return pos;
};

export const NumberRoll = ({ value, digits = 2, style, columnWidth = '0.62em' }: { value: number; digits?: number; style?: CSSProperties; columnWidth?: string }) => (
  <span style={{ display: 'inline-flex', lineHeight: 1, ...style }}>
    {digitPositions(value, digits).map((p, i) => (
      <span key={i} style={{ display: 'inline-block', width: columnWidth, height: '1em', overflow: 'hidden', position: 'relative' }}>
        <span style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-p}em)`, textAlign: 'center' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => (
            <span key={j} style={{ display: 'block', height: '1em' }}>{d}</span>
          ))}
        </span>
      </span>
    ))}
  </span>
);

// Odometer for a fixed string of digits: each digit column spins down `spins` full turns and lands on its digit,
// columns staggered left to right. Digits sit 1.3 em apart in the strip and the slot window is clipped to the digit
// band (cap height), so mid-roll a column shows one digit, not two. Use inside BlurWhen while it rolls.
const STEP = 1.3;
export const RollDigits = ({ text, frame, at, stagger = 4, spins = 2, settle = 34, columnWidth = '0.62em', style, qa }: { text: string; frame: number; at: number; stagger?: number; spins?: number; settle?: number; columnWidth?: string; style?: CSSProperties; qa?: string }) => (
  <span data-qa={qa} style={{ display: 'inline-flex', lineHeight: 1, ...style }}>
    {[...text].map((ch, i) => {
      if (!/\d/.test(ch)) return <span key={i}>{ch}</span>;
      const k = sp(frame, at + i * stagger, 'soft', settle);
      const p = (+ch + 10 * spins * (1 - k)) % 10;
      return (
        <span key={i} style={{ display: 'inline-block', width: columnWidth, height: '1em', overflow: 'hidden', position: 'relative', clipPath: 'inset(0.12em -0.1em 0.08em -0.1em)' }}>
          <span style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: p ? `translateY(${-p * STEP}em)` : undefined, textAlign: 'center' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, j) => (
              <span key={j} style={{ display: 'block', height: `${STEP}em`, lineHeight: 1 }}>{d}</span>
            ))}
          </span>
        </span>
      );
    })}
  </span>
);

// True while any column is still turning (for switching motion blur on).
export const rollingAt = (frame: number, at: number, digits: number, stagger = 4, settle = 34) => frame >= at && sp(frame, at + (digits - 1) * stagger, 'soft', settle) < 1;
