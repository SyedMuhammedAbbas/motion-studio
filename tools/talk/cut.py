# Cut one reel out of the talk: keep ranges -> tightened chunks, edited word timings, frames and voice.
# python -I tools/talk/cut.py <client> <reel>   (reads <client>/<reel>/keep.json, <client>/docs/words.json, <client>/source/talk.mp4)
# keep.json: {"keep": [[src_s, src_e], ...], "fix": {"heard": "caption" | null}, "max_gap": 0.3}
# writes <reel>/docs/cuts.json, <reel>/docs/words_edit.json, <reel>/source/frames/%05d.jpg, <reel>/audio/voice_edit.wav
import json, subprocess, sys, wave
import numpy as np
from pathlib import Path

HERE = Path(sys.argv[1])
REEL = HERE / sys.argv[2]
FPS = 30000 / 1001  # source frame rate
cfg = json.load(open(REEL / "keep.json"))
KEEP, FIX, MAX_GAP = cfg["keep"], cfg.get("fix", {}), cfg.get("max_gap", 0.45)
PRE, POST = 0.08, 0.20

words = json.load(open(HERE / "docs/words.json"))
# 10 ms level track of the talk: Whisper stretches word ends over pauses, so pauses are found from the audio itself
with wave.open(str(HERE / "source/talk16k.wav")) as wf:
    pcm = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
DB = 20 * np.log10(np.sqrt(np.mean(pcm[: len(pcm) // 160 * 160].reshape(-1, 160) ** 2, 1)) + 1e-6)
PAD = 0.10  # silence kept on each side of a removed pause

def speech_intervals(lo, hi):
    """[lo, hi] minus silent runs longer than MAX_GAP (edges trimmed to PAD/POST)."""
    i0, i1 = int(lo * 100), int(hi * 100)
    d = DB[i0:i1]
    thr = np.percentile(d, 20) + 0.35 * (np.percentile(d, 90) - np.percentile(d, 20))  # near the floor so soft word ends survive
    loud = np.flatnonzero(d > thr)
    assert len(loud), f"no speech in {lo}-{hi}"
    first, last = loud[0], loud[-1]
    iv, s = [], (i0 + first) / 100 - PRE
    gaps = np.flatnonzero(np.diff(loud) > MAX_GAP * 100)
    for g in gaps:
        iv.append((s, (i0 + loud[g] + 1) / 100 + PAD))
        s = (i0 + loud[g + 1]) / 100 - PAD
    iv.append((s, (i0 + last + 1) / 100 + POST))
    return iv

intervals, kept_words = [], []
# ranges may come out of source order (a cold open from later in the talk); each range keeps its own chunks
for k, (lo, hi) in enumerate(KEEP):
    ws = [w for w in words if lo - 0.01 <= w["s"] <= hi]
    assert ws, f"no words in {lo}-{hi}"
    kept_words += [(k, w) for w in ws]
    intervals += [(k, s, e) for s, e in speech_intervals(lo, min(hi, ws[-1]["e"]) + 0.3)]

cuts, t = [], 0.0
for k, s, e in intervals:
    if cuts and cuts[-1]["k"] == k and s < cuts[-1]["src_e"]:
        s = cuts[-1]["src_e"]
    s, e = round(s * FPS) / FPS, round(e * FPS) / FPS  # whole source frames so picture and sound chunks match
    if e - s < 2 / FPS:
        continue
    cuts.append({"k": k, "src_s": round(s, 4), "src_e": round(e, 4), "t": round(t, 4)})
    t += e - s

def edited(x, k):
    """source time -> edited time within range k; a time inside a removed pause snaps to the nearest kept edge."""
    cs = [c for c in cuts if c["k"] == k]
    for c in cs:
        if x < c["src_s"]:
            return c["t"]
        if x <= c["src_e"]:
            return c["t"] + x - c["src_s"]
    return cs[-1]["t"] + cs[-1]["src_e"] - cs[-1]["src_s"]

out = []
for k, w in kept_words:
    txt = FIX.get(w["w"], w["w"])
    if txt is None:
        continue
    s = edited(w["s"], k)
    c = max((c for c in cuts if c["t"] <= s + 1e-6), key=lambda c: c["t"])
    e = min(edited(w["e"], k), c["t"] + c["src_e"] - c["src_s"])  # stretched ends stop at their chunk
    out.append({"w": txt, "s": round(s, 3), "e": round(max(e, s + 0.08), 3)})

assert all(c["src_e"] > c["src_s"] for c in cuts)
assert all(b["s"] >= a["s"] for a, b in zip(out, out[1:]))
for d in ("docs", "source/frames", "audio"):
    (REEL / d).mkdir(parents=True, exist_ok=True)
json.dump(cuts, open(REEL / "docs/cuts.json", "w"), indent=0)
json.dump(out, open(REEL / "docs/words_edit.json", "w"), indent=0)

# ffmpeg seeks near the range (accurate when re-encoding) so it does not decode the whole talk; trims are relative to BASE
BASE = max(0.0, min(c["src_s"] for c in cuts) - 1)
f = []
for i, c in enumerate(cuts):
    a, b = round(c["src_s"] - BASE, 4), round(c["src_e"] - BASE, 4)
    f.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}];")
    f.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,afade=t=out:st={b - a - 0.015:.3f}:d=0.015[a{i}];")
f.append("".join(f"[v{i}][a{i}]" for i in range(len(cuts))) + f"concat=n={len(cuts)}:v=1:a=1[v][a]")
(REEL / "docs/cut_filter.txt").write_text("\n".join(f))
for old in (REEL / "source/frames").glob("*.jpg"):
    old.unlink()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(BASE), "-to", str(max(c["src_e"] for c in cuts) + 1), "-i", str(HERE / "source/talk.mp4"),
                "-/filter_complex", str(REEL / "docs/cut_filter.txt"),
                "-map", "[v]", "-q:v", "3", str(REEL / "source/frames/%05d.jpg"),
                "-map", "[a]", "-ar", "48000", str(REEL / "audio/voice_edit.wav")], check=True)
n = len(list((REEL / "source/frames").glob("*.jpg")))
print(f"{len(cuts)} chunks, {t:.2f}s edited, {n} frames ({n / FPS:.2f}s)")
