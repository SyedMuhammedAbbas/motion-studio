# Motion studio rules

Code-rendered motion graphics. Every video is a web page that paints any frame on demand; `render.mjs` screenshots it frame by frame and ffmpeg encodes the MP4. The full workflow is the global `motion-reel` skill; these rules apply to every video.

## Layout
- Shared engine at the root: `render.mjs`, `lib/motion.js` (spring, track, clamp, rng), `lib/p5film.js` (p5.js adapter), `beats.py`.
- One folder per video: `videos/<name>/` with `index.html`, `assets/`, `audio/`, `refs/`, `docs/`, `out/`.
- Pages import the engine by absolute path: `import { spring, track } from '/lib/motion.js'` (render.mjs serves the studio root over http).
- Keep one session per brand when possible; reuse that video folder's assets and music for follow-ups.

## Launch videos (Remotion)
- Launch films, product announcements and brand films follow `recipes/launch-director.md` (analysis, storyboard approval, design system, QA report) and are built in Remotion in `remotion/` (`npx remotion studio src/index.ts` to preview, `npx remotion render src/index.ts <id> out/<id>.mp4` to render). Remotion is free only for individuals and companies of up to 3 employees; check the licence per client.
- The look, sound and smoothness rules in this file still apply. Talk-to-reels and the older films stay on `render.mjs`.

## Render contract
- Every film is a pure function of time: `window.seek(t)` paints frame t onto `<canvas id="c">` sized from the `?w=&h=` query params. A DOM/CSS page without `#c` is allowed (render.mjs captures the whole viewport); render mode adds `?render=1`.
- Recipes for specific formats live in `recipes/motion-graphics-skills/` (see the motion-reel skill for when to use which, and which rules win).
- No CSS transitions, no setTimeout, no requestAnimationFrame in render mode, no state carried between frames. Seeded noise only (`rng()` from lib/motion.js), never Math.random.
- If the page loads images or other assets, set `window.ready` to a promise that resolves when they are loaded.
- p5.js (2.x, for generative and drawing-heavy shots): use `p5film({ setup, draw, seed })` from `/lib/p5film.js`, never p5's own loop. `draw(p, t)` must depend only on `t` (no `frameCount`, `millis()`, `deltaTime`); random/noise are reseeded every frame. Load fonts/images in the async `setup`. Example: `videos/_p5`.
- Render: `node render.mjs --dir videos/<name> --dur <s> [--fps 60 --sub 4 --w 1080 --h 1920]` writes `videos/<name>/out/silent.mp4`. H.264 yuv420p, CRF 16.
- Use `--fps 30 --sub 1` (and half size) for drafts and rough cuts; full settings only for the final.

## Look
- Banned: centered title on a gradient, everything fading in, corner labels and frame borders, glow on UI, generic particle bursts, bouncy easing.
- One display font, one UI font. One accent color unless the brief says otherwise. Fonts are local files in `assets/` or loaded and awaited before render.
- Every 2 to 4 seconds something new must happen on screen, and it must mean something: each animation pictures the words being said at that moment (owner rule). No decorative motion with no reason in the speech.
- Springs, not easing curves: `spring()`/`track()` from lib/motion.js. Tiny overshoot on UI, none on type. Stiff springs for buttons and toggles, soft for big type and logos.
- Real product UI only (screenshots via Playwright). Never invent or redraw screens from imagination.
- Never scale text up from small; lay it out at final size.

## Footage edits: smoothness (owner feedback on talk-to-reels work)
- Cut less: remove only pauses over ~0.8 s and cut between sentences. Every mid-sentence cut gets covered by a graphic change on that frame.
- Lock the framing. No follow-crop: one tripod-style framing per shot (ideally per reel), chosen from the face track. Reframe only on a cut.
- A framing change is either 0% or at least 25% (a clear new shot). A change between 3% and 25% looks like a glitch; that includes the old 1.0x/1.12x alternation.
- Never freeze the picture while the speaker is talking.
- List every hard cut (footage cuts, scene swaps, push-ins) in `window.hardCuts`. render.mjs then keeps its sub-frame blur from blending across them; without it every cut gets a one-frame ghost of both shots.
- Zones: graphics get their own zone (e.g. a top console with the speaker in a window below). Nothing is drawn over the face, and the head never leaves the frame.
- Prefer a near-4:5 window over a tight 9:16 crop of 16:9 footage: less stretch, sharper picture.
- Gate before the final render: the page exposes `window.qa()` (face box, window, text boxes, framing) and `node tools/talk/qa.mjs --dir <reel> --dur <s>` must print PASS. The rest of the talk pipeline (transcribe, cut, track, matte, audio, `reel.js`) is in `tools/talk/`.

## Sound
- Music and sound effects are synthesized in code (Python numpy + soundfile, to `audio/*.wav`) unless a track is supplied.
- Supplied track: `python beats.py audio/track.wav > audio/beats.json`. Cuts on beats, big moments on downbeats, SFX on hits.
- Mix to -14 LUFS (`ffmpeg ... -af loudnorm=I=-14:TP=-1:LRA=11`), mux with `out/silent.mp4` into `out/final.mp4` (`-c:v copy -c:a aac -b:a 192k -shortest`).
- Only use music we have the rights to.
- SFX restraint (owner feedback + editors' consensus): about 3-6 sound effects per 30 s of reel, only on big visual changes (a card or scene slamming in, a zoom hit, a cut to full screen, a marker strike). Never on caption words, stacked lines or list items, and no series of ticks. SFX sit well under the voice (mix at -14 dB under the voice bus; impacts may come up for one hero moment). Leave breaths and pauses alone. Comment every cue with the visual it marks.

## Loop before you show me anything
1. Render one frame per beat as a contact sheet and LOOK at it.
2. Score it 1-10 on: hook in first 2s, readability at phone size, motion quality, variety, composition, brand accuracy, sound sync.
3. Fix the 3 worst problems. Repeat until every score is 8+ (3 rounds minimum). Log scores in `docs/review_log.md`.
4. Only then do the full render.

## Secrets
- API keys live in `.env` only (never in prompts, code or docs).
