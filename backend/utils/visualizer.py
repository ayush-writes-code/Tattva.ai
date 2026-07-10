"""
Tattva.AI — Visualizer
Generates heatmaps and visual overlays for detection results.
Uses Error Level Analysis (ELA) as a lightweight, no-ML-required technique
to highlight potentially manipulated regions.
"""

import numpy as np
from PIL import Image, ImageChops, ImageEnhance, ImageFilter
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import io
import tempfile


def generate_ela_heatmap(image: Image.Image, quality: int = 90, scale: int = 15) -> Image.Image:
    """
    Generate an Error Level Analysis (ELA) heatmap overlay.
    
    ELA works by re-saving the image at a known quality level and then
    comparing the difference. Manipulated regions often show higher
    error levels than the rest of the image.

    Parameters
    ----------
    image : PIL.Image
        Input image.
    quality : int
        JPEG compression quality for re-save.
    scale : int
        Brightness multiplier for the difference image.

    Returns
    -------
    PIL.Image — the ELA heatmap overlay.
    """
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Save to buffer at specified quality
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    resaved = Image.open(buffer)

    # Compute pixel-wise difference
    diff = ImageChops.difference(image, resaved)

    # Enhance the difference to make artifacts visible
    extrema = diff.getextrema()
    max_diff = max([ex[1] for ex in extrema]) if extrema else 1
    if max_diff == 0:
        max_diff = 1

    # Scale up the difference
    enhancer = ImageEnhance.Brightness(diff)
    diff_enhanced = enhancer.enhance(scale)

    return diff_enhanced


def generate_heatmap_overlay(image: Image.Image, quality: int = 90) -> Image.Image:
    """
    Generate a colored heatmap overlaid on the original image.
    Red regions = higher error = potential manipulation.

    Returns
    -------
    PIL.Image — original image with colored heatmap overlay.
    """
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Get ELA image
    ela = generate_ela_heatmap(image, quality=quality, scale=20)

    # Convert to grayscale intensity map
    ela_gray = ela.convert("L")
    ela_array = np.array(ela_gray, dtype=np.float32)

    # Normalize to 0-1
    max_val = ela_array.max()
    if max_val > 0:
        ela_array = ela_array / max_val

    # Apply a slight blur for smoother heatmap
    ela_array_img = Image.fromarray((ela_array * 255).astype(np.uint8))
    ela_array_img = ela_array_img.filter(ImageFilter.GaussianBlur(radius=3))
    ela_array = np.array(ela_array_img, dtype=np.float32) / 255.0

    # Apply colormap (red = hot = manipulated)
    colored = cm.jet(ela_array)  # Returns RGBA float array
    colored_rgb = (colored[:, :, :3] * 255).astype(np.uint8)
    heatmap_img = Image.fromarray(colored_rgb)

    # Blend with original
    blended = Image.blend(image, heatmap_img, alpha=0.4)

    return blended


def generate_confidence_gauge(confidence: float, verdict: str) -> Image.Image:
    """
    Generate a visual confidence gauge using matplotlib.

    Returns
    -------
    PIL.Image — rendered gauge chart.
    """
    fig, ax = plt.subplots(figsize=(4, 2.5), subplot_kw={'projection': 'polar'})
    fig.patch.set_facecolor('#0f0f19')

    # Gauge settings
    colors_map = {
        "DEEPFAKE": "#ff5064",
        "SUSPICIOUS": "#ffd23c",
        "AUTHENTIC": "#00e6a0",
        "ERROR": "#666666",
    }
    color = colors_map.get(verdict, "#666666")

    # Draw gauge (half circle)
    theta = np.linspace(np.pi, 0, 100)
    radii = np.ones(100)

    # Background arc (grey)
    ax.barh(1, np.pi, height=0.5, left=0, color='#1a1a2e', edgecolor='none')

    # Foreground arc (colored by confidence)
    fill_angle = np.pi * (confidence / 100)
    ax.barh(1, fill_angle, height=0.5, left=np.pi - fill_angle,
            color=color, edgecolor='none', alpha=0.9)

    # Center text
    ax.text(np.pi / 2, 0.3, f"{confidence:.1f}%",
            ha='center', va='center', fontsize=20, fontweight='bold',
            color=color, family='monospace')

    ax.text(np.pi / 2, -0.2, verdict,
            ha='center', va='center', fontsize=10, fontweight='bold',
            color='white', family='monospace')

    # Clean up
    ax.set_ylim(0, 1.5)
    ax.set_thetamin(0)
    ax.set_thetamax(180)
    ax.set_rticks([])
    ax.set_thetagrids([])
    ax.spines['polar'].set_visible(False)
    ax.grid(False)

    # Render to PIL Image
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=100, bbox_inches='tight',
                facecolor='#0f0f19', edgecolor='none', transparent=False)
    plt.close(fig)
    buf.seek(0)
    gauge_img = Image.open(buf).convert("RGB")

    return gauge_img
