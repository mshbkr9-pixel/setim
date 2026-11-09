# -*- coding: utf-8 -*-
"""Assemble the explainer video: 1920x1080, 30 fps, Hebrew narration (ElevenLabs), burned-in Hebrew subtitles
(timed from the narration's character alignment), phone mockups from video/out/shots, numbered callouts on the
controls the narration explains, a soft music bed, cross-fades. Output: video/out/setim-explainer.mp4 + .srt
Run after tts.py and capture.py:  python video/make_video.py"""
import os, io, json, math, wave, struct, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from bidi.algorithm import get_display
import imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out'); SHOTS = os.path.join(OUT, 'shots')
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1920, 1080, 30
SR = 44100

# ---------- palette (the app's own) ----------
BG, BG2, CARD, CARD2 = (11, 12, 16), (16, 18, 25), (21, 23, 30), (30, 33, 43)
INK, INK2, INK3 = (243, 244, 248), (162, 167, 184), (94, 100, 118)
ACC, ACC2, GOOD = (255, 107, 74), (255, 179, 71), (74, 222, 128)

FONTS = r'C:\Windows\Fonts'
def font(name, size): return ImageFont.truetype(os.path.join(FONTS, name), size)
F_TITLE = font('davidbd.ttf', 78); F_TITLE_S = font('davidbd.ttf', 60); F_WORD = font('davidbd.ttf', 150)
F_BODY = font('segoeui.ttf', 36); F_BODY_B = font('segoeuib.ttf', 36); F_SMALL = font('segoeui.ttf', 30)
F_SUB = font('segoeuib.ttf', 42); F_BADGE = font('segoeuib.ttf', 30); F_URL = font('segoeuib.ttf', 44)

def rtl(s): return get_display(s)

def wrap(text, fnt, max_w):
    words = text.split(' '); lines = []; cur = ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if fnt.getlength(t) <= max_w or not cur: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

# ---------- inputs ----------
narr = json.load(io.open(os.path.join(OUT, 'narration.json'), encoding='utf-8'))
CLIPS = {c['id']: c for c in narr['clips']}
meta = json.load(io.open(os.path.join(SHOTS, 'shots.json'), encoding='utf-8'))
VW, VH = meta['viewport']; DPR = meta['dpr']

# ---------- scenes ----------
LEAD, TAIL = 0.45, 0.55
SCENES = [
 dict(id='intro', shot='home', title='סטים', kicker=None, lines=[], callouts=[], wordmark=True,
      sub='האפליקציה שסופרת בשבילך את האימון', extra=[(7.5, 'לחדר כושר, לבית ולפארק'), (11.5, 'זוכרת מה הרמת בפעם הקודמת, ועוזרת להשתפר')]),
 dict(id='nav', shot='home', title='שלושה כפתורים. זהו.', lines=['היום: מה עושים עכשיו', 'יומן: מה כבר עשית', 'עוד: כל השאר, מסודר בקופסאות'],
      callouts=[('tabs', 0), ('tabs', 1), ('tabs', 2)]),
 dict(id='today', shot='home', title='הלשונית "היום"', lines=['ימי השבוע: לחיצה על יום מראה את התוכנית שלו', 'הטבעת: כמה תרגילים כבר סיימת היום', 'התחל אימון: סטופר ומעבר מודרך בין תרגילים'],
      callouts=[('strip', 0), ('ring', 0), ('gobar', 0)]),
 dict(id='list', shot='home2', title='כל שורה היא תרגיל', lines=['לחיצה על תרגיל: רושמים משקל וחזרות', 'שלוש נקודות: שם ליום, סוג אימון, סידור והסרה', 'פלוס: מוסיפים תרגיל לרשימה'],
      callouts=[('items', 1), ('dots', 0), ('plus', 0)]),
 dict(id='exercise', shot='exercise', title='דף התרגיל', lines=['פלוס ומינוס: משקל וחזרות (לחיצה ארוכה רצה מהר)', 'וי ירוק: הסט בוצע וטיימר המנוחה נדלק', 'פעם שעברה: הכול כבר ממולא, רק מעלים'],
      callouts=[('stp', 0), ('chk', 0), ('sets', 0, 'top')]),
 dict(id='workout', shot='workout', title='מצב אימון', lines=['סטופר: רץ מההתחלה ועד הסיום', 'השהיה וסיום: שני כפתורים, לא יותר', 'רצועת התרגילים: מעבר אוטומטי לתרגיל הבא'],
      callouts=[('tm', 0), ('ctl', 'all'), ('strip', 0)]),
 dict(id='journal', shot='journal', title='היומן', lines=['כרטיס הסיכום: לחיצה פותחת גרפים ושיאים', 'לוח השנה: ירוק = אימון שבוצע, לחיצה על יום פותחת אותו', 'כל אימון: כל תרגיל וכל סט, לפי תאריך'],
      callouts=[('jstats', 0), ('cal', 0), ('jdate', 0)]),
 dict(id='more', shot='more', title='"עוד": הכול בקופסאות', lines=['תרגילים: 713 תרגילים עם הדגמות מונפשות', 'תוכניות: ממלאות את כל השבוע בלחיצה אחת', 'המכון שלי: המכשירים שיש לך', 'מדריכים: איך בונים אימון, תזונה', 'קלוריות: לפי משקל, גובה וגיל', 'הגדרות: טיימר, מראה, גיבוי'],
      callouts=[('boxes', i) for i in range(6)], small=True),
 dict(id='outro', shot='journal', title='פשוט. מסודר. זוכר הכול.', lines=[], callouts=[], wordmark=True, url='getonekeyai.com', tail=1.6),
]

# ---------- timeline ----------
t = 0.8  # logo breath before the first word
for sc in SCENES:
    c = CLIPS[sc['id']]; sc['voice_at'] = t + LEAD; sc['start'] = t
    sc['len'] = LEAD + c['seconds'] + sc.get('tail', TAIL); t += sc['len']
TOTAL = t + 0.6
print('scenes:', [(s['id'], round(s['start'], 1), round(s['len'], 1)) for s in SCENES], 'total %.1fs' % TOTAL)

# ---------- subtitles from character alignment ----------
def chunks_for(sc):
    c = CLIPS[sc['id']]; al = c['alignment']; text = c['text']
    if not al:  # fallback: proportional split
        words = text.split(' '); n = len(words); per = c['seconds'] / max(1, n); out = []; cur = []; t0 = 0
        for i, w in enumerate(words):
            cur.append(w)
            if len(' '.join(cur)) > 38 or i == n - 1: out.append((sc['voice_at'] + t0, sc['voice_at'] + per * (i + 1), ' '.join(cur))); t0 = per * (i + 1); cur = []
        return out
    chars, st, en = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    words = []; cur = ''; ws = None
    for ch, s, e in zip(chars, st, en):
        if ch == ' ':
            if cur: words.append((cur, ws, e_prev)); cur = ''; ws = None
        else:
            if ws is None: ws = s
            cur += ch; e_prev = e
    if cur: words.append((cur, ws, e_prev))
    out = []; cur = [];
    for i, (w, s, e) in enumerate(words):
        cur.append((w, s, e))
        txt = ' '.join(x[0] for x in cur)
        end_of_sentence = w.endswith(('.', ':', '?', '!'))
        at_comma = w.endswith(',') and len(txt) >= 20
        if len(txt) >= 38 or end_of_sentence or at_comma or i == len(words) - 1:
            out.append([sc['voice_at'] + cur[0][1] - 0.08, sc['voice_at'] + cur[-1][2] + 0.3, txt]); cur = []
    for i in range(len(out) - 1): out[i][1] = min(out[i][1], out[i + 1][0] - 0.02)
    return out
SUBS = []
for sc in SCENES: SUBS += chunks_for(sc)
def fmt_srt(x): h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60; return '%02d:%02d:%02d,%03d' % (h, m, int(s), int(round((s - int(s)) * 1000)) % 1000)
with io.open(os.path.join(OUT, 'setim-explainer.srt'), 'w', encoding='utf-8') as f:
    for i, (a, b, txt) in enumerate(SUBS, 1): f.write(f'{i}\n{fmt_srt(a)} --> {fmt_srt(b)}\n{txt}\n\n'.replace('.', ',', 0))
print('subtitle chunks:', len(SUBS))

# ---------- static layers ----------
def background():
    img = Image.new('RGB', (W, H), BG)
    grad = Image.linear_gradient('L').resize((W, H)).point(lambda v: int(v * 0.35))
    img = Image.composite(Image.new('RGB', (W, H), BG2), img, grad)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.ellipse([-100, 120, 900, 1120], fill=(255, 107, 74, 46)); gd.ellipse([1300, -300, 2200, 500], fill=(255, 179, 71, 26))
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    img = Image.alpha_composite(img.convert('RGBA'), glow)
    return img
BGI = background()

PH_H = 960; PH_W = round(PH_H * VW / VH); PH_X, PH_Y = 230, (H - PH_H) // 2 - 4   # phone screen box on the canvas
SUBX, SUBW = 1270, 1250   # subtitles sit under the text panel, clear of the phone
BEZEL = 12
def phone_layer(shot):
    """phone with the screenshot inside, as RGBA at native canvas size (+margin for shadow)"""
    im = Image.open(os.path.join(SHOTS, shot + '.png')).convert('RGBA').resize((PH_W * 2, PH_H * 2), Image.LANCZOS)  # 2x for later zoom
    s = 2; M = 60 * s
    layer = Image.new('RGBA', (PH_W * s + 2 * (BEZEL * s + M), PH_H * s + 2 * (BEZEL * s + M)), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    bx0, by0 = M, M; bx1, by1 = M + PH_W * s + 2 * BEZEL * s, M + PH_H * s + 2 * BEZEL * s
    # shadow
    sh = Image.new('RGBA', layer.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([bx0 + 10, by0 + 40, bx1 + 10, by1 + 40], radius=100, fill=(0, 0, 0, 150))
    layer = Image.alpha_composite(layer, sh.filter(ImageFilter.GaussianBlur(50))); d = ImageDraw.Draw(layer)
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=96, fill=(24, 26, 34, 255), outline=(60, 64, 78, 255), width=3)
    mask = Image.new('L', im.size, 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], radius=76, fill=255)
    layer.paste(im, (bx0 + BEZEL * s, by0 + BEZEL * s), mask)
    # dynamic island
    iw, ih = 130 * s // 2 * 2, 36 * s // 2 * 2; cx = bx0 + BEZEL * s + PH_W * s // 2
    d.rounded_rectangle([cx - iw // 2, by0 + BEZEL * s + 10 * s, cx + iw // 2, by0 + BEZEL * s + 10 * s + ih], radius=ih // 2, fill=(8, 8, 10, 255))
    return layer, M, s
PHONES = {}
def phone(shot):
    if shot not in PHONES: PHONES[shot] = phone_layer(shot)
    return PHONES[shot]

def css_to_canvas(r, zoom):
    """CSS px rect on the screenshot -> canvas rect, given the phone zoom around the phone centre"""
    x, y, w, h = r
    sx, sy = PH_W / VW, PH_H / VH
    cx, cy = PH_X + PH_W / 2, PH_Y + PH_H / 2
    X0 = cx + (PH_X + x * sx - cx) * zoom; Y0 = cy + (PH_Y + y * sy - cy) * zoom
    return [X0, Y0, X0 + w * sx * zoom, Y0 + h * sy * zoom]

def ease(p): p = max(0, min(1, p)); return 1 - (1 - p) ** 3

def paste(img, lay, x, y):
    """alpha-composite lay onto img at (x, y), cropping whatever falls outside the canvas"""
    x, y = int(x), int(y); lw, lh = lay.size
    cx0, cy0 = max(0, -x), max(0, -y); cx1, cy1 = min(lw, W - x), min(lh, H - y)
    if cx1 <= cx0 or cy1 <= cy0: return
    img.alpha_composite(lay.crop((cx0, cy0, cx1, cy1)), (x + cx0, y + cy0))

def text_panel(sc):
    """title + numbered lines as separate RGBA layers (for staggered reveal)"""
    layers = []
    X_R = 1790; y = 190
    if sc.get('wordmark'):
        img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
        icon = Image.open(os.path.join(HERE, '..', 'icons', 'icon-512.png')).convert('RGBA').resize((150, 150), Image.LANCZOS)
        img.paste(icon, (X_R - 150, y), icon)
        d.text((X_R - 180, y + 8), rtl('סטים'), font=F_WORD, fill=INK, anchor='ra')
        yy = y + 190
        if sc['id'] == 'intro':
            d.text((X_R, yy), rtl(sc['sub']), font=font('segoeui.ttf', 44), fill=INK2, anchor='ra'); layers.append(('title', img))
            for at, line in sc.get('extra', []):
                l = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dd = ImageDraw.Draw(l); yy += 78
                dd.rounded_rectangle([X_R - 22 - font('segoeuib.ttf', 40).getlength(rtl(line)) - 40, yy - 14, X_R + 22, yy + 64], radius=24, fill=(255, 107, 74, 36))
                dd.text((X_R - 10, yy), rtl(line), font=font('segoeuib.ttf', 40), fill=ACC2, anchor='ra'); layers.append(('extra', l, at))
        else:
            d.text((X_R, yy), rtl(sc['title']), font=F_TITLE_S, fill=INK, anchor='ra')
            d.text((X_R, yy + 100), sc['url'], font=F_URL, fill=ACC, anchor='ra'); layers.append(('title', img))
        return layers
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.text((X_R, y), rtl(sc['title']), font=F_TITLE, fill=INK, anchor='ra'); layers.append(('title', img))
    fnt = F_SMALL if sc.get('small') else F_BODY; lh = 44 if sc.get('small') else 52; gap = 26 if sc.get('small') else 40
    yy = y + 150
    for i, line in enumerate(sc['lines']):
        l = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dd = ImageDraw.Draw(l)
        r = 26; bx = X_R - r
        dd.ellipse([bx - r, yy - r + 20, bx + r, yy + r + 20], fill=ACC); dd.text((bx, yy + 20), str(i + 1), font=F_BADGE, fill=(26, 12, 8), anchor='mm')
        head, _, rest = line.partition(':')
        lines_w = wrap(rest.strip(), fnt, 900) if rest else []
        tx = X_R - 2 * r - 26
        dd.text((tx, yy), rtl(head + (':' if rest else '')), font=F_BODY_B if not sc.get('small') else font('segoeuib.ttf', 30), fill=INK, anchor='ra')
        hw = (F_BODY_B if not sc.get('small') else font('segoeuib.ttf', 30)).getlength(rtl(head + ':'))
        if lines_w:
            dd.text((tx - hw - 14, yy), rtl(lines_w[0]), font=fnt, fill=INK2, anchor='ra')
            for k, extra in enumerate(lines_w[1:], 1): dd.text((tx, yy + k * lh), rtl(extra), font=fnt, fill=INK2, anchor='ra')
        layers.append(('line', l)); yy += lh * max(1, len(lines_w)) + gap
    return layers

SUB_CACHE = {}
def subtitle_layer(txt):
    if txt in SUB_CACHE: return SUB_CACHE[txt]
    l = Image.new('RGBA', (W, 140), (0, 0, 0, 0)); d = ImageDraw.Draw(l)
    lines = wrap(txt, F_SUB, SUBW)
    tw = max(F_SUB.getlength(rtl(x)) for x in lines); th = 56 * len(lines)
    d.rounded_rectangle([SUBX - tw / 2 - 34, 10, SUBX + tw / 2 + 34, 10 + th + 26], radius=22, fill=(0, 0, 0, 165))
    for i, x in enumerate(lines): d.text((SUBX, 24 + i * 56), rtl(x), font=F_SUB, fill=INK, anchor='ma')
    SUB_CACHE[txt] = l; return l

# ---------- per-frame composition ----------
def frame_for(sc, local, sub_txt):
    img = BGI.copy()
    p = local / sc['len']; zoom = 1.0 + 0.035 * p
    shot = sc['shot']
    if sc.get('shot2') and p >= sc['shot2'][1]: shot = sc['shot2'][0]
    layer, M, s = phone(shot)
    full_w = PH_W + 2 * BEZEL + 2 * M / s; full_h = PH_H + 2 * BEZEL + 2 * M / s
    tw, th = round(full_w * zoom), round(full_h * zoom)
    ph = layer.resize((tw, th), Image.LANCZOS)
    cx, cy = PH_X + PH_W / 2, PH_Y + PH_H / 2
    paste(img, ph, round(cx - tw / 2), round(cy - th / 2))
    # callouts
    n = len(sc['callouts']); voice_len = CLIPS[sc['id']]['seconds']
    rects = meta['shots'][shot]['rects'] if shot in meta['shots'] else {}
    base_rects = meta['shots'][sc['shot']]['rects']
    for i, co in enumerate(sc['callouts']):
        key, idx = co[0], co[1]; part = co[2] if len(co) > 2 else None
        rs = base_rects.get(key, [])
        if not rs: continue
        if idx == 'all':
            xs = [r[0] for r in rs]; ys = [r[1] for r in rs]; x2 = [r[0] + r[2] for r in rs]; y2 = [r[1] + r[3] for r in rs]
            r = [min(xs), min(ys), max(x2) - min(xs), max(y2) - min(ys)]
        else: r = rs[min(idx, len(rs) - 1)]
        if part == 'top': r = [r[0], r[1], r[2], 44]
        at = LEAD + 0.15 + i * (0.72 * voice_len / max(1, n)); a = ease((local - at) / 0.45)
        if a <= 0: continue
        pulse = 0.78 + 0.22 * math.sin((local - at) * 3.2)
        x0, y0, x1, y1 = css_to_canvas(r, zoom); pad = 7; m = 48
        ox, oy = int(x0 - pad - m), int(y0 - pad - m); ow, oh = int(x1 - x0 + 2 * pad + 2 * m) + 1, int(y1 - y0 + 2 * pad + 2 * m) + 1
        ov = Image.new('RGBA', (ow, oh), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        box = [m, m, m + (x1 - x0) + 2 * pad, m + (y1 - y0) + 2 * pad]
        d.rounded_rectangle(box, radius=16, outline=(*ACC, int(120 * a)), width=10)
        ov = ov.filter(ImageFilter.GaussianBlur(8)); d = ImageDraw.Draw(ov)
        d.rounded_rectangle(box, radius=16, outline=(*ACC, int(255 * a * pulse)), width=4)
        br = 22; bxc, byc = box[2] + 6, box[1] - 6
        d.ellipse([bxc - br, byc - br, bxc + br, byc + br], fill=(*ACC, int(255 * a))); d.text((bxc, byc), str(i + 1), font=F_BADGE, fill=(26, 12, 8, int(255 * a)), anchor='mm')
        paste(img, ov, ox, oy)
    # text panel with staggered reveal
    for k, lay in enumerate(sc['_text']):
        kind = lay[0]
        if kind == 'title': at = 0.1
        elif kind == 'extra': at = lay[2]
        else: at = LEAD + 0.15 + (k - 1) * (0.72 * voice_len / max(1, n if n else len(sc['lines'])))
        a = ease((local - at) / 0.5)
        if a <= 0: continue
        l = lay[1]
        if a < 1:
            l = l.copy(); l.putalpha(l.getchannel('A').point(lambda v: int(v * a)))
            dy = int((1 - a) * 24); l = l.transform(l.size, Image.AFFINE, (1, 0, 0, 0, 1, -dy))
        img.alpha_composite(l)
    if sub_txt: img.alpha_composite(subtitle_layer(sub_txt), (0, H - 150))
    return img

for sc in SCENES: sc['_text'] = text_panel(sc)

def scene_at(tt):
    if tt < SCENES[0]['start']: return SCENES[0]
    for sc in SCENES:
        if sc['start'] <= tt < sc['start'] + sc['len']: return sc
    return SCENES[-1]
def sub_at(tt):
    for a, b, txt in SUBS:
        if a <= tt < b: return txt
    return None

# ---------- audio ----------
def read_wav(path):
    with wave.open(path, 'rb') as w:
        n = w.getnframes(); data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
        ch = w.getnchannels(); data = data.reshape(-1, ch)
        if ch == 1: data = np.repeat(data, 2, axis=1)
        return data
total_samples = int((TOTAL + 0.5) * SR)
mix = np.zeros((total_samples, 2), dtype=np.float32)
for sc in SCENES:
    v = read_wav(CLIPS[sc['id']]['wav']); s0 = int(sc['voice_at'] * SR); s1 = min(total_samples, s0 + len(v)); mix[s0:s1] += v[:s1 - s0] * 0.95

def music_bed(seconds):
    """soft ambient pad: slow chord progression, detuned sines, gentle swell; sits far under the voice"""
    path = os.path.join(OUT, 'music.wav')
    if os.path.exists(path):
        m = read_wav(path)
        if len(m) >= seconds * SR: return m[:int(seconds * SR)]
    n = int(seconds * SR); tt = np.arange(n) / SR; out = np.zeros((n, 2), dtype=np.float32)
    chords = [[220.0, 261.63, 329.63, 440.0], [174.61, 220.0, 261.63, 349.23], [130.81, 196.0, 261.63, 329.63], [196.0, 246.94, 293.66, 392.0]]
    seg = 7.2
    for k in range(int(math.ceil(seconds / seg))):
        a0 = int(k * seg * SR); a1 = min(n, int((k + 1) * seg * SR) + int(1.2 * SR)); L = a1 - a0
        if L <= 0: break
        lt = np.arange(L) / SR; env = np.minimum(1, lt / 1.6) * np.minimum(1, (L / SR - lt) / 1.6); env = np.clip(env, 0, 1)
        chord = chords[k % 4]; seg_sig = np.zeros(L, dtype=np.float32)
        for j, f in enumerate(chord):
            for det, g in ((0, 1.0), (1.003, 0.6), (0.997, 0.6)):
                seg_sig += g * np.sin(2 * np.pi * f * det * lt + j).astype(np.float32) / (j + 1.5)
            seg_sig += 0.35 * np.sin(2 * np.pi * f * 2 * lt).astype(np.float32) / (j + 2)
        seg_sig *= env; lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.11 * lt)
        out[a0:a1, 0] += seg_sig * lfo * (0.55 + 0.1 * j); out[a0:a1, 1] += seg_sig * (0.85 + 0.15 * np.cos(2 * np.pi * 0.09 * lt)) * 0.6
    out /= max(1e-6, np.abs(out).max()); out *= 0.16
    fade = np.minimum(1, tt / 2.5) * np.minimum(1, np.maximum(0, (seconds - tt) / 3.0)); out *= fade[:, None]
    return out
music = music_bed(TOTAL + 0.5)
mix[:len(music)] += music[:total_samples]
peak = np.abs(mix).max(); mix *= min(1.0, 0.98 / peak)
audio_path = os.path.join(OUT, 'mix.wav')
with wave.open(audio_path, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
print('audio mixed: %.1fs' % (total_samples / SR))

# ---------- render ----------
out_mp4 = os.path.join(OUT, 'setim-explainer.mp4')
cmd = [FF, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', audio_path,
       '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '192k', '-shortest', out_mp4]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
nframes = int(TOTAL * FPS); XF = 0.5
for fi in range(nframes):
    tt = fi / FPS; sc = scene_at(tt); local = tt - sc['start']; sub = sub_at(tt)
    img = frame_for(sc, local, sub)
    # cross-fade with the previous scene during the first XF seconds
    i = SCENES.index(sc)
    if i > 0 and local < XF:
        prev = SCENES[i - 1]; pimg = frame_for(prev, prev['len'] + local, sub); a = ease(local / XF)
        img = Image.blend(pimg, img, a)
    if tt < 0.8: img = Image.blend(Image.new('RGBA', (W, H), (*BG, 255)), img, ease(tt / 0.8))
    if tt > TOTAL - 0.8: img = Image.blend(img, Image.new('RGBA', (W, H), (*BG, 255)), ease((tt - (TOTAL - 0.8)) / 0.8))
    proc.stdin.write(img.convert('RGB').tobytes())
    if fi % 300 == 0: print(f'  frame {fi}/{nframes}  t={tt:.1f}s  scene={sc["id"]}', flush=True)
proc.stdin.close(); proc.wait()
print('done:', out_mp4, 'exit', proc.returncode)
