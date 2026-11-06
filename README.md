# סטים — אפליקציית מעקב אימונים

**הכתובת הרשמית:** https://getonekeyai.com/ (האפליקציה + הנתונים מהשרת srv1809211, Caddy, תעודת Let's Encrypt; DNS ב-Cloudflare, רשומות A במצב DNS-only).

עותק ב-GitHub Pages (אותו קוד, API דרך sslip.io): https://mshbkr9-pixel.github.io/setim/

ריפו: https://github.com/mshbkr9-pixel/setim · כל push ל-main מתפרסם אוטומטית.

גרסת claude.ai (פרטית, עם שמירה בחשבון): https://claude.ai/artifact/2wucA64fpWrpBqDN8fmcHQ

## קבצים
- `index.html` — הקובץ המפורסם. נבנה מ-`index.template.html` (ממשק, לוגיקה) + `articles.js` (המדריכים) + בלוקי הקטלוג (יצרנים/מכשירים/תוכניות) שנמצאים ב-`index.v1.html`. לעריכה: לשנות את הטמפלייט/המאמרים ולהרכיב מחדש (ראה build בסוף).
- `index.v1.html`, `index.v4.html` — גרסאות קודמות (גיבוי). v7 הוסיפה טקסונומיית שרירים מפורטת (`SUBS`, 22 תת-קבוצות: חזה עליון/תחתון, לאטס, גב עליון/תחתון, שלוש הכתפיים, ביצפס/טריצפס/אמות, ארבע-ראשי/האמסטרינג/תאומים/מקרבים/כופפי ירך, ישבן, בטן/אלכסונים/ליבה) עם סיווג לפי שריר ראשי + שם התרגיל (`subsOf`); משמשת לסינון בספרייה, להרכבת יום מתת-שרירים ולסטטיסטיקה. v6 הוסיפה: כפתור סגירה בכל גיליון, הסרה עם ביטול בכל תרגיל, קטגוריית קליסטניקס ופעילויות בחוץ (רישום בדקות וק״מ), זרימת סוג יום ← בחירת תרגילים, אימונים קבועים (`routines`) וזיהוי סבב (`days`: תווית ותרגילים לכל תאריך אימון). הגרסה v5 מינימליסטית: 4 לשוניות (היום / יומן / תרגילים / עוד); "היום" = פס ימי השבוע + התרגילים של היום, לחיצה = רישום סטים.
- `add_*.py` — הסקריפטים שבנו את הגרסאות (PWA, חשבונות, UX, תוכנית שבועית). `icons/og.png` תמונת תצוגה מקדימה לשיתוף, `icons/qr.png` QR של הכתובת.
- `data/exercises.json` — 701 תרגילים (שמות בעברית ובאנגלית, שרירים, ציוד, הוראות, טיפים).
- `data/img-<group>.json` — תמונות התרגילים (320px WebP, base64) לפי קבוצת שרירים, נטענות לפי צורך.
- `img/` — תמונות המקור (512px) מ-RepDB. לא מתפרסמות, משמשות לבנייה בלבד.
- `build_data.py` — בונה את `data/exercises.json` מתוך מאגר RepDB + קובצי התרגום.
- `pack_images.py` — מקטין ואורז את התמונות לקובצי ה-JSON.
- `BRANDS_RESEARCH.md` — מחקר על יצרני מכשירי כושר והיבואנים שלהם בישראל.

## פרסום מחדש
- לדומיין: `scp -r index.html manifest.json sw.js icons data root@2.24.161.2:/opt/setim/app/` (הגדרת Caddy: `server/caddy_domain.sh`).
אחרי שינוי ב-`index.html`: לפרסם מחדש את הקובץ לאותו artifact (slug `0fc3b8d0-81e8-4911-bc1b-47d481ffff83`).

## נתונים ושיתוף
- בקישור הציבורי יש הרשמה וכניסה (אימייל + סיסמה) מול PocketBase בשרת srv1809211 (`https://setim.2-24-161-2.sslip.io`). כל משתמש רואה רק את השורות שלו (כללי API של PocketBase). בלי התחברות הנתונים נשמרים במכשיר (localStorage); בהתחברות ראשונה הנתונים המקומיים עולים לחשבון.
- **השרת פעיל** (הותקן 2026-11-05): ממשק ניהול `https://setim.2-24-161-2.sslip.io/_/`, פרטי כניסה ב-`master_keys.env` (`SETIM_PB_*`). `server/pb_setup.sh` התקין את PocketBase בשרת מאחורי Caddy; `server/pb_schema.py` יוצר את הסכמה (`docs`: user, key, data); `server/mock_pb.py` שרת דמה לבדיקות מקומיות (האפליקציה פונה ל-127.0.0.1:8090 כשהיא רצה מ-localhost).
- `manifest.json`, `sw.js`, `icons/` — הופכים את הקישור הציבורי ל-PWA שמותקן במסך הבית.

- כל משתמש שנכנס עם חשבון Claude מקבל נתונים פרטיים משלו (`data/users/<id>/`).
- כדי שחברים יוכלו לשמור אימונים, יש לשתף את הקישור ברמת **Contributor** (לא Viewer).
- בלי חיבור, הנתונים נשמרים ב-localStorage של הדפדפן.

## גיבוי
- PocketBase מגבה לבד כל לילה ב-03:30 UTC (`settings.backups.cron`, שומר 14) ל-`/var/lib/pocketbase/backups/`. שחזור מממשק הניהול (Settings → Backups) או לפי ההוראות ב-`server/pb_backup_copy_setup.sh`.
- שכבה שנייה (העתקה ל-`/var/backups/pocketbase`, timer של systemd): `server/pb_backup_copy_setup.sh`, להרצה ידנית כ-root.

## קרדיט ורישיון
Exercise data by [RepDB (repdb.co)](https://repdb.co) — רישיון Free Tier, שימוש בתוך אפליקציה עם קרדיט גלוי. אין להפיץ את המאגר מחדש.

## הרכבת index.html מחדש
הטמפלייט מכיל שלושה סמנים: `/*__CATALOG__*/`, `/*__POOL__*/`, `/*__ARTICLES__*/`. יש להחליף אותם בבלוקים המתאימים (קטלוג EQ/MACHINES/BRANDS ו-POOL/PROGRAMS מתוך index.v1.html, ו-articles.js) ולשמור כ-index.html.
