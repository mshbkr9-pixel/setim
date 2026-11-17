import type { Lesson } from '../types';

/**
 * MODEL LESSON — the quality bar for every lesson in the course.
 * (Content writers: copy this structure. The algolem track file re-exports this lesson as algolem-03.)
 */
export const exampleLesson: Lesson = {
  id: 'algolem-03',
  track: 'algolem',
  order: 3,
  title: 'לולאת WHILE',
  subtitle: 'לחזור על פעולות כל עוד מונה הבקרה אינו ריק',
  minutes: 12,
  difficulty: 1,
  prerequisites: ['algolem-02'],
  sources: { photos: [52, 51, 50], guidePages: [5, 6], note: 'שקף "לולאה בשפת אלגולם" ודוגמאות 1–2 מהמצגת "פעולות ראשונות"' },
  confidence: 'high',
  skills: ['while-loop'],

  intro: {
    what: 'נלמד את ההוראה השלישית והאחרונה של אלגולם: **לולאה**. היא מאפשרת לחזור על אותן פעולות שוב ושוב.',
    why: 'עם ADD ו־SUB לבד אפשר לשנות מונה רק בכדור אחד לכל שורה. לולאה מאפשרת לכתוב תוכנית קצרה שעובדת על כל כמות של כדורים — 5 או 5,000.',
    goals: [
      'לקרוא לולאת `WHILE ... ENDW` ולהבין מתי נכנסים אליה ומתי יוצאים ממנה',
      'לספור כמה סיבובים תבצע לולאה',
      'לדעת מה יהיו ערכי המונים בסוף הלולאה',
    ],
  },

  glossary: [
    { term: 'לולאה', simple: 'קבוצת הוראות שחוזרים עליה שוב ושוב, כמו להקיף מסלול ריצה כמה פעמים.' },
    { term: 'מונה הבקרה', simple: 'המונה שכתוב בסוגריים אחרי WHILE. לפי מה שיש בו מחליטים אם להמשיך.', photos: [52] },
    { term: 'גוף הלולאה', simple: 'השורות שבין `WHILE (...)` לבין `ENDW` — מה שעושים בכל סיבוב.' },
    { term: 'סיבוב', simple: 'פעם אחת שבה מבצעים את כל גוף הלולאה מההתחלה ועד הסוף.' },
    { term: 'ENDW', simple: 'סימן הסוף של הלולאה (END WHILE). כשמגיעים אליו חוזרים למעלה לבדוק שוב.' },
  ],

  explain: {
    beginner:
      'תארו לעצמכם שאומרים לכם: **"כל עוד יש כדורים בכלי R1 — העבירו כדור אחד ל־R2"**.\n' +
      'אתם מסתכלים בכלי: יש כדורים? מעבירים אחד. מסתכלים שוב: עדיין יש? מעבירים עוד אחד.\n' +
      'כשהכלי ריק — עוצרים. זו בדיוק לולאת WHILE.',
    regular:
      '`WHILE (X)` בודקת את המונה X. אם הוא **אינו ריק** — מבצעים את גוף הלולאה עד `ENDW`, ואז חוזרים לבדיקה.\n' +
      'אם X **ריק** — קופצים אל אחרי `ENDW` וממשיכים משם.\n' +
      'הבדיקה מתבצעת **לפני כל סיבוב**, ולכן אם X ריק כבר מההתחלה — הלולאה לא מתבצעת אף פעם.',
    advanced:
      'סמנטיקה: `WHILE (X) S ENDW` ≡ "אם X > 0: בצע את S וחזור לבדיקה; אחרת: המשך". ' +
      'אם בכל סיבוב S מקטין את X בדיוק ב־1, ואין שינוי אחר ב־X, מספר הסיבובים הוא ערכו של X בכניסה ללולאה. ' +
      'כך מתרגמים את השינוי בסיבוב אחד (למשל $R1 \\to R1-1,\\; R2 \\to R2+1$) לנוסחת פלט: $R1 = 0,\\; R2 = R2 + R1$ (בערכי הכניסה).',
  },

  visual: {
    kind: 'algolem',
    code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW',
    inputs: { R1: 5, R2: 2 },
    panels: ['trace'],
    caption: 'לחצו "צעד" כדי לראות כל בדיקה, כל כדור שעובר וכל חזרה ל־WHILE.',
  },

  fromSource: [
    { text: 'לולאה בשפת אלגולם: חזור על גוף הלולאה, כל עוד מונה הבקרה $R_x$ אינו ריק.', photos: [52] },
    { text: 'דוגמה 2 — הוספת תוכן מונה אחד למונה אחר: `WHILE (R1)` / `ADD (R2)` (הוסף 1 ל־R2) / `SUB (R1)` (הורד 1 מ־R1) / `ENDW`.', photos: [50] },
  ],

  walkthrough: {
    title: 'מעקב אחרי `WHILE (R1) ADD (R2) SUB (R1) ENDW` עם R1 = 2, R2 = 0',
    origin: 'explanation',
    steps: [
      { text: 'בדיקה: R1 = 2, כלומר אינו ריק — נכנסים לסיבוב 1.', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', lang: 'algolem', highlight: [1], state: { R1: 2, R2: 0 } },
      { text: 'ADD (R2): כדור נוסף ב־R2.', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', lang: 'algolem', highlight: [2], state: { R1: 2, R2: 1 } },
      { text: 'SUB (R1): כדור יוצא מ־R1. בסוף הסיבוב: כדור אחד "עבר" מ־R1 ל־R2.', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', lang: 'algolem', highlight: [3], state: { R1: 1, R2: 1 } },
      { text: 'ENDW: חוזרים לבדיקה. R1 = 1 — עדיין לא ריק, סיבוב 2.', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', lang: 'algolem', highlight: [4, 1], state: { R1: 1, R2: 1 } },
      { text: 'ADD (R2), SUB (R1): עוד כדור עובר.', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', lang: 'algolem', highlight: [2, 3], state: { R1: 0, R2: 2 } },
      { text: 'חוזרים לבדיקה: R1 = 0 — ריק! יוצאים מהלולאה. היו 2 סיבובים, בדיוק כמו מספר הכדורים שהיו ב־R1 בהתחלה.', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', lang: 'algolem', highlight: [1], state: { R1: 0, R2: 2 } },
    ],
  },

  tryIt: {
    task: 'שנו את ערכי ההתחלה (למשל R1 = 0, או R1 = 7) והריצו. כמה סיבובים יהיו? מה קורה כש־R1 ריק מההתחלה? נסו גם להוסיף שורה `ADD (R2)` שנייה בתוך הלולאה.',
    widget: {
      kind: 'algolem',
      code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW',
      inputs: { R1: 4, R2: 1 },
      editable: true,
      panels: ['trace'],
    },
  },

  moreExamples: [
    {
      title: 'דוגמה 3 מהמצגת: הוספת פי שניים מתוכן מונה אחד למונה אחר',
      origin: 'source',
      widget: { kind: 'algolem', code: 'WHILE (R1)\n   ADD (R2)\n   ADD (R2)\n   SUB (R1)\nENDW', inputs: { R1: 3, R2: 0 }, panels: ['trace'] },
      text: 'בכל סיבוב R2 גדל ב־2 ו־R1 קטן ב־1, ולכן בסוף $R2 = R2 + 2 \\cdot R1$ (בערכי ההתחלה).',
    },
    {
      title: 'לולאה שלא מתבצעת בכלל',
      origin: 'new',
      widget: { kind: 'algolem', code: 'WHILE (A)\n   ADD (B)\n   SUB (A)\nENDW', inputs: { A: 0, B: 6 } },
      text: 'A ריק כבר בבדיקה הראשונה — מדלגים ישר אחרי ENDW, ו־B נשאר 6.',
    },
  ],

  check: {
    id: 'algolem-03-check',
    track: 'algolem',
    lesson: 'algolem-03',
    type: 'predict',
    skills: ['while-loop'],
    difficulty: 1,
    origin: 'new',
    prompt: 'מה יהיו ערכי המונים בסוף הריצה?',
    program: { code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', inputs: { R1: 3, R2: 4 } },
    ask: ['R1', 'R2'],
    hints: [
      'בכל סיבוב: כמה כדורים נוספים ל־R2, וכמה יוצאים מ־R1?',
      'כמה סיבובים יהיו? הלולאה נעצרת כש־R1 מתרוקן.',
      'R1 מתחיל ב־3 וקטן ב־1 בכל סיבוב — כלומר 3 סיבובים. בכל אחד R2 גדל ב־1.',
    ],
    explanation: '3 סיבובים: בכל סיבוב כדור אחד עובר מ־R1 ל־R2. בסוף R1 = 0 ו־R2 = 4 + 3 = 7.',
  },

  summary: {
    learned: [
      '`WHILE (X) ... ENDW` חוזרת על הגוף כל עוד X אינו ריק',
      'הבדיקה נעשית לפני כל סיבוב — אם X ריק מההתחלה, אין אף סיבוב',
      'כשכל סיבוב מוציא כדור אחד ממונה הבקרה, מספר הסיבובים = ערכו בכניסה ללולאה',
    ],
    next: 'בשיעור הבא נשתמש בלולאה כדי להעביר את כל התוכן של מונה אחד למונה אחר — ונראה מה קורה למונה המקורי.',
  },
};
