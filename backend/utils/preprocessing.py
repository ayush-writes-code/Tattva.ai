"""
Tattva.AI — Preprocessing Utilities
File validation, format checking, and common preprocessing tasks.
"""

import os
from PIL import Image

# ── Supported formats ─────────────────────────────────────────
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".gif"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}
AUDIO_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac", ".wma"}

MAX_IMAGE_SIZE = 20 * 1024 * 1024   # 20 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_AUDIO_SIZE = 50 * 1024 * 1024   # 50 MB


def validate_image(file_path: str) -> tuple[bool, str]:
    """Validate an image file. Returns (is_valid, message)."""
    if not file_path or not os.path.isfile(file_path):
        return False, "No file provided."

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in IMAGE_EXTENSIONS:
        return False, f"Unsupported format: {ext}. Supported: {', '.join(IMAGE_EXTENSIONS)}"

    size = os.path.getsize(file_path)
    if size > MAX_IMAGE_SIZE:
        return False, f"File too large ({size / 1024 / 1024:.1f} MB). Maximum: {MAX_IMAGE_SIZE / 1024 / 1024:.0f} MB"

    try:
        img = Image.open(file_path)
        img.verify()
        return True, "Valid image file."
    except Exception as e:
        return False, f"Invalid image: {e}"


def validate_video(file_path: str) -> tuple[bool, str]:
    """Validate a video file."""
    if not file_path or not os.path.isfile(file_path):
        return False, "No file provided."

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in VIDEO_EXTENSIONS:
        return False, f"Unsupported format: {ext}. Supported: {', '.join(VIDEO_EXTENSIONS)}"

    size = os.path.getsize(file_path)
    if size > MAX_VIDEO_SIZE:
        return False, f"File too large ({size / 1024 / 1024:.1f} MB). Maximum: {MAX_VIDEO_SIZE / 1024 / 1024:.0f} MB"

    return True, "Valid video file."


def validate_audio(file_path: str) -> tuple[bool, str]:
    """Validate an audio file."""
    if not file_path or not os.path.isfile(file_path):
        return False, "No file provided."

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in AUDIO_EXTENSIONS:
        return False, f"Unsupported format: {ext}. Supported: {', '.join(AUDIO_EXTENSIONS)}"

    size = os.path.getsize(file_path)
    if size > MAX_AUDIO_SIZE:
        return False, f"File too large ({size / 1024 / 1024:.1f} MB). Maximum: {MAX_AUDIO_SIZE / 1024 / 1024:.0f} MB"

    return True, "Valid audio file."


def get_file_info(file_path: str) -> dict:
    """Get basic file information."""
    if not file_path or not os.path.isfile(file_path):
        return {}

    stat = os.stat(file_path)
    return {
        "filename": os.path.basename(file_path),
        "extension": os.path.splitext(file_path)[1].lower(),
        "size_bytes": stat.st_size,
        "size_mb": round(stat.st_size / 1024 / 1024, 2),
    }
