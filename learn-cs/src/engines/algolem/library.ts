/**
 * The course's own named procedures ("מילים חדשות").
 * Each entry keeps its source so the UI can show where it comes from.
 *
 * Status `verified`: transcribed from the photo and re-checked at high zoom.
 * Status `reconstructed`: the photo shows the idea but the exact text was not readable,
 * so the body is a reconstruction that matches the stated purpose.
 * Status `dictionary`: the course dictionary gives only the meaning (e.g. "C = A+B");
 * the body was written for this site so the simulator can run the word. It keeps the
 * inputs unchanged and is safe when the result counter is also an input (SUM (B,E,B)).
 */
export interface LibraryProcedure {
  name: string;
  source: string;
  /** Hebrew one-line purpose. */
  purpose: string;
  photos: number[];
  status: 'verified' | 'reconstructed' | 'dictionary';
  /** The meaning column of the course dictionary, one statement per item ("B = A", "A = A"). */
  meaning?: string[];
  /** An equivalent form shown on the same slide (e.g. the two boxes joined by ↔ in photo 31). */
  alt?: string;
  /** Which deck/document it belongs to. */
  topic: 'algolem-procedures' | 'algolem-errors' | 'determinism' | 'algolem-dictionary';
}

export const LIBRARY: LibraryProcedure[] = [
  {
    name: 'ZERO',
    source: `@ ZERO (A)
   WHILE (A)
      SUB (A)
   ENDW`,
    purpose: 'מאפסת את המונה: מוציאה ממנו כדורים עד שהוא ריק',
    meaning: ['A = 0'],
    photos: [25, 32],
    status: 'verified',
    topic: 'algolem-procedures',
  },
  {
    name: 'ONE',
    source: `@ ONE (B)
   ZERO (B)
   ADD (B)`,
    alt: `@ ONE (B)
   WHILE (B)
      SUB (B)
   ENDW
   ADD (B)`,
    purpose: 'מכניסה 1 למונה (מאפסת ואז מוסיפה כדור אחד)',
    meaning: ['B = 1'],
    photos: [31],
    status: 'verified',
    topic: 'algolem-procedures',
  },
  {
    name: 'TWO',
    source: `@ TWO (A)
   WHILE (A)
      SUB (A)
   ENDW
   ADD (A)
   ADD (A)`,
    purpose: 'מכניסה 2 למונה: מרוקנת אותו ומוסיפה שני כדורים',
    meaning: ['A = 2'],
    photos: [30],
    status: 'verified',
    topic: 'algolem-procedures',
  },
  {
    name: 'FIVE',
    source: `@ FIVE (C)
   TWO (C)
   ADD (C)
   ADD (C)
   ADD (C)`,
    purpose: 'מכניסה 5 למונה: TWO ועוד שלושה כדורים',
    meaning: ['C = 5'],
    photos: [30],
    status: 'verified',
    topic: 'algolem-procedures',
  },
  {
    name: 'TEN',
    source: `@ TEN (A)
   FIVE (A)
   FIVE (B)
   WHILE (B)
      SUB (B)
      ADD (A)
   ENDW`,
    purpose: 'מכניסה 10 למונה: 5 ועוד 5 בעזרת מונה עזר B',
    meaning: ['A = 10'],
    photos: [29],
    status: 'verified',
    topic: 'algolem-procedures',
  },
  {
    name: 'HUN',
    source: `@ HUN (A)
   ZERO (A)
   TEN (B)
   WHILE (B)
      TEN (T)
      WHILE (T)
         SUB (T)
         ADD (A)
      ENDW
      SUB (B)
   ENDW`,
    purpose: 'מכניסה 100 למונה בעזרת לולאה בתוך לולאה (10 פעמים 10)',
    meaning: ['A = 100'],
    photos: [28],
    status: 'verified',
    topic: 'algolem-procedures',
  },
  {
    name: 'MOVE',
    source: `@ MOVE (A,B)
   ZERO (B)
   ZERO (C)
   WHILE (A)
      ADD (B)
      ADD (C)
      SUB (A)
   ENDW
   WHILE (C)
      ADD (A)
      SUB (C)
   ENDW`,
    purpose: 'מעתיקה את תוכן A אל B ומשאירה את A כפי שהיה (בעזרת מונה עזר C)',
    meaning: ['B = A', 'A = A'],
    photos: [26, 27],
    status: 'verified',
    topic: 'algolem-procedures',
  },
  {
    name: 'S',
    source: `@ S (A,B,C)
   FIVE (B)
   WHILE (A)
      ADD (B)
      ADD (C)
      SUB (A)
   ENDW`,
    purpose: 'הפרוצדורה של משימת "מלכת הלבבות" (תהליכים דטרמיניסטיים)',
    photos: [17],
    status: 'verified',
    topic: 'determinism',
  },
  {
    name: 'ALEF',
    source: `@ ALEF (A,B)
   WHILE (A)
      SUB (B)
      SUB (A)
   ENDW`,
    purpose: 'דוגמה 1 בפרק השגיאות: יש משמעות רק כאשר B גדול או שווה ל־A',
    photos: [23],
    status: 'verified',
    topic: 'algolem-errors',
  },
  {
    name: 'BET',
    source: `@ BET (A,B)
   WHILE (A)
      ADD (B)
      ADD (A)
   ENDW`,
    purpose: 'דוגמה 2 בפרק השגיאות: לולאה שאינה נגמרת כאשר A חיובי',
    photos: [22],
    status: 'verified',
    topic: 'algolem-errors',
  },
  {
    name: 'GIMEL',
    source: `@ GIMEL (A,B)
   WHILE (A)
      SUB (A)
   ENDW
   WHILE (B)
      ADD (A)
      SUB (B)
   ENDW`,
    purpose: 'דוגמה 3 בפרק השגיאות: יש משמעות לכל קלט',
    photos: [20],
    status: 'verified',
    topic: 'algolem-errors',
  },
  {
    name: 'DALET',
    source: `@ DALET (A)
   SUB (A)
   ADD (A)
   ADD (A)`,
    purpose: 'דוגמה 4 בפרק השגיאות: A = 0 — חיסור ממונה ריק, אין משמעות; A ≠ 0 — יש משמעות',
    photos: [19],
    status: 'verified',
    topic: 'algolem-errors',
  },
  {
    name: 'HE',
    source: `@ HE (A,B)
   WHILE (A)
      WHILE (A)
         SUB (B)
      ENDW
   ENDW`,
    purpose: 'דוגמה 5 בפרק השגיאות: לולאה פנימית שאינה משנה את A',
    photos: [18],
    status: 'verified',
    topic: 'algolem-errors',
  },
  // ---- words from the course dictionary whose body is not in the source: written for the simulator
  {
    name: 'SUM',
    source: `@ SUM (A,B,C)
   MOVE (A,P)
   MOVE (B,Q)
   WHILE (Q)
      ADD (P)
      SUB (Q)
   ENDW
   MOVE (P,C)`,
    purpose: 'חיבור: מכניסה ל־C את A ועוד B (A ו־B לא משתנים)',
    meaning: ['C = A+B'],
    photos: [],
    status: 'dictionary',
    topic: 'algolem-dictionary',
  },
  {
    name: 'MUL',
    source: `@ MUL (A,B,C)
   ZERO (X)
   MOVE (B,Y)
   WHILE (Y)
      MOVE (A,Z)
      WHILE (Z)
         ADD (X)
         SUB (Z)
      ENDW
      SUB (Y)
   ENDW
   MOVE (X,C)`,
    purpose: 'כפל: מכניסה ל־C את A כפול B (A ו־B לא משתנים)',
    meaning: ['C = A*B'],
    photos: [],
    status: 'dictionary',
    topic: 'algolem-dictionary',
  },
  {
    name: 'POW',
    source: `@ POW (A,B,C)
   ONE (P)
   MOVE (B,Q)
   WHILE (Q)
      MUL (P,A,P)
      SUB (Q)
   ENDW
   MOVE (P,C)`,
    purpose: 'חזקה: מכניסה ל־C את A בחזקת B (A ו־B לא משתנים; חזקה 0 נותנת 1)',
    meaning: ['C = A^B'],
    photos: [],
    status: 'dictionary',
    topic: 'algolem-dictionary',
  },
  {
    name: 'SUCC',
    source: `@ SUCC (A,B)
   MOVE (A,P)
   ADD (P)
   MOVE (P,B)`,
    purpose: 'העוקב: מכניסה ל־B את A ועוד 1 (A לא משתנה)',
    meaning: ['B = A+1'],
    photos: [],
    status: 'dictionary',
    topic: 'algolem-dictionary',
  },
  {
    name: 'EXCH',
    source: `@ EXCH (A,B)
   MOVE (A,P)
   MOVE (B,A)
   MOVE (P,B)`,
    purpose: 'החלפה: התוכן של A עובר ל־B והתוכן של B עובר ל־A',
    meaning: ['A = B', 'B = A'],
    photos: [],
    status: 'dictionary',
    topic: 'algolem-dictionary',
  },
];

export const LIBRARY_BY_NAME: Record<string, LibraryProcedure> = Object.fromEntries(LIBRARY.map((p) => [p.name, p]));

/** Procedures that set a counter to a constant — used by the modular summaries. */
export const CONSTANT_SETTERS: Record<string, number> = { ZERO: 0, ONE: 1, TWO: 2, FIVE: 5, TEN: 10, HUN: 100 };
