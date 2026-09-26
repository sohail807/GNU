import os
import shutil
from PIL import Image, ImageDraw, ImageFont

SRC_DIR = os.path.abspath(r"reports/live_browser_test")
OUT_DIR = os.path.abspath(r"reports/visual_uat_manual/screenshots")
os.makedirs(OUT_DIR, exist_ok=True)

# Load font if available or fallback
try:
    font_bold = ImageFont.truetype("arialbd.ttf", 16)
    font_badge = ImageFont.truetype("arialbd.ttf", 18)
    font_title = ImageFont.truetype("arialbd.ttf", 20)
except Exception:
    font_bold = font_badge = font_title = ImageFont.load_default()

def annotate_image(src_path, dest_path, callouts, title_banner=None, crop_box=None):
    """
    src_path: input image path
    dest_path: output image path
    callouts: list of dicts:
       [{"box": (x1, y1, x2, y2), "badge": "1", "label": "Click Here"}]
    title_banner: top banner text describing the screen
    crop_box: (left, upper, right, lower) to crop or None
    """
    if not os.path.exists(src_path):
        print(f"Warning: {src_path} does not exist!")
        return False
        
    im = Image.open(src_path).convert("RGBA")
    
    if crop_box:
        im = im.crop(crop_box)
        
    draw = ImageDraw.Draw(im)
    w, h = im.size
    
    # Optional Top Title Banner
    if title_banner:
        banner_h = 36
        draw.rectangle([0, 0, w, banner_h], fill=(27, 54, 93, 240)) # #1B365D navy
        draw.text((15, 8), title_banner, fill=(255, 255, 255, 255), font=font_title)
        
    for c in callouts:
        box = c.get("box")
        badge = c.get("badge")
        label = c.get("label")
        color = c.get("color", (230, 57, 70, 255)) # #E63946 red
        
        if box:
            # Draw prominent rectangle
            x1, y1, x2, y2 = box
            for i in range(4):
                draw.rectangle([x1 - i, y1 - i, x2 + i, y2 + i], outline=color)
                
            # Draw badge circle
            if badge:
                bx, by = x1 - 14, y1 - 14
                r = 16
                draw.ellipse([bx - r, by - r, bx + r, by + r], fill=color, outline=(255, 255, 255, 255), width=2)
                # Center text in badge
                draw.text((bx - 5, by - 10), str(badge), fill=(255, 255, 255, 255), font=font_badge)
                
            # Draw label box
            if label:
                lx = x1
                ly = max(40, y1 - 28)
                label_w = len(label) * 9 + 16
                draw.rectangle([lx, ly, lx + label_w, ly + 24], fill=(27, 54, 93, 230), outline=color, width=1)
                draw.text((lx + 8, ly + 4), label, fill=(255, 255, 255, 255), font=font_bold)
                
    im.convert("RGB").save(dest_path, "PNG")
    return True

print("Script template ready.")
