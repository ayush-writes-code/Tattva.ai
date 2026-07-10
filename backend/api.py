"""
IntrusionX SE — FastAPI Backend
Production-ready REST API for multi-modal deepfake detection.

Endpoints:
    GET  /                  → Health check
    POST /detect/image      → Image deepfake detection
    POST /detect/video      → Video deepfake detection (frame-by-frame)
    POST /detect/audio      → Audio deepfake detection
    POST /detect/metadata   → Metadata / EXIF forensic analysis
    POST /detect/auto       → Unified endpoint (auto-detects media type)

Run:
    cd intrusionx-se
    uvicorn api:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import io
import uuid
import base64
import shutil
import tempfile
import traceback
import numpy as np
from typing import Optional, List
from contextlib import asynccontextmanager

import matplotlib
matplotlib.use('Agg')
import matplotlib.cm as cm
import matplotlib.pyplot as plt

from fastapi import FastAPI, File, UploadFile, HTTPException, status, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security.api_key import APIKeyHeader
from PIL import Image, ImageFilter
from utils.forensics import generate_noisemap_b64, generate_spectrogram_b64, generate_waveform_b64

# ── Import detectors (unchanged — no modifications to core logic) ─
from detectors.image_detector import detect_image
from detectors.video_detector import detect_video
from detectors.audio_detector import detect_audio
from detectors.metadata_analyzer import analyze_metadata
from utils.media_router import detect_media_type
from utils.privacy_manager import delete_file, secure_cleanup, get_privacy_status

# ── API KEY SECURITY ──────────────────────────────────────────
API_KEY_NAME = "x-api-key"
API_KEY = os.getenv("BACKEND_API_KEY", "")
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if API_KEY and api_key_header != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key"
        )
    return api_key_header


# ══════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")

import asyncio
from functools import partial

async def run_async(func, *args, **kwargs):
    """Run a CPU-bound function in a separate thread."""
    loop = asyncio.get_running_loop()
    pfunc = partial(func, *args, **kwargs)
    return await loop.run_in_executor(None, pfunc)

# Accepted file extensions per media type
ALLOWED_IMAGE_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".gif"}
ALLOWED_VIDEO_EXT = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}
ALLOWED_AUDIO_EXT = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac", ".wma"}
ALL_ALLOWED_EXT = ALLOWED_IMAGE_EXT | ALLOWED_VIDEO_EXT | ALLOWED_AUDIO_EXT

# Max upload sizes (bytes)
MAX_IMAGE_SIZE = 20 * 1024 * 1024    # 20 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024   # 100 MB
MAX_AUDIO_SIZE = 50 * 1024 * 1024    # 50 MB

# ── Filename-based AI tool signatures ─────────────────────────
AI_FILENAME_SIGNATURES = [
    "chatgpt", "dall-e", "dall·e", "dalle", "midjourney",
    "stable diffusion", "firefly", "adobe firefly",
    "leonardo", "runway", "bing image creator",
    "ideogram", "flux", "playground ai",
    "nightcafe", "craiyon", "wombo", "starryai",
    "comfyui", "automatic1111",
]


def _check_filename_for_ai(filename: str) -> tuple:
    """
    Check if the uploaded filename contains known AI tool names.
    Returns (is_ai: bool, matched_tool: str or None).
    """
    if not filename:
        return False, None
    name_lower = filename.lower()
    for sig in AI_FILENAME_SIGNATURES:
        if sig in name_lower:
            return True, sig
    return False, None


# ══════════════════════════════════════════════════════════════
#  APP LIFECYCLE
# ══════════════════════════════════════════════════════════════

import asyncio

def _do_preload():
    print("[API] Preloading AI models in the background thread...")
    try:
        from detectors.image_detector import _load_model_a
        _load_model_a()
    except Exception as e:
        print(f"[API] Image models preload failed: {e}")
        
    try:
        from detectors.audio_detector import _load_model as _load_audio_model, _load_model_b as _load_audio_model_b
        _load_audio_model()
        _load_audio_model_b()
    except Exception as e:
        print(f"[API] Audio models preload failed: {e}")
        
    print("[API] Background model preloading complete ✓")

async def preload_models():
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _do_preload)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create temp directory on startup, clean it on shutdown."""
    os.makedirs(TEMP_DIR, exist_ok=True)
    print(f"[API] Temp directory ready: {TEMP_DIR}")
    print("[API] IntrusionX SE API is live ✓")
    
    # Pre-load heavy models so the first user request is instant
    asyncio.create_task(preload_models())
    
    yield
    # Cleanup temp on shutdown
    if os.path.isdir(TEMP_DIR):
        shutil.rmtree(TEMP_DIR, ignore_errors=True)
        print("[API] Temp directory cleaned up.")


# ══════════════════════════════════════════════════════════════
#  CREATE APP
# ══════════════════════════════════════════════════════════════

app = FastAPI(
    title="IntrusionX SE",
    description=(
        "AI-Powered Deepfake Detection API. "
        "Detects deepfakes in images, videos, and audio using "
        "ViT, Wav2Vec2-XLSR, "
        "face detection, ELA, and metadata forensics."
    ),
    version="3.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "https://intrusionx.vercel.app",
        "https://*.vercel.app",
        "https://*.huggingface.co",
        "https://*.hf.space"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════

async def _save_upload(upload: UploadFile, allowed_ext: set, max_size: int) -> str:
    """
    Save an uploaded file to the temp directory.

    Validates extension and size. Returns the temp file path.
    Raises HTTPException on validation failure.
    """
    # Validate filename
    if not upload.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided.",
        )

    ext = os.path.splitext(upload.filename)[1].lower()
    if ext not in allowed_ext:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type: '{ext}'. "
                f"Allowed: {', '.join(sorted(allowed_ext))}"
            ),
        )

    # Save stream safely to disk
    # Validate size before processing (approximate via file seek)
    upload.file.seek(0, 2)
    file_size = upload.file.tell()
    upload.file.seek(0)

    if file_size > max_size:
        size_mb = max_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed: {size_mb:.0f} MB"
        )

    unique_name = f"{uuid.uuid4().hex}{ext}"
    temp_path = os.path.join(TEMP_DIR, unique_name)
    os.makedirs(TEMP_DIR, exist_ok=True)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)

    return temp_path


def _cleanup(file_path: str) -> None:
    """Remove a temporary file after processing safely via Privacy Manager."""
    delete_file(file_path)


def _build_response(
    media_type: str,
    verdict: str,
    confidence: float,
    details: dict,
    file_info: Optional[dict] = None,
) -> dict:
    """Build a standardised API response."""
    response = {
        **get_privacy_status(),
        "media_type": media_type,
        "verdict": verdict,
        "confidence": round(confidence, 2),
        "details": details,
    }
    if file_info:
        response["file_info"] = file_info
    return response


# ══════════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════════

# ── Health Check ──────────────────────────────────────────────

@app.get("/", tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns API status and version info.
    """
    return {
        "status": "online",
        "service": "IntrusionX SE",
        "version": "3.0.0",
        "description": "AI-Powered Deepfake Detection API",
        "endpoints": {
            "image": "POST /detect/image",
            "video": "POST /detect/video",
            "audio": "POST /detect/audio",
            "metadata": "POST /detect/metadata",
            "auto": "POST /detect/auto",
            "batch": "POST /detect/batch",
            "report": "POST /generate-report",
            "download": "GET /download-report/{filename}",
            "docs": "GET /docs",
        },
    }


# ── Image Detection ──────────────────────────────────────────

@app.post("/detect/image", tags=["Detection"], dependencies=[Depends(get_api_key)])
async def detect_image_endpoint(file: UploadFile = File(...)):
    """
    Detect deepfakes in an uploaded image.

    - **Accepts:** JPG, JPEG, PNG, BMP, WebP, TIFF, GIF
    - **Max size:** 20 MB
    - **Models:** ViT (prithivMLmods/Deep-Fake-Detector-v2) + Swin (umm-maybe/AI-image-detector)
    - **Features:** Face detection, ELA scoring, metadata analysis
    """
    temp_path = None
    try:
        temp_path = await _save_upload(file, ALLOWED_IMAGE_EXT, MAX_IMAGE_SIZE)

        # Open image and run detection
        try:
            pil_image = Image.open(temp_path).convert("RGB")
            result = await run_async(detect_image, pil_image)
            metadata = await run_async(analyze_metadata, temp_path)
        except Exception as e:
             return _build_response(
                media_type="image",
                verdict="ERROR",
                confidence=0,
                details={"error": f"Corrupted or invalid image file: {str(e)}", "analysis": ["Processing failed."]},
                file_info={"filename": file.filename}
            )

        # Filename-based AI detection
        is_ai_filename, matched_tool = _check_filename_for_ai(file.filename)
        if is_ai_filename:
            result["verdict"] = "DEEPFAKE"
            result["confidence"] = 95.0
            result["details"].append(f"🚨 Filename contains AI tool signature: '{matched_tool}' — flagged as AI-generated.")

        return _build_response(
            media_type="image",
            verdict=result["verdict"],
            confidence=result["confidence"],
            details={
                "detection": {
                    "label": result.get("label"),
                    "probs": result.get("probs", {}),
                    "models_used": result.get("models_used", []),
                    "face_detected": result.get("face_detected", False),
                    "ela_score": result.get("ela_score", 0),
                    "analysis": result.get("details", []),
                },
                "metadata": {
                    "has_exif": metadata.get("has_exif", False),
                    "risk_score": metadata.get("risk_score", 0),
                    "ai_indicators": metadata.get("ai_indicators", []),
                    "details": metadata.get("details", []),
                },
            },
            file_info={
                "filename": file.filename,
                "content_type": file.content_type,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image detection failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)


# ── Video Detection ──────────────────────────────────────────

@app.post("/detect/video", tags=["Detection"], dependencies=[Depends(get_api_key)])
async def detect_video_endpoint(file: UploadFile = File(...)):
    """
    Detect deepfakes in an uploaded video (frame-by-frame).

    - **Accepts:** MP4, AVI, MOV, MKV, WebM, FLV, WMV
    - **Max size:** 100 MB
    - **Max duration:** 60 seconds
    - **Analysis:** Scene-aware frame sampling + dual-model ensemble per frame
    """
    temp_path = None
    try:
        temp_path = await _save_upload(file, ALLOWED_VIDEO_EXT, MAX_VIDEO_SIZE)

        result = await run_async(detect_video, temp_path)

        # Simplify frame results for API response (avoid huge payloads)
        frame_summary = []
        for fr in result.get("frame_results", []):
            frame_summary.append({
                "frame_index": fr.get("frame_index"),
                "timestamp": fr.get("timestamp"),
                "verdict": fr.get("verdict"),
                "confidence": fr.get("confidence"),
            })

        return _build_response(
            media_type="video",
            verdict=result["verdict"],
            confidence=result["confidence"],
            details={
                "duration": result.get("duration", 0),
                "frame_count": result.get("frame_count", 0),
                "flagged_frames": result.get("flagged_frames", []),
                "frame_results": frame_summary,
                "analysis": result.get("details", []),
            },
            file_info={
                "filename": file.filename,
                "content_type": file.content_type,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video detection failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)


# ── Audio Detection ──────────────────────────────────────────

@app.post("/detect/audio", tags=["Detection"], dependencies=[Depends(get_api_key)])
async def detect_audio_endpoint(file: UploadFile = File(...)):
    """
    Detect deepfake/synthetic audio in an uploaded file.

    - **Accepts:** MP3, WAV, FLAC, M4A, OGG, AAC, WMA
    - **Max size:** 50 MB
    - **Model:** Wav2Vec2-XLSR (garystafford) — 97.9% accuracy
    - **Fallback:** Spectral analysis heuristics
    """
    temp_path = None
    try:
        temp_path = await _save_upload(file, ALLOWED_AUDIO_EXT, MAX_AUDIO_SIZE)

        result = await run_async(detect_audio, temp_path)

        return _build_response(
            media_type="audio",
            verdict=result["verdict"],
            confidence=result["confidence"],
            details={
                "method": result.get("method", "unknown"),
                "probs": result.get("probs", {}),
                "features": result.get("features", {}),
                "analysis": result.get("details", []),
            },
            file_info={
                "filename": file.filename,
                "content_type": file.content_type,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio detection failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)


# ── Metadata Analysis ────────────────────────────────────────

@app.post("/detect/metadata", tags=["Detection"], dependencies=[Depends(get_api_key)])
async def detect_metadata_endpoint(file: UploadFile = File(...)):
    """
    Analyse file metadata for AI generation signatures.

    - **Accepts:** Image files (JPG, PNG, WebP, etc.)
    - **Checks:** EXIF data, PNG tEXt/iTXt chunks (SD/ComfyUI params),
      C2PA Content Credentials, AI software signatures, standard AI dimensions
    """
    temp_path = None
    try:
        temp_path = await _save_upload(file, ALLOWED_IMAGE_EXT, MAX_IMAGE_SIZE)

        result = await run_async(analyze_metadata, temp_path)

        return {
            "media_type": "metadata",
            "risk_score": result.get("risk_score", 0),
            "has_exif": result.get("has_exif", False),
            "ai_indicators": result.get("ai_indicators", []),
            "details": result.get("details", []),
            "exif_data": result.get("exif_data", {}),
            "file_info": {
                "filename": file.filename,
                "content_type": file.content_type,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Metadata analysis failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)


# ── Unified / Auto-Detect Endpoint ───────────────────────────

@app.post("/detect/auto", tags=["Detection"], dependencies=[Depends(get_api_key)])
async def detect_auto_endpoint(file: UploadFile = File(...)):
    """
    Unified detection endpoint — auto-detects the media type and
    routes to the correct detector.

    - **Accepts:** Any supported image, video, or audio file
    - **Auto-routing:** File extension → appropriate detector
    """
    temp_path = None
    try:
        temp_path = await _save_upload(file, ALL_ALLOWED_EXT, MAX_VIDEO_SIZE)

        # Detect media type
        media_type = detect_media_type(temp_path)

        if media_type == "image":
            pil_image = Image.open(temp_path).convert("RGB")
            result = await run_async(detect_image, pil_image)
            metadata = await run_async(analyze_metadata, temp_path)

            # Filename-based AI detection
            is_ai_filename, matched_tool = _check_filename_for_ai(file.filename)
            if is_ai_filename:
                result["verdict"] = "DEEPFAKE"
                result["confidence"] = 95.0
                result["details"].append(f"🚨 Filename contains AI tool signature: '{matched_tool}' — flagged as AI-generated.")

            # Generate AI insights
            from utils.explainer import generate_ai_insights
            ai_insights = generate_ai_insights(result, media_type="image")

            return _build_response(
                media_type="image",
                verdict=result["verdict"],
                confidence=result["confidence"],
                details={
                    "detection": {
                        "label": result.get("label"),
                        "probs": result.get("probs", {}),
                        "models_used": result.get("models_used", []),
                        "face_detected": result.get("face_detected", False),
                        "ela_score": result.get("ela_score", 0),
                        "analysis": result.get("details", []),
                    },
                    "metadata": {
                        "risk_score": metadata.get("risk_score", 0),
                        "ai_indicators": metadata.get("ai_indicators", []),
                    },
                    "ai_insights": ai_insights,
                },
                file_info={"filename": file.filename},
            )

        elif media_type == "video":
            result = await run_async(detect_video, temp_path)
            frame_summary = [
                {
                    "frame_index": fr.get("frame_index"),
                    "timestamp": fr.get("timestamp"),
                    "verdict": fr.get("verdict"),
                    "confidence": fr.get("confidence"),
                    "face_detected": fr.get("face_detected", False),
                }
                for fr in result.get("frame_results", [])
            ]

            # Generate AI insights
            from utils.explainer import generate_ai_insights
            ai_insights = generate_ai_insights(result, media_type="video")

            return _build_response(
                media_type="video",
                verdict=result["verdict"],
                confidence=result["confidence"],
                details={
                    "duration": result.get("duration", 0),
                    "frame_count": result.get("frame_count", 0),
                    "flagged_frames": result.get("flagged_frames", []),
                    "frame_results": frame_summary,
                    "analysis": result.get("details", []),
                    "ai_insights": ai_insights,
                },
                file_info={"filename": file.filename},
            )

        elif media_type == "audio":
            result = await run_async(detect_audio, temp_path)

            # Generate AI insights
            from utils.explainer import generate_ai_insights
            ai_insights = generate_ai_insights(result, media_type="audio")

            return _build_response(
                media_type="audio",
                verdict=result["verdict"],
                confidence=result["confidence"],
                details={
                    "method": result.get("method", "unknown"),
                    "probs": result.get("probs", {}),
                    "features": result.get("features", {}),
                    "analysis": result.get("details", []),
                    "ai_insights": ai_insights,
                },
                file_info={"filename": file.filename},
            )

        else:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(
                    f"Could not determine media type for '{file.filename}'. "
                    f"Supported formats: images, videos, audio."
                ),
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Detection failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)

# ── Unified Full Detection & Forensics (SINGLE PASS) ─────────
import hashlib

try:
    from cachetools import TTLCache
    _DETECTION_CACHE = TTLCache(maxsize=100, ttl=3600)
except ImportError:
    _DETECTION_CACHE = {}

def _get_file_hash(filepath):
    hasher = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

@app.post("/detect/full", tags=["Detection", "Forensics"], dependencies=[Depends(get_api_key)])
async def detect_full_endpoint(file: UploadFile = File(...)):
    """
    PERFORMANCE OPTIMIZED: Unified single-pass detection.
    Runs AI models exactly *once*, and generates forensics using the results.
    Eliminates the double-inference starvation bug.
    """
    temp_path = None
    try:
        temp_path = await _save_upload(file, ALL_ALLOWED_EXT, MAX_VIDEO_SIZE)
        file_hash = _get_file_hash(temp_path)
        
        # Checking local memory cache first!
        if file_hash in _DETECTION_CACHE:
            print(f"[FastAPI] Cache HIT for {file.filename}! Bypassing AI Models.")
            _DETECTION_CACHE[file_hash]["file_info"] = {"filename": file.filename}
            return _DETECTION_CACHE[file_hash]

        media_type = detect_media_type(temp_path)
        forensics_data = {}
        result = {}

        if media_type == "image":
            pil_image = Image.open(temp_path).convert("RGB")
            result = await run_async(detect_image, pil_image)
            metadata = await run_async(analyze_metadata, temp_path)

            from utils.visualizer import generate_heatmap_overlay
            heatmap = generate_heatmap_overlay(pil_image)
            buf = io.BytesIO()
            heatmap.save(buf, format="PNG")
            buf.seek(0)
            forensics_data["heatmap"] = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
            
            from utils.forensics import generate_noisemap_b64
            forensics_data["noisemap"] = generate_noisemap_b64(pil_image)

        elif media_type == "video":
            result = await run_async(detect_video, temp_path)
            metadata = await run_async(analyze_metadata, temp_path)
            
            from utils.video_visualizer import generate_video_forensics
            video_forensics = generate_video_forensics(temp_path, result.get("frame_results", []), result.get("flagged_frames", []))
            forensics_data["suspicious_frames"] = video_forensics.get("suspicious_frames", [])
            forensics_data["frame_confidence_timeline"] = video_forensics.get("frame_confidence_timeline", [])
            if video_forensics.get("annotated_video_b64"):
                forensics_data["annotated_video"] = video_forensics["annotated_video_b64"]

        elif media_type == "audio":
            result = await run_async(detect_audio, temp_path)
            metadata = await run_async(analyze_metadata, temp_path)
            
            from utils.forensics import generate_spectrogram_b64, generate_linear_spectrogram_b64
            forensics_data["spectrogram"] = generate_spectrogram_b64(temp_path)
            from utils.forensics import generate_waveform_b64
            forensics_data["waveform"] = generate_waveform_b64(temp_path)
            # Generate a second spectrogram view (linear frequency)
            forensics_data["audio_spectrogram"] = generate_linear_spectrogram_b64(temp_path)

        is_ai, matched_tool = _check_filename_for_ai(file.filename)
        if is_ai:
            result["verdict"] = "DEEPFAKE"
            result["confidence"] = 95.0
            result["details"].append(f"🚨 Filename contains AI tool signature: '{matched_tool}'")
            
        from utils.explainer import generate_ai_insights
        ai_insights = generate_ai_insights(result, media_type)

        combined_response = {
            "media_type": media_type,
            "verdict": result.get("verdict", "ERROR"),
            "confidence": result.get("confidence", 0),
            "details": {
                "detection": {
                    "models_used": result.get("models_used", []),
                    "analysis": result.get("details", []),
                },
                "metadata": {"risk_score": metadata.get("risk_score", 0)},
                "ai_insights": ai_insights,
            },
            "file_info": {"filename": file.filename},
            "forensics": forensics_data
        }
        
        _DETECTION_CACHE[file_hash] = combined_response
        
        return combined_response

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        _cleanup(temp_path)


# ══════════════════════════════════════════════════════════════
#  HEATMAP ENDPOINT
# ══════════════════════════════════════════════════════════════

@app.post("/detect/heatmap", summary="Generate ELA Heatmap", dependencies=[Depends(get_api_key)])
async def generate_heatmap(file: UploadFile = File(...)):
    """
    Generate an Error Level Analysis (ELA) heatmap overlay for an uploaded image.
    Returns the heatmap as a base64-encoded PNG string.
    """

    temp_path = None
    try:
        temp_path = await _save_upload(file, ALLOWED_IMAGE_EXT, MAX_IMAGE_SIZE)
        pil_image = Image.open(temp_path).convert("RGB")

        from utils.visualizer import generate_heatmap_overlay
        heatmap = generate_heatmap_overlay(pil_image)

        # Convert to base64 PNG
        buf = io.BytesIO()
        heatmap.save(buf, format="PNG")
        buf.seek(0)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return JSONResponse(content={
            "heatmap": f"data:image/png;base64,{b64}",
            "filename": file.filename,
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Heatmap generation failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)


# ══════════════════════════════════════════════════════════════
#  NOISE VARIANCE MAP ENDPOINT (Image)
# ══════════════════════════════════════════════════════════════

@app.post("/detect/noisemap", summary="Generate Noise Variance Map", dependencies=[Depends(get_api_key)])
async def generate_noisemap(file: UploadFile = File(...)):
    """
    Generate a noise variance map for an uploaded image.
    Highlights regions where the camera sensor noise is inconsistent,
    indicating potential splicing or AI generation.
    """

    temp_path = None
    try:
        temp_path = await _save_upload(file, ALLOWED_IMAGE_EXT, MAX_IMAGE_SIZE)
        pil_image = Image.open(temp_path).convert("RGB")
        from utils.forensics import generate_noisemap_b64
        b64_uri = generate_noisemap_b64(pil_image)

        return JSONResponse(content={
            "noisemap": b64_uri,
            "filename": file.filename,
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Noise map generation failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)


# ══════════════════════════════════════════════════════════════
#  MEL-SPECTROGRAM ENDPOINT (Audio)
# ══════════════════════════════════════════════════════════════

@app.post("/detect/spectrogram", summary="Generate Audio Mel-Spectrogram", dependencies=[Depends(get_api_key)])
async def generate_spectrogram(file: UploadFile = File(...)):
    """
    Generate a Mel-Spectrogram visualization for an uploaded audio file.
    Shows the frequency content over time — AI-generated audio often
    shows unnatural patterns like comb artifacts or missing harmonics.
    """

    temp_path = None
    try:
        temp_path = await _save_upload(file, ALLOWED_AUDIO_EXT, MAX_AUDIO_SIZE)

        from utils.forensics import generate_spectrogram_b64
        b64_uri = generate_spectrogram_b64(temp_path)

        return JSONResponse(content={
            "spectrogram": b64_uri,
            "filename": file.filename,
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Spectrogram generation failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)


# ══════════════════════════════════════════════════════════════
#  UNIFIED FORENSICS ENDPOINT
# ══════════════════════════════════════════════════════════════

@app.post("/detect/forensics", summary="Get All Forensic Visualizations", dependencies=[Depends(get_api_key)])
async def get_forensics(file: UploadFile = File(...)):
    """
    Unified endpoint that returns all available forensic visualizations
    for any media type (image, audio, video).
    """

    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    ext = os.path.splitext(file.filename)[1].lower()
    result = {}

    temp_path = None
    try:
        # ── IMAGE FORENSICS ──
        if ext in ALLOWED_IMAGE_EXT:
            temp_path = await _save_upload(file, ALLOWED_IMAGE_EXT, MAX_IMAGE_SIZE)
            pil_image = Image.open(temp_path).convert("RGB")

            # 1. ELA Heatmap
            from utils.visualizer import generate_heatmap_overlay
            heatmap = generate_heatmap_overlay(pil_image)
            buf = io.BytesIO()
            heatmap.save(buf, format="PNG")
            buf.seek(0)
            result["heatmap"] = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

            from utils.forensics import generate_noisemap_b64
            result["noisemap"] = generate_noisemap_b64(pil_image)

        # ── AUDIO FORENSICS ──
        elif ext in ALLOWED_AUDIO_EXT:
            temp_path = await _save_upload(file, ALLOWED_AUDIO_EXT, MAX_AUDIO_SIZE)

            from utils.forensics import generate_spectrogram_b64, generate_linear_spectrogram_b64
            result["spectrogram"] = generate_spectrogram_b64(temp_path)
            result["audio_spectrogram"] = generate_linear_spectrogram_b64(temp_path)

            from utils.forensics import generate_waveform_b64
            result["waveform"] = generate_waveform_b64(temp_path)

        # ── VIDEO FORENSICS ──
        elif ext in ALLOWED_VIDEO_EXT:
            temp_path = await _save_upload(file, ALLOWED_VIDEO_EXT, MAX_VIDEO_SIZE)

            # Run detection to get frame results
            video_result = await run_async(detect_video, temp_path)

            # Generate video forensic visualizations
            from utils.video_visualizer import generate_video_forensics
            video_forensics = generate_video_forensics(
                temp_path,
                video_result.get("frame_results", []),
                video_result.get("flagged_frames", []),
            )

            result["suspicious_frames"] = video_forensics.get("suspicious_frames", [])
            result["frame_confidence_timeline"] = video_forensics.get("frame_confidence_timeline", [])
            if video_forensics.get("annotated_video_b64"):
                result["annotated_video"] = video_forensics["annotated_video_b64"]

        return JSONResponse(content={
            "forensics": result,
            "filename": file.filename,
            "media_type": "image" if ext in ALLOWED_IMAGE_EXT else "audio" if ext in ALLOWED_AUDIO_EXT else "video",
        })

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[Forensics] Error: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forensics generation failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)


# ── Forensic Report Generation ────────────────────────────────

@app.post("/generate-report", tags=["Reports"], dependencies=[Depends(get_api_key)])
async def generate_report_endpoint(file: UploadFile = File(...)):
    """
    Generate a downloadable PDF forensic report for an uploaded media file.

    Pipeline:
      1. Save upload → detect media type
      2. Run /detect/auto logic → get detection result + AI insights
      3. Run /detect/forensics logic → get forensic visualizations
      4. Generate PDF report with all data
      5. Return the download URL

    - **Accepts:** Any supported image, video, or audio file
    - **Returns:** JSON with report_path and download_url
    """
    temp_path = None
    try:
        temp_path = await _save_upload(file, ALL_ALLOWED_EXT, MAX_VIDEO_SIZE)
        media_type = detect_media_type(temp_path)

        # ── Step 1: Run detection ─────────────────────────────
        from utils.explainer import generate_ai_insights

        if media_type == "image":
            pil_image = Image.open(temp_path).convert("RGB")
            det_result = await run_async(detect_image, pil_image)
            metadata = await run_async(analyze_metadata, temp_path)
            ai_insights = generate_ai_insights(det_result, media_type="image")

            result = _build_response(
                media_type="image",
                verdict=det_result["verdict"],
                confidence=det_result["confidence"],
                details={
                    "detection": {
                        "label": det_result.get("label"),
                        "probs": det_result.get("probs", {}),
                        "models_used": det_result.get("models_used", []),
                        "face_detected": det_result.get("face_detected", False),
                        "ela_score": det_result.get("ela_score", 0),
                        "analysis": det_result.get("details", []),
                    },
                    "metadata": {
                        "risk_score": metadata.get("risk_score", 0),
                        "ai_indicators": metadata.get("ai_indicators", []),
                    },
                    "ai_insights": ai_insights,
                },
                file_info={"filename": file.filename, "content_type": file.content_type},
            )

        elif media_type == "video":
            det_result = await run_async(detect_video, temp_path)
            ai_insights = generate_ai_insights(det_result, media_type="video")

            result = _build_response(
                media_type="video",
                verdict=det_result["verdict"],
                confidence=det_result["confidence"],
                details={
                    "duration": det_result.get("duration", 0),
                    "frame_count": det_result.get("frame_count", 0),
                    "flagged_frames": det_result.get("flagged_frames", []),
                    "analysis": det_result.get("details", []),
                    "ai_insights": ai_insights,
                },
                file_info={"filename": file.filename, "content_type": file.content_type},
            )

        elif media_type == "audio":
            det_result = await run_async(detect_audio, temp_path)
            ai_insights = generate_ai_insights(det_result, media_type="audio")

            result = _build_response(
                media_type="audio",
                verdict=det_result["verdict"],
                confidence=det_result["confidence"],
                details={
                    "method": det_result.get("method", "unknown"),
                    "probs": det_result.get("probs", {}),
                    "features": det_result.get("features", {}),
                    "analysis": det_result.get("details", []),
                    "ai_insights": ai_insights,
                },
                file_info={"filename": file.filename, "content_type": file.content_type},
            )
        else:
            raise HTTPException(status_code=415, detail="Unsupported media type.")

        # ── Step 2: Generate forensics ────────────────────────
        import base64

        forensics = {}
        ext = os.path.splitext(file.filename)[1].lower()

        if ext in ALLOWED_IMAGE_EXT:
            from utils.visualizer import generate_heatmap_overlay

            pil_image = Image.open(temp_path).convert("RGB")

            # ELA Heatmap
            heatmap = generate_heatmap_overlay(pil_image)
            buf = io.BytesIO()
            heatmap.save(buf, format="PNG")
            buf.seek(0)
            forensics["heatmap"] = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

            from utils.forensics import generate_noisemap_b64
            forensics["noisemap"] = generate_noisemap_b64(pil_image)

        # ── Step 3: Generate PDF ──────────────────────────────
        from utils.report_generator import generate_pdf_report

        report_path = generate_pdf_report(
            result=result,
            forensics=forensics,
            media_path=temp_path,
        )

        report_filename = os.path.basename(report_path)

        return JSONResponse(content={
            **get_privacy_status(),
            "report_path": report_path,
            "download_url": f"/download-report/{report_filename}",
            "report_id": report_filename.replace("IntrusionX_Report_", "").replace(".pdf", ""),
            "verdict": result.get("verdict", "UNKNOWN"),
            "confidence": result.get("confidence", 0),
        })

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {str(e)}",
        )
    finally:
        _cleanup(temp_path)


@app.get("/download-report/{filename}", tags=["Reports"], dependencies=[Depends(get_api_key)])
async def download_report(filename: str):
    """
    Download a previously generated forensic PDF report.
    """
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")

    reports_dir = os.path.join(os.path.dirname(__file__), "outputs", "reports")
    filepath = os.path.join(reports_dir, filename)

    if not os.path.isfile(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{filename}' not found.",
        )

    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Batch Analysis ────────────────────────────────────────────

@app.post("/detect/batch", tags=["Detection"], dependencies=[Depends(get_api_key)])
async def detect_batch_endpoint(files: List[UploadFile] = File(...)):
    """
    Process multiple media files in a single request.
    Automatically detects media type for each file and routes it correctly.
    
    - **Accepts:** List of image, video, or audio files
    - **Returns:** Aggregated batch summary and list of individual results
    """
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided for batch processing.",
        )
        
    temp_files = []
    
    try:
        # Save all uploads to temp
        for f in files:
            try:
                temp_path = await _save_upload(f, ALL_ALLOWED_EXT, MAX_VIDEO_SIZE)
                temp_files.append((temp_path, f.filename))
            except HTTPException as e:
                # Instead of crashing the whole batch, we record this file as a failure
                # by pushing None as the path. The batch processor handles this by emitting an error row.
                temp_files.append((None, f.filename))
            
        from utils.batch_processor import process_batch
        
        # Run batch processing
        batch_result = process_batch(temp_files)
        
        # Inject privacy status
        batch_result.update(get_privacy_status())
        
        return JSONResponse(content=batch_result)
        
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch processing failed: {str(e)}",
        )
    finally:
        # Cleanup all temp files
        for temp_path, _ in temp_files:
            _cleanup(temp_path)

