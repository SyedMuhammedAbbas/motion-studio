// Camera motion blur (@remotion/motion-blur) switched on only while something moves fast, so settled frames render
// once and stay sharp. The children must read the frame with useCurrentFrame(): the blur re-renders them at
// sub-frame times. Samples are kept low (default 6) to keep renders quick.
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { CameraMotionBlur } from '@remotion/motion-blur';

export const BlurWhen = ({ active, samples = 6, shutterAngle = 180, children }: { active: boolean; samples?: number; shutterAngle?: number; children: ReactNode }) =>
  active ? <CameraMotionBlur samples={samples} shutterAngle={shutterAngle}>{children}</CameraMotionBlur> : <AbsoluteFill>{children}</AbsoluteFill>;
