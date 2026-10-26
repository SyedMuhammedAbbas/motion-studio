# Carry and rhythm

Studio recipe for films that should feel like one continuous take instead of a slideshow. Written for this studio; general continuity-editing ideas, no third-party text or code.

## 1. Carry, don't replace
- At every shot boundary something must survive the cut: the hero shape, a line, a color field, a word, the camera direction. It moves, scales or morphs into the next shot instead of vanishing.
- Plan it in the shot list: for each boundary write `carry: <element> (<what it becomes>)`. A boundary with nothing carried is a hard cut and must be listed in `window.hardCuts`, used on purpose (a burst, a punchline), not by accident.
- Check in review: step through stills at each boundary (t - 1 frame, t, t + 1 frame). If the eye has nothing to follow, add a carry or make it a deliberate cut.

## 2. Rhythm in numbers
Measure the shot list before building:
- **Shot-length variation.** Coefficient of variation (std / mean of shot lengths) of at least 0.25. Equal-length shots read as a slideshow.
- **Stillness.** Some frames should be genuinely still (holds on a read, a beat before the turn). Target 15-30 % of the runtime holding; the "something new every 2-4 s" rule still applies to what the viewer reads, a hold can carry the new thing.
- **Bursts.** At least one run of 3+ quick cuts (each under 0.5 s) against the slower shots around it. Contrast is what makes speed feel fast.
- **Energy map.** For a reference clip, sample motion per 0.5 s (frame difference with ffmpeg `select='gt(scene,0.1)'` or a pixel diff between stills) and write a one-line ASCII bar per second in `docs/style_guide.md`. Match its shape, not its content.

## 3. Framing check
- Before the final render, every text box and the hero element must sit fully inside the frame (and inside platform safe zones for 9:16) at every beat. Expose the boxes from the page (`window.qa()` already exists for talk reels; use the same idea) and assert them on the beat grid.

## 4. Sound from the timeline
- The page exports its visual events (`window.cues`, read by `cues.mjs`) and sound effects are placed from that list, not by hand. Same restraint rules as CLAUDE.md (3-6 per 30 s, big changes only).

## 5. Adaptive shutter (render.mjs)
- A page may define `window.motion(t0, t1)` returning the largest on-screen travel in px during one frame's shutter. Frames under 1 px are captured once instead of `--sub` times, so holds render fast with identical output. Fast frames keep full sub-frame blur. Return a conservative (larger) number when unsure.
