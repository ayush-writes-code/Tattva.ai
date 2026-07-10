import sys

filepath = 'api.py'

with open(filepath, 'r') as f:
    content = f.read()

# Refactor `/detect/spectrogram`
spectrogram_old = '''        import librosa

        y, sr = librosa.load(temp_path, sr=22050, mono=True, duration=30)

        # Compute Mel-Spectrogram
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
        S_dB = librosa.power_to_db(S, ref=np.max)

        # Create the plot
        fig, ax = plt.subplots(figsize=(12, 4), dpi=120)
        fig.patch.set_facecolor('#080A0F')
        ax.set_facecolor('#080A0F')

        img = librosa.display.specshow(
            S_dB, sr=sr, x_axis='time', y_axis='mel',
            fmax=8000, ax=ax, cmap='magma'
        )

        ax.set_xlabel('Time (s)', color='#EDEDEA', fontsize=10)
        ax.set_ylabel('Frequency (Hz)', color='#EDEDEA', fontsize=10)
        ax.tick_params(colors='#4B5260', labelsize=8)

        for spine in ax.spines.values():
            spine.set_color('#1A1F2E')

        cbar = fig.colorbar(img, ax=ax, format='%+2.0f dB')
        cbar.ax.yaxis.set_tick_params(color='#4B5260')
        cbar.ax.yaxis.label.set_color('#EDEDEA')
        for label in cbar.ax.get_yticklabels():
            label.set_color('#4B5260')

        plt.tight_layout()

        buf = io.BytesIO()
        fig.savefig(buf, format='png', facecolor='#080A0F', edgecolor='none')
        plt.close(fig)
        buf.seek(0)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return JSONResponse(content={
            "spectrogram": f"data:image/png;base64,{b64}",'''

spectrogram_new = '''        from utils.forensics import generate_spectrogram_b64
        b64_uri = generate_spectrogram_b64(temp_path)

        return JSONResponse(content={
            "spectrogram": b64_uri,'''

content = content.replace(spectrogram_old, spectrogram_new)


# Refactor `/detect/full` Image part
full_img_old = '''            img_array = np.array(pil_image, dtype=np.float64)
            blurred = pil_image.filter(ImageFilter.GaussianBlur(radius=5))
            noise = img_array - np.array(blurred, dtype=np.float64)
            noise_gray = np.mean(np.abs(noise), axis=2)
            max_val = noise_gray.max() if noise_gray.max() > 0 else 1
            colored = cm.inferno((noise_gray / max_val).astype(np.float32))
            noise_img = Image.fromarray((colored[:, :, :3] * 255).astype(np.uint8)).resize(pil_image.size)
            blended = Image.blend(pil_image, noise_img, alpha=0.55)
            buf2 = io.BytesIO()
            blended.save(buf2, format="PNG")
            buf2.seek(0)
            forensics_data["noisemap"] = f"data:image/png;base64,{base64.b64encode(buf2.getvalue()).decode('utf-8')}"'''

full_img_new = '''            from utils.forensics import generate_noisemap_b64
            forensics_data["noisemap"] = generate_noisemap_b64(pil_image)'''

content = content.replace(full_img_old, full_img_new)


# Refactor `/detect/full` Audio part
full_audio_old = '''            import librosa
            y, sr = librosa.load(temp_path, sr=22050, mono=True, duration=30)
            S_dB = librosa.power_to_db(librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000), ref=np.max)
            fig, ax = plt.subplots(figsize=(12, 4), dpi=120)
            fig.patch.set_facecolor('#080A0F')
            ax.set_facecolor('#080A0F')
            img = librosa.display.specshow(S_dB, sr=sr, x_axis='time', y_axis='mel', fmax=8000, ax=ax, cmap='magma')
            plt.tight_layout()
            buf = io.BytesIO()
            fig.savefig(buf, format='png', facecolor='#080A0F', edgecolor='none')
            plt.close(fig)
            buf.seek(0)
            forensics_data["spectrogram"] = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"'''

full_audio_new = '''            from utils.forensics import generate_spectrogram_b64
            forensics_data["spectrogram"] = generate_spectrogram_b64(temp_path)'''

content = content.replace(full_audio_old, full_audio_new)

# Refactor `/detect/forensics` Audio part 1
forensics_audio_old_1 = '''            import librosa

            y, sr = librosa.load(temp_path, sr=22050, mono=True, duration=30)

            # 1. Mel-Spectrogram
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
            result["spectrogram"] = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"'''

forensics_audio_new_1 = '''            from utils.forensics import generate_spectrogram_b64
            result["spectrogram"] = generate_spectrogram_b64(temp_path)'''

content = content.replace(forensics_audio_old_1, forensics_audio_new_1)

# Refactor `/detect/forensics` Audio part 2 (waveform)
forensics_audio_old_2 = '''            # 2. Waveform
            fig2, ax2 = plt.subplots(figsize=(12, 3), dpi=120)
            fig2.patch.set_facecolor('#080A0F')
            ax2.set_facecolor('#080A0F')
            times = np.linspace(0, len(y) / sr, num=len(y))
            ax2.plot(times, y, color='#EDEDEA', linewidth=0.3, alpha=0.7)
            ax2.fill_between(times, y, alpha=0.15, color='#EDEDEA')
            ax2.set_xlabel('Time (s)', color='#EDEDEA', fontsize=10)
            ax2.set_ylabel('Amplitude', color='#EDEDEA', fontsize=10)
            ax2.tick_params(colors='#4B5260', labelsize=8)
            for spine in ax2.spines.values():
                spine.set_color('#1A1F2E')
            ax2.set_xlim(0, len(y) / sr)
            plt.tight_layout()
            buf2 = io.BytesIO()
            fig2.savefig(buf2, format='png', facecolor='#080A0F', edgecolor='none')
            plt.close(fig2)
            buf2.seek(0)
            result["waveform"] = f"data:image/png;base64,{base64.b64encode(buf2.getvalue()).decode('utf-8')}"'''

forensics_audio_new_2 = '''            from utils.forensics import generate_waveform_b64
            result["waveform"] = generate_waveform_b64(temp_path)'''

content = content.replace(forensics_audio_old_2, forensics_audio_new_2)

# Refactor `/detect/forensics` Image part
forensics_img_old = '''            # 2. Noise Variance Map
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
            result["noisemap"] = f"data:image/png;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"'''

forensics_img_new = '''            from utils.forensics import generate_noisemap_b64
            result["noisemap"] = generate_noisemap_b64(pil_image)'''

content = content.replace(forensics_img_old, forensics_img_new)


# Refactor `/generate-report` Image part
report_img_old = '''            # Noise map
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
            buf2 = io.BytesIO()
            blended.save(buf2, format="PNG")
            buf2.seek(0)
            forensics["noisemap"] = f"data:image/png;base64,{base64.b64encode(buf2.getvalue()).decode('utf-8')}"'''

report_img_new = '''            from utils.forensics import generate_noisemap_b64
            forensics["noisemap"] = generate_noisemap_b64(pil_image)'''

content = content.replace(report_img_old, report_img_new)

with open(filepath, 'w') as f:
    f.write(content)

print("Refactored forensics!")
