# Re-transcribe a reel's edited voice and diff it against the intended words (catches clipped words at cuts).
# .venv/Scripts/python tools/talk/check_cut.py <client> <reel>
import json, re, sys, wave
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel

REEL = Path(sys.argv[1]) / sys.argv[2]
with wave.open(str(REEL / "audio/voice_edit.wav")) as wf:
    x = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).reshape(-1, wf.getnchannels())[:, 0].astype(np.float32) / 32768
    sr = wf.getframerate()
x = np.interp(np.arange(0, len(x), sr / 16000), np.arange(len(x)), x).astype(np.float32)  # to 16 kHz
segs, _ = WhisperModel("small.en", device="cpu", compute_type="int8").transcribe(x, language="en")
norm = lambda s: re.sub(r"[^a-z' ]", "", s.lower().replace("*", "u")).split()
heard = norm(" ".join(s.text for s in segs))
want = norm(" ".join(w["w"] for w in json.load(open(REEL / "docs/words_edit.json"))))
print("want :", " ".join(want)); print("heard:", " ".join(heard))
missing = [w for w in want if w not in heard]
print("missing:", missing or "none")
