// 2D camera rig with parallax layers. The camera names the world point at the centre of the frame and a zoom;
// a layer with depth d < 1 follows the camera at d times its travel and zoom (back layers), d = 1 is the world plane.
// Motion blur is directional (an SVG Gaussian with separate x/y deviation), so it reads as travel, not defocus.
import { createContext, useContext, useId, type CSSProperties, type ReactNode } from 'react';

export type Cam = { x: number; y: number; zoom: number; blurX?: number; blurY?: number };

const CamCtx = createContext<{ cam: Cam; w: number; h: number }>({ cam: { x: 0, y: 0, zoom: 1 }, w: 0, h: 0 });

export const CameraRig = ({ cam, width, height, children }: { cam: Cam; width: number; height: number; children: ReactNode }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width, height, overflow: 'hidden' }}>
    <CamCtx.Provider value={{ cam, w: width, h: height }}>{children}</CamCtx.Provider>
  </div>
);

// Camera that keeps world point (ax, ay) fixed on screen while zooming (a dolly on an anchor).
export const anchoredCam = (ax: number, ay: number, zoom: number, w: number, h: number): Cam => ({
  x: ax - (ax - w / 2) / zoom,
  y: ay - (ay - h / 2) / zoom,
  zoom,
});

// World point to screen point for a camera (depth 1).
export const toScreen = (cam: Cam, w: number, h: number, x: number, y: number) => ({
  x: (x - cam.x) * cam.zoom + w / 2,
  y: (y - cam.y) * cam.zoom + h / 2,
});

export const BlurFilter = ({ id, x, y }: { id: string; x: number; y: number }) => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation={`${x.toFixed(2)} ${y.toFixed(2)}`} />
    </filter>
  </svg>
);

export const Layer = ({ depth = 1, children, style }: { depth?: number; children: ReactNode; style?: CSSProperties }) => {
  const { cam, w, h } = useContext(CamCtx);
  const id = `blur${useId().replace(/:/g, '')}`;
  const z = 1 + (cam.zoom - 1) * depth;
  const cx = w / 2 + (cam.x - w / 2) * depth;
  const cy = h / 2 + (cam.y - h / 2) * depth;
  const bx = (cam.blurX ?? 0) * depth;
  const by = (cam.blurY ?? 0) * depth;
  const blurred = bx > 0.3 || by > 0.3;
  return (
    <>
      {blurred && <BlurFilter id={id} x={bx} y={by} />}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: w,
          height: h,
          transformOrigin: '0 0',
          transform: `translate(${w / 2}px, ${h / 2}px) scale(${z}) translate(${-cx}px, ${-cy}px)`,
          willChange: 'transform',
          filter: blurred ? `url(#${id})` : undefined,
          ...style,
        }}
      >
        {children}
      </div>
    </>
  );
};

// Blur deviation in px for a camera speed in px per frame: nothing for slow drifts, capped for fast moves.
export const speedBlur = (pxPerFrame: number, gain = 0.35, max = 14) => {
  const s = Math.abs(pxPerFrame);
  return s < 6 ? 0 : Math.min(max, (s - 6) * gain);
};
