/**
 * Explanation layer for Algolem — deterministic Hebrew text.
 * It only *describes* what the engine did; it never computes results itself.
 */
import { cellName } from '@/engines/algolem/machine';
import type { MachineState, Program, StepEvent, Stmt } from '@/engines/algolem/types';
import { parseUnit } from '@/engines/algolem/parse';
import { LIBRARY_BY_NAME } from '@/engines/algolem/library';

export type Level = 1 | 2 | 3;

/** Wraps a left-to-right fragment ("4 → 5") in Unicode isolates so Hebrew text never reverses it. */
const ltr = (t: string) => `\u2066${t}\u2069`;
const balls = (n: number) => (n === 1 ? 'כדור אחד' : n === 0 ? 'אפס כדורים' : `${n} כדורים`);

/** Human label of a cell: "A", or "B (מונה עזר פרטי של TEN)". */
export function cellLabel(state: MachineState, cell: string): string {
  if (!cell.includes('@')) return cell;
  const serial = Number(cell.slice(cell.indexOf('@') + 1));
  const owner = state.frames.find((f) => f.serial === serial);
  return `${cellName(cell)} (מונה עזר של ${owner ? owner.unit : 'פרוצדורה'})`;
}

function alias(written: string, cell: string, unit: string, state: MachineState): string {
  if (unit === 'main' || written === cellName(cell)) return '';
  return ` (בתוך ${unit} השם ${written} מייצג את המונה ${cellLabel(state, cell)})`;
}

/** One-sentence explanation of a step, at three levels of detail. */
export function describeEvent(e: StepEvent, after: MachineState, level: Level = 2): string {
  switch (e.kind) {
    case 'add':
      if (level === 1) return `שמים כדור נוסף בכלי ${cellName(e.cell)}. היו בו ${balls(e.before)}, ועכשיו יש ${balls(e.after)}.`;
      if (level === 3) return `ADD (${e.written}): ${ltr(`${cellName(e.cell)} ← ${cellName(e.cell)} + 1`)}, כלומר ${ltr(`${e.before} → ${e.after}`)}.${alias(e.written, e.cell, e.unit, after)}`;
      return `ADD (${e.written}) מוסיפה כדור אחד למונה ${cellLabel(after, e.cell)}: ${ltr(`${e.before} → ${e.after}`)}.${alias(e.written, e.cell, e.unit, after)}`;
    case 'sub':
      if (level === 1) return `מוציאים כדור אחד מהכלי ${cellName(e.cell)}. היו בו ${balls(e.before)}, נשארו ${balls(e.after)}.`;
      if (level === 3) return `SUB (${e.written}): ${ltr(`${cellName(e.cell)} ← ${cellName(e.cell)} − 1`)} (מותר כי ${ltr(`${cellName(e.cell)} > 0`)}), כלומר ${ltr(`${e.before} → ${e.after}`)}.${alias(e.written, e.cell, e.unit, after)}`;
      return `SUB (${e.written}) מוציאה כדור אחד מהמונה ${cellLabel(after, e.cell)}: ${ltr(`${e.before} → ${e.after}`)}.${alias(e.written, e.cell, e.unit, after)}`;
    case 'while-enter':
      if (level === 1) return `בודקים: האם יש כדורים בכלי ${cellName(e.cell)}? יש ${balls(e.value)} — אז עושים את מה שבתוך הלולאה (פעם מספר ${e.iteration}).`;
      if (level === 3) return `בדיקת WHILE (${e.written}) בשורה ${e.line}: ${cellName(e.cell)} = ${e.value} > 0 ⇒ נכנסים לסיבוב ${e.iteration}.`;
      return `WHILE (${e.written}): המונה ${cellLabel(after, e.cell)} אינו ריק (${e.value}), ולכן מתחיל סיבוב ${e.iteration} של הלולאה.`;
    case 'while-exit':
      if (e.iteration === 0) {
        if (level === 1) return `בודקים: האם יש כדורים בכלי ${cellName(e.cell)}? אין — אז מדלגים על כל הלולאה וממשיכים אחרי ENDW.`;
        return `WHILE (${e.written}): המונה ${cellLabel(after, e.cell)} ריק כבר בבדיקה הראשונה — הלולאה לא מתבצעת אף פעם. ממשיכים אחרי ENDW (שורה ${e.endLine}).`;
      }
      if (level === 1) return `הכלי ${cellName(e.cell)} ריק עכשיו — הלולאה נגמרה אחרי ${e.iteration} פעמים.`;
      if (level === 3) return `בדיקת WHILE (${e.written}): ${cellName(e.cell)} = 0 ⇒ יציאה מהלולאה אחרי ${e.iteration} סיבובים; ממשיכים בשורה שאחרי ENDW (${e.endLine}).`;
      return `WHILE (${e.written}): המונה ${cellLabel(after, e.cell)} ריק — הלולאה מסתיימת אחרי ${e.iteration} סיבובים. ממשיכים אחרי ENDW.`;
    case 'endw':
      if (level === 1) return `סוף הסיבוב. חוזרים למעלה, לשורה ${e.whileLine}, לבדוק שוב.`;
      return `ENDW: סוף סיבוב ${e.iteration}. חוזרים לבדיקת ה־WHILE בשורה ${e.whileLine}.`;
    case 'call': {
      const parts = Object.entries(e.bind)
        .filter(([name]) => !e.bind[name].includes('@') || true)
        .map(([name, cell]) => (cell.includes('@') ? `${name} = מונה עזר חדש (מתחיל ב־0)` : name === cell ? `${name}` : ltr(`${name} ← ${cell}`)));
      if (level === 1) return `קוראים לפרוצדורה ${e.proc}: היא עושה את העבודה שלה, ואחר כך חוזרים לכאן. בתוכה: ${parts.join(', ')}.`;
      return `קריאה לפרוצדורה ${e.proc}: נפתחת מסגרת חדשה. השמות בתוכה: ${parts.join(', ')}.`;
    }
    case 'return':
      if (level === 1) return `הפרוצדורה ${e.proc} סיימה. חוזרים להמשך האלגוריתם.`;
      return `הפרוצדורה ${e.proc} הסתיימה: המסגרת שלה נסגרת (מוני העזר שלה נעלמים), וחוזרים ל${e.toUnit === 'main' ? 'אלגוריתם הראשי' : e.toUnit}.`;
    case 'done':
      return level === 1 ? 'סיימנו! הכמויות שנשארו בכלים הן התוצאה (הפלט).' : 'האלגוריתם הסתיים. הערכים שבמונים עכשיו הם ערכי הפלט.';
    case 'error':
      if (level === 1) return `אי אפשר להוציא כדור מכלי ריק! כאן הריצה נתקעת, ואין תוצאה.`;
      return e.error.message;
    case 'diverges': {
      const p = e.proof;
      if (p.reason === 'same-state')
        return level === 1
          ? 'חזרנו בדיוק לאותו מצב שכבר היינו בו. מכאן הכול יחזור על עצמו לנצח — הלולאה לא תיגמר.'
          : `הוכחה שהריצה אינסופית: בבדיקת ה־WHILE בשורה ${p.line} חזר בדיוק אותו מצב של כל המונים (צעד ${p.stepA} וצעד ${p.stepB}). המכונה דטרמיניסטית, ולכן מכאן הכול יחזור שוב ושוב.`;
      return level === 1
        ? `הלולאה רק מוסיפה כדורים למונה שהיא בודקת — הוא לעולם לא יתרוקן, והלולאה לא תיגמר.`
        : `הוכחה שהריצה אינסופית: בין שני ביקורים בבדיקת ה־WHILE בשורה ${p.line} אף מונה לא קטן, ואף מונה שגדל לא נמצא ריק בבדיקה. לכן אותו רצף פעולות יחזור שוב ושוב, והמונה ${cellName(p.cell)} לעולם לא יתרוקן.`;
    }
  }
}

/** Plain explanation of one line of Algolem code (for "תסביר כל שורת קוד"). */
export function explainLine(text: string): string {
  const t = text.replace(/\/\/.*$/, '').replace(/^\s*\d+\s*[.):]\s*/, '').trim();
  if (!t) return 'שורה ריקה.';
  const up = t.toUpperCase();
  let m = /^@\s*([A-Z][A-Z0-9_]*)\s*\(([^)]*)\)/.exec(up);
  if (m) {
    const params = m[2].split(',').map((s) => s.trim()).filter(Boolean);
    return `כותרת: מגדירים מילה חדשה בשם ${m[1]}${params.length ? ` שמקבלת ${params.length === 1 ? 'מונה' : params.length + ' מונים'}: ${params.join(', ')}` : ''}. ההוראות שאחריה הן גוף הפרוצדורה.`;
  }
  if ((m = /^ADD\s*\(\s*([A-Z][A-Z0-9_]*)\s*\)$/.exec(up))) return `מוסיפים כדור אחד למונה ${m[1]}.`;
  if ((m = /^SUB\s*\(\s*([A-Z][A-Z0-9_]*)\s*\)$/.exec(up))) return `מוציאים כדור אחד מהמונה ${m[1]} — מותר רק אם הוא לא ריק.`;
  if ((m = /^WHILE\s*\(\s*([A-Z][A-Z0-9_]*)\s*\)$/.exec(up))) return `תחילת לולאה: כל עוד המונה ${m[1]} אינו ריק — מבצעים את השורות עד ה־ENDW המתאים, ואז בודקים שוב.`;
  if (up === 'ENDW') return 'סוף גוף הלולאה: חוזרים לבדיקת ה־WHILE המתאים.';
  if ((m = /^([A-Z][A-Z0-9_]*)\s*\(([^)]*)\)$/.exec(up))) {
    const lib = LIBRARY_BY_NAME[m[1]];
    const args = m[2].split(',').map((s) => s.trim());
    return `קריאה לפרוצדורה ${m[1]} עם ${args.length === 1 ? 'המונה' : 'המונים'} ${args.join(', ')}${lib ? ` — ${lib.purpose}` : ''}.`;
  }
  return 'שורה זו אינה הוראה חוקית בשפת אלגולם.';
}

/** All lines with explanations; nested lines are marked with their loop. */
export function explainProgram(source: string): { line: number; text: string; explanation: string; depth: number }[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let depth = 0;
  return lines.map((text, i) => {
    const up = text.trim().toUpperCase();
    if (up.startsWith('ENDW')) depth = Math.max(0, depth - 1);
    const row = { line: i + 1, text, explanation: explainLine(text), depth };
    if (/^(\d+\s*[.):]\s*)?WHILE/.test(up)) depth++;
    return row;
  });
}

/** Short status sentence for the simulator header. */
export function statusText(state: MachineState, stoppedByLimit: boolean): string {
  if (state.status === 'done') return 'הריצה הסתיימה — יש פלט.';
  if (state.status === 'error') return 'הריצה נעצרה: חיסור ממונה ריק. אין פלט (חוסר משמעות).';
  if (state.status === 'diverges') return 'הוכח: הריצה אינסופית. אין פלט (חוסר משמעות).';
  if (stoppedByLimit) return 'הגענו למגבלת הצעדים. זה לא אומר שהתוכנית אינסופית — אפשר להמשיך.';
  return state.steps === 0 ? 'מוכן להרצה.' : `בוצעו ${state.steps} צעדים.`;
}

/** Predicts nothing — used by the tutor to describe *what a line will do* before it runs. */
export function previewNext(program: Program, state: MachineState): string {
  const f = state.frames[state.frames.length - 1];
  const unit = f.unit === 'main' ? program.main : program.procs[f.unit];
  const ins = unit.code[f.pc];
  if (!ins) return '';
  switch (ins.op) {
    case 'add':
      return `השורה הבאה: ADD (${ins.arg}).`;
    case 'sub':
      return `השורה הבאה: SUB (${ins.arg}).`;
    case 'while':
      return `השורה הבאה: בדיקת WHILE (${ins.arg}).`;
    case 'endw':
      return 'השורה הבאה: ENDW — חזרה לבדיקה.';
    case 'call':
      return `השורה הבאה: קריאה ל־${ins.proc} (${ins.args.join(', ')}).`;
    case 'end':
      return f.unit === 'main' ? 'סוף האלגוריתם.' : `סוף הפרוצדורה ${f.unit}.`;
  }
}

/** Collects which statements a code uses — for glossary links. */
export function usedWords(source: string): string[] {
  const r = parseUnit(source, null);
  if (!r.unit) return [];
  const out = new Set<string>();
  const walk = (ss: Stmt[]) =>
    ss.forEach((s) => {
      if (s.type === 'while') {
        out.add('WHILE');
        walk(s.body);
      } else if (s.type === 'call') out.add(s.name);
      else out.add(s.type.toUpperCase());
    });
  walk(r.unit.body);
  return [...out];
}
