"""
Tattva.AI — Batch Media Processor
Processes multiple media files sequentially, auto-detecting media type
and routing to the appropriate detector. CPU-optimized.
"""
from __future__ import annotations

import os
import time
from typing import List, Optional, Callable
from PIL import Image

from detectors.image_detector import detect_image
from detectors.video_detector import detect_video
from detectors.audio_detector import detect_audio
from detectors.metadata_analyzer import analyze_metadata
from utils.media_router import detect_media_type


# ══════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".gif"}
VIDEO_EXT = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}
AUDIO_EXT = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac", ".wma"}
ALL_EXT = IMAGE_EXT | VIDEO_EXT | AUDIO_EXT

RISK_THRESHOLDS = {
    "Critical": 85,
    "High": 60,
    "Medium": 35,
    "Low": 0,
}


# ══════════════════════════════════════════════════════════════
#  TRUST INDEX
# ══════════════════════════════════════════════════════════════

def calculate_trust_index(
    verdict: str,
    confidence: float,
    metadata_risk: float = 0,
    ela_score: float = 0,
) -> float:
    """
    Calculate a composite authenticity / trust score (0-100).
    Higher = more trustworthy / authentic.

    Formula:
      - Start with confidence mapped to trust direction
      - Penalise for metadata risk
      - Penalise for ELA anomalies
    """
    if verdict == "AUTHENTIC":
        base = confidence  # High confidence authentic → high trust
    elif verdict == "SUSPICIOUS":
        base = max(0, 55 - confidence * 0.3)
    else:  # DEEPFAKE or ERROR
        base = max(0, 100 - confidence)

    # Metadata penalty (0-100 scale, scaled to -20 max)
    meta_penalty = min(20, metadata_risk * 0.2)

    # ELA penalty (subtle, max -10)
    ela_penalty = min(10, max(0, ela_score - 10) * 0.15)

    trust = max(0, min(100, base - meta_penalty - ela_penalty))
    return round(trust, 1)


def _classify_risk(confidence: float, verdict: str) -> str:
    """Derive risk level from verdict + confidence."""
    if verdict == "AUTHENTIC":
        return "Low"
    if verdict == "ERROR":
        return "Unknown"

    # For DEEPFAKE / SUSPICIOUS, use the fake-direction confidence
    score = confidence if verdict == "DEEPFAKE" else confidence * 0.6
    for level, threshold in RISK_THRESHOLDS.items():
        if score >= threshold:
            return level
    return "Low"


# ══════════════════════════════════════════════════════════════
#  SINGLE FILE PROCESSOR
# ══════════════════════════════════════════════════════════════

def _process_single(file_path: Optional[str], filename: str) -> dict:
    """
    Detect the media type and run the appropriate detector.
    Returns a structured result dict for one file.
    """
    if file_path is None:
        ext = os.path.splitext(filename)[1].lower() if filename else ""
        return {
            "file_name": filename,
            "media_type": ext.lstrip(".") or "unsupported folder/file",
            "verdict": "ERROR",
            "confidence": 0,
            "authenticity_score": 0,
            "risk_level": "Unknown",
            "error": "File was rejected during upload validation (unsupported type/size or folder).",
            "processing_time": 0,
        }

    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALL_EXT:
        return {
            "file_name": filename,
            "media_type": "unsupported",
            "verdict": "ERROR",
            "confidence": 0,
            "authenticity_score": 0,
            "risk_level": "Unknown",
            "details": [f"Unsupported file type: {ext}"],
            "error": f"File extension '{ext}' is not supported.",
            "processing_time": 0,
        }

    start_ts = time.time()

    try:
        # ── IMAGE ─────────────────────────────────────────
        if ext in IMAGE_EXT:
            pil_image = Image.open(file_path).convert("RGB")
            det = detect_image(pil_image)
            meta = analyze_metadata(file_path)

            trust = calculate_trust_index(
                det["verdict"],
                det["confidence"],
                metadata_risk=meta.get("risk_score", 0),
                ela_score=det.get("ela_score", 0),
            )

            return {
                "file_name": filename,
                "media_type": "image",
                "verdict": det["verdict"],
                "confidence": round(det["confidence"], 2),
                "authenticity_score": trust,
                "risk_level": _classify_risk(det["confidence"], det["verdict"]),
                "details": det.get("details", []),
                "models_used": det.get("models_used", []),
                "face_detected": det.get("face_detected", False),
                "ela_score": det.get("ela_score", 0),
                "metadata_risk": meta.get("risk_score", 0),
                "processing_time": round(time.time() - start_ts, 2),
            }

        # ── VIDEO ─────────────────────────────────────────
        elif ext in VIDEO_EXT:
            det = detect_video(file_path)

            trust = calculate_trust_index(det["verdict"], det["confidence"])

            return {
                "file_name": filename,
                "media_type": "video",
                "verdict": det["verdict"],
                "confidence": round(det["confidence"], 2),
                "authenticity_score": trust,
                "risk_level": _classify_risk(det["confidence"], det["verdict"]),
                "details": det.get("details", []),
                "frame_count": det.get("frame_count", 0),
                "duration": det.get("duration", 0),
                "flagged_frames": len(det.get("flagged_frames", [])),
                "processing_time": round(time.time() - start_ts, 2),
            }

        # ── AUDIO ─────────────────────────────────────────
        elif ext in AUDIO_EXT:
            det = detect_audio(file_path)

            trust = calculate_trust_index(det["verdict"], det["confidence"])

            return {
                "file_name": filename,
                "media_type": "audio",
                "verdict": det["verdict"],
                "confidence": round(det["confidence"], 2),
                "authenticity_score": trust,
                "risk_level": _classify_risk(det["confidence"], det["verdict"]),
                "details": det.get("details", []),
                "method": det.get("method", "unknown"),
                "processing_time": round(time.time() - start_ts, 2),
            }

    except Exception as e:
        return {
            "file_name": filename,
            "media_type": ext.lstrip("."),
            "verdict": "ERROR",
            "confidence": 0,
            "authenticity_score": 0,
            "risk_level": "Unknown",
            "error": str(e),
            "processing_time": round(time.time() - start_ts, 2),
        }

    # Should never reach here
    return {
        "file_name": filename,
        "media_type": "unknown",
        "verdict": "ERROR",
        "confidence": 0,
        "authenticity_score": 0,
        "risk_level": "Unknown",
        "error": "Unhandled media type.",
    }


# ══════════════════════════════════════════════════════════════
#  BATCH PROCESSOR
# ══════════════════════════════════════════════════════════════

def process_batch(
    files: list[tuple[str, str]],
    progress_callback: Optional[Callable] = None,
) -> dict:
    """
    Process a batch of media files and return aggregated results.

    Parameters
    ----------
    files : list of (file_path, original_filename) tuples
    progress_callback : optional callable(current: int, total: int)

    Returns
    -------
    dict with 'summary' and 'results' keys.
    """
    total = len(files)
    results = []

    total_start = time.time()

    for idx, (file_path, filename) in enumerate(files):
        print(f"[BatchProcessor] Processing {idx + 1}/{total}: {filename}")
        result = _process_single(file_path, filename)
        results.append(result)

        if progress_callback:
            progress_callback(idx + 1, total)

    total_time = round(time.time() - total_start, 2)

    # ── Build summary ────────────────────────────────────
    image_count = sum(1 for r in results if r["media_type"] == "image")
    video_count = sum(1 for r in results if r["media_type"] == "video")
    audio_count = sum(1 for r in results if r["media_type"] == "audio")
    error_count = sum(1 for r in results if r["verdict"] == "ERROR")

    deepfake_count = sum(1 for r in results if r["verdict"] == "DEEPFAKE")
    suspicious_count = sum(1 for r in results if r["verdict"] == "SUSPICIOUS")
    authentic_count = sum(1 for r in results if r["verdict"] == "AUTHENTIC")

    confidences = [r["confidence"] for r in results if r["verdict"] != "ERROR"]
    trust_scores = [r["authenticity_score"] for r in results if r["verdict"] != "ERROR"]

    avg_confidence = round(sum(confidences) / len(confidences), 1) if confidences else 0
    avg_trust = round(sum(trust_scores) / len(trust_scores), 1) if trust_scores else 0

    # Overall batch verdict
    if deepfake_count > 0:
        batch_verdict = "THREATS DETECTED"
    elif suspicious_count > 0:
        batch_verdict = "REVIEW REQUIRED"
    elif error_count == total:
        batch_verdict = "PROCESSING ERROR"
    else:
        batch_verdict = "ALL CLEAR"

    summary = {
        "total_files": total,
        "images": image_count,
        "videos": video_count,
        "audio": audio_count,
        "errors": error_count,
        "deepfakes_detected": deepfake_count,
        "suspicious_files": suspicious_count,
        "authentic_files": authentic_count,
        "average_confidence": avg_confidence,
        "average_authenticity_score": avg_trust,
        "batch_verdict": batch_verdict,
        "total_processing_time": total_time,
    }

    return {
        "summary": summary,
        "results": results,
    }
