import io
import base64
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
from matplotlib import cm
from PIL import Image, ImageFilter

matplotlib.use('Agg')

def generate_noisemap_b64(pil_image: Image.Image) -> str:
    """Generate a noise variance map and return as base64 data URI."""
    img_array = np.array(pil_image, dtype=np.float64)
    blurred = pil_image.filter(ImageFilter.GaussianBlur(radius=5))
    blur_array = np.array(blurred, dtype=np.float64)
    noise = img_array - blur_array
    noise_gray = np.mean(np.abs(noise), axis=2)
    max_val = noise_gray.max()
    if max_val > 0:
        noise_gray = noise_gray / max_val
    colored = cm.inferno(noise_gray.astype(np.float32))
    colored_rgb = (colored[:, :, :3] * 255).astype(np.uint8)
    noise_img = Image.fromarray(colored_rgb).resize(pil_image.size)
    blended = Image.blend(pil_image, noise_img, alpha=0.55)
    buf = io.BytesIO()
    blended.save(buf, format="PNG")
    buf.seek(0)
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"


def generate_spectrogram_b64(audio_path: str) -> str:
    """Generate a mel-spectrogram for audio and return as base64 data URI."""
    import librosa
    y, sr = librosa.load(audio_path, sr=22050, mono=True, duration=30)
    S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
    S_dB = librosa.power_to_db(S, ref=np.max)
    fig, ax = plt.subplots(figsize=(12, 4), dpi=120)
    fig.patch.set_facecolor('#080A0F')
    ax.set_facecolor('#080A0F')
    img = librosa.display.specshow(S_dB, sr=sr, x_axis='time', y_axis='mel', fmax=8000, ax=ax, cmap='magma')
    ax.set_xlabel('Time (s)', color='#EDEDEA', fontsize=10)
    ax.set_ylabel('Frequency (Hz)', color='#EDEDEA', fontsize=10)
    ax.tick_params(colors='#4B5260', labelsize=8)
    for spine in ax.spines.values():
        spine.set_color('#1A1F2E')
    cbar = fig.colorbar(img, ax=ax, format='%+2.0f dB')
    cbar.ax.yaxis.set_tick_params(color='#4B5260')
    for label in cbar.ax.get_yticklabels():
        label.set_color('#4B5260')
    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', facecolor='#080A0F', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

def generate_linear_spectrogram_b64(audio_path: str) -> str:
    """Generate a linear-frequency spectrogram for audio and return as base64 data URI."""
    import librosa
    y, sr = librosa.load(audio_path, sr=22050, mono=True, duration=30)
    D = np.abs(librosa.stft(y))
    S_dB = librosa.amplitude_to_db(D, ref=np.max)
    fig, ax = plt.subplots(figsize=(12, 4), dpi=120)
    fig.patch.set_facecolor('#080A0F')
    ax.set_facecolor('#080A0F')
    img = librosa.display.specshow(S_dB, sr=sr, x_axis='time', y_axis='linear', ax=ax, cmap='viridis')
    ax.set_xlabel('Time (s)', color='#EDEDEA', fontsize=10)
    ax.set_ylabel('Frequency (Hz)', color='#EDEDEA', fontsize=10)
    ax.tick_params(colors='#4B5260', labelsize=8)
    for spine in ax.spines.values():
        spine.set_color('#1A1F2E')
    cbar = fig.colorbar(img, ax=ax, format='%+2.0f dB')
    cbar.ax.yaxis.set_tick_params(color='#4B5260')
    for label in cbar.ax.get_yticklabels():
        label.set_color('#4B5260')
    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', facecolor='#080A0F', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"


def generate_waveform_b64(audio_path: str) -> str:
    """Generate a waveform for audio and return as base64 data URI."""
    import librosa
    y, sr = librosa.load(audio_path, sr=22050, mono=True, duration=30)
    fig, ax = plt.subplots(figsize=(12, 3), dpi=120)
    fig.patch.set_facecolor('#080A0F')
    ax.set_facecolor('#080A0F')
    librosa.display.waveshow(y, sr=sr, ax=ax, color='#00F0FF', alpha=0.8)
    ax.set_xlabel('Time (s)', color='#EDEDEA', fontsize=10)
    ax.set_ylabel('Amplitude', color='#EDEDEA', fontsize=10)
    ax.tick_params(colors='#4B5260', labelsize=8)
    for spine in ax.spines.values():
        spine.set_color('#1A1F2E')
    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format='png', facecolor='#080A0F', edgecolor='none')
    plt.close(fig)
    buf.seek(0)
    return f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"
