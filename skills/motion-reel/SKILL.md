---
name: motion-reel
description: Make a motion graphics video rendered from code in the studio at D:\Projects\Motion. Use whenever the user asks for any video, launch video, product video, showreel, product reel, animated explainer, motion ad, social clip, kinetic typography, logo animation, music-synced animation, animated chart, milestone or number reveal, Vox-style explainer, Apple-style launch film, 3D title or cinematic opener, newsletter promo, looping GIF cover, motion effect, or a 9:16 reel/TikTok re-cut, from any project or session.
---

# Motion reel

Studio: `D:\Projects\Motion`. Read its `CLAUDE.md` first (render contract, banned looks, sound, critique loop) and follow it. Work in that folder even if the session started elsewhere. Effort: xhigh for a new video, max when the first 3 seconds must carry a big launch, medium for fixes and re-renders (tell the user if the session is lower).

## Inputs to collect first (ask only what is missing)
- Subject: product + URL, or the topic/story.
- Duration and formats (9:16 1080x1920 default; 1:1 1080x1080; 16:9 1920x1080).
- Brand colors + fonts (or "take them from the site").
- A reference: a frame, a video, or an image folder in `videos/<name>/refs/`. If none, suggest one; without it the result falls back to defaults.
- Music: a supplied file (rights confirmed) or "synthesize".
- Any real metric and the call to action.

## Pipeline (gates: wait for the user's OK where marked)
1. Create `videos/<kebab-name>/` with `assets/ audio/ refs/ docs/ out/`. Reuse an existing folder for the same brand.
2. Assets: visit the URL with Playwright, save real screenshots, logo, colors and fonts to `assets/`. List what you found. Never invent UI.
3. Reference: if a video, `ffmpeg -i refs/x.mp4 -vf fps=2,scale=480:-1 refs/frames/%03d.png`, study the frames. Write `docs/style_guide.md` (palette hex, type family/weight/spacing, shot lengths, transitions, camera moves, texture, text enter/exit). Take the grammar, never the content.
4. Music: supplied track → `python beats.py videos/<name>/audio/track.wav > videos/<name>/audio/beats.json`. Otherwise synthesize music (default 120 BPM) and SFX (click, pop, thump, whoosh) with numpy + soundfile into `audio/`, and write `audio/beats.json` from the known BPM.
5. Write `docs/shotlist.md` on the beat grid: timestamp, what is on screen, motion, sound cue. Hook in the first 2s, something new every 2-4s, payoff every 3-5s, CTA/logo at the end; for loops the last frame equals the first. **Show it and wait for OK.**
6. Build `index.html`: one `<canvas id="c">`, `window.seek(t)`, springs from `/lib/motion.js` (`track()` for any value with several targets). For generative or illustrative shots (noise fields, particles with intent, hand-drawn strokes, shapes, typography on paths) use p5.js through `p5film()` from `/lib/p5film.js` (see `videos/_p5`); p5 reference: https://p5js.org/reference/. Plain canvas for UI/screenshot shots. Text inside a morphing container enters after the morph starts and leaves before the next.
7. Critique loop, 3 rounds minimum, until every score is 8+ (log in `docs/review_log.md`). Draft render: `node render.mjs --dir videos/<name> --dur <s> --fps 30 --sub 1`, then from `videos/<name>/`:
   - `ffmpeg -y -i out/silent.mp4 -vf "fps=2,scale=270:-1,tile=6x5" -frames:v 1 out/contact.png`
   - `ffmpeg -y -ss <t-0.1> -i out/silent.mp4 -vf "scale=320:-1,tile=12x1" -frames:v 1 out/strip.png` (around fast moments)
   - `ffmpeg -y -i out/silent.mp4 -vf "fps=1,scale=360:-1,tile=5x3" -frames:v 1 out/phone.png`
   Open the images and judge as a harsh motion director. Score: hook in first 2s, readability at phone size, motion quality, variety, composition, brand accuracy, sound sync. Hunt for: overlapping text during swaps, sliding instead of springing, corner labels/frame borders, centered-on-gradient shots, blurry scaled text, dead beats, a stutter at the loop seam. Fix the 3 worst, re-render, repeat.
8. Final: `node render.mjs --dir videos/<name> --dur <s>` (60 fps, 4 subframes) per format with `--w/--h --out silent_<fmt>.mp4`. Mix audio to -14 LUFS and mux into `out/final.mp4` (and `final_<fmt>.mp4`). Poster: `ffmpeg -y -ss <best t> -i out/final.mp4 -frames:v 1 out/poster.png`. Loop check if it loops: `ffmpeg -y -stream_loop 1 -i out/final.mp4 -c copy out/loop_check.mp4`.
9. Deliver: paths to final MP4(s), contact.png, poster.png, the final scores, and what you would improve next. Verify each file exists (ffprobe duration/resolution) before saying it is done.

## Recipes (charlie947/motion-graphics-skills, vendored)
`D:\Projects\Motion\recipes\motion-graphics-skills\skills\<name>\SKILL.md`. These are reference, not installed skills. When a request matches one, read it after the inputs step and use its structure, look, beat timing, facts rules and checks. Build and render through this pipeline.

| Request | Recipe |
|---|---|
| Brand system for a client (colors, type, motion rules) | `brand-intake` (write `brand.md` + `MOTION.md` into `videos/<name>/docs/`, never edit CLAUDE.md) |
| Product/offer/cohort launch, 30-45s | `launch-video` |
| Apple keynote / Mac-style launch | `apple-launch-film` |
| Documentary explainer (Vox style) | `vox-explainer` |
| Animated chart or stat | `animated-chart` |
| Milestone / big number reveal | `milestone-reveal` |
| A single effect (button to player, glass focus, chart morph, spring stack, particle logo...) | `motion-effects` + `references/effects.md` |
| 3D cinematic opener | `title-sequence-3d` |
| Newsletter or edition promo | `newsletter-promo` |
| Looping GIF cover | `loop-cover` |
| Re-cut any video to 9:16 Reel/TikTok | `reel-export` |
| Same brief, several AI models compared | `model-showdown` |
| Break down a reference video / write a brief or prompt | `reference-to-motion`, `motion-brief-writer`, `motion-prompt-writer` |

Where a recipe conflicts with this studio, the studio wins:
- Render with `render.mjs`, not HyperFrames. Recipe pages may be DOM/CSS (render.mjs captures the viewport when there is no `#c`, and passes `?render=1` so autoplay must stop there). Use `?w=&h=` for size and `window.ready`, not `window.__ready`.
- 60 fps with sub-frame blur by default. A recipe look that is stepped "on twos" (vox-explainer) renders with `--fps 24 --sub 1` and quantizes t to 1/12 s inside seek.
- Springs from lib/motion.js replace any ease curve; no overshoot on type.
- Real product UI only. A recipe's code-drawn device chrome (menu bar, notch, generic frame) is fine; the product's own screens must be real screenshots.
- Our banned list holds: no glow on UI, no corner labels, no fade-everything. Intentional particle formations (milestone-reveal, particle logo) are allowed; random bursts are not.
- Keep the shot-list OK gate even where a recipe says to build straight away.
- Never install apple-design, Three.js, another HyperFrames version or anything else a recipe mentions without the owner's yes (tool-vetting). Prefer a local copy of Three.js in `node_modules` over a CDN.
- Adopt the recipe's facts-first rule: every name, number and date on screen comes from a list the user approved.

## More recipes (vendored references, same "studio wins" rules)
All under `D:\Projects\Motion\recipes\`; each folder's `SOURCE.md` says what was kept and what is overridden.
| When | Read |
|---|---|
| Every film: continuity across cuts, rhythm numbers, framing check, adaptive shutter | `carry-and-rhythm.md` (ours) |
| Picking a look: 59 named styles with fixed rules (paper, cel, news package, 3D, CRT...) | `lemo-opuscar/styles/<slug>/STYLE.md` (+ `DEMO.md`); index in `styles/README.md` |
| Directing a film: benchmark first, 3 candidate structures, native move at the peak, silences before the turn, cue map, reading time = letters / 15 + 1.5 s | `lemo-opuscar/DIRECTOR.md`, `TECHNIQUE.md` |
| Wordless metaphor b-roll per voiceover line (paper collage assembling) | `collage-broll/SKILL.md` (build in code; no paid generators without a yes) |
| Hand-painted / ink / watercolour character animation, boiling linework | `claude-animation-base/ANIMATION_GUIDE.md`; template `videos/_brush` (p5film + p5.brush) |
| A named visual block (transition, overlay, title, kinetic type, chart, map, 3D, camera move) before hand-building it | `hyperframes-skills/skills/hyperframes-registry/`; craft refs in `skills/hyperframes/references/` |
| Porting a Remotion film or block | `hyperframes-skills/skills/remotion-to-hyperframes/` |

HyperFrames CLI (pinned 0.8.149) lives in `D:\Projects\Motion\hyperframes\`; use it from there with `npx --no-install hyperframes ...` for `catalog`, `add` (port the block into our page afterwards) and `check`. Telemetry stays off: set `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1 HYPERFRAMES_SKIP_SKILLS=1 HYPERFRAMES_NO_UPDATE_CHECK=1` on every call. Never run `feedback`, `usage`, `init` without `--skip-skills`, or any media-use script; never let it read the studio `.env`. Final renders still go through `render.mjs` (or Remotion for launch films).

## Craft case law (vibegameengine/video-motion-craft, vendored docs)
`D:\Projects\Motion\recipes\video-motion-craft\references\`. Read for every reel and every footage edit:
- `motion-laws.md` before the shot list (rhythm R1-R6, composition Q, type T1-T5, copy C, process P). T1 minimums: captions >=56px effective at 1080 wide, auxiliary >=32px; T4 9:16 safe zone (middle ~75%).
- `shot-vocabulary.md`: every shot in `docs/shotlist.md` carries a technique name; one technique leads once per video.
- `ffmpeg-editing.md` for footage; `sound-design.md` for SFX (pin cues relative to shot start, SFX 2-3 frames early, ship a no-music version when there is a bed); `beat-sync.md` when cutting to a track.
- `review-checklist.md` at the critique loop: report `code ✓/✗ (frame N)` alongside the 1-10 scores.
Studio wins on conflicts: no Remotion (render.mjs + seek(t)), springs from lib/motion.js instead of bezier curves, no grain/mesh "five layers" on top of real footage unless the look calls for it, no glow (T2's glow line is overridden).

## Long talk to several reels (talking-head clips)
The pipeline scripts live in `D:/Projects/Motion/tools/talk/` and take the client folder (then the reel name) as arguments; models come from `models/README.md`. Client folder `videos/<client>/` holds the shared source and transcript: `source/talk.mp4`, `source/talk16k.wav`, `tools/talk/transcribe.py <client>` (faster-whisper large-v3-turbo, word timestamps) -> `docs/words.json` + `docs/transcript.md`. Read the whole transcript, pick self-contained 30-60s arcs (hook line in the first 2s, one idea, a payoff line to end on), write `docs/reel_picks.md` with source timestamps and why, and **wait for OK**. Each reel is `videos/<client>/<reel>/` with `keep.json` (source ranges) -> `cut.py <client> <reel>` (pauses cut from the audio level, frame-snapped, frames + voice) -> `check_cut.py` (re-transcribes to catch clipped words) -> `track.py` (speaker face track for the 9:16 crop) -> `matte.py` when an effect needs the speaker cut out -> `index.html` importing `/tools/talk/reel.js` -> `audio.py <client> <reel> <dur>` (bed, SFX, bleeps, -14 LUFS mix). Give every reel its own display font and caption treatment so the set does not look templated. Give every reel its own effects from `D:/Projects/Motion/recipes/reel-effects.md` (orbit, couch wall, ui world, frame break, digital zoom, phone mockup, checklist, headline wall, zoom-through cut, chart grow, pull-back reveal, green screen, paper cut, doodle boil, vertigo, cover story, glass type); no effect leads in two reels of one set. Smoothness is a gate: follow CLAUDE.md "Footage edits: smoothness" (locked framing, cuts only between sentences, 0% or 25%+ framing changes, graphics never over the face) and pass `node tools/talk/qa.mjs --dir <reel> --dur <s>` before the final render; use your own best past build in `videos/` as the reference (client folders are private and git-ignored).

## Long films (music video, story, 60s+)
Treat as a multi-session production. Write a director's brief in `docs/brief.md` (logline, references, look, beat sheet, gates, deliverables), then gates: shot list → stills per shot + contact sheet → low-res rough cut with placeholder audio (fix pacing) → full animation → polish → sound → render. Write `docs/ANIMATION_GUIDE.md` before splitting chapters across `engineer` subagents so they share one style.

## Hard rules
- Real product UI only. Never invent screens. Use clients' assets only with their permission.
- No Math.random, no timers, no CSS transitions in render mode.
- Banned: corner labels, centered title on gradient, everything fading in, glow on UI, particle bursts.
- API keys only in `D:\Projects\Motion\.env`, never in prompts or code.

## Troubleshooting
- Looks generic: banned list ignored or no reference. Get a reference.
- Floaty/cheap motion: replace easing with springs, check effort.
- Blurry text: render at full size, never scale text up; check the strip.
- Render differs run to run: find Math.random or live timers.
- Wrong fonts: font files must load before `document.fonts.ready`; use local files.
- Audio drift: re-run beats.py on the exact final track, re-time to beats.json.
