// Three "busywork" loops drawn with the studio line icons, each stepping on music beats from `beats` (frames):
//   copy  - a contact card comes off a source pile and drops into the CRM on every beat
//   chase - a paper plane flies out to a recipient and loops back unanswered every two beats
//   chart - three bars rise one per beat and the fourth beat knocks them down
// Drawn around (0, 0) in about 520 x 300 px; `t` is the frame the loop runs on (pass a fixed frame to freeze it).
import type { ReactNode } from 'react';
import { Dot } from './Dot';
import { Icon } from './icons';
import { lerp, sp } from './springs';

export type LoopKind = 'copy' | 'chase' | 'chart';
export type LoopColors = { ink: string; faint: string; accent: string; line: string };

const indexAt = (beats: number[], f: number) => beats.filter((b) => b <= f).length - 1;

export const LoopArt = ({ kind, t, start, beats, colors, stroke = 1.6 }: { kind: LoopKind; t: number; start: number; beats: number[]; colors: LoopColors; stroke?: number }) => {
  const k0 = Math.max(0, indexAt(beats, start) + 1);
  const k = Math.max(k0, indexAt(beats, t));
  const at = (i: number) => beats[i] ?? Infinity;
  const place = (x: number, y: number, node: ReactNode, rot = 0, s = 1) => (
    <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg) scale(${s})` }}>{node}</div>
  );
  if (kind === 'copy') {
    // the copy grows out of the pile and shrinks into the CRM, so it never pops in or out
    const p = sp(t, at(k), 'snappyClamp');
    const grow = Math.min(1, Math.max(0, (t - at(k)) / 6));
    const sink = sp(t, at(k) + 14, 'snappyClamp');
    return (
      <>
        {place(-150, 0, <Icon name="card" size={130} color={colors.faint} stroke={stroke} />)}
        {place(150, 0, <Icon name="crm" size={130} color={colors.ink} stroke={stroke} />)}
        {t >= at(k) && sink < 1 && place(lerp(-150, 140, p), -70 * Math.sin(Math.PI * p), <Icon name="card" size={110} color={colors.accent} stroke={stroke + 0.3} />, 0, grow * (1 - sink))}
      </>
    );
  }
  if (kind === 'chase') {
    const c0 = k0 + 2 * Math.floor((k - k0) / 2);
    const p = sp(t, at(c0), 'soft', Math.max(8, at(c0 + 2) - at(c0)));
    const th = Math.PI + 2 * Math.PI * p;
    const x = 160 * Math.cos(th);
    const y = 95 * Math.sin(th);
    const ang = (Math.atan2(95 * Math.cos(th), -160 * Math.sin(th)) * 180) / Math.PI + 45; // the icon's nose points up-right
    return (
      <>
        <svg width={1} height={1} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <ellipse cx={0} cy={0} rx={160} ry={95} fill="none" stroke={colors.line} strokeWidth={3} strokeDasharray="2 14" strokeLinecap="round" />
        </svg>
        <Dot x={-160} y={0} r={12} color={colors.ink} />
        <Dot x={160} y={0} r={12} color={colors.faint} />
        {place(x, y, <Icon name="plane" size={100} color={colors.accent} stroke={stroke + 0.3} />, ang)}
      </>
    );
  }
  const c0 = k0 + 4 * Math.floor((k - k0) / 4);
  const fall = sp(t, at(c0 + 3), 'snappyClamp');
  return (
    <>
      <div style={{ position: 'absolute', left: -150, top: 132, width: 300, height: 5, borderRadius: 3, background: colors.ink }} />
      {[0, 1, 2].map((j) => {
        const up = sp(t, at(c0 + j), 'snappyClamp');
        const hgt = [110, 170, 230][j];
        return (
          <div
            key={j}
            style={{
              position: 'absolute', left: -130 + j * 95, top: 130 - hgt, width: 70, height: hgt, borderRadius: 10, border: `5px solid ${j === 2 ? colors.accent : colors.ink}`, boxSizing: 'border-box',
              transformOrigin: '50% 100%', transform: `translate(${fall * (40 + 30 * j)}px, ${fall * 60}px) rotate(${fall * (50 + 20 * j)}deg) scaleY(${Math.max(0.001, up)})`, opacity: 1 - fall,
            }}
          />
        );
      })}
    </>
  );
};
