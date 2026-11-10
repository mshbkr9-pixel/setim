# -*- coding: utf-8 -*-
"""v11: app icon (three options), maskable icon and iPhone launch screens.
   Run:  python make_icons.py [a|b|c]     (default a; writes the chosen option as the live icon)
   Options are always written to icons/options/ so they can be compared side by side."""
import math, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

A, B, BG, INK, TRACK = (255, 107, 74), (255, 179, 71), (11, 12, 16), (243, 244, 248), (38, 42, 54)
FONT = next((p for p in (r'C:\Windows\Fonts\arialbd.ttf', r'C:\Windows\Fonts\segoeuib.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf') if os.path.exists(p)), None)

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def glow(im, cx, cy, r, col, alpha):
    g = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(g).ellipse([cx - r, cy - r, cx + r, cy + r], fill=col + (alpha,))
    return Image.alpha_composite(im, g.filter(ImageFilter.GaussianBlur(r * 0.45)))

def mark_a(d, c_x, c_y, n):          # progress ring with the first letter of the name
    R, W = n * 0.30, n * 0.085
    box = [c_x - R, c_y - R, c_x + R, c_y + R]
    d.arc(box, 0, 360, fill=TRACK + (255,), width=int(W))
    steps, a0, span = 200, -90, 270
    for i in range(steps):
        d.arc(box, a0 + span * i / steps, a0 + span * (i + 1) / steps + 0.9, fill=lerp(A, B, i / (steps - 1)) + (255,), width=int(W))
    for ang, col in ((a0, A), (a0 + span, B)):
        x = c_x + (R - W / 2) * math.cos(math.radians(ang)); y = c_y + (R - W / 2) * math.sin(math.radians(ang))
        d.ellipse([x - W / 2, y - W / 2, x + W / 2, y + W / 2], fill=col + (255,))
    if FONT:
        f = ImageFont.truetype(FONT, int(n * 0.30)); bb = d.textbbox((0, 0), 'ס', font=f)
        d.text((c_x - (bb[0] + bb[2]) / 2, c_y - (bb[1] + bb[3]) / 2), 'ס', font=f, fill=INK + (255,))

def mark_b(d, c_x, c_y, n):          # three sets, growing
    bw, gap, base = n * 0.13, n * 0.06, c_y + n * 0.20
    x0 = c_x + (3 * bw + 2 * gap) / 2 - bw
    for i, hh in enumerate((0.20, 0.31, 0.42)):
        x = x0 - i * (bw + gap)
        d.rounded_rectangle([x, base - n * hh, x + bw, base], radius=bw * 0.38, fill=lerp(A, B, i / 2) + (255,))
    d.rounded_rectangle([c_x - n * 0.27, base + n * 0.04, c_x + n * 0.27, base + n * 0.065], radius=n * 0.013, fill=INK + (255,))

def mark_c(d, c_x, c_y, n):          # a clean dumbbell
    d.rounded_rectangle([c_x - n * 0.30, c_y - n * 0.028, c_x + n * 0.30, c_y + n * 0.028], radius=n * 0.028, fill=INK + (255,))
    for sx in (-1, 1):
        for j, (off, hh, ww) in enumerate(((0.165, 0.30, 0.085), (0.262, 0.20, 0.065))):
            x = c_x + sx * n * off
            d.rounded_rectangle([x - n * ww / 2, c_y - n * hh / 2, x + n * ww / 2, c_y + n * hh / 2], radius=n * ww * 0.36, fill=lerp(A, B, j) + (255,))

MARKS = {'a': mark_a, 'b': mark_b, 'c': mark_c}

def icon(size, which, scale=1.0, k=4):
    n = size * k; im = Image.new('RGBA', (n, n), BG + (255,))
    im = glow(im, n * 0.80, n * 0.18, n * 0.42, A, 64)
    MARKS[which](ImageDraw.Draw(im), n / 2, n / 2, n * scale)
    return im.resize((size, size), Image.LANCZOS)

def splash(w, h, which):
    k = 2; im = Image.new('RGBA', (w * k, h * k), BG + (255,))
    im = glow(im, w * k * 0.85, h * k * 0.10, w * k * 0.55, A, 46)
    MARKS[which](ImageDraw.Draw(im), w * k / 2, h * k * 0.46, w * k * 0.62)
    return im.resize((w, h), Image.LANCZOS).convert('RGB')

SPLASH = [(1320, 2868), (1290, 2796), (1284, 2778), (1242, 2688), (1206, 2622), (1179, 2556), (1170, 2532), (1125, 2436), (828, 1792), (750, 1334)]

if __name__ == '__main__':
    pick = (sys.argv[1] if len(sys.argv) > 1 else 'a').lower()
    os.makedirs('icons/options', exist_ok=True); os.makedirs('icons/splash', exist_ok=True)
    for w in 'abc': icon(512, w).save('icons/options/icon-%s.png' % w, optimize=True)
    for sz in (180, 192, 512): icon(sz, pick).save('icons/icon-%d.png' % sz, optimize=True)
    icon(512, pick, scale=0.74).save('icons/icon-maskable-512.png', optimize=True)
    for w, h in SPLASH: splash(w, h, pick).save('icons/splash/splash-%dx%d.png' % (w, h), optimize=True)
    print('icons written, live option:', pick)
