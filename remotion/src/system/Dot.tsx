// A round dot sized by transform (a fixed 40 px element scaled to radius r), so pulsing never reflows.
export const Dot = ({ x, y, r, color, ring }: { x: number; y: number; r: number; color: string; ring?: string }) => {
  const R = 20;
  if (r <= 0.01) return null;
  return <div style={{ position: 'absolute', left: x - R, top: y - R, width: 2 * R, height: 2 * R, borderRadius: R, background: color, boxShadow: ring ? `0 0 0 ${(5 * R) / r}px ${ring}` : undefined, transform: `scale(${r / R})` }} />;
};
