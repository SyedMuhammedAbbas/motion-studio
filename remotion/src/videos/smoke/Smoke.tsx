// Engine check only: a box springs in. Not a deliverable.
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Smoke = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: '#f5f9f0', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 400, height: 400, borderRadius: 40, background: '#275c4e', transform: `translateY(${(1 - p) * 300}px)` }} />
    </AbsoluteFill>
  );
};
