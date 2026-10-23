# Sound for one reel: synthesized bed + SFX on the page's cues + bleeps over masked swears, mixed to -14 LUFS.
# python -I tools/talk/audio.py <client> <reel> <dur_s>
#   needs <reel>/audio/voice_edit.wav (cut.py), <reel>/docs/words_edit.json, <reel>/docs/cues.json (node cues.mjs --dir ...)
#   mood from <reel>/keep.json "music": drive | bright | playful | night | calm
#   writes <reel>/audio/{voice_bleep,bed,sfx,mix}.wav; muxes <reel>/out/final.mp4 when out/silent.mp4 exists
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np

REEL = Path(sys.argv[1]) / sys.argv[2]
DUR = float(sys.argv[3])
SR = 48000
N = int(DUR * SR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
MOOD = json.load(open(REEL / "keep.json")).get("music", "drive")

def read(path):
    with wave.open(str(path)) as wf:
        x = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).reshape(-1, wf.getnchannels()).mean(1) / 32768
        assert wf.getframerate() == SR
    out = np.zeros(N); out[: min(N, len(x))] = x[:N]
    return out

def write(name, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(REEL / "audio" / name), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.stack([x, x], 1) * 32767).astype(np.int16).tobytes())

def lowpass(x, hz):
    c = np.exp(-2 * np.pi * hz / SR); y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - c) * x[i] + c * acc; y[i] = acc
    return y

hz = lambda m: 440 * 2 ** ((m - 69) / 12)
env_ad = lambda d, a, r: np.minimum(1, d / a) * np.exp(-np.maximum(0, d - a) / r)

# ---------- voice: bleep the masked words ----------
voice = read(REEL / "audio/voice_edit.wav")
words = json.load(open(REEL / "docs/words_edit.json"))
for w in words:
    if "*" in w["w"]:
        a, b = int(w["s"] * SR), min(N, int((w["e"] + 0.04) * SR))
        d = np.arange(b - a) / SR
        fade = np.minimum(1, np.minimum(d, d[-1] - d) / 0.01)
        voice[a:b] = 0.22 * np.sin(2 * np.pi * 1000 * d) * fade
write("voice_bleep.wav", voice)

# ---------- bed ----------
MOODS = {  # bpm, chord roots/qualities (midi), character
    "drive":   (100, [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]], "pulse"),   # Am F G Em, dark eighths
    "bright":  (112, [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 57, 60], [43, 50, 55, 62]], "arp"),     # C Am F G, rising arps
    "playful": (96,  [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]], "pluck"),   # D Bm G A, plucks
    "night":   (86,  [[50, 57, 60, 65], [46, 53, 58, 62], [41, 48, 57, 60], [48, 55, 60, 64]], "pulse"),   # Dm Bb F C, low pulse
    "calm":    (72,  [[48, 55, 64, 67], [45, 52, 60, 64], [41, 48, 57, 64], [43, 50, 59, 62]], "pad"),     # Cmaj7-ish, slow pads
}
BPM, CHORDS, KIND = MOODS[MOOD]
beat = 60 / BPM; bar = 4 * beat
bed = np.zeros(N)
for i, start in enumerate(np.arange(0, DUR, bar)):
    ch = CHORDS[i % 4]
    a, b = int(start * SR), min(N, int((start + bar + 0.6) * SR))
    d = t[a:b] - start
    pad_env = np.minimum(1, d / 0.5) * np.minimum(1, np.maximum(0, (bar + 0.6 - d) / 0.6))
    pad = sum(np.sin(2 * np.pi * hz(m) * d) + 0.25 * np.sin(2 * np.pi * hz(m) * 2.003 * d) for m in ch) / len(ch)
    bed[a:b] += pad * pad_env * (0.55 if KIND == "pad" else 0.3)
    root = hz(ch[0] - 12)
    if KIND == "pulse":  # eighth-note bass pulse
        bed[a:b] += 0.5 * np.exp(-((d % (beat / 2)) / 0.07)) * np.sin(2 * np.pi * root * d) * pad_env
    for k in range(8 if KIND in ("arp", "pluck") else 0):  # eighth-note arpeggio / plucks
        n0 = start + k * beat / 2
        a2, b2 = int(n0 * SR), min(N, int((n0 + 0.5) * SR))
        if a2 >= N: break
        d2 = t[a2:b2] - n0
        f = hz(ch[[1, 2, 3, 2][k % 4]] + 12)
        tone = np.sin(2 * np.pi * f * d2) * env_ad(d2, 0.005, 0.12 if KIND == "pluck" else 0.25)
        bed[a2:b2] += 0.22 * tone
    if KIND != "pad":  # soft kick on beats 1 and 3
        for k in (0, 2):
            k0 = start + k * beat; a3, b3 = int(k0 * SR), min(N, int((k0 + 0.3) * SR))
            if a3 >= N: break
            d3 = t[a3:b3] - k0
            bed[a3:b3] += 0.35 * np.sin(2 * np.pi * np.cumsum(50 + 60 * np.exp(-d3 / 0.025)) / SR) * np.exp(-d3 / 0.11)
bed = lowpass(bed, 2200 if KIND != "pad" else 1500)
bed = bed / (np.max(np.abs(bed)) + 1e-9) * 0.5 * np.minimum(1, t / 0.3) * np.minimum(1, np.maximum(0, (DUR - t) / 1.2))
write("bed.wav", bed)

# ---------- SFX ----------
def thump():
    d = np.arange(int(0.4 * SR)) / SR
    return 0.9 * np.sin(2 * np.pi * np.cumsum(48 + 80 * np.exp(-d / 0.03)) / SR) * np.exp(-d / 0.1) + 0.12 * rng.standard_normal(len(d)) * np.exp(-d / 0.006)
def tick():
    d = np.arange(int(0.06 * SR)) / SR
    return 0.3 * (np.sin(2 * np.pi * 2400 * d) * np.exp(-d / 0.007) + 0.4 * rng.standard_normal(len(d)) * np.exp(-d / 0.003))
def scratch():  # felt marker on a board: band-passed noise with a stroke envelope
    d = np.arange(int(0.32 * SR)) / SR
    n = rng.standard_normal(len(d)); n = n - lowpass(n, 1500); n = lowpass(n, 6000)
    return 0.5 * n * np.sin(np.pi * np.minimum(1, d / 0.32)) ** 0.6 * (1 + 0.4 * np.sin(2 * np.pi * 23 * d))
def whoosh():
    d = np.arange(int(0.45 * SR)) / SR
    n = lowpass(rng.standard_normal(len(d)), 2500)
    return 0.6 * n * np.sin(np.pi * d / 0.45) ** 2
def pop():
    d = np.arange(int(0.12 * SR)) / SR
    return 0.45 * np.sin(2 * np.pi * (500 + 900 * np.exp(-d / 0.01)) * d) * np.exp(-d / 0.03)
def rev():  # engine rev for a gauge hitting the redline: rising buzz into the hit
    d = np.arange(int(0.55 * SR)) / SR
    f = 55 + 160 * (d / 0.55) ** 2
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sign(np.sin(ph)) * 0.5 + np.sin(2 * ph) * 0.3
    return 0.45 * lowpass(tone, 900) * np.minimum(1, d / 0.05) * np.exp(-np.maximum(0, d - 0.45) / 0.05)
KINDS = {"rev": rev, "thump": thump, "tick": tick, "scratch": scratch, "whoosh": whoosh, "pop": pop}
sfx = np.zeros(N)
cues = json.load(open(REEL / "docs/cues.json"))
for c in cues:
    s = KINDS[c["kind"]]() * c.get("gain", 1)
    a = max(0, int((c["t"] - 0.05) * SR))  # SFX lands a hair early (sound-design 4.7)
    b = min(N, a + len(s)); sfx[a:b] += s[: b - a]
write("sfx.wav", sfx)

# ---------- mix: voice compressed, bed ducked under it, SFX on top, -14 LUFS ----------
A = REEL / "audio"
fc = ("[0:a]highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2,asplit[v][vk];"
      "[1:a]volume=-18dB[bd];[bd][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[bduck];"
      "[2:a]volume=-14dB[fx];[v][bduck][fx]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1:LRA=11[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(A / "voice_bleep.wav"), "-i", str(A / "bed.wav"), "-i", str(A / "sfx.wav"),
                "-filter_complex", fc, "-map", "[out]", "-ar", str(SR), str(A / "mix.wav")], check=True)
# one-pass loudnorm can land a dB or two off on short clips: measure, then trim the gain (limited) to hit -14
import re
meas = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(A / "mix.wav"), "-af", "ebur128", "-f", "null", "-"],
                      capture_output=True, text=True).stderr
lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", meas)[-1])
if abs(lufs + 14) > 0.3:
    tmp = A / "mix_pre.wav"; (A / "mix.wav").replace(tmp)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", f"volume={-14 - lufs:.2f}dB,alimiter=limit=0.84:level=false",
                    "-ar", str(SR), str(A / "mix.wav")], check=True)
    tmp.unlink()
print(f"mix measured {lufs:.1f} LUFS before trim")
assert np.max(np.abs(bed)) > 0 and len(cues) > 0
print(f"{MOOD} bed, {len(cues)} sfx, {sum('*' in w['w'] for w in words)} bleeps, {DUR:.2f}s")

silent = REEL / "out/silent.mp4"
if silent.exists():
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(silent), "-i", str(A / "mix.wav"), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", str(REEL / "out/final.mp4")], check=True)
    print("muxed out/final.mp4")
