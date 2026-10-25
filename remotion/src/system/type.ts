// Type scale and text measurement. Text is laid out at its final size; nothing scales type up from small.
import type { CSSProperties } from 'react';

export type TypeSpec = { size: number; weight: number; tracking: number; lineHeight?: number };

// Line height for every line that sits in a mask: tall enough that ascenders and descenders stay inside the line box.
export const LINE_HEIGHT = 1.15;
// Baseline below a line's top for a font's ascent and descent (in em) at a given line height.
export const baselineAt = (ascent: number, descent: number, lineHeight = LINE_HEIGHT) => (lineHeight - (ascent + descent)) / 2 + ascent;

// Sizes for a 1080p frame. The vertical cut drops the display size one step.
export const typeScale = (vertical: boolean) => ({
  display: { size: vertical ? 140 : 200, weight: 700, tracking: -0.03 },
  heading: { size: 72, weight: 500, tracking: -0.02 },
  body: { size: 44, weight: 400, tracking: -0.01 },
  small: { size: 32, weight: 500, tracking: 0 },
});

export const textStyle = (family: string, t: TypeSpec): CSSProperties => ({
  fontFamily: family,
  fontSize: t.size,
  fontWeight: t.weight,
  letterSpacing: `${t.tracking}em`,
  lineHeight: t.lineHeight ?? LINE_HEIGHT,
  whiteSpace: 'pre',
  fontKerning: 'normal',
});

let ctx: CanvasRenderingContext2D | null = null;
// Width of `text` in px with the same font, weight and tracking the DOM uses. Call only after fonts are loaded.
export const measure = (text: string, family: string, t: TypeSpec) => {
  ctx ??= document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('measure: no 2d canvas');
  ctx.font = `${t.weight} ${t.size}px "${family}"`;
  ctx.letterSpacing = `${t.tracking * t.size}px`;
  return ctx.measureText(text).width;
};

// Greedy word wrap to a max width.
export const wrap = (text: string, family: string, t: TypeSpec, maxWidth: number) => {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && measure(next, family, t) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  return [...lines, cur];
};

// Largest size (down to `min`) at which every line fits `maxWidth`.
export const fitSize = (lines: string[], family: string, t: TypeSpec, maxWidth: number, min = 24) => {
  let size = t.size;
  while (size > min && Math.max(...lines.map((l) => measure(l, family, { ...t, size }))) > maxWidth) size -= 1;
  return size;
};
