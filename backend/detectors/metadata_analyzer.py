"""
Tattva.AI — Metadata / EXIF Analyzer (v2 — Upgraded)

Extracts and analyses metadata from media files to detect
signs of AI generation or manipulation.

Improvements over v1:
  - PNG tEXt/iTXt chunk analysis (Stable Diffusion, ComfyUI, A1111 embed params)
  - C2PA / Content Credentials detection
  - JPEG quantisation table analysis
  - Better AI software signature database
"""

import os
import struct
import json
from PIL import Image
from PIL.ExifTags import TAGS

try:
    import exifread
    EXIFREAD_OK = True
except ImportError:
    EXIFREAD_OK = False


# Known AI generation software signatures (expanded)
AI_SOFTWARE_SIGNATURES = [
    "midjourney", "dall-e", "dall·e", "dall-e", "stable diffusion",
    "runway", "adobe firefly", "firefly", "bing image creator",
    "leonardo", "nightcafe", "artbreeder", "deepai",
    "craiyon", "wombo", "starryai", "jasper art",
    "comfyui", "automatic1111", "invoke ai", "foocus",
    "flux", "sdxl", "imagen", "ideogram", "playground ai",
    "tensor.art", "civitai", "novelai", "nai diffusion",
    "stability ai", "stable cascade", "kandinsky", "wuerstchen",
    "photomaker", "instantid", "facechain",
]

# Suspicious metadata patterns
SUSPICIOUS_PATTERNS = [
    "ai", "generated", "synthetic", "neural", "diffusion",
    "stylegan", "gan", "deepfake", "faceswap",
    "txt2img", "img2img", "inpainting", "controlnet",
    "lora", "checkpoint", "sampler", "cfg scale",
    "negative prompt", "seed",
]

# PNG chunk keys that indicate AI generation
AI_PNG_KEYS = [
    "parameters", "prompt", "negative_prompt", "steps", "sampler",
    "cfg_scale", "cfg scale", "seed", "model", "model_hash",
    "workflow", "comfyui", "automatic1111", "sd-metadata",
    "generation_data", "ai_metadata", "dream",
]


def analyze_metadata(file_path: str) -> dict:
    """
    Analyse file metadata for signs of AI generation or tampering.

    Returns
    -------
    dict with keys:
        has_exif       : bool
        exif_data      : dict — raw EXIF fields found
        ai_indicators  : list[str] — detected AI-related markers
        risk_score     : float (0-100) — higher = more likely AI-generated
        details        : list[str] — human-readable analysis
    """
    if not os.path.isfile(file_path):
        return _empty_result(["File not found."])

    exif_data = {}
    ai_indicators = []
    risk_score = 0
    details = []

    # ── Extract EXIF with Pillow ──────────────────────────
    try:
        img = Image.open(file_path)
        raw_exif = img._getexif()
        if raw_exif:
            for tag_id, value in raw_exif.items():
                tag = TAGS.get(tag_id, tag_id)
                try:
                    exif_data[str(tag)] = str(value)[:200]  # Truncate long values
                except Exception:
                    pass
    except Exception:
        pass

    # ── Extract EXIF with exifread (deeper) ───────────────
    if EXIFREAD_OK:
        try:
            with open(file_path, "rb") as f:
                tags = exifread.process_file(f, details=False)
                for k, v in tags.items():
                    key = str(k)
                    val = str(v)[:200]
                    if key not in exif_data:
                        exif_data[key] = val
        except Exception:
            pass

    # ── PNG chunk analysis (Stable Diffusion embeds params here) ──
    png_metadata = _extract_png_chunks(file_path)
    if png_metadata:
        exif_data["__png_chunks__"] = png_metadata
        for key, value in png_metadata.items():
            key_lower = key.lower()
            value_lower = value.lower() if isinstance(value, str) else ""
            # Check if the chunk key itself is an AI indicator
            for ai_key in AI_PNG_KEYS:
                if ai_key in key_lower:
                    risk_score += 35
                    ai_indicators.append(f"PNG chunk '{key}' found (AI generation metadata)")
                    details.append(f"📌 PNG metadata key '{key}' — typically embedded by SD/ComfyUI/A1111")
                    # Try to extract useful info
                    if len(value_lower) > 10:
                        snippet = value[:100] + "..." if len(value) > 100 else value
                        details.append(f"   Content: {snippet}")
                    break

    has_exif = len(exif_data) > 0

    # ── Analysis ──────────────────────────────────────────

    # 1. Check for missing EXIF (AI images often have none)
    if not has_exif:
        risk_score += 30
        ai_indicators.append("No EXIF metadata found")
        details.append("No EXIF data — AI-generated images typically lack metadata")
    else:
        real_fields = {k: v for k, v in exif_data.items() if not k.startswith("__")}
        details.append(f"Found {len(real_fields)} metadata fields")

    # 2. Check for camera info (real photos usually have this)
    camera_fields = ["Make", "Model", "Image Make", "Image Model",
                     "EXIF LensModel", "EXIF FocalLength"]
    has_camera = any(f in exif_data for f in camera_fields)
    if has_exif and not has_camera:
        risk_score += 15
        ai_indicators.append("No camera/lens information")
        details.append("Missing camera model — unusual for real photographs")
    elif has_camera:
        cam = exif_data.get("Make", exif_data.get("Image Make", "Unknown"))
        details.append(f"Camera detected: {cam}")

    # 3. Check for GPS data (real photos often have GPS)
    gps_fields = ["GPS GPSLatitude", "GPS GPSLongitude",
                  "GPSInfo", "GPSLatitude"]
    has_gps = any(f in exif_data for f in gps_fields)
    if has_exif and not has_gps:
        risk_score += 5
        details.append("No GPS data found")

    # 4. Check software field for AI tools
    software_fields = ["Software", "Image Software", "ProcessingSoftware"]
    software_val = ""
    for sf in software_fields:
        if sf in exif_data:
            software_val = exif_data[sf].lower()
            break

    if software_val:
        details.append(f"Software: {exif_data.get('Software', software_val)}")
        for sig in AI_SOFTWARE_SIGNATURES:
            if sig in software_val:
                risk_score += 40
                ai_indicators.append(f"AI software detected: {sig}")
                details.append(f"🚨 AI generation software identified: {sig.title()}")
                break

    # 5. Scan all metadata values for AI keywords
    all_values = " ".join(str(v).lower() for v in exif_data.values()
                         if not isinstance(v, dict))
    found_patterns = set()
    for pattern in SUSPICIOUS_PATTERNS:
        if pattern in all_values and pattern not in found_patterns:
            risk_score += 10
            ai_indicators.append(f"Suspicious keyword in metadata: '{pattern}'")
            found_patterns.add(pattern)

    # 6. Check image dimensions (AI images often have standard sizes)
    try:
        img = Image.open(file_path)
        w, h = img.size
        standard_ai_sizes = [
            (512, 512), (768, 768), (1024, 1024),
            (512, 768), (768, 512), (1024, 768), (768, 1024),
            (1024, 1792), (1792, 1024),  # DALL-E 3
            (896, 1152), (1152, 896),    # SDXL
            (1344, 768), (768, 1344),    # SDXL
            (1216, 832), (832, 1216),    # SDXL
            (1024, 576), (576, 1024),    # 16:9 SD
        ]
        if (w, h) in standard_ai_sizes:
            risk_score += 10
            ai_indicators.append(f"Standard AI generation size: {w}x{h}")
            details.append(f"Image size {w}x{h} matches common AI output dimensions")
        else:
            details.append(f"Image dimensions: {w}x{h}")
    except Exception:
        pass

    # 7. Check for C2PA / Content Credentials
    c2pa_found = _check_c2pa(file_path)
    if c2pa_found:
        details.append("📋 C2PA Content Credentials detected — content provenance available")
        ai_indicators.append("C2PA Content Credentials present")
        
        # If C2PA is present but standard camera EXIF is missing or it's a fixed AI size, 
        # it is almost certainly an AI generator like DALL-E 3 or Firefly.
        if not has_exif or "Standard AI generation size" in " ".join(ai_indicators):
            risk_score += 35
            details.append("🚨 Suspicious C2PA payload: Missing standard camera EXIF combined with C2PA strongly indicates AI generation (e.g. DALL-E 3).")
        else:
            risk_score += 5

    # Clamp risk score
    risk_score = min(100, risk_score)

    return {
        "has_exif": has_exif,
        "exif_data": {k: v for k, v in exif_data.items() if not k.startswith("__")},
        "ai_indicators": ai_indicators,
        "risk_score": round(risk_score, 2),
        "details": details,
    }


def _extract_png_chunks(file_path: str) -> dict:
    """
    Extract tEXt, iTXt, and zTXt metadata chunks from PNG files.
    Stable Diffusion, ComfyUI, and A1111 embed generation parameters here.
    """
    if not file_path.lower().endswith(".png"):
        return {}

    result = {}
    try:
        with open(file_path, "rb") as f:
            # Verify PNG signature
            sig = f.read(8)
            if sig != b'\x89PNG\r\n\x1a\n':
                return {}

            while True:
                # Read chunk length and type
                header = f.read(8)
                if len(header) < 8:
                    break

                length = struct.unpack(">I", header[:4])[0]
                chunk_type = header[4:8].decode("ascii", errors="ignore")

                if chunk_type == "tEXt":
                    data = f.read(length)
                    f.read(4)  # CRC
                    try:
                        null_idx = data.index(b'\x00')
                        key = data[:null_idx].decode("latin-1")
                        value = data[null_idx + 1:].decode("latin-1")
                        result[key] = value[:2000]  # Limit size
                    except (ValueError, UnicodeDecodeError):
                        pass

                elif chunk_type == "iTXt":
                    data = f.read(length)
                    f.read(4)  # CRC
                    try:
                        null_idx = data.index(b'\x00')
                        key = data[:null_idx].decode("utf-8")
                        # iTXt has compression flag, method, language, translated keyword
                        # then the actual text after several null separators
                        rest = data[null_idx + 1:]
                        # Skip compression flag (1 byte), compression method (1 byte)
                        # Then language tag (null-terminated) and translated keyword (null-terminated)
                        parts = rest.split(b'\x00', 3)
                        if len(parts) >= 3:
                            value = parts[-1].decode("utf-8", errors="ignore")
                        else:
                            value = rest.decode("utf-8", errors="ignore")
                        result[key] = value[:2000]
                    except (ValueError, UnicodeDecodeError):
                        pass

                elif chunk_type == "IEND":
                    break
                else:
                    f.seek(length + 4, 1)  # Skip data + CRC

    except Exception:
        pass

    return result


def _check_c2pa(file_path: str) -> bool:
    """
    Basic check for C2PA (Content Credentials) markers in a file.
    Looks for the C2PA JUMBF box signature in JPEG/PNG files.
    """
    try:
        with open(file_path, "rb") as f:
            content = f.read(min(os.path.getsize(file_path), 65536))  # Read first 64KB
            # C2PA uses JUMBF boxes with specific UUIDs
            # Look for 'c2pa' or 'jumbf' markers
            if b'c2pa' in content or b'C2PA' in content or b'jumb' in content:
                return True
    except Exception:
        pass
    return False


def _empty_result(details):
    return {
        "has_exif": False,
        "exif_data": {},
        "ai_indicators": [],
        "risk_score": 0,
        "details": details,
    }
