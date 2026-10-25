// Synthetic pointer and click ripple. Position the tip at (x, y); `pressed` shrinks it for the click.
// The pointer moves by transform only.
import { DUR } from './time';
import { clamp, sp } from './springs';

export const Cursor = ({ x, y, scale = 1.5, pressed = false, fill = '#ffffff', stroke = '#17251e' }: { x: number; y: number; scale?: number; pressed?: boolean; fill?: string; stroke?: string }) => (
  <svg
    width={24}
    height={32}
    viewBox="-2 -2 24 34"
    style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', transformOrigin: '2px 2px', willChange: 'transform', transform: `translate(${x - 2}px, ${y - 2}px) scale(${scale * (pressed ? 0.88 : 1)})`, filter: 'drop-shadow(0 2px 3px rgba(20,36,29,0.25))' }}
  >
    <path d="M0 0 L0 26 L6.5 20 L11 30 L15 28.4 L10.6 18.6 L19 18.6 Z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

// Ring that expands from the click point over a macro duration and thins out as it goes.
export const Ripple = ({ x, y, age, color, radius = 90 }: { x: number; y: number; age: number; color: string; radius?: number }) => {
  const life = DUR.macroMax + 12;
  if (age < 0 || age > life) return null;
  const r = 14 + radius * sp(age, 0, 'snappyClamp');
  const k = 1 - clamp(age / life);
  return (
    <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={2 + 4 * k} strokeOpacity={0.9 * k} />
    </svg>
  );
};
