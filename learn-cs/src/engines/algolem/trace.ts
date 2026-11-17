/**
 * Trace tables ("טבלאות מעקב") built from a real run of the engine — never guessed.
 */
import { createMachine, step, visibleCounters } from './machine';
import type { MachineState, Program, StepEvent } from './types';

export interface TraceRow {
  /** 1-based number of the executed instruction. */
  step: number;
  event: StepEvent;
  /** Call depth when the instruction ran (0 = the main algorithm). */
  depth: number;
  /** Visible counters before / after the instruction. */
  before: Record<string, number>;
  after: Record<string, number>;
  /** Active loops of the main algorithm when the instruction ran: [{line, iteration}] outermost first. */
  loops: { line: number; iteration: number }[];
}

export interface Trace {
  counters: string[];
  input: Record<string, number>;
  rows: TraceRow[];
  final: MachineState;
  stoppedBy: 'done' | 'error' | 'diverges' | 'limit';
  /** Output values — only when the run ended normally. */
  output: Record<string, number> | null;
}

export function buildTrace(program: Program, input: Record<string, number>, maxSteps = 5000): Trace {
  let s = createMachine(program, input);
  const counters = [...program.counters, ...program.hiddenCounters];
  const rows: TraceRow[] = [];
  const startValues = visibleCounters(program, s);
  while (s.status === 'running' && rows.length < maxSteps) {
    const depth = s.frames.length - 1;
    const mainFrame = s.frames[0];
    const loops = mainFrame.loops.map((l) => ({ line: program.main.code[l.pc].line, iteration: l.iteration }));
    const before = visibleCounters(program, s);
    const r = step(program, s);
    s = r.state;
    rows.push({ step: rows.length + 1, event: r.event, depth, before, after: visibleCounters(program, s), loops });
  }
  const stoppedBy = s.status === 'running' ? 'limit' : s.status;
  return { counters, input: startValues, rows, final: s, stoppedBy, output: s.status === 'done' ? visibleCounters(program, s) : null };
}

export interface TableColumn {
  /** Top header: "קלט", "סיבוב 3", "פלט" … */
  group: string;
  /** Second header: "ש' 2" (line) or "". */
  label: string;
  values: Record<string, number> | null;
  /** Source line of the instruction that produced this column. */
  line?: number;
  /** Counter(s) changed in this column (for highlighting). */
  changed: string[];
  kind: 'input' | 'line' | 'iteration' | 'output' | 'stop';
  note?: string;
}

const changedKeys = (a: Record<string, number>, b: Record<string, number>) => Object.keys(b).filter((k) => a[k] !== b[k]);

function groupName(loops: { line: number; iteration: number }[]): string {
  if (!loops.length) return 'מחוץ ללולאה';
  return loops.map((l, i) => (i === 0 ? `סיבוב ${l.iteration}` : `פנימי ${l.iteration}`)).join(' · ');
}

/**
 * The course's general trace table (photos 33–36): a column after every executed line of the main
 * algorithm (calls count as one line), grouped by loop rounds, between "קלט" and "פלט".
 */
export function lineTable(trace: Trace): TableColumn[] {
  const cols: TableColumn[] = [{ group: 'קלט', label: '', values: trace.input, kind: 'input', changed: [] }];
  for (const r of trace.rows) {
    const e = r.event;
    const mainLevel = r.depth === 0 && (e.kind === 'add' || e.kind === 'sub');
    const callReturned = e.kind === 'return' && e.toUnit === 'main';
    if (!mainLevel && !callReturned) continue;
    let line = e.line;
    let loops = r.loops;
    if (callReturned) {
      // find the matching call row to label the column with the call line
      const callRow = [...trace.rows.slice(0, r.step - 1)].reverse().find((x) => x.depth === 0 && x.event.kind === 'call');
      if (callRow) {
        line = callRow.event.line;
        loops = callRow.loops;
      }
    }
    const before = callReturned ? cols[cols.length - 1].values ?? trace.input : r.before;
    cols.push({ group: groupName(loops), label: `ש' ${line}`, values: r.after, line, kind: 'line', changed: changedKeys(before, r.after) });
  }
  pushEnd(trace, cols);
  return cols;
}

/** One column after every completed round of the loop that starts at `loopLine` (main level). */
export function iterationTable(trace: Trace, loopLine?: number): TableColumn[] {
  const target = loopLine ?? trace.rows.find((r) => r.depth === 0 && (r.event.kind === 'while-enter' || r.event.kind === 'while-exit'))?.event.line;
  const cols: TableColumn[] = [{ group: 'קלט', label: '', values: trace.input, kind: 'input', changed: [] }];
  let last = trace.input;
  for (const r of trace.rows) {
    const e = r.event;
    if (r.depth === 0 && e.kind === 'endw' && e.whileLine === target) {
      cols.push({ group: `אחרי סיבוב ${e.iteration}`, label: '', values: r.after, kind: 'iteration', changed: changedKeys(last, r.after) });
      last = r.after;
    }
  }
  pushEnd(trace, cols);
  return cols;
}

function pushEnd(trace: Trace, cols: TableColumn[]) {
  if (trace.output) cols.push({ group: 'פלט', label: '', values: trace.output, kind: 'output', changed: [] });
  else if (trace.stoppedBy === 'error') cols.push({ group: 'פלט', label: '', values: null, kind: 'stop', changed: [], note: 'אין פלט — חיסור ממונה ריק' });
  else if (trace.stoppedBy === 'diverges') cols.push({ group: 'פלט', label: '', values: null, kind: 'stop', changed: [], note: 'אין פלט — הלולאה אינה מסתיימת' });
  else cols.push({ group: 'פלט', label: '', values: null, kind: 'stop', changed: [], note: 'הריצה לא הסתיימה במסגרת מגבלת הצעדים' });
}

/** Per-round change of a simple loop + closed form: X = x0 − n, Y = y0 + k·n (course method, photos 13–14, 34). */
export interface RoundFormula {
  loopCounter: string;
  /** counter → change per round */
  delta: Record<string, number>;
  /** Number of rounds, when the loop counter goes down by one per round. */
  rounds: number | null;
  /** Counter values when the loop is reached. */
  start: Record<string, number>;
}

export function roundFormula(trace: Trace, loopLine?: number): RoundFormula | null {
  const loopRow = trace.rows.find((r) => r.depth === 0 && r.event.kind === 'while-enter' && (loopLine === undefined || r.event.line === loopLine));
  if (!loopRow || loopRow.event.kind !== 'while-enter') return null;
  const line = loopRow.event.line;
  const rounds = iterationTable(trace, line).filter((c) => c.kind === 'iteration');
  if (rounds.length < 2) return null;
  const counters = trace.counters;
  const base = loopRow.before;
  const d: Record<string, number> = {};
  for (const c of counters) d[c] = (rounds[0].values![c] ?? 0) - (base[c] ?? 0);
  // the change must be the same in every round
  for (let i = 1; i < rounds.length; i++) for (const c of counters) if ((rounds[i].values![c] ?? 0) - (rounds[i - 1].values![c] ?? 0) !== d[c]) return null;
  const x = loopRow.event.written;
  return { loopCounter: x, delta: d, rounds: d[x] === -1 ? loopRow.event.value : null, start: base };
}

/** Builds a Trace from an interactive history (states[0] = start, events[i] led to states[i+1]). */
export function traceFromHistory(program: Program, states: MachineState[], events: StepEvent[]): Trace {
  const counters = [...program.counters, ...program.hiddenCounters];
  const rows: TraceRow[] = events.map((event, i) => {
    const prev = states[i];
    return {
      step: i + 1,
      event,
      depth: prev.frames.length - 1,
      before: visibleCounters(program, prev),
      after: visibleCounters(program, states[i + 1]),
      loops: prev.frames[0].loops.map((l) => ({ line: program.main.code[l.pc].line, iteration: l.iteration })),
    };
  });
  const final = states[states.length - 1];
  const stoppedBy = final.status === 'running' ? 'limit' : final.status;
  return { counters, input: visibleCounters(program, states[0]), rows, final, stoppedBy, output: final.status === 'done' ? visibleCounters(program, final) : null };
}
