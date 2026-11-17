#!/usr/bin/env python3
"""Zoom helper for reading source photos.

Usage:
  python3 -I tile.py NN x0 y0 x1 y1 [cols] [rows] [scale] [outdir]

NN        photo number 1..76  (file photos/photo-NN.jpg, 1157x1536 px)
x0 y0 x1 y1   region of the ORIGINAL photo in pixels
cols rows     split the region into cols x rows overlapping tiles (default 2 2)
scale         upscale factor (default 2.5)
outdir        where PNG tiles are written (default crops/)

Prints the path of every tile written. Tiles overlap by ~12% so no line is cut.
"""
import sys, os
from PIL import Image, ImageOps, ImageFilter
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def main():
    a = sys.argv[1:]
    if len(a) < 5:
        print(__doc__); sys.exit(1)
    nn = int(a[0]); x0, y0, x1, y1 = [int(float(v)) for v in a[1:5]]
    cols = int(a[5]) if len(a) > 5 else 2
    rows = int(a[6]) if len(a) > 6 else 2
    scale = float(a[7]) if len(a) > 7 else 2.5
    outdir = a[8] if len(a) > 8 else os.path.join(BASE, 'crops')
    os.makedirs(outdir, exist_ok=True)
    im = Image.open(os.path.join(BASE, 'photos', f'photo-{nn:02d}.jpg')).convert('RGB')
    W, H = im.size
    x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    tw, th = (x1 - x0) / cols, (y1 - y0) / rows
    ox, oy = tw * 0.12, th * 0.12
    for r in range(rows):
        for c in range(cols):
            bx0 = max(x0, int(x0 + c * tw - ox)); by0 = max(y0, int(y0 + r * th - oy))
            bx1 = min(x1, int(x0 + (c + 1) * tw + ox)); by1 = min(y1, int(y0 + (r + 1) * th + oy))
            t = im.crop((bx0, by0, bx1, by1))
            t = t.resize((int(t.width * scale), int(t.height * scale)), Image.LANCZOS)
            t = ImageOps.autocontrast(t, cutoff=1)
            t = t.filter(ImageFilter.UnsharpMask(radius=2, percent=80, threshold=2))
            # keep the long edge <= 1560 px so the viewer does not downscale it
            m = max(t.size)
            if m > 1560:
                f = 1560 / m; t = t.resize((int(t.width * f), int(t.height * f)), Image.LANCZOS)
            p = os.path.join(outdir, f'p{nn:02d}_{x0}-{y0}-{x1}-{y1}_r{r}c{c}.png')
            t.save(p); print(p, t.size, f'src=({bx0},{by0},{bx1},{by1})')
if __name__ == '__main__':
    main()
