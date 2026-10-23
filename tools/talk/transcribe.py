# Word-level transcript of the full talk.
# .venv/Scripts/python tools/talk/transcribe.py <client> ["initial prompt: names and topic"]
#   reads <client>/source/talk16k.wav (ffmpeg -i talk.mp4 -ac 1 -ar 16000 talk16k.wav)
#   -> <client>/docs/words.json [{w,s,e,p}], <client>/docs/transcript.md (timestamped paragraphs)
import json, sys, time, wave
import numpy as np
from pathlib import Path
from faster_whisper import WhisperModel

HERE = Path(sys.argv[1])
PROMPT = sys.argv[2] if len(sys.argv) > 2 else None  # e.g. "Leadership training with <speaker>: <talk title>."
model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=8)
t0 = time.time()
# audio loaded here: faster-whisper 1.2.1 decode_audio breaks on PyAV 19 (metadata_errors kwarg)
with wave.open(str(HERE / "source/talk16k.wav")) as wf:
    audio = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
segs, info = model.transcribe(audio, language="en", word_timestamps=True,
                              vad_filter=True, beam_size=5,
                              initial_prompt=PROMPT)
(HERE / "docs").mkdir(exist_ok=True)
words, lines = [], []
for s in segs:
    lines.append(f"[{int(s.start // 60):02d}:{s.start % 60:05.2f}] {s.text.strip()}")
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)})
    print(lines[-1], flush=True)
json.dump(words, open(HERE / "docs/words.json", "w"), indent=0)
(HERE / "docs/transcript.md").write_text("\n".join(lines), encoding="utf-8")
print(f"done {len(words)} words in {time.time() - t0:.0f}s", flush=True)
