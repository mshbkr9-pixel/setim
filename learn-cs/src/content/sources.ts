import index from '../../content/source/photo-index.json';

/** The original documents photographed in the 76 source photos (grouped by the course's own codes). */
export interface SourceDoc {
  id: string;
  code: string;
  title: string;
  kind: 'slides' | 'reading' | 'task';
  photos: number[];
  note: string;
}

export const DOCS: SourceDoc[] = [
  { id: 'logo-procs', code: 'א.2', title: 'היכרות עם שפת לוגו / פרוצדורות ומשתנים (מצגת)', kind: 'slides', photos: [67, 68, 69, 70, 71], note: 'שקפים 4–16: Commander ו־Edall, REPEAT → SQUARE → SQUARE :SIZE, POLYGONS, TOOTH/TEETH.' },
  { id: 'logo-stack', code: 'א.2', title: 'דיון במשתנים ומחסניות זיכרון (מצגת)', kind: 'slides', photos: [72, 73, 74, 75, 76], note: 'שקפים 6–14: ארבעת המקרים של TEETH 3 20 ומחסנית LIFO.' },
  { id: 'logo-task', code: 'א.2', title: 'היכרות עם שפת לוגו (א) פעולות אלמנטריות – משימה', kind: 'task', photos: [54], note: 'דף משימה: פירוש אלגוריתמים (שאלות 2–3).' },
  { id: 'alg-basic', code: 'א.3', title: 'היכרות עם שפת אלגולם / פעולות ראשונות (מצגת)', kind: 'slides', photos: [44, 45, 46, 47, 48, 49, 50, 51, 52, 53], note: 'שקפים 3–17: מונים R1–R6, ADD/SUB, WHILE, דוגמאות 1–7.' },
  { id: 'alg-procs', code: 'א.3', title: 'היכרות עם שפת אלגולם / פרוצדורות ומשתנים (מצגת)', kind: 'slides', photos: [25, 26, 27, 28, 29, 30, 31, 32], note: 'שקפים 4–16: הכללה ומתן שם, ONE, TWO, FIVE, TEN, HUN, MOVE.' },
  { id: 'alg-trace', code: 'א.3', title: 'היכרות עם שפת אלגולם / טבלאות מעקב (מצגת)', kind: 'slides', photos: [33, 34, 35, 36], note: 'שקפים 7–15: טבלאות מעקב לפי סיבובים ושורות, n = 65.' },
  { id: 'errors', code: 'א.4', title: 'שגיאות / חוסר משמעות באלגולם (מצגת)', kind: 'slides', photos: [18, 19, 20, 21, 22, 23, 24], note: 'שקפים 2–18: עץ השגיאות, ALEF, BET, GIMEL, DALET, HE, טבלת סיכום.' },
  { id: 'sets', code: 'א.5', title: 'יסודות בתורת הקבוצות – קריאה + תרגילים', kind: 'reading', photos: [37, 38, 39, 40, 41, 42, 43], note: 'עמודים 1–4 ותרגילים לסעיף א.5.' },
  { id: 'functions', code: 'א.6', title: 'רקע למושג פונקציה – קריאה + תרגילים', kind: 'reading', photos: [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66], note: 'עמודים 1–7 ותרגילים לסעיף א.6.' },
  { id: 'determinism', code: 'ב.0', title: 'תהליכים דטרמיניסטיים ואקראיות מדומה – משימה', kind: 'task', photos: [16, 17], note: 'משחק מלכת הלבבות עם הפרוצדורה S(A,B,C). נושא שאינו מופיע במחברת המעובדת (עמ׳ 1–22).' },
  { id: 'analysis', code: 'ב.1', title: 'אמצעים לניתוח אלגוריתמים – קריאה', kind: 'reading', photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], note: 'עמודים 1–8: סימוני קלט/פלט, טבלת מעקב כללית, תרשים פירוק הדרגתי, דוגמאות 1–7, תרגילים.' },
];

export interface PhotoInfo {
  photo: number;
  pdfPage: number;
  doc: string;
  kind: string;
  number: string;
  parts: string;
  confidence: string;
  uncertain: number;
}

export const PHOTOS: PhotoInfo[] = index as PhotoInfo[];
export const docOfPhoto = (n: number) => DOCS.find((d) => d.photos.includes(n));
