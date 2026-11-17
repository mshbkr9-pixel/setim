/**
 * LOGO engine — the subset used in the course (MSWLogo/FMSLogo style, photos 54, 67–76).
 *
 * Commands: FD/FORWARD, BK/BACK, RT/RIGHT, LT/LEFT, PU/PENUP, PD/PENDOWN, HOME, CS/CLEARSCREEN,
 *           HT/HIDETURTLE, ST/SHOWTURTLE, REPEAT n [ ... ], TO NAME :P1 :P2 ... END, calls.
 * Expressions: numbers, :VAR, + − * / and parentheses (e.g. 360 / :SIDES).
 * Variables are looked up through the call stack from the top frame down (dynamic scope, as in
 * MSWLogo) — this is exactly what the "memory stack" slides discuss (photo 73: TOOTH without its
 * own SIZE finds SIZE in TEETH's frame).
 * Turtle: starts at (0,0), heading 0 = up (north), angles clockwise, pen down.
 */

export type Expr =
  | { k: 'num'; v: number }
  | { k: 'var'; name: string; line: number }
  | { k: 'neg'; a: Expr }
  | { k: 'bin'; op: '+' | '-' | '*' | '/'; a: Expr; b: Expr };

export type Cmd =
  | { k: 'move'; dir: 'FD' | 'BK'; e: Expr; line: number }
  | { k: 'turn'; dir: 'RT' | 'LT'; e: Expr; line: number }
  | { k: 'pen'; down: boolean; line: number }
  | { k: 'home'; line: number }
  | { k: 'cs'; line: number }
  | { k: 'show'; visible: boolean; line: number }
  | { k: 'repeat'; count: Expr; body: Cmd[]; line: number; endLine: number }
  | { k: 'call'; name: string; args: Expr[]; line: number };

export interface Proc {
  name: string;
  params: string[];
  body: Cmd[];
  line: number;
  endLine: number;
}

export interface LogoError {
  kind: 'syntax' | 'runtime';
  line: number;
  message: string;
  hint?: string;
}

export interface LogoProgram {
  procs: Record<string, Proc>;
  /** Top-level commands of the editor text followed by the run line (Commander). */
  main: Cmd[];
  /** Line numbers of run-line commands are offset: they start at runLineBase + 1. */
  runLineBase: number;
}

type Tok = { t: 'word' | 'num' | 'var' | '[' | ']' | '(' | ')' | 'op'; v: string; line: number };

const ALIASES: Record<string, string> = {
  FORWARD: 'FD', BACK: 'BK', RIGHT: 'RT', LEFT: 'LT', PENUP: 'PU', PENDOWN: 'PD', CLEARSCREEN: 'CS', HIDETURTLE: 'HT', SHOWTURTLE: 'ST',
};
const PRIMS = new Set(['FD', 'BK', 'RT', 'LT', 'PU', 'PD', 'HOME', 'CS', 'HT', 'ST', 'REPEAT', 'TO', 'END']);

function tokenize(src: string, lineOffset: number, errors: LogoError[]): Tok[] {
  const out: Tok[] = [];
  src.replace(/\r\n?/g, '\n').split('\n').forEach((raw, i) => {
    const line = i + 1 + lineOffset;
    const text = raw.replace(/;.*$/, '');
    let c = 0;
    while (c < text.length) {
      const ch = text[c];
      if (/\s/.test(ch)) { c++; continue; }
      if (ch === '[' || ch === ']' || ch === '(' || ch === ')') { out.push({ t: ch, v: ch, line }); c++; continue; }
      if ('+-*/'.includes(ch)) { out.push({ t: 'op', v: ch, line }); c++; continue; }
      if (ch === ':') {
        let e = c + 1;
        while (e < text.length && /[A-Za-z0-9_.?]/.test(text[e])) e++;
        if (e === c + 1) errors.push({ kind: 'syntax', line, message: 'אחרי הנקודתיים צריך לבוא שם של משתנה', hint: 'לדוגמה :SIZE' });
        out.push({ t: 'var', v: text.slice(c + 1, e).toUpperCase(), line });
        c = e;
        continue;
      }
      if (/[0-9.]/.test(ch)) {
        let e = c + 1;
        while (e < text.length && /[0-9.]/.test(text[e])) e++;
        out.push({ t: 'num', v: text.slice(c, e), line });
        c = e;
        continue;
      }
      if (/[A-Za-z֐-׿_]/.test(ch)) {
        let e = c + 1;
        while (e < text.length && /[A-Za-z0-9֐-׿_.?]/.test(text[e])) e++;
        const w = text.slice(c, e).toUpperCase();
        out.push({ t: 'word', v: ALIASES[w] ?? w, line });
        c = e;
        continue;
      }
      errors.push({ kind: 'syntax', line, message: `התו "${ch}" אינו חלק מהשפה` });
      c++;
    }
  });
  return out;
}

/** Parses editor text (definitions + commands) and an optional Commander line. */
export function parseLogo(code: string, run = ''): { program: LogoProgram | null; errors: LogoError[] } {
  const errors: LogoError[] = [];
  const codeLines = code.replace(/\r\n?/g, '\n').split('\n').length;
  const toks = [...tokenize(code, 0, errors), ...tokenize(run, codeLines, errors)];
  // pass 1: procedure headers (names and arity)
  const arity: Record<string, number> = {};
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].t === 'word' && toks[i].v === 'TO') {
      const n = toks[i + 1];
      if (!n || n.t !== 'word') continue;
      let j = i + 2;
      let count = 0;
      while (toks[j] && toks[j].t === 'var' && toks[j].line === n.line) { count++; j++; }
      arity[n.v] = count;
    }
  }
  let p = 0;
  const procs: Record<string, Proc> = {};

  const parseFactor = (): Expr | null => {
    const t = toks[p];
    if (!t) return null;
    if (t.t === 'num') { p++; return { k: 'num', v: Number(t.v) }; }
    if (t.t === 'var') { p++; return { k: 'var', name: t.v, line: t.line }; }
    if (t.t === 'op' && t.v === '-') { p++; const a = parseFactor(); return a ? { k: 'neg', a } : null; }
    if (t.t === '(') {
      p++;
      const e = parseExpr();
      if (toks[p]?.t !== ')') { errors.push({ kind: 'syntax', line: t.line, message: 'חסר סוגר עגול סוגר )' }); return e; }
      p++;
      return e;
    }
    return null;
  };
  const parseTerm = (): Expr | null => {
    let a = parseFactor();
    while (a && toks[p]?.t === 'op' && (toks[p].v === '*' || toks[p].v === '/')) {
      const op = toks[p++].v as '*' | '/';
      const b = parseFactor();
      if (!b) { errors.push({ kind: 'syntax', line: toks[p - 1].line, message: `חסר מספר אחרי ${op}` }); return a; }
      a = { k: 'bin', op, a, b };
    }
    return a;
  };
  function parseExpr(): Expr | null {
    let a = parseTerm();
    while (a && toks[p]?.t === 'op' && (toks[p].v === '+' || toks[p].v === '-')) {
      const op = toks[p++].v as '+' | '-';
      const b = parseTerm();
      if (!b) { errors.push({ kind: 'syntax', line: toks[p - 1].line, message: `חסר מספר אחרי ${op}` }); return a; }
      a = { k: 'bin', op, a, b };
    }
    return a;
  }
  const needExpr = (cmd: string, line: number): Expr => {
    const e = parseExpr();
    if (!e) {
      errors.push({ kind: 'syntax', line, message: `${cmd} צריכה מספר אחריה`, hint: `לדוגמה: ${cmd} 50` });
      return { k: 'num', v: 0 };
    }
    return e;
  };

  const parseBlock = (until: ']' | 'END' | null, startLine: number): { body: Cmd[]; endLine: number } => {
    const body: Cmd[] = [];
    while (p < toks.length) {
      const t = toks[p];
      if (until === ']' && t.t === ']') { p++; return { body, endLine: t.line }; }
      if (until === 'END' && t.t === 'word' && t.v === 'END') { p++; return { body, endLine: t.line }; }
      if (t.t !== 'word') {
        errors.push({ kind: 'syntax', line: t.line, message: t.t === 'num' ? `מה לעשות עם המספר ${t.v}?` : `הסימן "${t.v}" לא צפוי כאן`, hint: 'כל הוראה מתחילה במילה, למשל FD 50.' });
        p++;
        continue;
      }
      p++;
      switch (t.v) {
        case 'FD': case 'BK': body.push({ k: 'move', dir: t.v, e: needExpr(t.v, t.line), line: t.line }); break;
        case 'RT': case 'LT': body.push({ k: 'turn', dir: t.v, e: needExpr(t.v, t.line), line: t.line }); break;
        case 'PU': case 'PD': body.push({ k: 'pen', down: t.v === 'PD', line: t.line }); break;
        case 'HOME': body.push({ k: 'home', line: t.line }); break;
        case 'CS': body.push({ k: 'cs', line: t.line }); break;
        case 'HT': case 'ST': body.push({ k: 'show', visible: t.v === 'ST', line: t.line }); break;
        case 'REPEAT': {
          const count = needExpr('REPEAT', t.line);
          if (toks[p]?.t !== '[') {
            errors.push({ kind: 'syntax', line: t.line, message: 'אחרי REPEAT ומספר החזרות צריך לבוא סוגר מרובע [', hint: 'לדוגמה: REPEAT 4 [ FD 10 RT 90 ]' });
            break;
          }
          p++;
          const inner = parseBlock(']', t.line);
          body.push({ k: 'repeat', count, body: inner.body, line: t.line, endLine: inner.endLine });
          break;
        }
        case 'TO': {
          if (until !== null) { errors.push({ kind: 'syntax', line: t.line, message: 'אי אפשר להגדיר פרוצדורה בתוך פרוצדורה או בתוך REPEAT' }); break; }
          const name = toks[p];
          if (!name || name.t !== 'word' || PRIMS.has(name.v)) {
            errors.push({ kind: 'syntax', line: t.line, message: 'אחרי TO צריך לבוא שם חדש לפרוצדורה', hint: 'לדוגמה: TO SQUARE' });
            break;
          }
          p++;
          const params: string[] = [];
          while (toks[p] && toks[p].t === 'var' && toks[p].line === name.line) params.push(toks[p++].v);
          const inner = parseBlock('END', t.line);
          if (procs[name.v]) errors.push({ kind: 'syntax', line: t.line, message: `הפרוצדורה ${name.v} מוגדרת פעמיים` });
          procs[name.v] = { name: name.v, params, body: inner.body, line: t.line, endLine: inner.endLine };
          break;
        }
        case 'END':
          errors.push({ kind: 'syntax', line: t.line, message: 'END בלי TO פתוח' });
          break;
        default: {
          if (!(t.v in arity)) {
            errors.push({ kind: 'syntax', line: t.line, message: `אני לא יודע איך ${t.v}`, hint: 'זו לא פקודה מוכרת ואין פרוצדורה בשם הזה. בדקו את האיות, או הגדירו אותה עם TO ... END.' });
            break;
          }
          const args: Expr[] = [];
          for (let i = 0; i < arity[t.v]; i++) {
            const e = parseExpr();
            if (!e) { errors.push({ kind: 'syntax', line: t.line, message: `${t.v} צריכה ${arity[t.v]} ערכים, וקיבלה ${i}` }); break; }
            args.push(e);
          }
          body.push({ k: 'call', name: t.v, args, line: t.line });
        }
      }
    }
    if (until === ']') errors.push({ kind: 'syntax', line: startLine, message: 'חסר סוגר מרובע סוגר ] ל־REPEAT' });
    if (until === 'END') errors.push({ kind: 'syntax', line: startLine, message: 'חסר END בסוף הגדרת הפרוצדורה' });
    return { body, endLine: toks.length ? toks[toks.length - 1].line : startLine };
  };

  const top = parseBlock(null, 1);
  if (errors.length) return { program: null, errors };
  return { program: { procs, main: top.body, runLineBase: codeLines }, errors: [] };
}

// ------------------------------------------------------------------ machine

export interface Segment { x1: number; y1: number; x2: number; y2: number; line: number }

export interface Block { cmds: Cmd[]; pc: number; repeat?: { line: number; total: number; iter: number } }

export interface LFrame {
  proc: string | null;
  /** Parameter values of this call (shown in the memory stack). */
  vars: { name: string; value: number }[];
  blocks: Block[];
  callLine: number | null;
}

export interface Turtle { x: number; y: number; heading: number; pen: boolean; visible: boolean }

export interface LogoState {
  turtle: Turtle;
  segments: Segment[];
  frames: LFrame[];
  status: 'running' | 'done' | 'error';
  steps: number;
  error?: LogoError;
}

export type LogoEvent =
  | { kind: 'move'; line: number; dir: 'FD' | 'BK'; amount: number; from: [number, number]; to: [number, number]; drew: boolean }
  | { kind: 'turn'; line: number; dir: 'RT' | 'LT'; amount: number; from: number; to: number }
  | { kind: 'pen'; line: number; down: boolean }
  | { kind: 'home' | 'cs' | 'show'; line: number }
  | { kind: 'repeat'; line: number; total: number; iter: number }
  | { kind: 'call'; line: number; proc: string; vars: { name: string; value: number }[] }
  | { kind: 'return'; line: number; proc: string }
  | { kind: 'done'; line: number }
  | { kind: 'error'; line: number; error: LogoError };

export const MAX_DEPTH = 200;
const round = (v: number) => {
  const r = Math.round(v * 1e6) / 1e6;
  return Object.is(r, -0) ? 0 : r;
};
const norm = (h: number) => round(((h % 360) + 360) % 360);

export function createLogo(program: LogoProgram): LogoState {
  return {
    turtle: { x: 0, y: 0, heading: 0, pen: true, visible: true },
    segments: [],
    frames: [{ proc: null, vars: [], blocks: [{ cmds: program.main, pc: 0 }], callLine: null }],
    status: 'running',
    steps: 0,
  };
}

function lookup(s: LogoState, name: string): number | undefined {
  for (let i = s.frames.length - 1; i >= 0; i--) {
    const v = s.frames[i].vars.find((x) => x.name === name);
    if (v) return v.value;
  }
  return undefined;
}

class LogoRuntimeError extends Error {
  constructor(public line: number, message: string) { super(message); }
}

function evaluate(s: LogoState, e: Expr): number {
  switch (e.k) {
    case 'num': return e.v;
    case 'neg': return -evaluate(s, e.a);
    case 'var': {
      const v = lookup(s, e.name);
      if (v === undefined) throw new LogoRuntimeError(e.line, `למשתנה ${e.name} אין ערך: הוא לא נמצא באף מסגרת במחסנית`);
      return v;
    }
    case 'bin': {
      const a = evaluate(s, e.a);
      const b = evaluate(s, e.b);
      if (e.op === '/' && b === 0) throw new LogoRuntimeError(0, 'חלוקה באפס');
      return e.op === '+' ? a + b : e.op === '-' ? a - b : e.op === '*' ? a * b : a / b;
    }
  }
}

function clone(s: LogoState): LogoState {
  return {
    ...s,
    turtle: { ...s.turtle },
    segments: s.segments,
    frames: s.frames.map((f) => ({ ...f, blocks: f.blocks.map((b) => ({ ...b, repeat: b.repeat ? { ...b.repeat } : undefined })) })),
  };
}

/** Executes one command (or one REPEAT round start / call / return). Pure. */
export function stepLogo(program: LogoProgram, state: LogoState): { state: LogoState; event: LogoEvent } {
  const s = clone(state);
  if (s.status !== 'running') return { state: s, event: s.error ? { kind: 'error', line: s.error.line, error: s.error } : { kind: 'done', line: 0 } };
  const frame = s.frames[s.frames.length - 1];
  const block = frame.blocks[frame.blocks.length - 1];
  try {
    if (!block) {
      // frame finished → return
      s.frames.pop();
      s.steps++;
      if (s.frames.length === 0 || frame.proc === null) {
        s.frames = s.frames.length ? s.frames : [frame];
        s.status = 'done';
        return { state: s, event: { kind: 'done', line: 0 } };
      }
      return { state: s, event: { kind: 'return', line: frame.callLine ?? 0, proc: frame.proc } };
    }
    if (block.pc >= block.cmds.length) {
      if (block.repeat && block.repeat.iter < block.repeat.total) {
        block.repeat.iter++;
        block.pc = 0;
        s.steps++;
        return { state: s, event: { kind: 'repeat', line: block.repeat.line, total: block.repeat.total, iter: block.repeat.iter } };
      }
      frame.blocks.pop();
      return stepLogo(program, s);
    }
    const cmd = block.cmds[block.pc++];
    s.steps++;
    const t = s.turtle;
    switch (cmd.k) {
      case 'move': {
        const n = evaluate(s, cmd.e) * (cmd.dir === 'BK' ? -1 : 1);
        const rad = (t.heading * Math.PI) / 180;
        const from: [number, number] = [t.x, t.y];
        t.x = round(t.x + n * Math.sin(rad));
        t.y = round(t.y + n * Math.cos(rad));
        if (t.pen && n !== 0) s.segments = [...s.segments, { x1: from[0], y1: from[1], x2: t.x, y2: t.y, line: cmd.line }];
        return { state: s, event: { kind: 'move', line: cmd.line, dir: cmd.dir, amount: Math.abs(n), from, to: [t.x, t.y], drew: t.pen } };
      }
      case 'turn': {
        const a = evaluate(s, cmd.e);
        const from = t.heading;
        t.heading = norm(t.heading + (cmd.dir === 'RT' ? a : -a));
        return { state: s, event: { kind: 'turn', line: cmd.line, dir: cmd.dir, amount: a, from, to: t.heading } };
      }
      case 'pen':
        t.pen = cmd.down;
        return { state: s, event: { kind: 'pen', line: cmd.line, down: cmd.down } };
      case 'home':
        if (t.pen && (t.x !== 0 || t.y !== 0)) s.segments = [...s.segments, { x1: t.x, y1: t.y, x2: 0, y2: 0, line: cmd.line }];
        t.x = 0; t.y = 0; t.heading = 0;
        return { state: s, event: { kind: 'home', line: cmd.line } };
      case 'cs':
        s.segments = [];
        t.x = 0; t.y = 0; t.heading = 0;
        return { state: s, event: { kind: 'cs', line: cmd.line } };
      case 'show':
        t.visible = cmd.visible;
        return { state: s, event: { kind: 'show', line: cmd.line } };
      case 'repeat': {
        const n = Math.round(evaluate(s, cmd.count));
        if (n > 0) frame.blocks.push({ cmds: cmd.body, pc: 0, repeat: { line: cmd.line, total: n, iter: 1 } });
        return { state: s, event: { kind: 'repeat', line: cmd.line, total: Math.max(0, n), iter: n > 0 ? 1 : 0 } };
      }
      case 'call': {
        const proc = program.procs[cmd.name];
        if (s.frames.length >= MAX_DEPTH) throw new LogoRuntimeError(cmd.line, 'יותר מדי קריאות מקוננות (המחסנית התמלאה)');
        const vars = proc.params.map((name, i) => ({ name, value: evaluate(s, cmd.args[i]) }));
        s.frames.push({ proc: proc.name, vars, blocks: [{ cmds: proc.body, pc: 0 }], callLine: cmd.line });
        return { state: s, event: { kind: 'call', line: cmd.line, proc: proc.name, vars } };
      }
    }
  } catch (err) {
    const line = err instanceof LogoRuntimeError && err.line ? err.line : (block?.cmds[Math.max(0, block.pc - 1)]?.line ?? 0);
    const error: LogoError = { kind: 'runtime', line, message: err instanceof Error ? err.message : String(err) };
    s.status = 'error';
    s.error = error;
    return { state: s, event: { kind: 'error', line, error } };
  }
}

export function runLogo(program: LogoProgram, state?: LogoState, maxSteps = 50_000): { state: LogoState; stoppedBy: 'done' | 'error' | 'limit' } {
  let s = state ?? createLogo(program);
  let n = 0;
  while (s.status === 'running' && n < maxSteps) {
    s = stepLogo(program, s).state;
    n++;
  }
  return { state: s, stoppedBy: s.status === 'running' ? 'limit' : s.status };
}

/** Convenience: parse + run. */
export function execLogo(code: string, run = '', maxSteps = 50_000) {
  const parsed = parseLogo(code, run);
  if (!parsed.program) return { ok: false as const, errors: parsed.errors };
  const r = runLogo(parsed.program, undefined, maxSteps);
  return { ok: true as const, program: parsed.program, ...r };
}

/** Compares two drawings by the points they cover (order and segment splitting do not matter). */
export function sameDrawing(a: Segment[], b: Segment[], step = 1): boolean {
  const pts = (segs: Segment[]) => {
    const set = new Set<string>();
    for (const s of segs) {
      const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
      const n = Math.max(1, Math.ceil(len / step));
      for (let i = 0; i <= n; i++) set.add(`${Math.round(s.x1 + ((s.x2 - s.x1) * i) / n)},${Math.round(s.y1 + ((s.y2 - s.y1) * i) / n)}`);
    }
    return set;
  };
  const A = pts(a);
  const B = pts(b);
  if (A.size === 0 || B.size === 0) return A.size === B.size;
  let inter = 0;
  for (const k of A) if (B.has(k)) inter++;
  return inter / Math.max(A.size, B.size) > 0.97;
}

const headingName = (h: number) =>
  ({ 0: 'למעלה (צפון)', 90: 'ימינה (מזרח)', 180: 'למטה (דרום)', 270: 'שמאלה (מערב)' } as Record<number, string>)[h] ?? `${h}°`;

/** Hebrew explanation of a LOGO event (explanation layer kept next to the engine for brevity). */
export function describeLogo(e: LogoEvent): string {
  switch (e.kind) {
    case 'move':
      return `${e.dir} ${e.amount}: הצב ${e.dir === 'FD' ? 'מתקדם קדימה' : 'נסוג אחורה'} ${e.amount} צעדים${e.drew ? ' ומצייר קו' : ' בלי לצייר (העט מורם)'}.`;
    case 'turn':
      return `${e.dir} ${e.amount}: הצב מסתובב ${e.dir === 'RT' ? 'ימינה' : 'שמאלה'} ${e.amount}° — מכיוון ${headingName(e.from)} לכיוון ${headingName(e.to)}. המקום שלו לא משתנה.`;
    case 'pen':
      return e.down ? 'PD: העט יורד — מעכשיו כל תנועה מציירת קו.' : 'PU: העט מורם — מעכשיו הצב זז בלי לצייר.';
    case 'home':
      return 'HOME: הצב חוזר לנקודת ההתחלה ופונה למעלה.';
    case 'cs':
      return 'CS: המסך נמחק והצב חוזר להתחלה.';
    case 'show':
      return 'הצגה/הסתרה של הצב.';
    case 'repeat':
      return e.total === 0 ? 'REPEAT 0: הלולאה לא מתבצעת.' : `REPEAT: מתחיל סיבוב ${e.iter} מתוך ${e.total}.`;
    case 'call':
      return `קריאה לפרוצדורה ${e.proc}: נפתחת מסגרת חדשה במחסנית${e.vars.length ? ` ובה ${e.vars.map((v) => `:${v.name} = ${v.value}`).join(', ')}` : ' (בלי משתנים)'}.`;
    case 'return':
      return `הפרוצדורה ${e.proc} הסתיימה: המסגרת העליונה יוצאת מהמחסנית (LIFO) וחוזרים למי שקרא לה.`;
    case 'done':
      return 'התוכנית הסתיימה.';
    case 'error':
      return e.error.message;
  }
}
