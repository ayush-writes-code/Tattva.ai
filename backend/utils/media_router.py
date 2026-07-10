"""
Tattva.AI — Media Router
Unified detection endpoint that auto-routes files to the correct detector.

Usage:
    from utils.media_router import detect_media_type, route_detection

    media_type = detect_media_type("/path/to/file.jpg")   # → "image"
    result     = route_detection("/path/to/file.jpg")      # → full detection result

Supports:
    Images : jpg, jpeg, png, bmp, webp, tiff, gif
    Videos : mp4, avi, mov, mkv, webm, flv, wmv
    Audio  : mp3, wav, flac, m4a, ogg, aac, wma
"""

import os
import mimetypes

from PIL import Image

from detectors.image_detector import detect_image
from detectors.video_detector import detect_video
from detectors.audio_detector import detect_audio
from detectors.metadata_analyzer import analyze_metadata


# ══════════════════════════════════════════════════════════════
#  FORMAT DEFINITIONS
# ══════════════════════════════════════════════════════════════

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".gif"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}
AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac", ".wma"}

# MIME type prefix → media type (fallback when extension is ambiguous)
MIME_PREFIX_MAP = {
    "image/": "image",
    "video/": "video",
    "audio/": "audio",
}


# ══════════════════════════════════════════════════════════════
#  MEDIA TYPE DETECTION
# ══════════════════════════════════════════════════════════════

def detect_media_type(file_path: str) -> str:
    """
    Identify the media type of a file.

    Uses a two-pass approach:
      1. File extension check (fast, reliable for standard files)
      2. MIME type guessing (fallback for non-standard extensions)

    Parameters
    ----------
    file_path : str
        Absolute or relative path to the media file.

    Returns
    -------
    str
        One of: "image", "video", "audio", "unknown"

    Examples
    --------
    >>> detect_media_type("photo.jpg")
    'image'
    >>> detect_media_type("clip.mp4")
    'video'
    >>> detect_media_type("voice.wav")
    'audio'
    >>> detect_media_type("data.csv")
    'unknown'
    """
    if not file_path:
        return "unknown"

    # ── Pass 1: Extension-based detection ─────────────────
    ext = os.path.splitext(file_path)[1].lower()

    if ext in IMAGE_EXTENSIONS:
        return "image"
    elif ext in VIDEO_EXTENSIONS:
        return "video"
    elif ext in AUDIO_EXTENSIONS:
        return "audio"

    # ── Pass 2: MIME type fallback ────────────────────────
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type:
        for prefix, media_type in MIME_PREFIX_MAP.items():
            if mime_type.startswith(prefix):
                return media_type

    return "unknown"


# ══════════════════════════════════════════════════════════════
#  UNIFIED DETECTION ROUTER
# ══════════════════════════════════════════════════════════════

def route_detection(file_path: str, progress_callback=None) -> dict:
    """
    Unified detection endpoint.

    Automatically determines the media type and routes the file to the
    appropriate detector (image, video, or audio). For images, metadata
    analysis is included as an additional layer.

    Parameters
    ----------
    file_path : str
        Path to the uploaded media file.
    progress_callback : callable, optional
        For video analysis: function(current, total) for progress updates.

    Returns
    -------
    dict
        Standardised result with keys:
            media_type : str   — "image" | "video" | "audio" | "unknown"
            verdict    : str   — "DEEPFAKE" | "AUTHENTIC" | "SUSPICIOUS" | "ERROR"
            confidence : float — 0-100
            details    : dict  — full detector output + metadata (if applicable)
            file_info  : dict  — filename, extension, size

    Raises
    ------
    Does NOT raise exceptions — all errors are captured in the result dict.

    Examples
    --------
    >>> result = route_detection("photo.jpg")
    >>> result["media_type"]
    'image'
    >>> result["verdict"]
    'DEEPFAKE'
    """
    # ── Validate file exists ──────────────────────────────
    if not file_path or not os.path.isfile(file_path):
        return _error_result("unknown", "File not found or no file provided.")

    # ── File info ─────────────────────────────────────────
    file_info = {
        "filename": os.path.basename(file_path),
        "extension": os.path.splitext(file_path)[1].lower(),
        "size_bytes": os.path.getsize(file_path),
        "size_mb": round(os.path.getsize(file_path) / (1024 * 1024), 2),
    }

    # ── Detect media type ─────────────────────────────────
    media_type = detect_media_type(file_path)

    if media_type == "unknown":
        return _error_result(
            "unknown",
            f"Unsupported file format: '{file_info['extension']}'. "
            f"Supported: images ({', '.join(sorted(IMAGE_EXTENSIONS))}), "
            f"videos ({', '.join(sorted(VIDEO_EXTENSIONS))}), "
            f"audio ({', '.join(sorted(AUDIO_EXTENSIONS))})",
            file_info=file_info,
        )

    # ── Route to correct detector ─────────────────────────
    try:
        if media_type == "image":
            return _handle_image(file_path, file_info)
        elif media_type == "video":
            return _handle_video(file_path, file_info, progress_callback)
        elif media_type == "audio":
            return _handle_audio(file_path, file_info)
    except Exception as e:
        return _error_result(
            media_type,
            f"Detection failed: {str(e)}",
            file_info=file_info,
        )

    return _error_result(media_type, "Unexpected routing error.", file_info=file_info)


# ══════════════════════════════════════════════════════════════
#  INTERNAL HANDLERS
# ══════════════════════════════════════════════════════════════

def _handle_image(file_path: str, file_info: dict) -> dict:
    """Route an image file through the detection pipeline."""
    # Open as PIL Image
    pil_image = Image.open(file_path)
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")

    # Run deepfake detection
    detection = detect_image(pil_image)

    # Run metadata analysis as additional layer
    metadata = analyze_metadata(file_path)

    return {
        "media_type": "image",
        "verdict": detection["verdict"],
        "confidence": detection["confidence"],
        "details": {
            "detection": detection,
            "metadata": metadata,
        },
        "file_info": file_info,
    }


def _handle_video(file_path: str, file_info: dict, progress_callback=None) -> dict:
    """Route a video file through the detection pipeline."""
    detection = detect_video(file_path, progress_callback=progress_callback)

    return {
        "media_type": "video",
        "verdict": detection["verdict"],
        "confidence": detection["confidence"],
        "details": {
            "detection": detection,
        },
        "file_info": file_info,
    }


def _handle_audio(file_path: str, file_info: dict) -> dict:
    """Route an audio file through the detection pipeline."""
    detection = detect_audio(file_path)

    return {
        "media_type": "audio",
        "verdict": detection["verdict"],
        "confidence": detection["confidence"],
        "details": {
            "detection": detection,
        },
        "file_info": file_info,
    }


# ══════════════════════════════════════════════════════════════
#  ERROR HELPER
# ══════════════════════════════════════════════════════════════

def _error_result(media_type: str, message: str, file_info: dict = None) -> dict:
    """Build a standardised error result."""
    return {
        "media_type": media_type,
        "verdict": "ERROR",
        "confidence": 0,
        "details": {
            "error": message,
        },
        "file_info": file_info or {},
    }
