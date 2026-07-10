import sys

filepath = 'api.py'

with open(filepath, 'r') as f:
    content = f.read()

# Replace block synchronous calls
content = content.replace("result = detect_image(pil_image)", "result = await run_async(detect_image, pil_image)")
content = content.replace("det_result = detect_image(pil_image)", "det_result = await run_async(detect_image, pil_image)")

content = content.replace("result = detect_video(temp_path)", "result = await run_async(detect_video, temp_path)")
content = content.replace("det_result = detect_video(temp_path)", "det_result = await run_async(detect_video, temp_path)")
content = content.replace("video_result = detect_video(temp_path)", "video_result = await run_async(detect_video, temp_path)")

content = content.replace("result = detect_audio(temp_path)", "result = await run_async(detect_audio, temp_path)")
content = content.replace("det_result = detect_audio(temp_path)", "det_result = await run_async(detect_audio, temp_path)")

content = content.replace("metadata = analyze_metadata(temp_path)", "metadata = await run_async(analyze_metadata, temp_path)")
content = content.replace("result = analyze_metadata(temp_path)", "result = await run_async(analyze_metadata, temp_path)")

# Now deduplicate forensics code using the new forensics module
import re

content = content.replace("from utils.forensics import generate_noisemap_b64, generate_spectrogram_b64, generate_waveform_b64", "")

# Add imports for new forensics at the top of the file
import_stmt = "from utils.forensics import generate_noisemap_b64, generate_spectrogram_b64, generate_waveform_b64\n"
content = content.replace("from PIL import Image, ImageFilter\n", "from PIL import Image, ImageFilter\n" + import_stmt)

with open(filepath, 'w') as f:
    f.write(content)

print("Refactored!")
