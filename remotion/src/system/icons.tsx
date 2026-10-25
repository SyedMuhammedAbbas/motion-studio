// Studio line icons (first-party, drawn for this system): 24-unit grid, round caps and joins, one stroke weight.
// Each icon is a list of SVG shapes so it can draw on with a stroke dash (Icon, `draw` 0..1) or be animated part by part.
import type { CSSProperties, ReactElement } from 'react';

type Shape = ['path', string] | ['circle', number, number, number] | ['rect', number, number, number, number, number] | ['ellipse', number, number, number, number];

export const ICONS = {
  calendar: [['rect', 3, 5, 18, 16, 2], ['path', 'M3 10h18'], ['path', 'M8 3v4'], ['path', 'M16 3v4']],
  card: [['rect', 3, 5, 18, 14, 2], ['circle', 9, 11, 2.2], ['path', 'M6 16.2c.6-1.6 1.8-2.4 3-2.4s2.4.8 3 2.4'], ['path', 'M14 10h4'], ['path', 'M14 13.5h3']],
  crm: [['ellipse', 12, 6, 7, 2.6], ['path', 'M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6'], ['path', 'M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6']],
  plane: [['path', 'M21 3L3 10.5l7 2.5 2.5 7L21 3z'], ['path', 'M10 13l4.5-4.5']],
  chart: [['path', 'M3 20.5h18'], ['rect', 4.5, 13, 4, 7.5, 1], ['rect', 10, 9, 4, 11.5, 1], ['rect', 15.5, 5, 4, 15.5, 1]],
  bug: [['ellipse', 12, 14.5, 4.5, 5.5], ['circle', 12, 7, 2.4], ['path', 'M12 9.5v10'], ['path', 'M7.6 12H4.5'], ['path', 'M7.6 16H4.5'], ['path', 'M16.4 12h3.1'], ['path', 'M16.4 16h3.1'], ['path', 'M8.5 19.2l-2 2'], ['path', 'M15.5 19.2l2 2'], ['path', 'M10.6 5.2L9 3'], ['path', 'M13.4 5.2L15 3']],
  bandage: [['path', 'M4.6 14.3l9.7-9.7a3.5 3.5 0 015 5l-9.7 9.7a3.5 3.5 0 01-5-5z'], ['path', 'M9.4 12l2.6-2.6 2.6 2.6-2.6 2.6z']],
  target: [['circle', 12, 12, 9], ['circle', 12, 12, 5.5], ['circle', 12, 12, 2]],
  wrench: [['path', 'M14.7 6.3a4 4 0 00-5.4 5.2L3.5 17.3a1.9 1.9 0 002.7 2.7l5.8-5.8a4 4 0 005.2-5.4l-2.6 2.6-2.4-.4-.4-2.4z']],
  gear: [['circle', 12, 12, 3], ['circle', 12, 12, 6.8], ['path', 'M12 2.6v2.6'], ['path', 'M12 18.8v2.6'], ['path', 'M2.6 12h2.6'], ['path', 'M18.8 12h2.6'], ['path', 'M5.4 5.4l1.8 1.8'], ['path', 'M16.8 16.8l1.8 1.8'], ['path', 'M5.4 18.6l1.8-1.8'], ['path', 'M16.8 7.2l1.8-1.8']],
  plug: [['path', 'M9 3v4'], ['path', 'M15 3v4'], ['path', 'M6.5 7h11v3.5a5.5 5.5 0 01-11 0z'], ['path', 'M12 16v5']],
  magnifier: [['circle', 10.5, 10.5, 6.5], ['path', 'M15.3 15.3L21 21']],
  frame: [['path', 'M3 8.5V3h5.5'], ['path', 'M15.5 3H21v5.5'], ['path', 'M21 15.5V21h-5.5'], ['path', 'M8.5 21H3v-5.5'], ['rect', 8, 8, 8, 8, 1]],
  blocks: [['rect', 3, 13, 8, 8, 1.2], ['rect', 13, 13, 8, 8, 1.2], ['rect', 8, 3, 8, 8, 1.2]],
  play: [['circle', 12, 12, 9], ['path', 'M10 8.5l6 3.5-6 3.5z']],
  sparkle: [['path', 'M11 3l1.9 5.3L18 10.2l-5.1 1.9L11 17.4l-1.9-5.3L4 10.2l5.1-1.9z'], ['path', 'M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z']],
  app: [['rect', 7, 2.5, 10, 19, 2.2], ['path', 'M11 18.5h2']],
  dashboard: [['rect', 3, 4, 18, 16, 2], ['path', 'M3 9h18'], ['path', 'M7.5 17v-4'], ['path', 'M12 17v-5.5'], ['path', 'M16.5 17v-2.5']],
  link: [['path', 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1'], ['path', 'M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1']],
  check: [['path', 'M5 12.5l4.5 4.5L19 7.5']],
  loop: [['path', 'M17 3l3 3-3 3'], ['path', 'M20 6H9a5 5 0 00-5 5'], ['path', 'M7 21l-3-3 3-3'], ['path', 'M4 18h11a5 5 0 005-5']],
  box: [['path', 'M3 8l9-5 9 5v8l-9 5-9-5z'], ['path', 'M3 8l9 5 9-5'], ['path', 'M12 13v8']],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

const draw = (k: number) => (k >= 1 ? {} : { pathLength: 1, strokeDasharray: `${Math.max(0, k)} 2` });

export const shapeEl = (s: Shape, key: number, k = 1): ReactElement => {
  const d = draw(k);
  switch (s[0]) {
    case 'path':
      return <path key={key} d={s[1]} {...d} />;
    case 'circle':
      return <circle key={key} cx={s[1]} cy={s[2]} r={s[3]} {...d} />;
    case 'rect':
      return <rect key={key} x={s[1]} y={s[2]} width={s[3]} height={s[4]} rx={s[5]} {...d} />;
    case 'ellipse':
      return <ellipse key={key} cx={s[1]} cy={s[2]} rx={s[3]} ry={s[4]} {...d} />;
  }
};

// One icon at `size` px. `draw` 0..1 draws the strokes on; `parts` limits it to some shapes (for part-by-part animation).
export const Icon = ({ name, size, color, draw: k = 1, stroke = 1.6, fill = 'none', parts, style }: { name: IconName; size: number; color: string; draw?: number; stroke?: number; fill?: string; parts?: number[]; style?: CSSProperties }) => {
  if (k <= 0) return null;
  const shapes = ICONS[name] as Shape[];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible', display: 'block', ...style }}>
      {shapes.map((s, i) => (parts && !parts.includes(i) ? null : shapeEl(s, i, k)))}
    </svg>
  );
};
