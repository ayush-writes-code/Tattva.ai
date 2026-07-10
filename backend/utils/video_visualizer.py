"""
Tattva.AI — Video Visualizer
Generates annotated video overlays, suspicious frame galleries,
and per-frame heatmaps for explainable video deepfake detection.
"""
from __future__ import annotations

import cv2
import io
import base64
import uuid
import numpy as np
from PIL import Image

# Import the heatmap generator from existing visualizer
from utils.visualizer import generate_heatmap_overlay


def generate_video_forensics(
    video_path: str,
    frame_results: list,
    flagged_frames: list,
    max_suspicious: int = 8,
) -> dict:
    """
    Generate comprehensive video forensic visualizations.

    Parameters
    ----------
    video_path : str
        Path to the original video file.
    frame_results : list[dict]
        Per-frame detection results from video_detector.
    flagged_frames : list[int]
        Frame indices flagged as DEEPFAKE.
    max_suspicious : int
        Maximum number of suspicious frames to extract.

    Returns
    -------
    dict with:
        suspicious_frames : list of frame data dicts with base64 images + heatmaps
        frame_confidence_timeline : list of {frame, timestamp, confidence, verdict}
        annotated_video_b64 : base64-encoded annotated MP4 (or None if generation fails)
    """
    result = {
        "suspicious_frames": [],
        "frame_confidence_timeline": [],
        "annotated_video_b64": None,
    }

    # ── Build confidence timeline ─────────────────────────
    for fr in frame_results:
        fake_prob = fr.get("confidence", 50)
        verdict = fr.get("verdict", "UNKNOWN")
        # Normalize: for AUTHENTIC, confidence = "realness", we want "fakeness"
        if verdict == "AUTHENTIC":
            fake_score = 100 - fake_prob
        else:
            fake_score = fake_prob

        result["frame_confidence_timeline"].append({
            "frame": fr.get("frame_index", 0),
            "timestamp": fr.get("timestamp", 0),
            "confidence": round(fake_score, 1),
            "verdict": verdict,
        })

    # ── Extract suspicious frames with heatmaps ───────────
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return result

    # Collect suspicious frame indices (DEEPFAKE + SUSPICIOUS)
    suspicious_indices = []
    for fr in frame_results:
        if fr.get("verdict") in ("DEEPFAKE", "SUSPICIOUS"):
            suspicious_indices.append(fr)

    # Sort by confidence (most suspicious first), limit count
    suspicious_indices.sort(
        key=lambda x: x.get("confidence", 0)
        if x.get("verdict") != "AUTHENTIC"
        else 0,
        reverse=True,
    )
    suspicious_indices = suspicious_indices[:max_suspicious]

    for fr in suspicious_indices:
        fidx = fr.get("frame_index", 0)
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(fidx))
        ret, frame = cap.read()
        if not ret:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb)

        # Generate base64 image
        img_b64 = _pil_to_b64(pil_image)

        # Generate heatmap overlay
        try:
            heatmap = generate_heatmap_overlay(pil_image)
            heatmap_b64 = _pil_to_b64(heatmap)
        except Exception:
            heatmap_b64 = None

        result["suspicious_frames"].append({
            "frame_index": int(fidx),
            "timestamp": fr.get("timestamp", 0),
            "confidence": fr.get("confidence", 0),
            "verdict": fr.get("verdict", "UNKNOWN"),
            "image": img_b64,
            "heatmap": heatmap_b64,
        })

    # ── Generate annotated video ──────────────────────────
    try:
        annotated_b64 = _generate_annotated_video(video_path, frame_results, cap)
        result["annotated_video_b64"] = annotated_b64
    except Exception as e:
        print(f"[VideoVisualizer] Annotated video generation failed: {e}")

    cap.release()
    return result


def _generate_annotated_video(
    video_path: str, frame_results: list, cap: cv2.VideoCapture
) -> str | None:
    """
    Create an annotated version of the video with detection overlays.
    Returns base64-encoded MP4 or None on failure.
    """
    import tempfile
    import os

    cap2 = cv2.VideoCapture(video_path)
    if not cap2.isOpened():
        return None

    fps = cap2.get(cv2.CAP_PROP_FPS) or 30
    width = int(cap2.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap2.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap2.get(cv2.CAP_PROP_FRAME_COUNT))

    # Build a lookup of frame_index → result
    result_lookup = {}
    for fr in frame_results:
        result_lookup[fr.get("frame_index", -1)] = fr

    # Create temp output file
    import os
    tmp_path = os.path.join(tempfile.gettempdir(), f"annotated_{uuid.uuid4().hex}.mp4")
    
    # Try different codecs (avc1 is best for web, mp4v is safe fallback)
    codecs = ['avc1', 'mp4v', 'XVID']
    out = None
    
    for codec in codecs:
        fourcc = cv2.VideoWriter_fourcc(*codec)
        out = cv2.VideoWriter(tmp_path, fourcc, fps, (width, height))
        if out.isOpened():
            break
            
    if not out or not out.isOpened():
        cap2.release()
        return None

    # Limit frames for annotated video to prevent timeouts/gigantic files
    MAX_ANNOTATE_FRAMES = 150 
    total_to_process = min(total_frames, MAX_ANNOTATE_FRAMES)
    step = max(1, total_frames // MAX_ANNOTATE_FRAMES)

    # Find closest analyzed frame for each video frame
    analyzed_indices = sorted(result_lookup.keys())

    # Color map for verdicts
    verdict_colors = {
        "DEEPFAKE": (0, 0, 255),     # Red in BGR
        "SUSPICIOUS": (0, 200, 255),  # Yellow-ish in BGR
        "AUTHENTIC": (0, 200, 0),     # Green in BGR
    }

    processed_count = 0
    for fidx in range(0, total_frames, step):
        if processed_count >= MAX_ANNOTATE_FRAMES:
            break
        
        cap2.set(cv2.CAP_PROP_POS_FRAMES, fidx)
        ret, frame = cap2.read()
        if not ret:
            break

        processed_count += 1

        # Find the nearest analyzed frame
        closest = _find_nearest(analyzed_indices, fidx)
        fr_result = result_lookup.get(closest, None) if closest is not None else None

        if fr_result:
            verdict = fr_result.get("verdict", "UNKNOWN")
            confidence = fr_result.get("confidence", 0)
            color = verdict_colors.get(verdict, (128, 128, 128))

            # Draw border
            cv2.rectangle(frame, (0, 0), (width - 1, height - 1), color, 3)

            # Draw top bar background
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (width, 40), (0, 0, 0), -1)
            cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)

            # Draw verdict text
            label = f"{verdict} | {confidence:.1f}%"
            cv2.putText(
                frame, label, (10, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2, cv2.LINE_AA,
            )

            # Draw confidence bar
            bar_width = int((width - 20) * confidence / 100)
            cv2.rectangle(frame, (10, height - 20), (10 + bar_width, height - 10), color, -1)
            cv2.rectangle(frame, (10, height - 20), (width - 10, height - 10), (50, 50, 50), 1)

        out.write(frame)

    out.release()
    cap2.release()

    # Read the generated video and encode to base64
    try:
        with open(tmp_path, "rb") as f:
            video_bytes = f.read()
        b64 = base64.b64encode(video_bytes).decode("utf-8")
        os.remove(tmp_path)
        # Only return if size is reasonable (<50MB base64)
        if len(b64) < 50 * 1024 * 1024:
            return f"data:video/mp4;base64,{b64}"
        return None
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        return None


def _find_nearest(sorted_indices: list, target: int) -> int | None:
    """Find the nearest value in a sorted list to the target."""
    if not sorted_indices:
        return None
    pos = np.searchsorted(sorted_indices, target)
    if pos == 0:
        return sorted_indices[0]
    if pos == len(sorted_indices):
        return sorted_indices[-1]
    before = sorted_indices[pos - 1]
    after = sorted_indices[pos]
    return before if (target - before) <= (after - target) else after


def _pil_to_b64(image: Image.Image, format: str = "PNG") -> str:
    """Convert a PIL Image to a base64 data URI string."""
    buf = io.BytesIO()
    image.save(buf, format=format)
    buf.seek(0)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    mime = "image/png" if format == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{b64}"
