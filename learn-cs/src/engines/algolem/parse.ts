import type { AlgolemSyntaxError, Ident, Stmt, SyntaxErrorCode, Unit } from './types';

/** Elementary words of Algolem. They can never be used as counter or procedure names. */
export const KEYWORDS = new Set(['ADD', 'SUB', 'WHILE', 'ENDW']);

type TokKind = 'id' | 'num' | '(' | ')' | ',' | '@';
interface Tok {
  k: TokKind;
  v: string;
  line: number;
  col: number;
}

const MAX_ERRORS = 12;

function err(
  code: SyntaxErrorCode,
  unit: string | null,
  line: number,
  col: number,
  message: string,
  hint?: string,
): AlgolemSyntaxError {
  return { kind: 'syntax', code, unit, line, col, message, hint };
}

/**
 * Splits source text into tokens.
 * Accepted extras so that code copied from the slides works:
 *  - a leading line number such as `1.` / `12)` / `3:` is ignored;
 *  - `//` or `#` start a comment until the end of the line.
 */
export function tokenize(source: string, unit: string | null, errors: AlgolemSyntaxError[]): Tok[] {
  const toks: Tok[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  lines.forEach((raw, i) => {
    const line = i + 1;
    let text = raw;
    const cut = text.search(/\/\/|#/);
    if (cut >= 0) text = text.slice(0, cut);
    const num = /^(\s*)(\d+)\s*[.):]\s*/.exec(text);
    if (num) text = ' '.repeat(num[0].length) + text.slice(num[0].length);
    let c = 0;
    while (c < text.length) {
      const ch = text[c];
      if (/\s/.test(ch)) {
        c++;
        continue;
      }
      if (/[A-Za-z]/.test(ch)) {
        let e = c + 1;
        while (e < text.length && /[A-Za-z0-9_]/.test(text[e])) e++;
        toks.push({ k: 'id', v: text.slice(c, e).toUpperCase(), line, col: c + 1 });
        c = e;
        continue;
      }
      if (/[0-9]/.test(ch)) {
        let e = c + 1;
        while (e < text.length && /[0-9]/.test(text[e])) e++;
        toks.push({ k: 'num', v: text.slice(c, e), line, col: c + 1 });
        c = e;
        continue;
      }
      if (ch === '(' || ch === ')' || ch === ',' || ch === '@') {
        toks.push({ k: ch, v: ch, line, col: c + 1 });
        c++;
        continue;
      }
      if (errors.length < MAX_ERRORS) {
        const hebrew = /[֐-׿]/.test(ch);
        errors.push(
          err(
            'unexpected-char',
            unit,
            line,
            c + 1,
            hebrew ? 'אותיות עבריות אינן חלק מהקוד' : `התו "${ch}" אינו חלק משפת אלגולם`,
            hebrew
              ? 'כתבו את הפקודות באותיות לועזיות. להערות אפשר להשתמש ב־// בסוף השורה.'
              : 'בשפה יש רק שמות, מספרי שורות, סוגריים עגולים, פסיקים והסימן @.',
          ),
        );
      }
      c++;
    }
  });
  return toks;
}

/** Parses one code unit (the main algorithm or one procedure definition). */
export function parseUnit(source: string, unitLabel: string | null = null): { unit: Unit | null; errors: AlgolemSyntaxError[] } {
  const errors: AlgolemSyntaxError[] = [];
  const lineCount = source.replace(/\r\n?/g, '\n').split('\n').length;
  const toks = tokenize(source, unitLabel, errors);
  let p = 0;
  const peek = (o = 0): Tok | undefined => toks[p + o];

  let name: string | null = null;
  let headerLine: number | null = null;
  const params: Ident[] = [];
  const label = () => name ?? unitLabel;

  /** Skip the rest of the current line (error recovery). */
  const resync = (line: number) => {
    while (p < toks.length && toks[p].line === line) p++;
  };

  // ---- optional header:  @ NAME ( P1 , P2 , ... )
  if (peek()?.k === '@') {
    const at = toks[p++];
    headerLine = at.line;
    const nameTok = peek();
    if (!nameTok || nameTok.k !== 'id' || nameTok.line !== at.line) {
      errors.push(err('bad-header', unitLabel, at.line, at.col, 'אחרי הסימן @ צריך לבוא שם הפרוצדורה', 'לדוגמה: @ ZERO (A)'));
      resync(at.line);
    } else {
      p++;
      if (KEYWORDS.has(nameTok.v)) {
        errors.push(err('reserved-name', unitLabel, nameTok.line, nameTok.col, `אי אפשר לקרוא לפרוצדורה בשם השמור ${nameTok.v}`));
      }
      name = nameTok.v;
      const open = peek();
      if (!open || open.k !== '(') {
        errors.push(
          err('expected-open-paren', label(), nameTok.line, nameTok.col + nameTok.v.length, 'אחרי שם הפרוצדורה צריך לבוא סוגר פותח (', 'לדוגמה: @ MOVE (A,B)'),
        );
        resync(at.line);
      } else {
        p++;
        let expectName = true;
        while (p < toks.length) {
          const t = toks[p];
          if (t.k === ')') {
            if (!expectName || params.length === 0) {
              p++;
              break;
            }
            errors.push(err('expected-counter', label(), t.line, t.col, 'חסר שם משתנה לפני הסוגר', undefined));
            p++;
            break;
          }
          if (expectName && t.k === 'id') {
            if (KEYWORDS.has(t.v)) errors.push(err('reserved-name', label(), t.line, t.col, `${t.v} היא מילה שמורה ואינה יכולה לשמש שם של משתנה`));
            else if (params.some((q) => q.name === t.v))
              errors.push(err('duplicate-param', label(), t.line, t.col, `המשתנה ${t.v} מופיע פעמיים בכותרת`));
            params.push({ name: t.v, line: t.line, col: t.col });
            expectName = false;
            p++;
            continue;
          }
          if (!expectName && t.k === ',') {
            expectName = true;
            p++;
            continue;
          }
          if (t.k === 'num') {
            errors.push(err('number-as-counter', label(), t.line, t.col, 'בכותרת כותבים שמות של משתנים, לא מספרים'));
          } else {
            errors.push(err('bad-header', label(), t.line, t.col, 'הכותרת צריכה להיראות כך: @ NAME (A,B) — שמות מופרדים בפסיקים'));
          }
          resync(t.line);
          break;
        }
      }
    }
  }

  // ---- statements
  const parseBlock = (inWhile: Tok | null): { body: Stmt[]; endLine: number } => {
    const body: Stmt[] = [];
    while (p < toks.length && errors.length < MAX_ERRORS) {
      const t = toks[p];
      if (t.k === '@') {
        errors.push(
          err('header-not-first', label(), t.line, t.col, 'הסימן @ יכול להופיע רק בשורה הראשונה, בכותרת של הגדרה', 'כל פרוצדורה נכתבת בנפרד, עם כותרת אחת בראשה.'),
        );
        resync(t.line);
        continue;
      }
      if (t.k !== 'id') {
        errors.push(
          err(
            'unexpected-token',
            label(),
            t.line,
            t.col,
            t.k === 'num' ? `המספר ${t.v} לא צפוי כאן` : `הסימן "${t.v}" לא צפוי כאן`,
            'כל שורה מתחילה בהוראה: ADD, SUB, WHILE, ENDW או שם של פרוצדורה.',
          ),
        );
        resync(t.line);
        continue;
      }
      if (t.v === 'ENDW') {
        p++;
        if (inWhile) return { body, endLine: t.line };
        errors.push(err('endw-without-while', label(), t.line, t.col, 'ENDW בלי WHILE פתוח', 'לכל ENDW חייב להתאים WHILE שנפתח לפניו.'));
        continue;
      }
      // every other statement has the form WORD ( args )
      const word = t;
      p++;
      const open = peek();
      if (!open || open.k !== '(' ) {
        errors.push(
          err(
            'expected-open-paren',
            label(),
            word.line,
            word.col + word.v.length,
            KEYWORDS.has(word.v) ? `אחרי ${word.v} צריך לבוא סוגר עם שם של מונה` : `אחרי ${word.v} צריך לבוא סוגר (`,
            KEYWORDS.has(word.v) ? `לדוגמה: ${word.v} (A)` : 'קריאה לפרוצדורה נכתבת כך: ZERO (A)',
          ),
        );
        resync(word.line);
        continue;
      }
      p++;
      const args: Ident[] = [];
      let ok = true;
      let expectName = true;
      for (;;) {
        const a = peek();
        if (!a) {
          errors.push(err('expected-close-paren', label(), word.line, word.col, 'חסר סוגר סוגר )'));
          ok = false;
          break;
        }
        if (a.k === ')') {
          if (expectName && args.length > 0) {
            errors.push(err('expected-counter', label(), a.line, a.col, 'חסר שם מונה אחרי הפסיק'));
            ok = false;
          }
          p++;
          break;
        }
        if (expectName && a.k === 'id') {
          if (KEYWORDS.has(a.v)) {
            errors.push(err('reserved-name', label(), a.line, a.col, `${a.v} היא מילה שמורה ואינה יכולה לשמש שם של מונה`));
            ok = false;
          }
          args.push({ name: a.v, line: a.line, col: a.col });
          expectName = false;
          p++;
          continue;
        }
        if (!expectName && a.k === ',') {
          expectName = true;
          p++;
          continue;
        }
        if (a.k === 'num') {
          errors.push(
            err('number-as-counter', label(), a.line, a.col, `בתוך הסוגריים כותבים שם של מונה, לא מספר (${a.v})`, 'כדי להכניס מספר למונה משתמשים בפרוצדורות כמו FIVE (A) או בכמה ADD.'),
          );
        } else {
          errors.push(err('expected-close-paren', label(), a.line, a.col, 'חסר סוגר סוגר ) או פסיק בין שמות'));
        }
        ok = false;
        resync(a.line);
        break;
      }
      if (!ok) continue;
      if (word.v === 'ADD' || word.v === 'SUB' || word.v === 'WHILE') {
        if (args.length !== 1) {
          errors.push(
            err('expected-counter', label(), word.line, word.col, `${word.v} פועלת על מונה אחד בדיוק`, `לדוגמה: ${word.v} (A)`),
          );
          if (word.v === 'WHILE') parseBlock(word); // consume the body to stay in sync
          continue;
        }
        if (word.v === 'WHILE') {
          const inner = parseBlock(word);
          body.push({ type: 'while', arg: args[0], body: inner.body, line: word.line, endLine: inner.endLine });
        } else {
          body.push({ type: word.v === 'ADD' ? 'add' : 'sub', arg: args[0], line: word.line });
        }
        continue;
      }
      body.push({ type: 'call', name: word.v, args, line: word.line, col: word.col });
    }
    if (inWhile && errors.length < MAX_ERRORS) {
      errors.push(
        err('while-without-endw', label(), inWhile.line, inWhile.col, 'ללולאת WHILE הזו אין ENDW סוגר', 'הוסיפו ENDW בסוף גוף הלולאה.'),
      );
    }
    return { body, endLine: toks.length ? toks[toks.length - 1].line : 1 };
  };

  const { body } = parseBlock(null);
  if (errors.length) return { unit: null, errors };
  return {
    unit: { name, params, body, headerLine, source, lineCount },
    errors: [],
  };
}
