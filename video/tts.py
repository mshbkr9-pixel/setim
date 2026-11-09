# -*- coding: utf-8 -*-
"""Narration for the explainer video: Hebrew text-to-speech via ElevenLabs.
Writes video/out/vo_NN.mp3 (+ .wav) and video/out/narration.json with per-clip durations
and, when the API returns them, character-level timings for the subtitles.
The API key is read from the master keys file and never printed."""
import io, os, re, json, base64, subprocess, wave, sys
import requests, imageio_ffmpeg

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()

env = {}
for line in io.open(r"C:\Users\moshe bahar\.secrets\master_keys.env", encoding='utf-8', errors='ignore'):
    m = re.match(r'\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$', line)
    if m: env[m.group(1)] = m.group(2).strip().strip('"').strip("'")
KEY = env['ELEVENLABS_API_KEY']
H = {'xi-api-key': KEY, 'Content-Type': 'application/json'}

# scene id -> narration (plain spoken Hebrew; the URL is shown on screen, not read aloud)
SCENES = [
 ('intro',   'זאת סטים. אפליקציה שסופרת בשבילך את האימון, ולא נותנת לך לשכוח כלום. היא מיועדת לכל מי שמתאמן, בחדר כושר, בבית או בפארק, ורוצה לדעת בדיוק מה הרים בפעם הקודמת, ולהשתפר קצת בכל פעם.'),
 ('nav',     'למטה יש רק שלושה כפתורים: היום, יומן, ועוד. זה כל מה שצריך לדעת.'),
 ('today',   'בלשונית היום רואים את ימי השבוע. הטבעת מראה כמה מהתרגילים כבר סיימת, והכפתור הכתום מתחיל אימון מודרך עם סטופר.'),
 ('list',    'כל שורה היא תרגיל. לוחצים עליו כדי לרשום משקל וחזרות. שלוש הנקודות פותחות את אפשרויות היום, והפלוס מוסיף תרגיל חדש.'),
 ('exercise','בדף התרגיל, הפלוס והמינוס משנים משקל וחזרות, והוי הירוק מסמן שהסט בוצע. בפעם הבאה הכול כבר ממולא מהפעם הקודמת, ורק צריך לעלות.'),
 ('workout', 'במצב אימון הסטופר רץ, ובסוף כל תרגיל האפליקציה מעבירה אותך לתרגיל הבא, עד הסיכום.'),
 ('journal', 'ביומן יש לוח שנה. ימים ירוקים הם אימונים שבוצעו, ולחיצה על כרטיס הסיכום פותחת גרפים ושיאים אישיים.'),
 ('more',    'בעוד הכול מסודר בקופסאות: ספריית תרגילים עם הדגמות מונפשות, תוכניות שממלאות את כל השבוע בלחיצה אחת, המכון שלי, מדריכים, קלוריות, והגדרות.'),
 ('outro',   'פשוט, מסודר, וזוכר הכול בשבילך. סטים.'),
]
print('total characters:', sum(len(t) for _, t in SCENES))

# voice: a warm, clear premade voice; the Hebrew comes from the multilingual model, not the voice
voices = requests.get('https://api.elevenlabs.io/v1/voices', headers=H, timeout=30).json()['voices']
pref = ['Bella', 'Alice', 'Matilda', 'George']
voice = next((v for name in pref for v in voices if v['name'].startswith(name)), voices[0])
print('voice:', voice['name'])
VOICE_ID = voice['voice_id']
MODELS = ['eleven_v3', 'eleven_v4_turbo', 'eleven_v3_conversational']

def wav_seconds(path):
    with wave.open(path, 'rb') as w: return w.getnframes() / float(w.getframerate())

def tts(text, idx):
    mp3 = os.path.join(OUT, f'vo_{idx:02d}.mp3'); wav = mp3[:-4] + '.wav'
    last_err = None
    for model in MODELS:
        body = {'text': text, 'model_id': model, 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8, 'style': 0.2, 'use_speaker_boost': True}}
        # 1) with character timestamps (for exact subtitle timing)
        r = requests.post(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps', headers=H, json=body, params={'output_format': 'mp3_44100_128'}, timeout=180)
        align = None
        if r.ok:
            j = r.json(); audio = base64.b64decode(j['audio_base64']); align = j.get('alignment') or j.get('normalized_alignment')
        else:
            last_err = f'{model} with-timestamps {r.status_code}: {r.text[:160]}'
            r = requests.post(f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}', headers=H, json=body, params={'output_format': 'mp3_44100_128'}, timeout=180)
            if not r.ok:
                last_err = f'{model} plain {r.status_code}: {r.text[:160]}'; continue
            audio = r.content
        open(mp3, 'wb').write(audio)
        subprocess.run([FF, '-y', '-loglevel', 'error', '-i', mp3, '-ar', '44100', '-ac', '2', wav], check=True)
        return {'model': model, 'mp3': mp3, 'wav': wav, 'seconds': wav_seconds(wav), 'alignment': align}
    raise SystemExit('TTS failed: ' + str(last_err))

clips = []
for i, (sid, text) in enumerate(SCENES, 1):
    c = tts(text, i); c.update(id=sid, text=text); clips.append(c)
    print(f'{i:02d} {sid:9s} {c["seconds"]:5.1f}s  model={c["model"]}  timestamps={"yes" if c["alignment"] else "no"}')
json.dump({'voice': voice['name'], 'clips': clips}, io.open(os.path.join(OUT, 'narration.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('narration total: %.1fs' % sum(c['seconds'] for c in clips))
sub = requests.get('https://api.elevenlabs.io/v1/user/subscription', headers=H, timeout=30).json()
print('quota used:', sub.get('character_count'), '/', sub.get('character_limit'))
