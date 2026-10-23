# Models

ONNX models used by `tools/talk/`. They are not committed (`models/*` is git-ignored except this file); download each once into this folder under the file name below.

| File | Used by | Source |
|---|---|---|
| `ultraface-RFB-640.onnx` | `tools/talk/track.py` (face track) | [onnx/models](https://github.com/onnx/models): `validated/vision/body_analysis/ultraface/models/version-RFB-640.onnx`, renamed |
| `modnet.onnx` | `tools/talk/matte.py` (person matte) | Hugging Face [`Xenova/modnet`](https://huggingface.co/Xenova/modnet): `onnx/model.onnx`, renamed |

Direct links:
- https://github.com/onnx/models/raw/main/validated/vision/body_analysis/ultraface/models/version-RFB-640.onnx
- https://huggingface.co/Xenova/modnet/resolve/main/onnx/model.onnx

SHA-256 of the copies the studio was built with:

```
8f4c659275977e7a3bfbfa339a9c769ad793df50f9c0baa8c14b11baa1646430  ultraface-RFB-640.onnx  (1,588,012 bytes)
07c308cf0fc7e6e8b2065a12ed7fc07e1de8febb7dc7839d7b7f15dd66584df9  modnet.onnx             (25,888,640 bytes)
```

The Whisper models (`large-v3-turbo` for `transcribe.py`, `small.en` for `check_cut.py`) are fetched by faster-whisper on first run and cached outside the repo.
