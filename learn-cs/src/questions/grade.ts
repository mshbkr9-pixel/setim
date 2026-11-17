/**
 * Question engine: correct answers and grading — computed by the deterministic engines.
 * No UI here.
 */
import type { Question } from '@/content/types';
import { compile, createMachine, run, visibleCounters, type Program } from '@/engines/algolem';
import { buildTrace, iterationTable, lineTable, roundFormula, type TableColumn } from '@/engines/algolem/trace';
import { execLogo, type LogoState } from '@/engines/logo';
import { evalSetExpr, formatSet, isEqual, parseSetAnswer } from '@/engines/sets';
import { analyzeArrows } from '@/engines/functions';

export type Answer =
  | { type: 'mcq'; picks: number[] }
  | { type: 'predict'; values: Record<string, string>; noOutput: boolean }
  | { type: 'complete-code'; option: number }
  | { type: 'find-bug'; lines: number[] }
  | { type: 'trace-fill'; cells: Record<string, string> }
  | { type: 'order'; order: number[] }
  | { type: 'build'; code: string }
  | { type: 'sim-goal'; state: Record<string, number> }
  | { type: 'match'; mapping: Record<number, number> }
  | { type: 'numeric'; value: string }
  | { type: 'set-answer'; text: string }
  | { type: 'arrows-classify'; picks: Record<string, boolean | undefined> }
  | { type: 'logo-state'; values: Record<string, string> };

export interface GradeResult {
  correct: boolean;
  /** 0..1 for multi-part answers. */
  score: number;
  /** Specific Hebrew feedback lines (what is wrong — never the full answer). */
  feedback: string[];
  misconception?: string;
  /** Cells/items that are wrong (for highlighting). */
  wrong?: string[];
}

// ------------------------------------------------------------------ Algolem helpers

export function algolemOutcome(code: string, inputs: Record<string, number>, procedures?: string[]) {
  const c = compile({ main: code, procedures });
  if (!c.ok) return null;
  const r = run(c.program, createMachine(c.program, inputs), { maxSteps: 200_000 });
  return { program: c.program, result: r, out: visibleCounters(c.program, r.state) };
}

export function traceColumns(q: Extract<Question, { type: 'trace-fill' }>): { program: Program; columns: TableColumn[]; counters: string[] } | null {
  const c = compile({ main: q.program.code, procedures: q.program.procedures });
  if (!c.ok) return null;
  const t = buildTrace(c.program, q.program.inputs, 3000);
  return { program: c.program, columns: q.mode === 'lines' ? lineTable(t) : iterationTable(t), counters: t.counters };
}

export function traceBlanks(q: Extract<Question, { type: 'trace-fill' }>, columns: TableColumn[], counters: string[]): Set<string> {
  if (q.blanks?.length) return new Set(q.blanks.map((b) => `${b.col}:${b.counter}`));
  const s = new Set<string>();
  columns.forEach((c, i) => c.kind !== 'input' && c.values && counters.forEach((n) => s.add(`${i}:${n}`)));
  return s;
}

function runTests(code: string, tests: { inputs: Record<string, number>; expect: Record<string, number> | 'no-output' }[], procedures?: string[]) {
  const c = compile({ main: code, procedures });
  if (!c.ok) return { ok: false, lines: c.errors.slice(0, 3).map((e) => `שורה ${e.line}: ${e.message}`), compileError: true };
  const lines: string[] = [];
  let ok = true;
  for (const t of tests) {
    const r = run(c.program, createMachine(c.program, t.inputs), { maxSteps: 200_000 });
    const inp = Object.entries(t.inputs).map(([k, v]) => `${k}=${v}`).join(', ');
    if (t.expect === 'no-output') {
      if (r.stoppedBy === 'done') { ok = false; lines.push(`בקלט ${inp} התקבל פלט, אבל ציפינו שלא יהיה.`); }
      continue;
    }
    if (r.stoppedBy !== 'done') {
      ok = false;
      lines.push(`בקלט ${inp}: ${r.stoppedBy === 'error' ? 'חיסור ממונה ריק' : r.stoppedBy === 'diverges' ? 'הלולאה אינה מסתיימת' : 'הריצה לא הסתיימה'}.`);
      continue;
    }
    const out = visibleCounters(c.program, r.state);
    const bad = Object.entries(t.expect).filter(([k, v]) => out[k] !== v);
    if (bad.length) { ok = false; lines.push(`בקלט ${inp}: ${bad.map(([k, v]) => `${k} יצא ${out[k] ?? '—'} במקום ${v}`).join(', ')}.`); }
  }
  return { ok, lines, compileError: false };
}

function usesOnly(code: string, allowed: string[]): string | null {
  const words = code.toUpperCase().replace(/\/\/.*$/gm, '').match(/[A-Z][A-Z0-9_]*(?=\s*\()/g) ?? [];
  const bad = [...new Set(words)].filter((w) => !allowed.includes(w));
  return bad.length ? bad.join(', ') : null;
}

// ------------------------------------------------------------------ LOGO helpers

export function logoFinal(code: string, runLine = ''): LogoState | null {
  const r = execLogo(code, runLine);
  return r.ok && r.stoppedBy === 'done' ? r.state : null;
}

// ------------------------------------------------------------------ correct answer text (shown only on "הצג פתרון")

export function solutionText(q: Question): string {
  switch (q.type) {
    case 'mcq':
      return q.choices.filter((c) => c.correct).map((c) => c.text).join(' · ');
    case 'predict': {
      const o = algolemOutcome(q.program.code, q.program.inputs, q.program.procedures);
      if (!o) return '—';
      if (o.result.stoppedBy !== 'done') return o.result.stoppedBy === 'error' ? 'אין פלט: יש חיסור ממונה ריק.' : 'אין פלט: הלולאה אינה מסתיימת.';
      return q.ask.map((k) => `${k} = ${o.out[k]}`).join(', ');
    }
    case 'complete-code':
      return q.options.find((o) => runTests(q.template.replace('___', o), q.tests, q.procedures).ok) ?? '—';
    case 'find-bug':
      return `שורה ${q.bugLines.join(', ')}`;
    case 'trace-fill':
      return 'הטבלה המלאה מוצגת למטה.';
    case 'order':
      return q.items.map((t, i) => `${i + 1}. ${t}`).join('\n');
    case 'build':
      return q.solution;
    case 'sim-goal':
      return Object.entries(q.target).map(([k, v]) => `${k} = ${v}`).join(', ');
    case 'match':
      return q.pairs.map(([a, b]) => `${a} ↔ ${b}`).join('\n');
    case 'numeric':
      return `${q.answer}${q.unit ? ' ' + q.unit : ''}`;
    case 'set-answer':
      return `${q.expr} = ${formatSet(evalSetExpr(q.expr, q.sets))}`;
    case 'arrows-classify': {
      const r = analyzeArrows(q.domain, q.codomain, q.arrows);
      const names = { function: 'פונקציה', injective: 'חד־חד־ערכית', surjective: 'על' } as const;
      return q.ask.map((k) => `${names[k]}: ${(k === 'function' ? r.isFunction : k === 'injective' ? r.injective : r.surjective) ? 'כן' : 'לא'}`).join(' · ');
    }
    case 'logo-state': {
      const s = logoFinal(q.code, q.run);
      if (!s) return '—';
      const vals: Record<string, string> = { x: String(s.turtle.x), y: String(s.turtle.y), heading: String(s.turtle.heading), pen: s.turtle.pen ? 'למטה' : 'למעלה', lines: String(s.segments.length) };
      return q.ask.map((k) => `${LOGO_ASK[k]}: ${vals[k]}`).join(' · ');
    }
  }
}

export const LOGO_ASK = { x: 'x', y: 'y', heading: 'כיוון (מעלות)', pen: 'מצב העט', lines: 'מספר קווים שצוירו' } as const;

// ------------------------------------------------------------------ grading

const num = (s: string | undefined) => (s === undefined || s.trim() === '' ? NaN : Number(s.trim()));

export function grade(q: Question, a: Answer): GradeResult {
  switch (q.type) {
    case 'mcq': {
      if (a.type !== 'mcq') break;
      const correctIdx = q.choices.map((c, i) => (c.correct ? i : -1)).filter((i) => i >= 0);
      const picks = [...a.picks].sort();
      const ok = picks.length === correctIdx.length && picks.every((p, i) => p === correctIdx[i]);
      if (ok) return { correct: true, score: 1, feedback: [] };
      const wrongPick = a.picks.find((p) => !q.choices[p]?.correct);
      const ch = wrongPick !== undefined ? q.choices[wrongPick] : undefined;
      const fb = ch?.feedback ? [ch.feedback] : q.multi && a.picks.every((p) => q.choices[p]?.correct) ? ['בחרתם רק חלק מהתשובות הנכונות.'] : [];
      return { correct: false, score: 0, feedback: fb, misconception: ch?.misconception };
    }
    case 'predict': {
      if (a.type !== 'predict') break;
      const o = algolemOutcome(q.program.code, q.program.inputs, q.program.procedures);
      if (!o) return { correct: false, score: 0, feedback: ['שגיאה בשאלה'] };
      const ended = o.result.stoppedBy === 'done';
      if (!ended) {
        if (a.noOutput) return { correct: true, score: 1, feedback: [] };
        return {
          correct: false,
          score: 0,
          feedback: [o.result.stoppedBy === 'error' ? 'במהלך הריצה מתבצעת פעולה לא חוקית. נסו לעקוב צעד אחרי צעד: האם כל SUB מתבצע על מונה שיש בו כדור?' : 'בדקו אם הלולאה באמת מגיעה לסיום — האם המונה שבסוגריים של WHILE מתרוקן?'],
          misconception: o.result.stoppedBy === 'error' ? 'sub-negative' : 'limit-means-infinite',
        };
      }
      if (a.noOutput) return { correct: false, score: 0, feedback: ['לריצה הזו יש פלט — היא מסתיימת בלי פעולה לא חוקית.'] };
      const wrong = q.ask.filter((k) => num(a.values[k]) !== o.out[k]);
      if (!wrong.length) return { correct: true, score: 1, feedback: [] };
      // diagnose
      const given = Object.fromEntries(q.ask.map((k) => [k, num(a.values[k])]));
      const same = (vals: Record<string, number>) => q.ask.every((k) => given[k] === vals[k]);
      let misconception: string | undefined;
      const inputs = Object.fromEntries(q.ask.map((k) => [k, q.program.inputs[k] ?? 0]));
      if (same(inputs)) misconception = 'output-is-input';
      else {
        const t = buildTrace(o.program, q.program.inputs, 5000);
        const rounds = iterationTable(t).filter((c) => c.kind === 'iteration');
        const f = roundFormula(t);
        if (rounds.length > 1 && rounds[0].values && same(rounds[0].values)) misconception = 'loop-runs-once';
        else if (f) {
          const minus = Object.fromEntries(q.ask.map((k) => [k, o.out[k] - (f.delta[k] ?? 0)]));
          const plus = Object.fromEntries(q.ask.map((k) => [k, o.out[k] + (f.delta[k] ?? 0)]));
          if (same(minus) || same(plus)) misconception = 'off-by-one';
        }
        if (!misconception && Object.values(given).some((v) => v < 0)) misconception = 'sub-negative';
      }
      return { correct: false, score: (q.ask.length - wrong.length) / q.ask.length, feedback: [wrong.length < q.ask.length ? `חלק מהערכים נכונים. בדקו שוב את: ${wrong.join(', ')}.` : 'הערכים עדיין לא נכונים.'], misconception, wrong };
    }
    case 'complete-code': {
      if (a.type !== 'complete-code') break;
      const r = runTests(q.template.replace('___', q.options[a.option] ?? ''), q.tests, q.procedures);
      return r.ok ? { correct: true, score: 1, feedback: [] } : { correct: false, score: 0, feedback: ['עם ההשלמה הזו האלגוריתם לא עושה את מה שצריך:', ...r.lines.slice(0, 2)] };
    }
    case 'find-bug': {
      if (a.type !== 'find-bug') break;
      const ok = a.lines.length === q.bugLines.length && a.lines.every((l) => q.bugLines.includes(l));
      if (ok) return { correct: true, score: 1, feedback: [] };
      const hit = a.lines.filter((l) => q.bugLines.includes(l)).length;
      return { correct: false, score: hit / q.bugLines.length, feedback: [hit ? 'מצאתם חלק מהבעיה, אבל לא את כולה (או סימנתם גם שורה תקינה).' : 'השורה שסימנתם תקינה. חפשו שורה אחרת.'] };
    }
    case 'trace-fill': {
      if (a.type !== 'trace-fill') break;
      const t = traceColumns(q);
      if (!t) return { correct: false, score: 0, feedback: ['שגיאה בשאלה'] };
      const blanks = [...traceBlanks(q, t.columns, t.counters)];
      const wrong = blanks.filter((k) => {
        const [i, n] = k.split(':');
        return num(a.cells[k]) !== t.columns[Number(i)].values?.[n];
      });
      if (!wrong.length) return { correct: true, score: 1, feedback: [] };
      const first = wrong.map((k) => Number(k.split(':')[0])).sort((x, y) => x - y)[0];
      const col = t.columns[first];
      return { correct: false, score: (blanks.length - wrong.length) / blanks.length, feedback: [`${wrong.length} תאים שגויים או ריקים. הטעות הראשונה בעמודה "${col.group}${col.label ? ' · ' + col.label : ''}" — התחילו לעקוב משם.`], wrong };
    }
    case 'order': {
      if (a.type !== 'order') break;
      const ok = a.order.every((v, i) => v === i);
      const firstWrong = a.order.findIndex((v, i) => v !== i);
      return ok ? { correct: true, score: 1, feedback: [] } : { correct: false, score: 0, feedback: [`הסדר נכון עד שלב ${firstWrong}. בדקו מה צריך לבוא בשלב ${firstWrong + 1}.`] };
    }
    case 'build': {
      if (a.type !== 'build') break;
      if (q.allowed) {
        const bad = usesOnly(a.code, q.allowed);
        if (bad) return { correct: false, score: 0, feedback: [`בתרגיל הזה מותר להשתמש רק ב־${q.allowed.join(', ')}. השתמשתם גם ב־${bad}.`] };
      }
      const r = runTests(a.code, q.tests, q.procedures);
      return r.ok ? { correct: true, score: 1, feedback: [] } : { correct: false, score: 0, feedback: r.lines.slice(0, 3) };
    }
    case 'sim-goal': {
      if (a.type !== 'sim-goal') break;
      const wrong = Object.keys(q.target).filter((k) => a.state[k] !== q.target[k]);
      return wrong.length ? { correct: false, score: 0, feedback: [`עדיין לא: ${wrong.map((k) => `${k} צריך להיות ${q.target[k]}`).join(', ')}.`] } : { correct: true, score: 1, feedback: [] };
    }
    case 'match': {
      if (a.type !== 'match') break;
      const wrong = q.pairs.map((_, i) => i).filter((i) => a.mapping[i] !== i);
      return wrong.length ? { correct: false, score: (q.pairs.length - wrong.length) / q.pairs.length, feedback: [`${wrong.length} התאמות שגויות.`], wrong: wrong.map(String) } : { correct: true, score: 1, feedback: [] };
    }
    case 'numeric': {
      if (a.type !== 'numeric') break;
      const v = num(a.value);
      return Math.abs(v - q.answer) < 1e-9 ? { correct: true, score: 1, feedback: [] } : { correct: false, score: 0, feedback: Number.isNaN(v) ? ['כתבו מספר.'] : [] };
    }
    case 'set-answer': {
      if (a.type !== 'set-answer') break;
      const right = evalSetExpr(q.expr, q.sets);
      const given = parseSetAnswer(a.text);
      if (isEqual(right, given)) return { correct: true, score: 1, feedback: [] };
      const extra = given.filter((x) => !right.some((y) => String(y) === String(x)));
      const missing = right.filter((x) => !given.some((y) => String(y) === String(x)));
      const fb: string[] = [];
      if (extra.length) fb.push(`יש בתשובה איברים שלא שייכים לתוצאה (${extra.length}).`);
      if (missing.length) fb.push(`חסרים איברים (${missing.length}).`);
      const sym = q.expr.match(/^\s*([A-Za-z]+)\s*[-−\\]\s*([A-Za-z]+)\s*$/);
      const misconception = sym && isEqual(given, evalSetExpr(`${sym[2]} - ${sym[1]}`, q.sets)) ? 'difference-symmetric' : undefined;
      return { correct: false, score: 0, feedback: fb, misconception };
    }
    case 'arrows-classify': {
      if (a.type !== 'arrows-classify') break;
      const r = analyzeArrows(q.domain, q.codomain, q.arrows);
      const truth = { function: r.isFunction, injective: r.injective, surjective: r.surjective };
      const wrong = q.ask.filter((k) => a.picks[k] !== truth[k]);
      if (!wrong.length) return { correct: true, score: 1, feedback: [] };
      let misconception: string | undefined;
      if (wrong.includes('function')) {
        if (!r.isFunction && r.missing.length) misconception = 'missing-input-ok';
        else if (r.isFunction && r.shared.length) misconception = 'two-to-one-not-function';
        else if (r.isFunction && r.unreached.length) misconception = 'range-must-be-covered';
      }
      return { correct: false, score: (q.ask.length - wrong.length) / q.ask.length, feedback: ['חלק מהתשובות לא נכונות. עברו על כל איבר בתחום: כמה חצים יוצאים ממנו?'], misconception, wrong };
    }
    case 'logo-state': {
      if (a.type !== 'logo-state') break;
      const s = logoFinal(q.code, q.run);
      if (!s) return { correct: false, score: 0, feedback: ['שגיאה בשאלה'] };
      const truth: Record<string, string | number> = { x: s.turtle.x, y: s.turtle.y, heading: s.turtle.heading, pen: s.turtle.pen ? 'down' : 'up', lines: s.segments.length };
      const wrong = q.ask.filter((k) => {
        const v = a.values[k];
        if (k === 'pen') return v !== truth.pen;
        if (k === 'heading') return ((num(v) % 360) + 360) % 360 !== truth.heading;
        return Math.abs(num(v) - (truth[k] as number)) > 0.01 || Number.isNaN(num(v));
      });
      if (!wrong.length) return { correct: true, score: 1, feedback: [] };
      let misconception: string | undefined;
      if (wrong.includes('lines') && /\bPU\b/i.test(q.code + (q.run ?? ''))) misconception = 'pen-up-draws';
      else if (wrong.includes('x') || wrong.includes('y')) misconception = wrong.includes('heading') ? undefined : 'turn-moves';
      return { correct: false, score: (q.ask.length - wrong.length) / q.ask.length, feedback: [`בדקו שוב: ${wrong.map((k) => LOGO_ASK[k]).join(', ')}.`], misconception, wrong };
    }
  }
  return { correct: false, score: 0, feedback: ['סוג תשובה לא מתאים לשאלה'] };
}
