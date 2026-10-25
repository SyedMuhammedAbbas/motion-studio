# Launch director: standing process for every launch video

Owner-approved process (2026-10-25) for SaaS launches, AI feature announcements and tech brand films. The studio CLAUDE.md still wins where it is stricter (look bans, springs, SFX restraint, real UI only, ask every question before building).

Engine: Remotion (React) in `remotion/`, one composition per video, frame-deterministic. Three.js (`@remotion/three`) only when 3D clearly improves the shot.
Licence: Remotion is free only for individuals, non-profits and companies of up to 3 employees; larger companies need a Remotion Company Licence. The owner confirms which applies per client.

## Phase 1: reference and creative analysis (before any code)
1. Inspect the product, screenshots, brand rules, assets and references.
2. Name the audience, the one central message and the emotional tone.
3. Analyse references shot by shot where accessible (sample frames in the browser; MP4s in `refs/` are better). Never copy another company's branding or composition.
4. Write down typography, composition, movement, camera, transitions, timing and audio of each reference.
5. Propose one creative direction with reasons.
6. List the product assets that must stay accurate.
Output: `docs/analysis.md`.

## Phase 2: storyboard (owner approves before production)
Timecoded, per scene: narrative purpose, duration and frame range, start and end state, type and layout, focal point, animation hierarchy, camera position and move, easing/spring, transition into the next scene, SFX and musical accents. The message must read without heavy on-screen text.
Output: `docs/storyboard.md`.

## Phase 3: motion design system
Tokens for type scale and weights, palette and contrast, spacing grid, springs and durations, camera behaviour, shadow/light/depth, transitions and effects. Reusable across videos in `remotion/src/system/`; per-brand values in `remotion/src/brands/<brand>.ts`.
Avoid: excessive bounce, arbitrary floating elements, repeated zooms, particle bursts, identical entrances.

## Phase 4: production
Remotion components, frame-deterministic, real product UI and brand assets, precise type, natural acceleration, purposeful camera, layered depth, no clipping or layout shift, audio and picture cues in sync, one visual language.

## Phase 5: visual QA (rendering is not the same as good)
Render key frames and low-res previews plus short motion strips around each move. Review type and composition, smoothness, continuity, pacing and readability, product accuracy, transitions, audio sync, brand consistency. Revise weak scenes only. Log in `docs/review_log.md`.

## Phase 6: final output
1920x1080 master, 1080x1920 vertical with reframed compositions (not a crop), source, reusable components, final mix (-14 LUFS), QA report in `docs/qa_report.md` listing remaining limits.

## Quality rules
Every move serves the story; contrast fast and slow sections; keep negative space; no over-animation; make the big moments distinct; sound is design, not an afterthought; transform instead of cutting to unrelated things; never fabricate product functionality; judge the whole video, not single scenes.
