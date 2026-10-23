# Person matte for cut-out effects (frame break, green screen, vertigo, cover story): MODNet, models/modnet.onnx (see models/README.md).
# .venv/Scripts/python tools/talk/matte.py <client> <reel>  (needs docs/track.json) -> <reel>/source/matte/NNNNN.png (896x512, alpha = speaker)
# .venv/Scripts/python tools/talk/matte.py <client> <reel> --hi <t0> <t1>  -> <reel>/source/matte_hi/NNNNN.png (1344x768) for edited seconds t0-t1:
#   for close-ups where the cut-out edge is seen big (frame break, vertigo): 1.5x resolution, edge choked so no background
#   fringe survives, lightly feathered, and smoothed over neighbouring frames of the same shot so the edge does not boil.
# Only the region connected to the speaker's tracked face is kept, so other people and screens in the room drop out.
import json, subprocess, sys
from pathlib import Path
import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[2]
REEL = Path(sys.argv[1]) / sys.argv[2]
HI = "--hi" in sys.argv
MW, MH = (1344, 768) if HI else (896, 512)  # hi: 1.5x, about 2x the cost of a regular matte
opts = ort.SessionOptions(); opts.log_severity_level = 3
sess = ort.InferenceSession(str(ROOT / "models/modnet.onnx"), opts)
track = json.load(open(REEL / "docs/track.json"))
out = REEL / ("source/matte_hi" if HI else "source/matte"); out.mkdir(parents=True, exist_ok=True)

def keep_connected(a, sx, sy):
    """grow from the face seed through alpha > 0.35 on a 1/4-res grid, zero everything not reached"""
    q = 8 if HI else 4
    m = a[::q, ::q] > 0.35
    seed = np.zeros_like(m)
    y0, x0 = int(np.clip(sy / q, 0, m.shape[0] - 1)), int(np.clip(sx / q, 0, m.shape[1] - 1))
    seed[max(0, y0 - 2): y0 + 2, max(0, x0 - 2): x0 + 2] = True
    seed &= m
    if not seed.any():
        return a  # face not on the matte (turned away): keep the raw matte rather than lose him
    while True:
        g = seed.copy()
        g[1:] |= seed[:-1]; g[:-1] |= seed[1:]; g[:, 1:] |= seed[:, :-1]; g[:, :-1] |= seed[:, 1:]
        g &= m
        if (g == seed).all():
            break
        seed = g
    g = seed.copy()  # one cell of slack so soft edges survive, then back to full res
    g[1:] |= seed[:-1]; g[:-1] |= seed[1:]; g[:, 1:] |= seed[:, :-1]; g[:, :-1] |= seed[:, 1:]
    return a * np.repeat(np.repeat(g, q, 0), q, 1)[: a.shape[0], : a.shape[1]]

n = len(track)
FPS = 30000 / 1001

def shift_min(a):  # 3x3 erosion
    b = a.copy()
    b[1:] = np.minimum(b[1:], a[:-1]); b[:-1] = np.minimum(b[:-1], a[1:])
    c = b.copy()
    c[:, 1:] = np.minimum(c[:, 1:], b[:, :-1]); c[:, :-1] = np.minimum(c[:, :-1], b[:, 1:])
    return c

def box3(a):  # 3x3 box blur (feather)
    p = np.pad(a, 1, mode="edge")
    return sum(p[dy:dy + a.shape[0], dx:dx + a.shape[1]] for dy in range(3) for dx in range(3)) / 9

def write(dst, a):
    ya = np.stack([np.full(a.shape, 255, np.uint8), (np.clip(a, 0, 1) * 255).astype(np.uint8)], -1)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "ya8", "-s", f"{a.shape[1]}x{a.shape[0]}", "-i", "-", str(dst)],
                   input=ya.tobytes(), check=True)

if HI:
    t0, t1 = map(float, sys.argv[sys.argv.index("--hi") + 1: sys.argv.index("--hi") + 3])
    f0, f1 = max(0, int(t0 * FPS)), min(n - 1, int(t1 * FPS) + 1)
    cuts = json.load(open(REEL / "docs/cuts.json"))
    shot = lambda i: sum(1 for c in cuts if round(c["t"] * FPS) <= i)
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-start_number", str(f0 + 1), "-i", str(REEL / "source/frames/%05d.jpg"),
                             "-frames:v", str(f1 - f0 + 1), "-vf", f"scale={MW}:{MH}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    raw = []
    for i in range(f0, f1 + 1):
        x = np.frombuffer(proc.stdout.read(MW * MH * 3), np.uint8).reshape(MH, MW, 3).astype(np.float32)
        a = sess.run(None, {"input": ((x - 127.5) / 127.5).transpose(2, 0, 1)[None]})[0][0, 0]
        raw.append((keep_connected(a, track[i]["x"] * MW / 1920, track[i]["y"] * MH / 1080) * 255).astype(np.uint8))
    proc.wait()
    for k, i in enumerate(range(f0, f1 + 1)):
        a = raw[k] / 255
        nb = [raw[j] / 255 for j in (k - 1, k + 1) if 0 <= j < len(raw) and shot(f0 + j) == shot(i)]
        if len(nb) == 2:
            a = 0.5 * a + 0.25 * (nb[0] + nb[1])
        a = np.clip((a - 0.3) / 0.55, 0, 1)  # choke: drop the half-transparent fringe that carries the window light
        a = box3(shift_min(shift_min(a)))     # pull the edge in ~2 px, then feather 1 px
        write(out / f"{i + 1:05d}.png", a)
    print(f"wrote {f1 - f0 + 1} hi-res mattes for frames {f0 + 1}-{f1 + 1}")
    sys.exit()

proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(REEL / "source/frames/%05d.jpg"), "-vf", f"scale={MW}:{MH}",
                         "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
for i in range(n):
    x = np.frombuffer(proc.stdout.read(MW * MH * 3), np.uint8).reshape(MH, MW, 3).astype(np.float32)
    dst = out / f"{i + 1:05d}.png"
    if dst.exists() and dst.stat().st_size > 0:  # resume: keep mattes from an earlier run
        continue
    a = sess.run(None, {"input": ((x - 127.5) / 127.5).transpose(2, 0, 1)[None]})[0][0, 0]
    a = keep_connected(a, track[i]["x"] * MW / 1920, track[i]["y"] * MH / 1080)
    ya = np.stack([np.full((MH, MW), 255, np.uint8), (a * 255).astype(np.uint8)], -1)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "ya8", "-s", f"{MW}x{MH}", "-i", "-", str(dst)],
                   input=ya.tobytes(), check=True)
    if i % 100 == 0:
        print(f"matte {i}/{n}", flush=True)
proc.wait()
assert len(list(out.glob("*.png"))) == n
print(f"wrote {n} mattes")
