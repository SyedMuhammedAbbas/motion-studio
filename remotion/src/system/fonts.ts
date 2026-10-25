// Loads local font files with FontFace and holds the render until they are ready.
import { useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';

export type Face = { family: string; file: string; weight: number };

// `faces` must be a stable (module-level) array.
export const useFontFaces = (faces: Face[]) => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all(
      faces.map(async ({ family, file, weight }) => {
        const face = new FontFace(family, `url(${staticFile(file)})`, { weight: String(weight) });
        await face.load();
        document.fonts.add(face);
      }),
    )
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch(cancelRender);
  }, [faces, handle]);
  return ready;
};
