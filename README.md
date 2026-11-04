# סטים — אפליקציית מעקב אימונים

קישור לאפליקציה המפורסמת: https://claude.ai/artifact/2wucA64fpWrpBqDN8fmcHQ

## קבצים
- `index.html` — הקובץ המפורסם. נבנה מ-`index.template.html` (ממשק, לוגיקה) + `articles.js` (המדריכים) + בלוקי הקטלוג (יצרנים/מכשירים/תוכניות) שנמצאים ב-`index.v1.html`. לעריכה: לשנות את הטמפלייט/המאמרים ולהרכיב מחדש (ראה build בסוף).
- `index.v1.html` — הגרסה הראשונה (גיבוי).
- `data/exercises.json` — 701 תרגילים (שמות בעברית ובאנגלית, שרירים, ציוד, הוראות, טיפים).
- `data/img-<group>.json` — תמונות התרגילים (320px WebP, base64) לפי קבוצת שרירים, נטענות לפי צורך.
- `img/` — תמונות המקור (512px) מ-RepDB. לא מתפרסמות, משמשות לבנייה בלבד.
- `build_data.py` — בונה את `data/exercises.json` מתוך מאגר RepDB + קובצי התרגום.
- `pack_images.py` — מקטין ואורז את התמונות לקובצי ה-JSON.
- `BRANDS_RESEARCH.md` — מחקר על יצרני מכשירי כושר והיבואנים שלהם בישראל.

## פרסום מחדש
אחרי שינוי ב-`index.html`: לפרסם מחדש את הקובץ לאותו artifact (slug `0fc3b8d0-81e8-4911-bc1b-47d481ffff83`).

## נתונים ושיתוף
- כל משתמש שנכנס עם חשבון Claude מקבל נתונים פרטיים משלו (`data/users/<id>/`).
- כדי שחברים יוכלו לשמור אימונים, יש לשתף את הקישור ברמת **Contributor** (לא Viewer).
- בלי חיבור, הנתונים נשמרים ב-localStorage של הדפדפן.

## קרדיט ורישיון
Exercise data by [RepDB (repdb.co)](https://repdb.co) — רישיון Free Tier, שימוש בתוך אפליקציה עם קרדיט גלוי. אין להפיץ את המאגר מחדש.

## הרכבת index.html מחדש
הטמפלייט מכיל שלושה סמנים: `/*__CATALOG__*/`, `/*__POOL__*/`, `/*__ARTICLES__*/`. יש להחליף אותם בבלוקים המתאימים (קטלוג EQ/MACHINES/BRANDS ו-POOL/PROGRAMS מתוך index.v1.html, ו-articles.js) ולשמור כ-index.html.
