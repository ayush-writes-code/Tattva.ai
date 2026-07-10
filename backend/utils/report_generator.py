"""
IntrusionX SE — Forensic PDF Report Generator
Generates professional, downloadable forensic reports summarizing
deepfake detection results using ReportLab.
"""
from __future__ import annotations

import os
import io
import uuid
import base64
import tempfile
from datetime import datetime, timezone
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm, inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image as RLImage, PageBreak, HRFlowable,
)
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Wedge
from reportlab.graphics import renderPDF
from PIL import Image

from detectors.image_detector import DEVICE


# ══════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs", "reports")

# Brand palette
BRAND_BG = colors.HexColor("#080A0F")
BRAND_SURFACE = colors.HexColor("#0D1117")
BRAND_BORDER = colors.HexColor("#1A1F2E")
BRAND_TEXT = colors.HexColor("#EDEDEA")
BRAND_MUTED = colors.HexColor("#4B5260")

VERDICT_COLORS = {
    "DEEPFAKE": colors.HexColor("#ef4444"),
    "SUSPICIOUS": colors.HexColor("#eab308"),
    "AUTHENTIC": colors.HexColor("#22c55e"),
    "ERROR": colors.HexColor("#888888"),
}


# ══════════════════════════════════════════════════════════════
#  STYLES
# ══════════════════════════════════════════════════════════════

def _get_styles():
    """Build custom paragraph styles for the report."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="ReportTitle",
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=30,
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=6,
        alignment=TA_LEFT,
    ))

    styles.add(ParagraphStyle(
        name="ReportSubtitle",
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4B5260"),
        spaceAfter=12,
        alignment=TA_LEFT,
    ))

    styles.add(ParagraphStyle(
        name="SectionHeader",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1a1a2e"),
        spaceBefore=18,
        spaceAfter=8,
        borderWidth=0,
    ))

    styles.add(ParagraphStyle(
        name="SubSection",
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#333333"),
        spaceBefore=10,
        spaceAfter=6,
    ))

    styles.add(ParagraphStyle(
        name="BodyMono",
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#333333"),
    ))

    styles.add(ParagraphStyle(
        name="CellText",
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#333333"),
    ))

    styles.add(ParagraphStyle(
        name="InsightText",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#444444"),
        leftIndent=12,
        spaceAfter=6,
    ))

    styles.add(ParagraphStyle(
        name="VerdictLarge",
        fontName="Helvetica-Bold",
        fontSize=28,
        leading=34,
        alignment=TA_CENTER,
        spaceAfter=4,
    ))

    styles.add(ParagraphStyle(
        name="ConfidenceLarge",
        fontName="Helvetica",
        fontSize=16,
        leading=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#333333"),
    ))

    styles.add(ParagraphStyle(
        name="Footer",
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#999999"),
        alignment=TA_CENTER,
    ))

    return styles


# ══════════════════════════════════════════════════════════════
#  HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════

def _b64_to_pil(data_uri: str) -> Optional[Image.Image]:
    """Convert a base64 data URI to a PIL Image."""
    try:
        if "," in data_uri:
            data_uri = data_uri.split(",", 1)[1]
        img_bytes = base64.b64decode(data_uri)
        return Image.open(io.BytesIO(img_bytes))
    except Exception:
        return None


def _pil_to_rl_image(pil_img: Image.Image, max_width: float = 220, max_height: float = 160) -> RLImage:
    """Convert a PIL Image to a ReportLab Image flowable, respecting max dimensions."""
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    buf.seek(0)

    w, h = pil_img.size
    aspect = w / h

    if w > max_width:
        w = max_width
        h = w / aspect
    if h > max_height:
        h = max_height
        w = h * aspect

    return RLImage(buf, width=w, height=h)


def _media_to_rl_image(media_path: str, max_width: float = 260, max_height: float = 180) -> Optional[RLImage]:
    """Load a media file as a ReportLab Image. Works for images; skips video/audio."""
    try:
        ext = os.path.splitext(media_path)[1].lower()
        if ext in (".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".gif"):
            pil = Image.open(media_path).convert("RGB")
            return _pil_to_rl_image(pil, max_width, max_height)
    except Exception:
        pass
    return None


def _severity_icon(severity: str) -> str:
    """Map severity to a unicode marker for the PDF."""
    return {
        "critical": "◉",
        "high": "▲",
        "medium": "●",
        "low": "○",
    }.get(severity, "●")


def _section_line():
    """Produce a horizontal rule."""
    return HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CCCCCC"),
                      spaceBefore=6, spaceAfter=6)


# ══════════════════════════════════════════════════════════════
#  MAIN GENERATOR
# ══════════════════════════════════════════════════════════════

def generate_pdf_report(
    result: dict,
    forensics: dict = None,
    media_path: str = None,
) -> str:
    """
    Generate a professional forensic PDF report.

    Parameters
    ----------
    result : dict
        The full detection response from /detect/auto.
    forensics : dict, optional
        The forensic visualizations from /detect/forensics.
    media_path : str, optional
        Path to the uploaded media file (for inline preview).

    Returns
    -------
    str — absolute path to the generated PDF file.
    """
    os.makedirs(REPORTS_DIR, exist_ok=True)

    report_id = uuid.uuid4().hex[:12].upper()
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    filename = f"IntrusionX_Report_{report_id}.pdf"
    filepath = os.path.join(REPORTS_DIR, filename)

    styles = _get_styles()
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        title=f"IntrusionX SE Forensic Report — {report_id}",
        author="IntrusionX SE",
    )

    elements = []

    # ── HEADER ────────────────────────────────────────────
    _build_header(elements, styles, report_id, timestamp)

    # ── VERDICT SUMMARY ──────────────────────────────────
    _build_verdict_summary(elements, styles, result)

    # ── FILE INFO ─────────────────────────────────────────
    _build_file_info(elements, styles, result, media_path)

    # ── AI INSIGHTS ───────────────────────────────────────
    ai_insights = result.get("details", {}).get("ai_insights")
    if ai_insights:
        _build_ai_insights(elements, styles, ai_insights)

    # ── FORENSIC VISUALIZATIONS ───────────────────────────
    if forensics:
        _build_forensic_visuals(elements, styles, forensics)

    # ── METADATA ANALYSIS ─────────────────────────────────
    metadata = result.get("details", {}).get("metadata")
    if metadata:
        _build_metadata_section(elements, styles, metadata)

    # ── DETECTION TELEMETRY ───────────────────────────────
    _build_telemetry(elements, styles, result)

    # ── SYSTEM FOOTER ─────────────────────────────────────
    _build_footer(elements, styles, report_id, timestamp)

    # ── BUILD PDF ─────────────────────────────────────────
    doc.build(elements)
    print(f"[ReportGen] PDF generated: {filepath}")
    return filepath


# ══════════════════════════════════════════════════════════════
#  SECTION BUILDERS
# ══════════════════════════════════════════════════════════════

def _build_header(elements, styles, report_id, timestamp):
    """Report title block."""
    elements.append(Paragraph("INTRUSIONX SE", styles["ReportTitle"]))
    elements.append(Paragraph(
        "AI-Powered Deepfake Detection — Forensic Analysis Report",
        styles["ReportSubtitle"],
    ))

    # Report metadata row
    meta_data = [
        [
            Paragraph(f"<b>Report ID:</b> {report_id}", styles["CellText"]),
            Paragraph(f"<b>Generated:</b> {timestamp}", styles["CellText"]),
            Paragraph(f"<b>Classification:</b> CONFIDENTIAL", styles["CellText"]),
        ]
    ]
    meta_table = Table(meta_data, colWidths=["33%", "34%", "33%"])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0f2f5")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 12))
    elements.append(_section_line())


def _build_verdict_summary(elements, styles, result):
    """Large verdict + confidence display."""
    verdict = result.get("verdict", "UNKNOWN")
    confidence = result.get("confidence", 0)
    media_type = result.get("media_type", "unknown")
    color = VERDICT_COLORS.get(verdict, VERDICT_COLORS["ERROR"])

    elements.append(Paragraph("DETECTION VERDICT", styles["SectionHeader"]))

    # Verdict card
    verdict_style = ParagraphStyle(
        "VerdictDynamic",
        parent=styles["VerdictLarge"],
        textColor=color,
    )
    elements.append(Paragraph(verdict, verdict_style))
    elements.append(Paragraph(f"Confidence: {confidence:.1f}%", styles["ConfidenceLarge"]))
    elements.append(Paragraph(
        f"Media Type: {media_type.upper()}",
        ParagraphStyle("MediaType", parent=styles["ConfidenceLarge"], fontSize=11, textColor=colors.HexColor("#666666")),
    ))
    elements.append(Spacer(1, 6))

    # Risk level from AI insights
    ai_insights = result.get("details", {}).get("ai_insights", {})
    if ai_insights:
        risk = ai_insights.get("risk_level", "—")
        anomaly = ai_insights.get("anomaly_score", 0)
        summary_data = [
            ["Risk Level", risk],
            ["Anomaly Score", f"{anomaly * 100:.0f}%"],
        ]
        summary_table = Table(summary_data, colWidths=[120, 120])
        summary_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#333333")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8f9fa")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#dddddd")),
        ]))
        elements.append(summary_table)

    elements.append(Spacer(1, 8))
    elements.append(_section_line())


def _build_file_info(elements, styles, result, media_path):
    """File information and optional media preview."""
    elements.append(Paragraph("FILE INFORMATION", styles["SectionHeader"]))

    file_info = result.get("file_info", {})
    rows = [
        ["Filename", file_info.get("filename", "N/A")],
        ["Content Type", file_info.get("content_type", result.get("media_type", "N/A"))],
    ]
    if file_info.get("size_bytes"):
        size_mb = file_info["size_bytes"] / (1024 * 1024)
        rows.append(["File Size", f"{size_mb:.2f} MB"])

    info_table = Table(rows, colWidths=[130, 340])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Courier"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#333333")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#eeeeee")),
    ]))
    elements.append(info_table)

    # Media preview
    if media_path:
        rl_img = _media_to_rl_image(media_path)
        if rl_img:
            elements.append(Spacer(1, 8))
            elements.append(Paragraph("<i>Uploaded Media Preview:</i>", styles["CellText"]))
            elements.append(Spacer(1, 4))
            elements.append(rl_img)

    elements.append(Spacer(1, 8))
    elements.append(_section_line())


def _build_ai_insights(elements, styles, ai_insights):
    """AI-generated insights section."""
    elements.append(Paragraph("AI-GENERATED INSIGHTS", styles["SectionHeader"]))

    # Summary
    summary = ai_insights.get("summary", "")
    if summary:
        elements.append(Paragraph(summary, styles["InsightText"]))
        elements.append(Spacer(1, 6))

    # Insight cards
    insights_list = ai_insights.get("ai_insights", [])
    if insights_list:
        rows = [["", "Category", "Severity", "Description"]]
        for ins in insights_list:
            icon = _severity_icon(ins.get("severity", "medium"))
            sev = ins.get("severity", "—").upper()
            rows.append([
                icon,
                ins.get("category", "—"),
                sev,
                Paragraph(ins.get("description", ""), styles["InsightText"]),
            ])

        t = Table(rows, colWidths=[20, 110, 60, 290])
        t.setStyle(TableStyle([
            # Header row
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            # Body
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (2, -1), 9),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#333333")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e0e0e0")),
        ]))
        elements.append(t)

    elements.append(Spacer(1, 8))
    elements.append(_section_line())


def _build_forensic_visuals(elements, styles, forensics):
    """Embed forensic visualizations (heatmap, noisemap, spectrogram, waveform)."""
    elements.append(Paragraph("FORENSIC VISUALIZATIONS", styles["SectionHeader"]))

    visual_map = [
        ("heatmap", "ELA Heatmap — Error Level Analysis",
         "Red regions indicate potential manipulation zones where compression error levels differ from surrounding areas."),
        ("noisemap", "Noise Variance Map",
         "Bright regions indicate sensor noise inconsistencies. Uniform noise suggests synthetic origin."),
        ("spectrogram", "Mel-Spectrogram — Frequency Analysis",
         "Visualizes audio frequency content over time. AI-generated audio often shows comb-like artifacts."),
        ("waveform", "Audio Waveform — Amplitude Analysis",
         "Displays amplitude patterns. AI audio tends to have unnaturally consistent energy levels."),
    ]

    has_any = False
    for key, title, desc in visual_map:
        b64_data = forensics.get(key)
        if not b64_data:
            continue
        has_any = True

        pil = _b64_to_pil(b64_data)
        if not pil:
            continue

        elements.append(Paragraph(f"<b>{title}</b>", styles["SubSection"]))
        elements.append(Paragraph(f"<i>{desc}</i>", styles["InsightText"]))
        elements.append(Spacer(1, 4))
        elements.append(_pil_to_rl_image(pil, max_width=460, max_height=220))
        elements.append(Spacer(1, 10))

    # Suspicious frames (video)
    sus_frames = forensics.get("suspicious_frames", [])
    if sus_frames:
        has_any = True
        elements.append(Paragraph(
            f"<b>Suspicious Frame Gallery</b> — {len(sus_frames)} frame(s) flagged",
            styles["SubSection"],
        ))
        for sf in sus_frames[:4]:  # Limit to 4 in PDF
            pil = _b64_to_pil(sf.get("image", ""))
            if not pil:
                continue
            verdict = sf.get("verdict", "UNKNOWN")
            conf = sf.get("confidence", 0)
            ts = sf.get("timestamp", 0)
            fidx = sf.get("frame_index", 0)

            elements.append(Paragraph(
                f"Frame #{fidx} at {ts:.1f}s — <b>{verdict}</b> ({conf:.1f}%)",
                styles["CellText"],
            ))
            elements.append(Spacer(1, 2))
            elements.append(_pil_to_rl_image(pil, max_width=300, max_height=170))
            elements.append(Spacer(1, 8))

    if not has_any:
        elements.append(Paragraph("<i>No forensic visualizations available for this media type.</i>", styles["CellText"]))

    elements.append(Spacer(1, 8))
    elements.append(_section_line())


def _build_metadata_section(elements, styles, metadata):
    """Metadata and EXIF analysis section."""
    elements.append(Paragraph("METADATA ANALYSIS", styles["SectionHeader"]))

    risk = metadata.get("risk_score", 0)
    indicators = metadata.get("ai_indicators", [])

    rows = [["Risk Score", f"{risk:.0f} / 100"]]
    if indicators:
        rows.append(["AI Indicators", f"{len(indicators)} detected"])

    meta_table = Table(rows, colWidths=[130, 340])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#333333")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#eeeeee")),
    ]))
    elements.append(meta_table)

    if indicators:
        elements.append(Spacer(1, 6))
        elements.append(Paragraph("<b>Detected Indicators:</b>", styles["CellText"]))
        for ind in indicators:
            elements.append(Paragraph(f"  ⚠ {ind}", styles["InsightText"]))

    elements.append(Spacer(1, 8))
    elements.append(_section_line())


def _build_telemetry(elements, styles, result):
    """Detection telemetry — raw analysis strings."""
    elements.append(Paragraph("DETECTION TELEMETRY", styles["SectionHeader"]))

    # Detection details
    details = result.get("details", {})
    detection = details.get("detection", {})
    analysis = details.get("analysis") or detection.get("analysis", [])

    if analysis:
        for line in analysis:
            # Strip markdown bold markers for PDF
            clean = line.replace("**", "").replace("🔬", "▸").replace("👤", "▸").replace("🖼️", "▸")
            clean = clean.replace("🔴", "●").replace("🟢", "●").replace("🟡", "●").replace("📊", "▸")
            clean = clean.replace("✅", "✓").replace("⚠️", "⚠").replace("", "")
            if clean.strip():
                elements.append(Paragraph(clean, styles["BodyMono"]))

    # Model info
    models = detection.get("models_used", [])
    if models:
        elements.append(Spacer(1, 8))
        elements.append(Paragraph("<b>Models Used:</b>", styles["CellText"]))
        for m in models:
            elements.append(Paragraph(f"  • {m}", styles["InsightText"]))

    # Probabilities
    probs = detection.get("probs") or details.get("probs", {})
    if probs:
        elements.append(Spacer(1, 8))
        elements.append(Paragraph("<b>Model Probabilities:</b>", styles["CellText"]))
        prob_rows = [["Label", "Score"]]
        for k, v in probs.items():
            if isinstance(v, (int, float)):
                prob_rows.append([k, f"{v:.2f}%"])
            else:
                prob_rows.append([k, str(v)])

        prob_table = Table(prob_rows, colWidths=[280, 80])
        prob_table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 1), (-1, -1), "Courier"),
            ("FONTSIZE", (0, 1), (-1, -1), 8),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#333333")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e0e0e0")),
        ]))
        elements.append(prob_table)

    elements.append(Spacer(1, 8))
    elements.append(_section_line())


def _build_footer(elements, styles, report_id, timestamp):
    """Report footer with disclaimers and system info."""
    elements.append(Spacer(1, 20))

    footer_text = (
        f"IntrusionX SE — AI-Powered Deepfake Detection System  |  "
        f"Report ID: {report_id}  |  Generated: {timestamp}<br/><br/>"
        f"<b>System:</b> Dual-Model Ensemble (ViT + Swin Transformer) + Wav2Vec2-XLSR + ELA + Metadata Forensics<br/>"
        f"<b>Environment:</b> {DEVICE.upper()} Acceleration | Python 3.9 | FastAPI + Uvicorn<br/><br/>"
        f"<b>DISCLAIMER:</b> This report is generated by an automated AI system and should be used as "
        f"a forensic aid only. Results are probabilistic and should not be treated as definitive proof. "
        f"Always cross-reference with manual analysis and domain expertise."
    )

    elements.append(Paragraph(footer_text, styles["Footer"]))
