# Long talk to edited reels: setup + prompt

## Setup (once per machine)
1. **Claude Code** (desktop app or CLI), with Opus as the main model.
2. **The studio repo** cloned to a folder such as `D:\Projects\Motion` (the motion-studio GitHub repo). It provides `render.mjs`, `lib/motion.js`, `cues.mjs`, `CLAUDE.md` (studio rules), the `motion-reel` skill in `skills/motion-reel/` (copy it to `~/.claude/skills/motion-reel/`) and the recipes in `recipes/` (`reel-effects.md`, `video-motion-craft/`, `motion-graphics-skills/`).
3. **Tools on PATH:** Node 20+ with `npm install` run in the repo (Playwright 1.63 + its Chromium), **ffmpeg 7+**, **Python 3.11+**.
4. **Python venv** in the repo (`.venv`) with `faster-whisper`, `onnxruntime` and `numpy`.
5. **Models** in `models/` (downloaded once, not committed; sources in `models/README.md`):
   - `ultraface-RFB-640.onnx` (face tracking), from the onnx/models GitHub repo
   - `modnet.onnx` (person cut-out), from Hugging Face `Xenova/modnet`
   - The Whisper `large-v3-turbo` model downloads itself on first run.
6. **Talk pipeline scripts** in `tools/talk/`, run from the studio folder. Each takes the client folder (and the reel name) as arguments:
   - `transcribe.py <client> ["names and topic"]`: word-level transcript of `<client>/source/talk16k.wav`
   - `cut.py <client> <reel>`: keep ranges to frames and voice, cutting only long pauses
   - `check_cut.py <client> <reel>`: re-transcribes the cut to catch clipped words
   - `track.py <client> <reel>`: face track
   - `matte.py <client> <reel> [--hi t0 t1]`: person cut-out, `--hi` for close-ups
   - `reel.js`: shared page helpers (`import { loadReel } from '/tools/talk/reel.js'`)
   - `audio.py <client> <reel> <dur>`: music bed, SFX, bleeps, -14 LUFS mix
   - `qa.mjs --dir <client>/<reel> --dur <s>`: face-safe and framing gate
7. **Optional reference reel:** the effect demo "17 video effects Claude can create" (Instagram reel Def9pj5TWtA), saved as `refs/ref.mp4`.

## The prompt (fill the brackets, paste into Claude Code opened in the studio folder)

> Make [3-4] short vertical reels (1080x1920, 30-50 s each) from the long talk video at [PATH TO VIDEO]. Client folder: `videos/[client-name]/`. Use the motion-reel skill and follow the studio rules in CLAUDE.md exactly. The bar is edits a professional editor would sign off: no AI-made tells.
>
> **1. Understand the whole talk first.** Copy the source into the client folder and transcribe all of it with word-level timestamps (Whisper large-v3-turbo). Read the full transcript. Pick the strongest self-contained 30-50 s moments: a hook line in the first 2 seconds, one clear idea, and a line to end on. Show me the picks (source timestamps, the hook, the ending, and why each works) and **wait for my OK**. Ask me how to handle swearing (default: bleep the audio and mask the caption as f***).
>
> **2. Plan the effects per reel, then wait for my OK.** Each reel gets its own effects from the catalog in `recipes/reel-effects.md`: orbit, couch wall, ui world, frame break, digital zoom, phone mockup, checklist, headline wall, zoom-through cut, chart grow, pull-back reveal, green screen, paper cut, doodle boil, vertigo, cover story, glass type. No effect repeats across the set. Every reel also gets its own font pair (free fonts from the official Google Fonts repo) and its own palette with one accent colour. Write each reel as a storyboard table: | time | his words | what happens on screen | why. Every animation must picture the words being said at that moment; nothing moves without a reason in the speech.
>
> **3. Make it smooth, the way a human editor would.**
> - Cut only pauses longer than about 0.8 s, and cut between sentences. Cover any mid-sentence cut with a graphic change on that same frame.
> - Lock the framing like a camera on a tripod. No crop that follows the face. A framing change is either none or at least 25%, never a small jump. Never freeze the picture while the person is still talking.
> - Keep graphics in their own zone (for example a panel on top, the speaker in a near-4:5 window below). Nothing ever covers the face, and the head never leaves the frame.
> - List every hard cut in `window.hardCuts` so the renderer doesn't blend frames across it.
> - Make the person's cut-out at higher resolution for close-ups so there is no halo around the edges.
> - The page exposes `window.qa()`, and `qa.mjs` must print PASS before any final render.
>
> **4. Sound.** Use the person's own voice, cleaned and tightened. Under it, a synthesized music bed ducked beneath the voice. Use only 3-6 sound effects per 30 s, and only on big visual changes, never on captions or list items. Mix to -14 LUFS with true peak at or below -1 dB.
>
> **5. Review before showing me anything.** Render half-size drafts, make contact sheets and full-size stills, and look at them. Score hook, readability at phone size, motion, variety, composition, brand and sound from 1 to 10. Fix the 3 worst problems each round, for at least 3 rounds, until every score is 8 or higher, and log each round in `docs/review_log.md`. Show me each storyboard before building and each draft before the final render.
>
> **6. Deliver one reel at a time.** Render finals one after another rather than in parallel. For each, verify the frame count, 1080x1920, duration and loudness, then send me the file with what's in it and anything you couldn't check (for example, that nobody has listened to the mix).
