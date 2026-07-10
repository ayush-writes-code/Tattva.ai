from PIL import Image
from detectors.image_detector import detect_image
import json

img = Image.open('test.jpg')
res = detect_image(img)
print(json.dumps(res, indent=2))
