// Copy to Root.tsx (git-ignored) and add one <Composition> per video. Videos live in src/videos/<brand>-<name>/,
// brand values in src/brands/<brand>.ts, assets in public/<brand>/ (all git-ignored); shared motion system in src/system/.
import { Composition } from 'remotion';
import { Smoke } from './videos/smoke/Smoke';

export const Root = () => (
  <>
    <Composition id="smoke" component={Smoke} durationInFrames={60} fps={60} width={1920} height={1080} />
  </>
);
