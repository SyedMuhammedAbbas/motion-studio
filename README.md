# motion-studio

A code-driven motion graphics studio for [Claude Code](https://claude.com/claude-code). You describe a video in one prompt; Claude writes it as a web page, renders it frame by frame and hands you an MP4. No After Effects, no timeline editor.

Based on the guide [How to Build a Motion Design Studio With Opus 5.5](https://docs.google.com/document/d/1N2aEojHhhs98ZokIp56wiGyPBL0v9tG1o7LWWdqOYb8/mobilebasic) (skool.com/raycfu), adapted for Windows, one folder per video, and p5.js.

## How it works

1. Every video is an `index.html` that exposes `window.seek(t)`: paint the exact frame for time `t` (seconds) onto `<canvas id="c">`.
2. `render.mjs` opens the page in headless Chromium (Playwright), calls `seek()` for every sub-frame, screenshots the canvas and pipes the PNGs into ffmpeg.
3. ffmpeg blends the sub-frames (4 per frame by default) into real motion blur and encodes H.264.

Nothing depends on a live clock, so the same page always renders the same file, and changing one shot is a small edit plus a re-render.

`CLAUDE.md` holds the house rules Claude follows on every video (banned "AI video" looks, springs instead of easing curves, beat-synced sound, a self-review loop). The `motion-reel` skill holds the step-by-step workflow.

## Requirements

- [Claude Code](https://claude.com/claude-code). Use a high effort setting (xhigh) for new videos.
- Node.js 20.11 or newer
- ffmpeg on your `PATH` (`ffmpeg -version` should work)
- Python 3.10+ with `numpy`, `librosa`, `soundfile` (only for measuring the beats of a supplied music track and for synthesized audio)

Tested on Windows 11 with Node 24, ffmpeg 9 and Python 3.14. macOS and Linux should work the same way; the paths below show both.

## Setup

```bash
git clone https://github.com/SyedMuhammedAbbas/motion-studio.git
cd motion-studio
npm ci
npx playwright install chromium
pip install numpy librosa soundfile
```

Install the skill so Claude uses this pipeline for every video request, from any project:

```bash
mkdir -p ~/.claude/skills/motion-reel
cp skills/motion-reel/SKILL.md ~/.claude/skills/motion-reel/SKILL.md
```

Then open `~/.claude/skills/motion-reel/SKILL.md` and replace `D:\Projects\Motion` (it appears three times) with the folder you cloned into. To keep the skill local to this folder instead, copy it to `.claude/skills/motion-reel/` inside the repo.

Check the install:

```bash
node lib/motion.test.mjs
node render.mjs --dir videos/_smoke --dur 2 --fps 30 --w 540 --h 960
```

The first prints `motion.js ok`; the second writes `videos/_smoke/out/silent.mp4`.

## Making a video

Start Claude Code in the studio folder and ask for a video. Examples:

```text
make a 20s vertical launch video for https://example.com, reference ./videos/example/refs/frame.png
```

```text
make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out.
```

The skill makes Claude:

1. Ask for anything missing: subject or URL, duration, formats, brand colors and fonts, a reference, music.
2. Create `videos/<name>/`, collect real screenshots and logos with Playwright, and study the reference.
3. Measure or synthesize the music and write a shot list on the beat grid, then **wait for your OK**.
4. Build the page, render drafts, review contact sheets of its own frames and fix the worst problems, at least 3 rounds.
5. Render the final at 60 fps in each format, mix audio to -14 LUFS and deliver `out/final.mp4`, a contact sheet and a poster frame.

The more you give it (a reference frame or video, the real product URL, a track), the less generic the result. The first draft is rarely the best one; the review loop is the method.

## Layout

```text
CLAUDE.md               house rules for every video
render.mjs              page -> MP4 renderer
cues.mjs                exports a page's window.cues (sound effect timings) to docs/cues.json
beats.py                beat grid of a music track -> beats.json
lib/motion.js           spring(), track(), clamp(), rng()
lib/p5film.js           p5.js adapter for the render contract
lib/motion.test.mjs     self-check for motion.js
skills/motion-reel/     the Claude Code skill
videos/_smoke/          minimal canvas example
videos/_p5/             minimal p5.js example
videos/<name>/          one folder per video (ignored by git): index.html, assets/, audio/, refs/, docs/, out/
```

## Writing a page by hand

Plain canvas:

```html
<canvas id="c"></canvas>
<script type="module">
import { track } from '/lib/motion.js';
const q = new URLSearchParams(location.search), W = +q.get('w') || 1080, H = +q.get('h') || 1920;
const c = document.getElementById('c'); c.width = W; c.height = H;
const g = c.getContext('2d');
window.seek = (t) => {
  g.fillStyle = '#f2efe9'; g.fillRect(0, 0, W, H);
  const x = track(t, [[0, W * 0.2], [0.3, W * 0.8]]); // springs to a new target at 0.3s
  g.fillStyle = '#ff4d2e'; g.fillRect(x - 50, H / 2 - 50, 100, 100);
};
</script>
```

p5.js (for generative and drawing-heavy shots):

```html
<script type="module">
import { p5film } from '/lib/p5film.js';
p5film({
  seed: 7,
  draw: (p, t) => {
    p.background('#f2efe9');
    p.circle(p.width / 2, p.height / 2, 200 + 100 * p.noise(t));
  },
});
</script>
```

Rules for both: the frame depends only on `t`. No CSS transitions, timers, `requestAnimationFrame`, `Math.random`, or p5's `frameCount`/`millis()`. Use `rng(seed)` from `lib/motion.js` or p5's `random()`/`noise()` (reseeded every frame by `p5film`). If the page loads images or fonts, set `window.ready` to a promise (in p5, load them in an async `setup`).

`track(t, [[time, value], ...])` stacks one damped spring per change, so a value can move between many targets and any frame still renders instantly.

## Commands

```bash
# Render (defaults: --fps 60 --sub 4 --w 1080 --h 1920 --dur 15 --start 0 --out silent.mp4)
node render.mjs --dir videos/<name> --dur 20
# Fast draft
node render.mjs --dir videos/<name> --dur 20 --fps 30 --sub 1 --w 540 --h 960
# Other formats from the same page
node render.mjs --dir videos/<name> --dur 20 --w 1080 --h 1080 --out silent_1x1.mp4
node render.mjs --dir videos/<name> --dur 20 --w 1920 --h 1080 --out silent_16x9.mp4

# Beat grid of a supplied track
python beats.py videos/<name>/audio/track.wav > videos/<name>/audio/beats.json

# Review images (run inside videos/<name>/)
ffmpeg -y -i out/silent.mp4 -vf "fps=2,scale=270:-1,tile=6x5" -frames:v 1 out/contact.png
ffmpeg -y -i out/silent.mp4 -vf "fps=1,scale=360:-1,tile=5x3" -frames:v 1 out/phone.png
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| Looks like every other AI video | Give it a reference frame or video; check `CLAUDE.md` is in the folder Claude runs in. |
| Motion feels floaty or cheap | Ask for springs from `lib/motion.js` everywhere; raise the effort setting. |
| Text is blurry when it scales | Lay text out at final size; never scale it up from small. |
| Two renders differ | Something uses `Math.random`, a timer or p5's `frameCount`. |
| Wrong fonts in the render | Use local font files and make sure they load before `window.ready` resolves. |
| Music and picture drift | Re-run `beats.py` on the exact final track and re-time to `beats.json`. |

## Music and assets

Only use music you have the rights to; code-synthesized music is the safe default. Use a client's logos, screenshots and footage only with their permission. Keep API keys (for example a voiceover service) in `.env`, which is git-ignored.
