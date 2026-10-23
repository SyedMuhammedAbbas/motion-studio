# Reel effects catalog (talking-head and footage reels)

The owner's effect vocabulary for reels. Every reel in a set gets its **own** effects: no effect leads in two reels of the same set, and inside one reel each effect is the hero once (motion-laws P4). Reference demo: the owner's reel "17 video effects Claude can create" (keep a local copy in the client's refs/ folder). Pick 3-5 per reel from what the words give you, then name them in `docs/shotlist.md`.

Built in the studio pipeline (render.mjs + `window.seek(t)`, springs from lib/motion.js). Footage helpers live with the client (`tools/talk/`: `reel.js`, `track.py` face tracking, `matte.py` person matte).

Needs: **T** = speaker track (`track.py`, UltraFace), **M** = person matte (`matte.py`, MODNet, `models/modnet.onnx`), nothing = canvas only.

| Effect | What it looks like | Build | Needs | Use on |
|---|---|---|---|---|
| **orbit** | Small cards (screenshots, stat cards, words) circle the speaker in 3D, passing behind him and in front of him | Ellipse path per card, depth sort against the speaker: draw far cards, then the matte cut-out, then near cards; cards face camera, scale with depth | T M | Lists of results, "all of these" moments |
| **couch wall** | Screenshots or cards appear pinned on the wall behind the seated/standing speaker, slight tilt, soft shadow | Cards drawn over the footage, then the speaker's matte cut-out on top so they sit behind him; each card lands with a stiff spring + tiny rotation | M | Proof, receipts, "look at all this" |
| **ui world** | The frame splits: an app-like panel on top (drop zone, chat, board) where things fly in, the speaker live underneath | Code-drawn neutral panel (never a real app's UI), clips/cards fly from the speaker into the panel and land in slots | T | Process, "you drop X, it does Y" |
| **frame break** | Footage sits in a framed card; the speaker steps out past the frame edge over the type behind | Draw card footage clipped to the card, type, then the matte cut-out unclipped on top so head/shoulders cross the border | T M | Payoff line, the strongest claim |
| **digital zoom** | Crash punch-in on a word (1.0 to 1.35+ in ~6 frames), hold, hard cut back | Spring the crop zoom (stiff, no overshoot), motion blur from sub-frames; aim at the tracked face | T | Emphasis words; max 3 per reel (R4) |
| **phone mockup** | The footage plays inside a phone on a clean background, phone tilts in with a soft spring | Code-drawn generic phone (rounded rect, notch), footage clipped to the screen; never a real app's UI on it | T | Social proof, "people are watching" |
| **checklist** | Items appear as spoken and get ticked; the list builds down the screen | Rows spring in on their word time; tick is a drawn stroke (marker or clean), done items dim | - | Lists, characteristics, steps |
| **headline wall** | Paper headline notes get pinned to the wall behind the speaker, filling it up | Notes (off-white cards, black type) drawn over footage, matte cut-out on top; they pile in faster and faster (R2). A pure-type variant fills the frame with rows of the key word | M | Hooks, many claims at once |
| **zoom-through cut** | The camera pushes into an element (a letter's counter, a box, a dot) until it fills the frame and becomes the next shot | Scale an element around its centre with an accelerating spring; at full cover hard-switch to the next shot drawn inside it | - | Moving between sections |
| **chart grow** | A chart or calendar grid on the wall behind the speaker, a bright line climbs across it with a label chip ("SCALE >") | Grid + line drawn progressively behind the matte cut-out; values only from the speaker's words; counters roll | M | Revenue, growth, milestones |
| **pull-back reveal** | Starts full-frame on the speaker, pulls back to reveal the shot lives inside a bigger layout (an editor, a board, a grid of tiles) | Spring the whole scene's scale from ~2.5 to 1; the surrounding layout was already laid out outside the start frame | - | Payoffs, "here's the whole picture" |
| **green screen** | The speaker cut out and placed over a different background (a web page, an illustration, a generated scene) | Matte composite over the new background; grade the background to his lighting | M | Metaphors, "imagine..." |
| **paper cut** | The speaker becomes a paper sticker (thick white cut edge, drop shadow) on a collage: tape, scribbles, cross-outs, cut-out letters | Dilate the matte for the white edge, drop shadow, collage pieces enter stop-motion on twos (t floored to 1/12 s) | M | Jokes, playful asides |
| **doodle boil** | A boiling white outline traces the speaker; hand-drawn doodles (icons, arrows, hearts) boil around him | Outline from the matte edge, re-jittered every 2 frames (seeded); doodles via marker strokes, boiled on twos, placed from the tracked head | T M | Reactions, emphasis on a person |
| **vertigo** | Dolly zoom: the speaker stays the same size while the background stretches away (or rushes in) | Background layer zooms one way, matte cut-out of the speaker scaled the opposite way so he holds size | T M | A realisation, an uncomfortable truth |
| **cover story** | A magazine cover: masthead behind the speaker's head, cover lines around him, issue line | Masthead type first, speaker matte over it (head overlaps letters), cover lines spring in on their words | M | Titles, the reel's thesis, end card |
| **glass type** | Type on frosted-glass panels over the footage: blurred backdrop inside the panel, thin light edge | Draw panel region of the footage again with `filter: blur()` + slight brightness, clip to rounded rect, 1px light stroke; no glow | - | Quotes, calm lines over busy footage |

## Rules that still hold
- Studio wins: no glow, no corner labels, no fade-everything, springs not easing, no overshoot on type, real footage only.
- Matte edges: check a full-size still of every cut-out effect; hair and hand edges must not crawl. If the matte is bad on a shot, use the effect on a different shot.
- Effects serve the words: an effect lands on the word it illustrates, never on filler.
- Sound: one SFX per effect's hero moment at most, about 3-6 per 30 s overall (CLAUDE.md Sound); nothing on caption lines.
- Meaning first (owner feedback on the tree reel): every animation is the picture of the words under it at that moment. Nothing moves without a reason in the speech: no decorative growth, drift, idle pushes or ambient particles. Write the storyboard as | time | his words | what happens and why |.
- Never freeze the footage while the speaker is still talking: a held frame under live audio reads as a stalled video (owner feedback, tree reel STOP beat). Carry the beat with type, sound or framing instead.
