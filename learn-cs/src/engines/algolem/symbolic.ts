/**
 * Symbolic summaries of Algolem code ("טבלת מעקב מודולרית").
 *
 * The value of every counter after a piece of code is written as a polynomial in the values
 * the counters had before it — e.g. a loop `WHILE (A) ADD (B) ADD (B) SUB (A) ENDW` becomes
 *   A = 0,  B = B + 2·A
 * (right-hand sides always refer to the values *before* the piece — the course's convention).
 *
 * A summary is only produced when it is exact. Loops are summarised when every round lowers the
 * loop counter by exactly one and every other counter changes by an amount that does not change
 * during the loop. Anything else returns `null` and the UI falls back to concrete numbers.
 * Summaries assume the run has meaning (no SUB from an empty counter); the engine checks that.
 */
import type { CompiledUnit, Program, Stmt } from './types';
import { parseUnit } from './parse';

/** monomial key ("" = constant, "A", "A*B") → coefficient */
export type Poly = Map<string, number>;
/** counter → new value. Counters not in the map are unchanged. `null` value = unknown (garbage). */
export type Effect = Map<string, Poly | null>;

const mono = (vars: string[]) => [...vars].sort().join('*');
export const constant = (c: number): Poly => (c === 0 ? new Map() : new Map([['', c]]));
export const variable = (v: string): Poly => new Map([[v, 1]]);

function add(a: Poly, b: Poly, k = 1): Poly {
  const r = new Map(a);
  for (const [m, c] of b) {
    const v = (r.get(m) ?? 0) + k * c;
    if (v === 0) r.delete(m);
    else r.set(m, v);
  }
  return r;
}

function mul(a: Poly, b: Poly): Poly {
  let r: Poly = new Map();
  for (const [ma, ca] of a)
    for (const [mb, cb] of b) {
      const vars = [...(ma ? ma.split('*') : []), ...(mb ? mb.split('*') : [])];
      r = add(r, new Map([[mono(vars), ca * cb]]));
    }
  return r;
}

const varsOf = (p: Poly) => new Set([...p.keys()].flatMap((m) => (m ? m.split('*') : [])));

/** Replace every variable V in p by sub(V). */
function substitute(p: Poly, sub: (v: string) => Poly | null): Poly | null {
  let r: Poly = new Map();
  for (const [m, c] of p) {
    let term: Poly = constant(c);
    for (const v of m ? m.split('*') : []) {
      const s = sub(v);
      if (s === null) return null;
      term = mul(term, s);
    }
    r = add(r, term);
  }
  return r;
}

/** Sequential composition: first `f`, then `g`. */
export function compose(f: Effect, g: Effect): Effect {
  const r: Effect = new Map(f);
  const before = (v: string): Poly | null => (f.has(v) ? f.get(v)! : variable(v));
  for (const [x, px] of g) {
    r.set(x, px === null ? null : substitute(px, before));
  }
  return r;
}

const isIdentity = (x: string, p: Poly | null | undefined) => p !== undefined && p !== null && p.size === 1 && p.get(x) === 1;

/** Closed form of `WHILE (x) body ENDW`, or null if this simple rule does not apply. */
function loopEffect(x: string, body: Effect): Effect | null {
  const px = body.get(x);
  // the loop counter must go down by exactly one per round: x ↦ x − 1
  if (!px || px.size !== 2 || px.get(x) !== 1 || px.get('') !== -1) return null;
  const changed = new Set([...body.keys()].filter((k) => !isIdentity(k, body.get(k))));
  const r: Effect = new Map([[x, constant(0)]]);
  for (const y of changed) {
    if (y === x) continue;
    const py = body.get(y);
    if (py === null || py === undefined) {
      r.set(y, null); // overwritten with something we do not track
      continue;
    }
    const inc = add(py, variable(y), -1); // y_new − y_old per round
    const deps = varsOf(inc);
    if (deps.has(y) || [...deps].some((d) => changed.has(d))) {
      // y := const each round (no dependence on itself) → value after the loop depends on whether it ran
      r.set(y, null);
      continue;
    }
    r.set(y, add(variable(y), mul(inc, variable(x))));
  }
  return r;
}

export interface SummaryContext {
  program: Program;
  cache: Map<string, Effect | null>;
}

/** Effect of a procedure body in terms of its parameters (helpers are dropped in `local` mode). */
function unitEffect(ctx: SummaryContext, unit: CompiledUnit): Effect | null {
  if (ctx.cache.has(unit.id)) return ctx.cache.get(unit.id)!;
  ctx.cache.set(unit.id, null); // guards against cycles (compile() already rejects recursion)
  const parsed = parseUnit(unit.source, unit.name);
  if (!parsed.unit) return null;
  let e = stmtsEffect(ctx, parsed.unit.body);
  if (e && ctx.program.helperMode === 'local') {
    const keep = new Set(unit.params);
    const helpers = new Set(unit.freeCounters);
    // a parameter must not depend on a helper's (unknown) incoming value
    for (const [k, p] of e) {
      if (!keep.has(k)) continue;
      if (p && [...varsOf(p)].some((v) => helpers.has(v))) {
        // helpers start at 0 in local mode: substitute 0
        e.set(k, substitute(p, (v) => (helpers.has(v) ? constant(0) : variable(v))));
      }
    }
    e = new Map([...e].filter(([k]) => keep.has(k)));
  }
  ctx.cache.set(unit.id, e);
  return e;
}

export function stmtsEffect(ctx: SummaryContext, stmts: Stmt[]): Effect | null {
  let e: Effect = new Map();
  for (const s of stmts) {
    const one = stmtEffect(ctx, s);
    if (one === null) return null;
    e = compose(e, one);
  }
  return e;
}

export function stmtEffect(ctx: SummaryContext, s: Stmt): Effect | null {
  switch (s.type) {
    case 'add':
      return new Map([[s.arg.name, add(variable(s.arg.name), constant(1))]]);
    case 'sub':
      return new Map([[s.arg.name, add(variable(s.arg.name), constant(-1))]]);
    case 'while': {
      const body = stmtsEffect(ctx, s.body);
      return body ? loopEffect(s.arg.name, body) : null;
    }
    case 'call': {
      const callee = ctx.program.procs[s.name];
      if (!callee) return null;
      const inner = unitEffect(ctx, callee);
      if (!inner) return null;
      const rename = new Map(callee.params.map((p, i) => [p, s.args[i].name]));
      // two parameters bound to the same counter: the simple renaming is not exact
      if (new Set(rename.values()).size !== rename.size) return null;
      const r: Effect = new Map();
      for (const [k, p] of inner) {
        const target = rename.get(k) ?? k;
        r.set(target, p === null ? null : substitute(p, (v) => variable(rename.get(v) ?? v)));
      }
      return r;
    }
  }
}

/** "B + 2·A", "0", "A + B + 1" — the counter itself first, other counters, constant last. */
export function formatPoly(p: Poly | null, self?: string): string {
  if (p === null) return '?';
  if (p.size === 0) return '0';
  const terms = [...p.entries()].sort(([a], [b]) => {
    const rank = (m: string) => (m === self ? 0 : m === '' ? 3 : m.includes('*') ? 2 : 1);
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  let out = '';
  terms.forEach(([m, c], i) => {
    const neg = c < 0;
    const abs = Math.abs(c);
    const body = m === '' ? String(abs) : `${abs === 1 ? '' : abs + '·'}${m.split('*').join('·')}`;
    if (i === 0) out = (neg ? '−' : '') + body;
    else out += neg ? ` − ${body}` : ` + ${body}`;
  });
  return out;
}

export interface FormulaLine {
  counter: string;
  expr: string;
  unchanged: boolean;
}

/** Lines such as "A = 0", "B = B + 2·A" for the given counters (in the given order). */
export function formatEffect(e: Effect, counters: string[]): FormulaLine[] {
  return counters.map((c) => {
    const p = e.get(c);
    if (p === undefined || isIdentity(c, p)) return { counter: c, expr: c, unchanged: true };
    return { counter: c, expr: formatPoly(p, c), unchanged: false };
  });
}

/** Evaluate a summary on concrete numbers (used by tests and to cross-check the engine). */
export function evalEffect(e: Effect, values: Record<string, number>): Record<string, number | null> {
  const out: Record<string, number | null> = { ...values };
  for (const [k, p] of e) {
    if (p === null) {
      out[k] = null;
      continue;
    }
    let v = 0;
    for (const [m, c] of p) v += c * (m ? m.split('*').reduce((acc, x) => acc * (values[x] ?? 0), 1) : 1);
    out[k] = v;
  }
  return out;
}

/** Summary of a whole program's main algorithm. */
export function summarizeProgram(program: Program): Effect | null {
  const ctx: SummaryContext = { program, cache: new Map() };
  const parsed = parseUnit(program.main.source, program.main.name);
  if (!parsed.unit) return null;
  return stmtsEffect(ctx, parsed.unit.body);
}

export interface Segment {
  /** First and last source line of the segment. */
  from: number;
  to: number;
  kind: 'straight' | 'loop' | 'call';
  code: string;
  effect: Effect | null;
}

/** Splits the main algorithm into meaningful pieces: straight-line runs, whole loops, calls. */
export function segmentProgram(program: Program): Segment[] {
  const parsed = parseUnit(program.main.source, program.main.name);
  if (!parsed.unit) return [];
  const ctx: SummaryContext = { program, cache: new Map() };
  const lines = program.main.source.replace(/\r\n?/g, '\n').split('\n');
  const segs: Segment[] = [];
  let run: Stmt[] = [];
  const text = (from: number, to: number) => lines.slice(from - 1, to).join('\n');
  const flush = () => {
    if (!run.length) return;
    const from = run[0].line;
    const to = run[run.length - 1].line;
    segs.push({ from, to, kind: 'straight', code: text(from, to), effect: stmtsEffect(ctx, run) });
    run = [];
  };
  for (const s of parsed.unit.body) {
    if (s.type === 'add' || s.type === 'sub') {
      run.push(s);
      continue;
    }
    flush();
    if (s.type === 'while') segs.push({ from: s.line, to: s.endLine, kind: 'loop', code: text(s.line, s.endLine), effect: stmtEffect(ctx, s) });
    else segs.push({ from: s.line, to: s.line, kind: 'call', code: text(s.line, s.line), effect: stmtEffect(ctx, s) });
  }
  flush();
  return segs;
}
