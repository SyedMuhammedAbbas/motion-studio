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
- Never install HyperFrames, apple-design, Three.js or anything else a recipe mentions without the owner's yes (tool-vetting). Prefer a local copy of Three.js in `node_modules` over a CDN.
- Adopt the recipe's facts-first rule: every name, number and date on screen comes from a list the user approved.

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
