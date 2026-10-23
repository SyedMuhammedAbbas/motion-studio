# Follow the speaker for the 9:16 crop with a face detector (UltraFace RFB-640, models/ultraface-RFB-640.onnx, see models/README.md).
# .venv/Scripts/python tools/talk/track.py <client> <reel>
#   -> <reel>/docs/track.json  [{x, y, h} face centre/height in source px per edited frame]
#      <reel>/out/track_check.jpg (1 fps, 608 px crop window drawn) to eyeball it
# Tuned for a standing speaker in 1920x1080 footage: faces lower than 42% of frame height (seated people) are ignored.
import json, subprocess, sys
from pathlib import Path
import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[2]
REEL = Path(sys.argv[1]) / sys.argv[2]
SW, SH = 1920, 1080
opts = ort.SessionOptions(); opts.log_severity_level = 3
sess = ort.InferenceSession(str(ROOT / "models/ultraface-RFB-640.onnx"), opts)

# letterbox 1920x1080 -> 640x360 inside the 640x480 input, so faces keep their aspect
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(REEL / "source/frames/%05d.jpg"), "-vf", "scale=640:360,pad=640:480:0:60",
                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, 480, 640, 3)
N = len(frames)

def faces(img):
    x = ((img.astype(np.float32) - 127) / 128).transpose(2, 0, 1)[None]
    sc, bx = sess.run(None, {"input": x})
    keep = sc[0, :, 1] > 0.6
    b = bx[0, keep] * [640, 480, 640, 480]
    s = sc[0, keep, 1]
    out = []  # greedy NMS
    for i in np.argsort(-s):
        x1, y1, x2, y2 = b[i]
        if all(max(0, min(x2, o[2]) - max(x1, o[0])) * max(0, min(y2, o[3]) - max(y1, o[1])) < 0.3 * (x2 - x1) * (y2 - y1) for o in out):
            out.append(b[i])
    # back to source px: (cx, cy, h)
    return [((x1 + x2) / 2 * 3, ((y1 + y2) / 2 - 60) * 3, (y2 - y1) * 3) for x1, y1, x2, y2 in out]

STEP = 2
det = [faces(frames[i]) for i in range(0, N, STEP)]
# The speaker stands: his face sits in the top ~40% of frame; the seated guest's is lower, the Zoom faces on the TV are small
def pick(min_h):
    out = []
    for fs in det:
        fs = [f for f in fs if f[2] > min_h and f[1] < 0.42 * SH]
        out.append(min(fs, key=lambda f: f[1]) if fs else None)
    return out
track = pick(60)
# second pass: when he faces the board the only faces left are the small Zoom tiles; drop anything well under his usual size
track = pick(0.55 * np.median([p[2] for p in track if p]))
found = np.array([p is not None for p in track])
assert found.mean() > 0.4, f"face found in only {found.mean():.0%} of samples"
t = np.arange(0, N, STEP)
cols = [np.interp(np.arange(N), t[found], [p[k] for p in track if p]) for k in range(3)]
# 0.5 s centred median so the crop holds still through small head moves
med = lambda a: np.array([np.median(a[max(0, i - 7): i + 8]) for i in range(N)])
x, y, h = (med(c) for c in cols)
json.dump([{"x": round(a, 1), "y": round(b, 1), "h": round(c, 1)} for a, b, c in zip(x, y, h)], open(REEL / "docs/track.json", "w"))

sel = range(0, N, 30)
boxes = ",".join(f"drawbox=enable='eq(n\\,{j})':x={max(0, min(SW - 608, x[i] - 304)):.0f}:y=0:w=608:h=1080:c=red:t=8,"
                 f"drawbox=enable='eq(n\\,{j})':x={x[i] - h[i] / 2:.0f}:y={y[i] - h[i] / 2:.0f}:w={h[i]:.0f}:h={h[i]:.0f}:c=yellow:t=6"
                 for j, i in enumerate(sel))
(REEL / "out").mkdir(exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(REEL / "source/frames/%05d.jpg"), "-vf",
                f"select='not(mod(n\\,30))',{boxes},scale=320:-1,tile=8x5", "-frames:v", "1", str(REEL / "out/track_check.jpg")], check=True)
print(f"{N} frames, face found in {found.mean():.0%} of samples, x {x.min():.0f}-{x.max():.0f}, face h {np.median(h):.0f}px")
