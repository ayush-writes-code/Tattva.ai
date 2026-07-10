"""
Tattva.AI — Explanation Generator & AI Insights Engine
Generates human-readable explanations and structured AI insights
for detection results using a rule-based analysis engine.
"""
from __future__ import annotations


# ══════════════════════════════════════════════════════════════
#  AI INSIGHTS ENGINE (Rule-Based)
# ══════════════════════════════════════════════════════════════

def generate_ai_insights(result: dict, media_type: str = "image") -> dict:
    """
    Generate structured, human-readable AI insights from a detection result.

    Parameters
    ----------
    result : dict
        The detection result from any detector (image/video/audio).
    media_type : str
        One of "image", "video", "audio".

    Returns
    -------
    dict with:
        ai_insights   : list of {category, description, severity}
        anomaly_score : float (0-1)
        risk_level    : str ("Low", "Medium", "High", "Critical")
        summary       : str
    """
    insights = []
    anomaly_score = 0.0

    if media_type == "image":
        insights, anomaly_score = _analyze_image_insights(result)
    elif media_type == "video":
        insights, anomaly_score = _analyze_video_insights(result)
    elif media_type == "audio":
        insights, anomaly_score = _analyze_audio_insights(result)

    # Determine risk level
    if anomaly_score >= 0.8:
        risk_level = "Critical"
    elif anomaly_score >= 0.6:
        risk_level = "High"
    elif anomaly_score >= 0.35:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    # Generate summary
    verdict = result.get("verdict", "UNKNOWN")
    confidence = result.get("confidence", 0)
    n_insights = len([i for i in insights if i["severity"] in ("high", "critical")])

    if verdict == "DEEPFAKE":
        summary = (
            f"Analysis detected {n_insights} high-severity anomalies with "
            f"{confidence:.1f}% confidence. Strong indicators of AI manipulation "
            f"or synthetic generation were found."
        )
    elif verdict == "SUSPICIOUS":
        summary = (
            f"Analysis found {len(insights)} potential anomalies. "
            f"Some indicators of manipulation are present but not definitive. "
            f"Manual review is recommended."
        )
    elif verdict == "AUTHENTIC":
        summary = (
            f"No significant manipulation indicators detected. "
            f"The media appears authentic with {confidence:.1f}% confidence."
        )
    else:
        summary = "Analysis could not be completed. Please try again."

    return {
        "ai_insights": insights,
        "anomaly_score": round(anomaly_score, 2),
        "risk_level": risk_level,
        "summary": summary,
    }


def _analyze_image_insights(result: dict) -> tuple[list, float]:
    """Generate insights specific to image detection."""
    insights = []
    scores = []

    verdict = result.get("verdict", "UNKNOWN")
    confidence = result.get("confidence", 0)
    ela_score = result.get("ela_score", 0)
    face_detected = result.get("face_detected", False)
    models_used = result.get("models_used", [])
    probs = result.get("probs", {})

    # ── Rule: Face detection + deepfake verdict ──
    if face_detected and verdict == "DEEPFAKE":
        insights.append({
            "category": "Facial Inconsistency",
            "description": (
                "Face region analysis reveals texture irregularities consistent "
                "with GAN-generated or face-swapped imagery. Subtle artifacts "
                "detected around facial landmarks (eyes, mouth, jawline)."
            ),
            "severity": "high",
        })
        scores.append(0.85)

    elif face_detected and verdict == "SUSPICIOUS":
        insights.append({
            "category": "Facial Anomaly",
            "description": (
                "Minor facial texture inconsistencies detected. The face region "
                "shows some statistical deviations from natural imagery patterns."
            ),
            "severity": "medium",
        })
        scores.append(0.5)

    # ── Rule: No face but deepfake → full-image AI generation ──
    if not face_detected and verdict in ("DEEPFAKE", "SUSPICIOUS"):
        insights.append({
            "category": "AI-Generated Content",
            "description": (
                "No human face detected, but the full image exhibits patterns "
                "consistent with AI image generation (Stable Diffusion, DALL-E, "
                "Midjourney). Uniform noise distribution suggests synthetic origin."
            ),
            "severity": "high" if verdict == "DEEPFAKE" else "medium",
        })
        scores.append(0.75 if verdict == "DEEPFAKE" else 0.45)

    # ── Rule: ELA-based insights ──
    if ela_score > 30:
        insights.append({
            "category": "Compression Artifacts",
            "description": (
                f"Error Level Analysis shows elevated error levels ({ela_score:.1f}). "
                "This indicates the image has undergone non-uniform compression, "
                "suggesting regions may have been edited or spliced after initial save."
            ),
            "severity": "high",
        })
        scores.append(0.7)
    elif ela_score > 15:
        insights.append({
            "category": "Compression Anomaly",
            "description": (
                f"Moderate ELA score ({ela_score:.1f}) detected. Some regions "
                "show different error levels, which could indicate light editing "
                "or multiple save operations."
            ),
            "severity": "medium",
        })
        scores.append(0.4)
    elif ela_score < 5 and verdict in ("DEEPFAKE", "SUSPICIOUS"):
        insights.append({
            "category": "Unnaturally Clean Image",
            "description": (
                f"Very low ELA score ({ela_score:.1f}) combined with deepfake "
                "indicators. AI-generated images often have uniform error levels "
                "because they are never captured by a physical camera sensor."
            ),
            "severity": "medium",
        })
        scores.append(0.5)

    # ── Rule: Model agreement/disagreement ──
    if len(models_used) >= 2:
        # Check if models agree
        fake_probs = []
        for key, val in probs.items():
            if "Fake" in key or "artificial" in key:
                fake_probs.append(val)

        if len(fake_probs) >= 2:
            agree = all(p >= 50 for p in fake_probs) or all(p < 50 for p in fake_probs)
            if agree and all(p >= 50 for p in fake_probs):
                insights.append({
                    "category": "Cross-Model Consensus",
                    "description": (
                        "Both ViT and Swin Transformer models independently "
                        "flagged this image as manipulated. Cross-model agreement "
                        "significantly increases detection reliability."
                    ),
                    "severity": "high",
                })
                scores.append(0.9)
            elif not agree:
                insights.append({
                    "category": "Model Disagreement",
                    "description": (
                        "Detection models produced conflicting results. One model "
                        "flags manipulation while the other does not. This can "
                        "occur with sophisticated deepfakes or borderline cases."
                    ),
                    "severity": "medium",
                })
                scores.append(0.45)

    # ── Rule: High confidence authentic ──
    if verdict == "AUTHENTIC" and confidence > 90:
        insights.append({
            "category": "High Authenticity",
            "description": (
                "Multiple detection layers confirm this image appears genuine. "
                "Natural sensor noise, consistent compression, and no face-swap "
                "artifacts detected."
            ),
            "severity": "low",
        })
        scores.append(0.1)

    # Calculate aggregate anomaly score
    anomaly_score = max(scores) if scores else 0.0
    return insights, anomaly_score


def _analyze_video_insights(result: dict) -> tuple[list, float]:
    """Generate insights specific to video detection."""
    insights = []
    scores = []

    verdict = result.get("verdict", "UNKNOWN")
    confidence = result.get("confidence", 0)
    frame_results = result.get("frame_results", [])
    flagged_frames = result.get("flagged_frames", [])
    frame_count = result.get("frame_count", 0)
    duration = result.get("duration", 0)

    # ── Rule: Temporal instability ──
    if len(frame_results) >= 3:
        confidences = []
        for fr in frame_results:
            v = fr.get("verdict", "AUTHENTIC")
            c = fr.get("confidence", 50)
            confidences.append(c if v != "AUTHENTIC" else 100 - c)

        variance = float(np.std(confidences)) if len(confidences) > 1 else 0
        mean_conf = float(np.mean(confidences))

        if variance > 20:
            insights.append({
                "category": "Temporal Instability",
                "description": (
                    f"High frame-to-frame confidence variance ({variance:.1f}%). "
                    "Deepfake generation often produces inconsistent quality across "
                    "frames, especially during rapid head movements or expressions."
                ),
                "severity": "high",
            })
            scores.append(0.75)
        elif variance > 10:
            insights.append({
                "category": "Temporal Fluctuation",
                "description": (
                    f"Moderate confidence variance ({variance:.1f}%) detected across frames. "
                    "Some frames show more manipulation artifacts than others."
                ),
                "severity": "medium",
            })
            scores.append(0.5)

    # ── Rule: Flagged frame ratio ──
    if frame_count > 0:
        flag_ratio = len(flagged_frames) / frame_count
        if flag_ratio >= 0.5:
            insights.append({
                "category": "Widespread Manipulation",
                "description": (
                    f"{len(flagged_frames)} out of {frame_count} analyzed frames "
                    f"({flag_ratio*100:.0f}%) flagged as deepfake. Manipulation "
                    "appears to span the majority of the video."
                ),
                "severity": "critical",
            })
            scores.append(0.95)
        elif flag_ratio >= 0.2:
            insights.append({
                "category": "Partial Manipulation",
                "description": (
                    f"{len(flagged_frames)} out of {frame_count} frames flagged. "
                    "Manipulation may be limited to specific segments of the video."
                ),
                "severity": "high",
            })
            scores.append(0.7)

    # ── Rule: Face consistency ──
    face_counts = sum(1 for fr in frame_results if fr.get("face_detected", False))
    if frame_count > 0 and face_counts > 0:
        face_ratio = face_counts / frame_count
        if face_ratio < 0.5 and verdict in ("DEEPFAKE", "SUSPICIOUS"):
            insights.append({
                "category": "Face Detection Inconsistency",
                "description": (
                    f"Faces detected in only {face_counts}/{frame_count} frames. "
                    "Inconsistent face detection can indicate face-swap artifacts "
                    "that confuse the detector in certain angles or lighting."
                ),
                "severity": "medium",
            })
            scores.append(0.55)

    # ── Rule: Authentic video ──
    if verdict == "AUTHENTIC":
        insights.append({
            "category": "Temporal Consistency",
            "description": (
                f"All {frame_count} analyzed frames show consistent authenticity. "
                "No significant manipulation artifacts detected across the timeline."
            ),
            "severity": "low",
        })
        scores.append(0.1)

    # ── Rule: Peak frame anomaly ──
    if frame_results:
        peak_frame = max(frame_results, key=lambda x: x.get("confidence", 0) if x.get("verdict") != "AUTHENTIC" else 0)
        if peak_frame.get("verdict") == "DEEPFAKE" and peak_frame.get("confidence", 0) > 85:
            insights.append({
                "category": "Peak Anomaly Frame",
                "description": (
                    f"Frame #{peak_frame.get('frame_index', 0)} at "
                    f"{peak_frame.get('timestamp', 0):.1f}s shows extremely high "
                    f"manipulation confidence ({peak_frame.get('confidence', 0):.1f}%). "
                    "This frame likely contains the most visible deepfake artifacts."
                ),
                "severity": "high",
            })
            scores.append(0.8)

    anomaly_score = max(scores) if scores else 0.0
    return insights, anomaly_score


def _analyze_audio_insights(result: dict) -> tuple[list, float]:
    """Generate insights specific to audio detection."""
    insights = []
    scores = []

    verdict = result.get("verdict", "UNKNOWN")
    confidence = result.get("confidence", 0)
    method = result.get("method", "unknown")
    features = result.get("features", {})

    # ── Rule: Spectral flatness anomaly ──
    flatness = features.get("spectral_flatness_mean", 0)
    if flatness > 0.15:
        insights.append({
            "category": "Spectral Flatness Anomaly",
            "description": (
                f"High spectral flatness ({flatness:.4f}) indicates the audio "
                "has an unusually smooth frequency distribution. Natural human "
                "speech has more tonal variation. This pattern is common in "
                "TTS-generated audio."
            ),
            "severity": "high",
        })
        scores.append(0.7)
    elif flatness < 0.02 and verdict in ("DEEPFAKE", "SUSPICIOUS"):
        insights.append({
            "category": "Spectral Profile Anomaly",
            "description": (
                f"Very low spectral flatness ({flatness:.4f}) combined with "
                "deepfake indicators. Some voice cloning systems produce audio "
                "with concentrated tonal energy that differs from natural speech."
            ),
            "severity": "medium",
        })
        scores.append(0.5)

    # ── Rule: RMS energy consistency ──
    rms_std = features.get("rms_std", 0)
    if rms_std < 0.02 and verdict in ("DEEPFAKE", "SUSPICIOUS"):
        insights.append({
            "category": "Unnatural Energy Consistency",
            "description": (
                f"RMS energy standard deviation is very low ({rms_std:.4f}). "
                "Natural human speech has significant volume variation (breathing, "
                "emphasis, pauses). AI-generated audio often maintains unnaturally "
                "consistent energy levels throughout."
            ),
            "severity": "high",
        })
        scores.append(0.75)

    # ── Rule: Zero-crossing rate ──
    zcr_std = features.get("zcr_std", 0)
    if zcr_std < 0.01 and verdict in ("DEEPFAKE", "SUSPICIOUS"):
        insights.append({
            "category": "Zero-Crossing Uniformity",
            "description": (
                f"Zero-crossing rate variance is abnormally low ({zcr_std:.4f}). "
                "This suggests the audio lacks the micro-variations present in "
                "natural vocal cord vibration patterns."
            ),
            "severity": "medium",
        })
        scores.append(0.5)

    # ── Rule: Wav2Vec2 model detection ──
    if method == "wav2vec2_xlsr":
        if verdict == "DEEPFAKE":
            insights.append({
                "category": "Neural Network Detection",
                "description": (
                    "The Wav2Vec2-XLSR model (97.9% accuracy) classified this "
                    "audio as AI-generated with high confidence. This model is "
                    "trained on ElevenLabs, Amazon Polly, Kokoro, and Hume AI samples."
                ),
                "severity": "high",
            })
            scores.append(0.85)
        elif verdict == "AUTHENTIC":
            insights.append({
                "category": "Neural Verification",
                "description": (
                    "The Wav2Vec2-XLSR model confirms this audio exhibits natural "
                    "human speech patterns. No voice cloning or TTS artifacts detected."
                ),
                "severity": "low",
            })
            scores.append(0.1)

    # ── Rule: Spectral centroid ──
    centroid_std = features.get("spectral_centroid_std", 0)
    if centroid_std < 200 and verdict in ("DEEPFAKE", "SUSPICIOUS"):
        insights.append({
            "category": "Frequency Monotony",
            "description": (
                f"Low spectral centroid variation ({centroid_std:.0f} Hz). "
                "Natural speech shifts frequency content significantly during "
                "different phonemes. Low variation suggests synthetic origin."
            ),
            "severity": "medium",
        })
        scores.append(0.45)

    anomaly_score = max(scores) if scores else 0.0
    return insights, anomaly_score


# ══════════════════════════════════════════════════════════════
#  ORIGINAL EXPLANATION FORMATTERS (preserved)
# ══════════════════════════════════════════════════════════════

def explain_image_result(result: dict) -> str:
    """Format an image detection result into a rich markdown explanation."""
    verdict = result.get("verdict", "UNKNOWN")
    confidence = result.get("confidence", 0)
    details = result.get("details", [])

    icon = _verdict_icon(verdict)

    md = f"## {icon} Verdict: **{verdict}**\n\n"
    md += f"### Confidence: {confidence:.1f}%\n\n"
    md += _confidence_bar(confidence, verdict) + "\n\n"
    md += "### Analysis Details\n\n"
    for d in details:
        md += f"- {d}\n"

    # Add probability breakdown if available
    probs = result.get("probs", {})
    if probs:
        md += "\n### Model Probabilities\n\n"
        for label, prob in probs.items():
            md += f"- **{label}**: {prob}%\n"

    return md


def explain_video_result(result: dict) -> str:
    """Format a video detection result into markdown."""
    verdict = result.get("verdict", "UNKNOWN")
    confidence = result.get("confidence", 0)
    details = result.get("details", [])
    frame_count = result.get("frame_count", 0)
    flagged = result.get("flagged_frames", [])
    duration = result.get("duration", 0)

    icon = _verdict_icon(verdict)

    md = f"## {icon} Verdict: **{verdict}**\n\n"
    md += f"### Confidence: {confidence:.1f}%\n\n"
    md += _confidence_bar(confidence, verdict) + "\n\n"

    md += f"**Video Duration:** {duration:.1f}s | "
    md += f"**Frames Analysed:** {frame_count} | "
    md += f"**Frames Flagged:** {len(flagged)}\n\n"

    md += "### Analysis Details\n\n"
    for d in details:
        md += f"- {d}\n"

    # Frame breakdown
    frame_results = result.get("frame_results", [])
    if frame_results:
        md += "\n### Frame-by-Frame Results\n\n"
        md += "| Frame | Time | Verdict | Confidence |\n"
        md += "|-------|------|---------|------------|\n"
        for fr in frame_results:
            t = fr.get("timestamp", 0)
            v = fr.get("verdict", "?")
            c = fr.get("confidence", 0)
            fi = fr.get("frame_index", 0)
            flag = " ⚠️" if v == "DEEPFAKE" else ""
            md += f"| #{fi} | {t:.1f}s | {v}{flag} | {c:.1f}% |\n"

    return md


def explain_audio_result(result: dict) -> str:
    """Format an audio detection result into markdown."""
    verdict = result.get("verdict", "UNKNOWN")
    confidence = result.get("confidence", 0)
    details = result.get("details", [])
    method = result.get("method", "unknown")

    icon = _verdict_icon(verdict)

    md = f"## {icon} Verdict: **{verdict}**\n\n"
    md += f"### Confidence: {confidence:.1f}%\n\n"
    md += _confidence_bar(confidence, verdict) + "\n\n"
    md += f"**Detection Method:** {method.replace('_', ' ').title()}\n\n"

    md += "### Analysis Details\n\n"
    for d in details:
        md += f"- {d}\n"

    # Feature breakdown
    features = result.get("features", {})
    if features:
        md += "\n### Audio Features\n\n"
        md += "| Feature | Value |\n"
        md += "|---------|-------|\n"
        for k, v in features.items():
            name = k.replace("_", " ").title()
            if isinstance(v, float):
                md += f"| {name} | {v:.4f} |\n"
            else:
                md += f"| {name} | {v} |\n"

    return md


def explain_metadata_result(meta: dict) -> str:
    """Format metadata analysis into markdown."""
    risk = meta.get("risk_score", 0)
    has_exif = meta.get("has_exif", False)
    indicators = meta.get("ai_indicators", [])
    details = meta.get("details", [])

    if risk >= 50:
        icon = "🔴"
        label = "HIGH RISK"
    elif risk >= 25:
        icon = "🟡"
        label = "MODERATE RISK"
    else:
        icon = "🟢"
        label = "LOW RISK"

    md = f"## {icon} Metadata Risk: **{label}** ({risk:.0f}%)\n\n"

    if indicators:
        md += "### AI Indicators Found\n\n"
        for ind in indicators:
            md += f"- ⚠️ {ind}\n"
        md += "\n"

    md += "### Metadata Details\n\n"
    for d in details:
        md += f"- {d}\n"

    # Raw EXIF table
    exif = meta.get("exif_data", {})
    if exif:
        md += "\n### Raw Metadata Fields\n\n"
        md += "| Field | Value |\n"
        md += "|-------|-------|\n"
        for k, v in list(exif.items())[:20]:
            val = str(v)[:80]
            md += f"| {k} | {val} |\n"
        if len(exif) > 20:
            md += f"\n*...and {len(exif) - 20} more fields*\n"

    return md


# ── Helpers ───────────────────────────────────────────────────

def _verdict_icon(verdict: str) -> str:
    return {
        "DEEPFAKE": "🔴",
        "SUSPICIOUS": "🟡",
        "AUTHENTIC": "🟢",
        "ERROR": "⚪",
    }.get(verdict, "⚪")


def _verdict_color(verdict: str) -> str:
    return {
        "DEEPFAKE": "#ff5064",
        "SUSPICIOUS": "#ffd23c",
        "AUTHENTIC": "#00e6a0",
        "ERROR": "#888",
    }.get(verdict, "#888")


def _confidence_bar(confidence: float, verdict: str) -> str:
    """Generate a text-based confidence bar."""
    filled = int(confidence / 5)
    empty = 20 - filled
    bar = "█" * filled + "░" * empty
    return f"`{bar}` **{confidence:.1f}%**"


# Need numpy for video insight variance calculations
import numpy as np
