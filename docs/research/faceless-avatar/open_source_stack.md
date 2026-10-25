# Self-hosted and open-source avatar video from audio + image (state as of Oct 2026)

Method note: figures come from official GitHub READMEs and pricing pages fetched in this session. Search aggregator summaries were treated as secondary. Many READMEs give no VRAM or speed numbers; those are listed as gaps rather than guessed. The READMEs were fetched live, so I could not date-check each statement; vendor pricing moves often.

## 1. Audio-driven talking-head / avatar models: quality, length, license, VRAM, speed, ComfyUI

### Takeaway
Two families exist. (a) Lip-sync / face-region models (MuseTalk, LatentSync, Wav2Lip, SadTalker) run on 4-18 GB cards but only move the mouth or a small face region. (b) Whole-video diffusion avatars built on Wan 2.1/2.2 (InfiniteTalk, OmniAvatar, StableAvatar, Wan2.2-S2V, LongCat-Video-Avatar) give real head/body motion from one image but need roughly 18-80 GB, or heavy offload/quantization on 24 GB cards, and run far slower than real time. Licenses: the strongest commercial-clean set is InfiniteTalk, OmniAvatar, Wan2.2-S2V (Apache 2.0), StableAvatar, MuseTalk (MIT), LatentSync (Apache 2.0), LongCat-Video-Avatar (MIT). Wav2Lip is explicitly non-commercial.

### Cited Findings
Lip-sync / face-region models
- MuseTalk (1.5 released 2025-03-28): code MIT, README says academic and commercial use allowed and models "available for any purpose"; third-party parts (whisper, dwpose) follow their own licenses; test data is non-commercial research only. Face region is 256x256, authors suggest GFPGAN-type super-resolution for higher res. Real-time 30fps+ on a Tesla V100. Minimum tested hardware: 4 GB RTX 3050 Ti laptop, fp16, 8-second video took about 5 minutes. Recommends 25fps input. ComfyUI: third-party chaojie/ComfyUI-MuseTalk, unverified by maintainers. — [MuseTalk README](https://github.com/TMElyralab/MuseTalk)
- LatentSync (ByteDance): Apache-2.0 repo. Inference VRAM minimum 8 GB for v1.5, 18 GB for v1.6. v1.6 trained at 512x512 to reduce blur. 20-50 inference steps trade quality for speed. README does not mention ComfyUI or give timing. — [LatentSync README](https://github.com/bytedance/LatentSync)
- Independent article comparing licenses confirms: Wav2Lip no license file, weights trained on LRS2, commercial use barred; SadTalker Apache 2.0 except third-party components; MuseTalk MIT + dependency manifest; LatentSync Apache 2.0 no carve-outs; LongCat-Video-Avatar 1.5 MIT. Expects 25fps video, 16 kHz audio for LatentSync. — [creativeainews license roundup](https://www.creativeainews.com/articles/open-source-lip-sync-licenses-commercial-use-2026/)
- Wav2Lip: README says repo only for personal/research/non-commercial use; any commercial use strictly prohibited; generated face region is 192x288 in newer models; commercial alternative is the paid sync.so API. — [Wav2Lip README](https://github.com/Rudrabha/Wav2Lip)
- SadTalker: README highlights say license updated to Apache 2.0 and non-commercial restriction removed; disclaimer bars fraud/deception/portrait-rights abuse. Single still image in. No VRAM or speed figures in README; has Gradio WebUI and A1111 extension, no ComfyUI mention in README. — [SadTalker README](https://github.com/OpenTalker/SadTalker)
- LivePortrait: README does not state license terms in the text I got (LICENSE file exists; credits InsightFace, which is known elsewhere for non-commercial model terms, not verified here). It is a video/image-driven portrait animator, not audio-driven; audio-driven projects in its list are separate (ditto-talkinghead, AVTR-1). ComfyUI nodes are community (kijai ComfyUI-LivePortraitKJ uses MediaPipe instead of InsightFace). torch.compile gives 20-30% speedup, not on Windows. — [LivePortrait README](https://github.com/KwaiVGI/LivePortrait)

Diffusion-based avatars (talking head with head/body motion)
- InfiniteTalk (MeiGen-AI, built on Wan 2.1): Apache-2.0. Image-to-video and video-to-video dubbing. Default max_frame_num 1000 (about 40 s); authors say image-to-video stays good to about 1 minute, then color shift grows; video-to-video unlimited via streaming. 480p and 720p. No VRAM figure in README; offers fp8 (`--quant fp8`, single GPU), `--num_persistent_param_in_dit 0` for very low VRAM, TeaCache, and 4-step (lightx2v) or 8-step (FusionX) LoRAs vs 40 default steps (FusionX worsens color shift and identity). ComfyUI branch released 2025-08-19 plus kijai ComfyUI-WanVideoWrapper. — [InfiniteTalk README](https://github.com/MeiGen-AI/InfiniteTalk)
- OmniAvatar (Wan 2.1 14B based): Apache-2.0. Measured on A800, 14B bf16: 1 GPU 36 GB at 16.0 s/it; 21 GB at 19.4 s/it with 7B persistent params; 8 GB at 22.1 s/it with offload 0; 4 GPUs FSDP 14.3 GB at 4.8 s/it. Output currently 480p only. Trained to about 30k tokens at 480p, longer inputs (60-80k tokens) "may still produce good results". 1.3B weights released 2025-07-02 (no VRAM numbers). README does not mention ComfyUI. Note: s/it is per diffusion step, so a full clip takes steps x that value (my arithmetic, not a README figure). — [OmniAvatar README](https://github.com/Omni-Avatar/OmniAvatar)
- StableAvatar (Wan 2.1 1.3B based): MIT. Claims theoretically hours of video; 3D VAE decoder is the memory bottleneck past 10,000 frames (can run on CPU). Inference: about 18 GB for 5 s at 480x832/25fps (full load), cpu_offload halves it, sequential_cpu_offload about 3 GB but slow. Speed: 5 s clip in about 3 minutes on an RTX 4090. Resolutions 512x512, 480x832, 832x480. Community ComfyUI integration (smthemex) runs in 10 steps. — [StableAvatar README](https://github.com/Francis-Rings/StableAvatar)
- Wan2.2-S2V-14B (Alibaba): Apache 2.0. Official single-GPU command "can run on a GPU with at least 80GB VRAM" (with --offload_model True --convert_model_dtype); 8-GPU FSDP example; 480p/720p; length follows audio automatically, `--num_clip` for previews; no speed numbers in text. — [Wan2.2-S2V-14B model card](https://huggingface.co/Wan-AI/Wan2.2-S2V-14B). A vLLM-Omni recipe reportedly uses about 60 GB per GPU tensor-parallel (secondary summary, unverified).
- LongCat-Video-Avatar 1.0 and 1.5 (Meituan): MIT (no trademark/patent grant). 480p/720p; 1.5 is step-distilled to 8 steps and offers `--use_int8` (1.5 only); long video via continuation segments; examples run on 2 GPUs; no VRAM or timing numbers. — [LongCat-Video README](https://github.com/meituan-longcat/LongCat-Video)
- EchoMimic V2 (Ant Group): Apache-2.0 repo, but disclaimer says "intended for academic research". Tested on A100 80 GB, RTX 4090D 24 GB, V100 16 GB. Accelerated script: 120 frames from about 7 min to about 50 s on A100 (9x). Community ComfyUI_EchoMimic (smthemex). — [EchoMimic V2 README](https://github.com/antgroup/echomimic_v2)
- Hallo2: MIT repo, high-res part is modified CodeFormer under S-Lab License 1.0 (that license is generally non-commercial; not verified in this session). Showcases up to 23-minute and "up to 1 hour" talks, 4K via upscale. Tested on A100, CUDA 11.8; no VRAM/speed stated. — [Hallo2 README](https://github.com/fudan-generative-vision/hallo2)
- Hallo3: MIT repo but derivative of CogVideoX-5B, so CogVideoX-5B license applies (not checked). H100 tested; no VRAM/speed. — [Hallo3 README](https://github.com/fudan-generative-vision/hallo3)
- HunyuanVideo-Avatar (Tencent): README links LICENSE and Notice.txt but text not retrieved, so territory/commercial terms unverified. 24 GB minimum for 704x768x129 frames ("very slow"), 96 GB recommended, FP8 + CPU-offload single-GPU script, a 10 GB mode via Wan2GP. ComfyUI plan unconfirmed. — [HunyuanVideo-Avatar README](https://github.com/Tencent-Hunyuan/HunyuanVideo-Avatar)

### Inferences
- Realistic speed for "good talking head" on a 24 GB card: StableAvatar about 3 min per 5 s of 480p on a 4090 means roughly 36 min of render per minute of video; OmniAvatar 14B offloaded at 19-22 s/it x about 25-50 steps is on the order of 8-18 min per 1 s-chunk-equivalent (I have no clip-length per step figure, so treat as unquantified). Expect roughly 20-40x slower than real time on a single consumer GPU for 480p diffusion avatars; MuseTalk/LatentSync are close to real time or a few x slower.
- For a reel-length (15-60 s) vertical clip, InfiniteTalk (Apache, 480/720p, 1 min stable) and StableAvatar (MIT) are the cleanest commercial picks; MuseTalk is the cheapest for pure lip-sync on existing footage.
- Wav2Lip should be excluded for commercial work; Hallo2/Hallo3/EchoMimic/HunyuanVideo-Avatar need a license read before client work.

### Gaps
- No InfiniteTalk VRAM or timing figure from the official README; community numbers (r/comfyui, r/StableDiffusion) not found via search tool.
- No independent 2026 quality benchmark comparing these models side by side was found.
- LICENSE text for HunyuanVideo-Avatar, LivePortrait/InsightFace, CogVideoX-5B, S-Lab 1.0 not read.
- Newer 2026 releases beyond LongCat-Video-Avatar 1.5 not systematically surveyed.
- "Max length" for OmniAvatar, Wan2.2-S2V not stated officially.

## 2. Stylized non-photoreal route (VTuber, PNGtuber, Live2D, VRM, Rive/Lottie, Rhubarb)

### Takeaway
Little hard data was retrievable. The route trades photorealism for near-zero render cost: audio-driven mouth cues (e.g. Rhubarb) drive a 2D/3D rig, runnable on an ordinary PC and renderable in this studio's own code-rendered pipeline. This is an inference; sources are thin.

### Cited Findings
- Rhubarb Lip Sync: CLI that produces mouth-shape cues from an audio file; PocketSphinx recognizer is English only, phonetic recognizer language-independent but less precise; outputs TSV, XML, JSON, and Moho/OpenToonz .dat; 6 basic shapes (A-F) plus optional G, H, X. README text did not state its license (a LICENSE.md exists) — [Rhubarb README](https://github.com/DanielSWolf/rhubarb-lip-sync). A Blender-marketplace listing and an npm wrapper describe it as MIT (secondary) — [search result summary](https://www.jsdelivr.com/package/npm/rhubarb-lip-sync). Integrations with After Effects, Moho, OpenToonz, Spine are reported by a third-party page — [sourcepulse](https://www.sourcepulse.org/projects/1841021).
- VTuber options (marketing-grade source): model types are 2D Live2D (most popular), 3D VRM, or PNGtuber (simplest); custom rigged 2D models roughly $200-$1,000 on commission; free 3D models from VRoid Studio; VTube Studio supports Live2D and VRM, VSeeFace is the free PC option with webcam — [Fiverr/guide listings](https://www.fiverr.com/s/DBpjxDP). Claims are commercial marketing, not documentation.

### Inferences
- Pros for faceless reels: no identity or likeness risk, tiny compute, deterministic and seekable (fits the studio's `window.seek(t)` contract if mouth cues from Rhubarb JSON are applied per frame to an SVG/Canvas/Rive character), consistent brand mascot.
- Cons: less "human" trust, rigs cost money or time, VSeeFace/VTube Studio/Warudo are live-capture tools that are awkward to render deterministically offline; Live2D runtime and VRoid/VRM asset licenses need checking per model.

### Gaps
- Warudo (site fetch returned nothing), VSeeFace, VTube Studio, Rive, and Lottie lip-sync specifics: no usable sources retrieved.
- Rhubarb's actual license not confirmed from the primary repo text.
- No tool found/verified for "animated character from photo" in this pass.

## 3. Rented GPU cost (RunPod, Vast.ai, Modal, Replicate, fal.ai)

### Takeaway
Renting a 24-80 GB GPU costs about $0.34-$4/hour; hosted per-second avatar APIs cost $0.14-$0.20+ per output second ($8-$12+ per minute of video), so self-hosting on a rented 4090/A100 is far cheaper per minute if the pipeline is already working.

### Cited Findings
- RunPod pricing page (community / secure per hour): RTX 4090 24 GB $0.34 / $0.89; RTX 5090 32 GB $0.69 / $1.19; L40S 48 GB $0.79 / $1.09; A100 80 GB PCIe $1.19 / $1.79; A100 SXM $1.39 / $1.79; H100 PCIe $1.99 / $2.89; H100 SXM $2.69 / $3.99. The fetch note says the page body table matched Secure prices, so community figures come from structured data — [RunPod pricing](https://www.runpod.io/gpu-cloud/pricing). A tracker reports a rate increase week of Oct 5-12, 2026 (H100 SXM $3.49 to $3.99, A100 $1.59 to $1.79, 4090 $0.74 to $0.89) — [pricingsaas](https://pricingsaas.com/companies/runpod/diffs/2026W42).
- Vast.ai marketplace: median RTX 4090 about $0.40/hr, L40S $0.80, A100 SXM4 $1.27 on its pricing pages; third-party snapshots show 4090 from $0.14-$0.31 — [Vast.ai pricing](https://vast.ai/pricing/gpu/A100-SXM4), [computeprices](https://computeprices.com/providers/vast/gpus/rtx4090). Prices fluctuate daily.
- Modal list rates per second: L4 $0.000222, L40S $0.000542, A100 80GB $0.000694, H100 $0.001097 (about $0.80, $1.95, $2.50, $3.95 per hour); Starter plan includes $30/month free credits — [Modal pricing](https://modal.com/pricing). Hourly conversions are my arithmetic.
- fal.ai InfiniteTalk: $0.20 per second of output, 720p doubles the price; commercial use listed — [fal InfiniteTalk](https://fal.ai/models/fal-ai/infinitalk). OmniHuman about $0.14/s and OmniHuman 1.5 about $0.16/s on fal, BytePlus direct from about $0.12/s (secondary pages) — [fal OmniHuman](https://fal.ai/models/fal-ai/bytedance/omnihuman).
- fal-hosted Wan 2.2 14B speech-to-video endpoint exists (price not retrieved) — [modelgrep listing](https://modelgrep.com/media/models/fal-ai/wan/v2.2-14b/speech-to-video).

### Inferences
- fal InfiniteTalk 480p: $0.20 x 60 = $12 per minute of video; 720p about $24 per minute.
- Self-host example: if a 4090 community pod at $0.34/h takes ~36 min per video minute (StableAvatar estimate above), cost is about $0.20 per video minute plus setup; an 80 GB A100 at $1.19/h is faster and removes offload. Treat as an order-of-magnitude estimate.

### Gaps
- Replicate pricing not retrieved. Modal/Vast figures are list/median, not quotes.
- No measured per-minute-of-video render cost on any rental platform for these models.

## 4. Minimum viable local PC spec by tier

### Takeaway
Tiering below combines README-measured VRAM with inference; there are no official "minimum PC spec" statements for most models.

### Cited Findings
- Quick lip-sync: MuseTalk runs on 4 GB (RTX 3050 Ti laptop fp16, slow: 8 s clip about 5 min); real time on V100 — [MuseTalk](https://github.com/TMElyralab/MuseTalk). LatentSync 1.5 8 GB, 1.6 18 GB — [LatentSync](https://github.com/bytedance/LatentSync).
- Good talking head: StableAvatar about 18 GB full load, about 9 GB with model_cpu_offload (derived from "roughly halves"), about 3 GB sequential offload; 4090 gives 5 s in about 3 min — [StableAvatar](https://github.com/Francis-Rings/StableAvatar). OmniAvatar 14B: 36 GB / 21 GB / 8 GB with increasing offload and slower speed — [OmniAvatar](https://github.com/Omni-Avatar/OmniAvatar). InfiniteTalk fp8 and low-VRAM flags exist but no figure — [InfiniteTalk](https://github.com/MeiGen-AI/InfiniteTalk).
- Long-form: Wan2.2-S2V single GPU needs 80 GB per official command — [Wan2.2-S2V](https://huggingface.co/Wan-AI/Wan2.2-S2V-14B); HunyuanVideo-Avatar recommends 96 GB, 24 GB minimum — [HunyuanVideo-Avatar](https://github.com/Tencent-Hunyuan/HunyuanVideo-Avatar).
- System RAM matters for offload: a ComfyUI guide (about a different video model, MiniMax H3) says 12-16 GB VRAM success stories almost always have 64 GB RAM and OOM reports cluster at 32 GB; a 12 GB 4070 took 11 min versus 167 s at lower res due to spilling — [InstaSD offloading guide](https://www.instasd.com/post/comfyui-vram-offloading-guide). Indirect evidence only.

### Inferences (suggested tiers; not vendor-stated)
- Tier 1 quick lip-sync: 8 GB GPU (RTX 3060/4060 class), 16 GB RAM, about 20 GB disk. MuseTalk or LatentSync 1.5.
- Tier 2 good talking head: 24 GB GPU (RTX 3090/4090), 64 GB RAM, 200-300 GB NVMe (Wan-family weights are tens of GB each; disk figure is my estimate, not sourced). InfiniteTalk fp8 / StableAvatar / OmniAvatar 14B with offload at 480p, 20-40x slower than real time.
- Tier 3 long-form / 720p: 48-80 GB (L40S, A100 80GB, or rent), or multi-GPU. Rent rather than buy: hours at $1.19-$1.79/h on RunPod.

### Gaps
- No official disk-size figures retrieved; no measured Windows-specific results; Blackwell (RTX 5090 32 GB) behavior with these repos not researched.
