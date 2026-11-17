import type { Track, TrackId } from './types';

export const TRACKS: Track[] = [
  { id: 'logo', title: 'שפת LOGO', subtitle: 'צב, פרוצדורות, משתנים ומחסניות זיכרון', units: ['א.2'], color: 'var(--t-logo)' },
  { id: 'algolem', title: 'שפת אלגולם', subtitle: 'מונים, פעולות, לולאות ופרוצדורות', units: ['א.3'], color: 'var(--t-algolem)' },
  { id: 'trace', title: 'טבלאות מעקב וקריאת אלגוריתמים', subtitle: 'מעקב כללי, נוסחאות ופירוק הדרגתי', units: ['א.3', 'ב.1'], color: 'var(--t-trace)' },
  { id: 'errors', title: 'שגיאות וחוסר משמעות', subtitle: 'תחביר, סמנטיקה, דטרמיניזם', units: ['א.4', 'ב.0'], color: 'var(--t-errors)' },
  { id: 'sets', title: 'תורת הקבוצות', subtitle: 'שייכות, הכלה, הפרש וזוגות סדורים', units: ['א.5'], color: 'var(--t-sets)' },
  { id: 'functions', title: 'פונקציות', subtitle: 'תחום, טווח, כלל התאמה וגרפים', units: ['א.6'], color: 'var(--t-functions)' },
];

export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t])) as Record<TrackId, Track>;

/**
 * Skill tags. Every question and lesson lists the skills it trains.
 * Three recent mistakes in a skill → the learner is offered the reinforcement lesson first.
 */
export const SKILLS: Record<string, { track: TrackId; title: string; reinforce: string }> = {
  // LOGO
  'logo-algorithm': { track: 'logo', title: 'מהו אלגוריתם', reinforce: 'logo-01' },
  'logo-commands': { track: 'logo', title: 'פקודות הצב', reinforce: 'logo-02' },
  'logo-pen': { track: 'logo', title: 'מצב העט', reinforce: 'logo-03' },
  'logo-repeat': { track: 'logo', title: 'לולאת REPEAT', reinforce: 'logo-04' },
  'logo-procedure': { track: 'logo', title: 'הגדרה וקריאה של פרוצדורה', reinforce: 'logo-05' },
  'logo-parameters': { track: 'logo', title: 'פרמטרים', reinforce: 'logo-06' },
  'logo-generalize': { track: 'logo', title: 'הכללה', reinforce: 'logo-07' },
  'logo-nested-proc': { track: 'logo', title: 'פרוצדורה בתוך פרוצדורה', reinforce: 'logo-08' },
  'logo-stack': { track: 'logo', title: 'מחסנית זיכרון', reinforce: 'logo-09' },
  'logo-scope': { track: 'logo', title: 'איזה ערך יש למשתנה', reinforce: 'logo-10' },
  // Algolem
  counters: { track: 'algolem', title: 'מונים', reinforce: 'algolem-01' },
  'add-sub': { track: 'algolem', title: 'ADD ו־SUB', reinforce: 'algolem-02' },
  'while-loop': { track: 'algolem', title: 'לולאת WHILE', reinforce: 'algolem-03' },
  transfer: { track: 'algolem', title: 'העברת תוכן בין מונים', reinforce: 'algolem-04' },
  zeroing: { track: 'algolem', title: 'איפוס והכנסת קבוע', reinforce: 'algolem-05' },
  'helper-counter': { track: 'algolem', title: 'מונה עזר', reinforce: 'algolem-06' },
  'procedure-def': { track: 'algolem', title: 'הגדרת פרוצדורה (@)', reinforce: 'algolem-07' },
  'procedure-call': { track: 'algolem', title: 'קריאה לפרוצדורה', reinforce: 'algolem-08' },
  'nested-loop': { track: 'algolem', title: 'לולאה בתוך לולאה', reinforce: 'algolem-10' },
  // Trace / reading
  'trace-general': { track: 'trace', title: 'טבלת מעקב כללית', reinforce: 'trace-01' },
  'trace-formula': { track: 'trace', title: 'נוסחה אחרי n סיבובים', reinforce: 'trace-02' },
  'io-notation': { track: 'trace', title: 'ערכי קלט ופלט', reinforce: 'trace-03' },
  'assignment': { track: 'trace', title: 'השמה אינה משוואה', reinforce: 'trace-05' },
  'trace-modular': { track: 'trace', title: 'פירוק הדרגתי', reinforce: 'trace-06' },
  // Errors
  'error-kinds': { track: 'errors', title: 'סוגי שגיאות', reinforce: 'errors-01' },
  syntax: { track: 'errors', title: 'שגיאות תחביר', reinforce: 'errors-02' },
  'sub-empty': { track: 'errors', title: 'חיסור ממונה ריק', reinforce: 'errors-03' },
  'infinite-loop': { track: 'errors', title: 'לולאה אינסופית', reinforce: 'errors-04' },
  meaning: { track: 'errors', title: 'משמעות לכל קלט', reinforce: 'errors-05' },
  determinism: { track: 'errors', title: 'תהליך דטרמיניסטי', reinforce: 'errors-07' },
  // Sets
  'set-notation': { track: 'sets', title: 'דרכי תיאור קבוצה', reinforce: 'sets-01' },
  'number-sets': { track: 'sets', title: 'ℕ, ℤ, ℝ ו־∅', reinforce: 'sets-02' },
  membership: { track: 'sets', title: 'שייכות', reinforce: 'sets-03' },
  inclusion: { track: 'sets', title: 'הכלה ושוויון', reinforce: 'sets-04' },
  'empty-set': { track: 'sets', title: 'הקבוצה הריקה', reinforce: 'sets-05' },
  'set-difference': { track: 'sets', title: 'הפרש קבוצות', reinforce: 'sets-06' },
  'ordered-pairs': { track: 'sets', title: 'זוגות סדורים ו־ℕ²', reinforce: 'sets-07' },
  // Functions
  'function-def': { track: 'functions', title: 'הגדרת פונקציה', reinforce: 'functions-01' },
  'arrow-diagram': { track: 'functions', title: 'דיאגרמות חצים', reinforce: 'functions-02' },
  'domain-range': { track: 'functions', title: 'תחום, טווח וכלל התאמה', reinforce: 'functions-03' },
  'domain-rule': { track: 'functions', title: 'תחום וטווח מול כלל ההתאמה', reinforce: 'functions-04' },
  'onto-injective': { track: 'functions', title: 'על וחד־חד־ערכית', reinforce: 'functions-05' },
  'discrete-continuous': { track: 'functions', title: 'בדיד מול רציף', reinforce: 'functions-06' },
  'multi-input': { track: 'functions', title: 'פונקציה של זוגות', reinforce: 'functions-07' },
};

/**
 * Misconception tags: what a wrong answer reveals. The tutor uses `text` to re-explain
 * and `skill` to count repeated mistakes.
 */
export const MISCONCEPTIONS: Record<string, { skill: string; text: string }> = {
  'loop-runs-once': { skill: 'while-loop', text: 'נראה שחשבת שהלולאה מתבצעת פעם אחת בלבד. WHILE חוזרת שוב ושוב — כל עוד המונה שבסוגריים אינו ריק.' },
  'off-by-one': { skill: 'while-loop', text: 'התשובה רחוקה בסיבוב אחד. ספרו: מספר הסיבובים שווה למספר הכדורים שהיו במונה הבקרה כשהגענו ללולאה.' },
  'loop-not-run': { skill: 'while-loop', text: 'נראה שדילגת על הלולאה. הבדיקה של WHILE מתבצעת לפני כל סיבוב — אם המונה אינו ריק, נכנסים.' },
  'sub-negative': { skill: 'sub-empty', text: 'מונה לעולם אינו שלילי. SUB ממונה ריק היא פעולה לא חוקית — הריצה נעצרת ואין פלט.' },
  'output-is-input': { skill: 'io-notation', text: 'כתבת את ערכי הקלט. השאלה מבקשת את הערכים בסוף הריצה (פלט).' },
  'equation-not-assignment': { skill: 'assignment', text: 'B = B + 2·A אינה משוואה. אגף ימין מחושב מהערכים שלפני הקטע, והתוצאה נכנסת ל־B.' },
  'substitute-new-value': { skill: 'assignment', text: 'הצבת את הערך החדש של A (אחרי האיפוס) בנוסחה של B. צריך להציב את ערך A שלפני הקטע.' },
  'helper-is-output': { skill: 'helper-counter', text: 'מונה העזר אינו חלק מהתוצאה המבוקשת. הוא רק עוזר לשמור ערך זמנית.' },
  'source-destroyed': { skill: 'transfer', text: 'שימו לב: לולאה שמעבירה כדורים מ־A מרוקנת את A. כדי לשמור עליו צריך מונה עזר.' },
  'zero-before-add': { skill: 'zeroing', text: 'כדי להכניס מספר קבוע צריך קודם לאפס את המונה, אחרת מוסיפים לערך שכבר היה בו.' },
  'param-name-matters': { skill: 'logo-parameters', text: 'שם הפרמטר אינו חשוב לתוצאה — חשוב איזה ערך נשלח בקריאה. השם מקומי לפרוצדורה.' },
  'definition-runs': { skill: 'logo-procedure', text: 'הגדרה (TO ... END) רק שומרת את הפרוצדורה. הצב זז רק כשקוראים לה בשמה.' },
  'turn-moves': { skill: 'logo-commands', text: 'פנייה (RT/LT) משנה רק את הכיוון של הצב — לא את המקום שלו.' },
  'pen-up-draws': { skill: 'logo-pen', text: 'כשהעט מורם (PU) הצב זז אבל לא מצייר קו.' },
  'stack-fifo': { skill: 'logo-stack', text: 'מחסנית עובדת לפי LIFO: האחרון שנכנס הוא הראשון שיוצא — המסגרת העליונה נסגרת ראשונה.' },
  'member-vs-subset': { skill: 'membership', text: '∈ מחבר איבר לקבוצה; ⊆ מחבר קבוצה לקבוצה. לדוגמה 2 ∈ ℕ אבל {2} ⊆ ℕ.' },
  'empty-member': { skill: 'empty-set', text: '∅ מוכלת בכל קבוצה, אבל היא איבר רק של קבוצה שבאמת מכילה אותה כאיבר.' },
  'difference-symmetric': { skill: 'set-difference', text: 'A − B אינה B − A. לוקחים את האיברים של A ומוציאים מהם את מה שנמצא ב־B.' },
  'order-in-set': { skill: 'set-notation', text: 'בקבוצה אין סדר ואין חזרות: {1,2} = {2,1} = {1,1,2}.' },
  'pair-unordered': { skill: 'ordered-pairs', text: 'בזוג סדור הסדר חשוב: (1,2) ≠ (2,1).' },
  'two-to-one-not-function': { skill: 'arrow-diagram', text: 'שני קלטים שמגיעים לאותו פלט — זה מותר בפונקציה. אסור רק שקלט אחד יגיע לשני פלטים.' },
  'range-must-be-covered': { skill: 'arrow-diagram', text: 'אין חובה שכל איבר בטווח יקבל חץ. החובה היא רק על איברי התחום: לכל אחד בדיוק חץ אחד.' },
  'missing-input-ok': { skill: 'function-def', text: 'כל איבר בתחום חייב לקבל תשובה. איבר בתחום בלי חץ — אין פונקציה.' },
  'rule-is-function': { skill: 'domain-range', text: 'כלל התאמה לבד אינו פונקציה. צריך גם תחום וגם טווח.' },
  'connect-discrete': { skill: 'discrete-continuous', text: 'בתחום בדיד (כמו ℕ) הגרף הוא נקודות נפרדות. אין לחבר ביניהן בקו.' },
  'syntax-vs-meaning': { skill: 'error-kinds', text: 'שגיאת תחביר היא בעיה בצורת הכתיבה. חוסר משמעות קורה בתוכנית כתובה נכון, רק עבור קלטים מסוימים.' },
  'limit-means-infinite': { skill: 'infinite-loop', text: 'זה שריצה ארוכה לא אומר שהיא אינסופית. צריך להראות שהמונה הנבדק לעולם לא יתרוקן.' },
};
