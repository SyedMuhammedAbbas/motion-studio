// Depth: a 1 px ring plus one large soft drop, tinted with the brand's shadow colour ("r, g, b").
export const depthShadow = (rgb: string, lift = 1) =>
  `0 0 0 1px rgba(${rgb}, 0.08), 0 ${Math.round(28 * lift)}px ${Math.round(72 * lift)}px -${Math.round(28 * lift)}px rgba(${rgb}, ${(0.18 + 0.1 * Math.min(lift, 1.5)).toFixed(3)})`;

// Back layers move at this fraction of the camera during camera moves.
export const PARALLAX_BACK = 0.6;
