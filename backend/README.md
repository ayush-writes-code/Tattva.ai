---
title: Intrusionx Backend
emoji: 👀
colorFrom: gray
colorTo: blue
sdk: docker
pinned: false
license: apache-2.0
---

# 🛡️ IntrusionX Backend — AI Detection API

FastAPI-based backend for **Tattva.AI** deepfake and synthetic media detection.

## 🤖 Models

| Model | Type | Labels |
|-------|------|--------|
| `prithivMLmods/Deep-Fake-Detector-v2-Model` | Image (ViT) | `{0: "Realism", 1: "Deepfake"}` |
| `umm-maybe/AI-image-detector` | Image (Swin) | `{0: "artificial", 1: "human"}` |
| `garystafford/wav2vec2-deepfake-voice-detector` | Audio (Wav2Vec2) | Bonafide vs Synthetic |
| `MelodyMachine/Deepfake-audio-detection-V2` | Audio (Wav2Vec2) | Real vs Fake |

## 🏗️ Detection Architecture

### Image Pipeline (v5 — Calibrated Accuracy)
1. **Input validation**: Handles truncated files, RGBA/grayscale, tiny/huge images
2. **Face detection**: OpenCV Haar cascade with 30% padding
3. **Dual-model inference**: ViT (face-optimized) + Swin (general AI art) in parallel
4. **Forensic layers**: ELA + DCT frequency analysis (conservative, corroboration-gated)
5. **Ensemble**: Context-aware weighting (face: 70/30 ViT, no-face: 10/90 Swin)

### Audio Pipeline
- Dual Wav2Vec2 ensemble with weighted aggregation
- Mel-spectrogram generation for visual forensics

### Ensemble Calibration
- Forensic layers (ELA, frequency) add **max ±5 points** to the final score
- Boosts require **model corroboration** — at least one model must already lean fake (>35%)
- This prevents false positives on phone photos, JPEG compression artifacts, and Google Photos downloads

## 🚀 Running Locally

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --host 0.0.0.0 --port 8000
```

## 🐳 Docker

```bash
docker build -t intrusionx-backend .
docker run -p 8000:7860 intrusionx-backend
```

Or use **Docker Compose** from the [frontend repo](https://github.com/ayush-writes-code/Tattva.ai) to run both services together:
```bash
cd Tattva.ai
docker compose up --build
```

## 🔑 API Security

All endpoints require an `x-api-key` header when `BACKEND_API_KEY` env var is set. Leave it empty for local development.

## 📡 Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/detect/full` | Full multi-modal detection (auto-routes by file type) |
| `POST` | `/detect/image` | Image-only detection |
| `POST` | `/detect/audio` | Audio-only detection |
| `POST` | `/detect/video` | Video detection (frame extraction + image pipeline) |
| `POST` | `/detect/batch` | Batch file detection |
| `POST` | `/detect/heatmap` | ELA heatmap generation |
| `POST` | `/generate-report` | PDF forensic report |
| `GET`  | `/download-report/{filename}` | Download generated report |
| `GET`  | `/health` | Health check |
