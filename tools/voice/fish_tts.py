# python -I tools/voice/fish_tts.py <script.txt> <out.wav> [--voice ID] [--speed 1.0]
# Fish Audio text-to-speech. Key comes from FISH_API_KEY in the studio .env (never printed).
# Blank lines in the script are kept as sentence breaks by Fish; one call per file.
import os, sys
from pathlib import Path
from fishaudio import FishAudio

ROOT = Path(__file__).resolve().parents[2]
for line in (ROOT / ".env").read_text(encoding="utf8").splitlines():
    k, _, v = line.partition("=")
    if k.strip() == "FISH_API_KEY":
        os.environ["FISH_API_KEY"] = v.strip().strip("\"'")

args = sys.argv[1:]
opt = lambda k, d: args[args.index(k) + 1] if k in args else d
src, out = Path(args[0]), Path(args[1])
audio = FishAudio().tts.convert(text=src.read_text(encoding="utf8").strip(), reference_id=opt("--voice", None),
                                format="wav", speed=float(opt("--speed", 1.0)))
out.write_bytes(audio)
print(f"wrote {out} ({out.stat().st_size // 1024} KB)")
