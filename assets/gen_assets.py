#!/usr/bin/env python3
"""Generate HazardHub STL assets. uv run --with pillow python assets/gen_assets.py
Design: a road surface with a dark pothole and an orange location pin over it."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.dirname(os.path.abspath(__file__))
BG = (21, 32, 43)        # #15202B
ROAD = (48, 60, 74)
HOLE = (10, 15, 22)
ACCENT = (242, 163, 60)  # #F2A33C
TEXT = (241, 246, 251)


def font(sz):
    for p in ['/System/Library/Fonts/SFNSRounded.ttf', '/System/Library/Fonts/Helvetica.ttc']:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, sz)
            except Exception:
                pass
    return ImageFont.load_default()


def icon(S, adaptive=False):
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if not adaptive:
        d.rounded_rectangle([0, 0, S, S], radius=int(S * 0.22), fill=BG)
    pad = S * (0.30 if adaptive else 0.24)
    # road band
    d.rounded_rectangle([pad, S*0.5, S-pad, S*0.78], radius=int(S*0.03), fill=ROAD)
    # dashed center line
    y = S*0.64
    x = pad + S*0.03
    while x < S - pad - S*0.06:
        d.rectangle([x, y-S*0.008, x+S*0.05, y+S*0.008], fill=(230,230,230))
        x += S*0.11
    # pothole (irregular dark blob)
    cx, cy, rr = S*0.44, S*0.66, S*0.07
    d.ellipse([cx-rr, cy-rr*0.8, cx+rr, cy+rr*0.8], fill=HOLE)
    # location pin above
    px, py, pr = S*0.56, S*0.40, S*0.1
    d.ellipse([px-pr, py-pr, px+pr, py+pr], fill=ACCENT)
    d.polygon([(px-pr*0.6, py+pr*0.4), (px+pr*0.6, py+pr*0.4), (px, py+pr*1.6)], fill=ACCENT)
    d.ellipse([px-pr*0.38, py-pr*0.38, px+pr*0.38, py+pr*0.38], fill=BG)
    return img


def splash(W=1284, H=2778):
    img = Image.new('RGBA', (W, H), BG)
    d = ImageDraw.Draw(img)
    S = int(min(W, H)*0.42)
    img.alpha_composite(icon(S), ((W-S)//2, int(H*0.33)))
    f = font(int(S*0.2)); t = 'HazardHub'
    b = d.textbbox((0,0), t, font=f)
    d.text(((W-(b[2]-b[0]))//2, int(H*0.33)+S+int(S*0.1)), t, font=f, fill=TEXT)
    fs = font(int(S*0.09)); s = 'Report a road hazard in St. Louis'
    bs = d.textbbox((0,0), s, font=fs)
    d.text(((W-(bs[2]-bs[0]))//2, int(H*0.33)+S+int(S*0.36)), s, font=fs, fill=ACCENT)
    return img


icon(1024).save(os.path.join(OUT, 'icon.png'))
icon(1024, adaptive=True).save(os.path.join(OUT, 'adaptive-icon.png'))
icon(48).save(os.path.join(OUT, 'favicon.png'))
splash().save(os.path.join(OUT, 'splash.png'))
print('Wrote icon.png, adaptive-icon.png, favicon.png, splash.png')
