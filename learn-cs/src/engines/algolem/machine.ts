import type {
  AlgolemRuntimeError,
  CompiledUnit,
  DivergenceProof,
  Frame,
  MachineState,
  Program,
  StepEvent,
  StepResult,
} from './types';

export const MAX_CALL_DEPTH = 64;
/** How many earlier visits of the same WHILE check are kept for the non-termination proof. */
const VISIT_HISTORY = 4;

const isLocal = (cell: string) => cell.includes('@');
export const cellName = (cell: string) => (isLocal(cell) ? cell.slice(0, cell.indexOf('@')) : cell);
const cellSerial = (cell: string) => (isLocal(cell) ? Number(cell.slice(cell.indexOf('@') + 1)) : 0);

function unitOf(program: Program, id: string): CompiledUnit {
  return id === 'main' ? program.main : program.procs[id];
}

/** Creates the initial machine state. Missing inputs start at 0; inputs are clamped to whole numbers ≥ 0. */
export function createMachine(program: Program, inputs: Record<string, number> = {}): MachineState {
  const cells: Record<string, number> = {};
  const bind: Record<string, string> = {};
  for (const name of [...program.counters, ...program.hiddenCounters]) {
    const raw = inputs[name] ?? 0;
    cells[name] = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
  }
  for (const name of program.counters) bind[name] = name;
  return {
    cells,
    frames: [{ serial: 0, unit: 'main', pc: 0, bind, owns: [], loops: [], callLine: null }],
    nextSerial: 1,
    status: 'running',
    steps: 0,
    watch: { lastZero: {}, visits: {} },
  };
}

function cloneState(s: MachineState): MachineState {
  return {
    ...s,
    cells: { ...s.cells },
    frames: s.frames.map((f) => ({ ...f, loops: f.loops.map((l) => ({ ...l })) })),
    watch: { lastZero: { ...s.watch.lastZero }, visits: { ...s.watch.visits } },
  };
}

/** Key that identifies a cell independently of frame serial numbers: `g:A` or `<depth>:B`. */
function stableKey(s: MachineState, cell: string): string {
  if (!isLocal(cell)) return `g:${cell}`;
  const serial = cellSerial(cell);
  const depth = s.frames.findIndex((f) => f.serial === serial);
  return `${depth}:${cellName(cell)}`;
}

function snapshot(s: MachineState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(s.cells)) out[stableKey(s, k)] = v;
  return out;
}

function controlSignature(s: MachineState): string {
  return s.frames.map((f) => `${f.unit}:${f.pc}`).join('/');
}

type Visit = { step: number; values: Record<string, number> };

/**
 * Sound non-termination check at a WHILE test.
 * Let s1 (earlier) and s2 (now) be two visits of the same WHILE check with the same call stack,
 * and d = s2 − s1. If d ≥ 0 everywhere, and no counter with d > 0 was found empty by any WHILE
 * test in between, then the instructions executed from s1 to s2 can be executed again from s2
 * (every SUB still has a ball, every test takes the same branch) and lead to s2 + d, and so on
 * forever. The machine is deterministic, so this is exactly what it will do: it never stops.
 * d = 0 is the special case of an exact repetition of the state.
 */
function proveDivergence(s: MachineState, history: Visit[], now: Record<string, number>): { visit: Visit; reason: 'same-state' | 'growing' } | null {
  const keys = Object.keys(now);
  for (let h = history.length - 1; h >= 0; h--) {
    const v = history[h];
    const pk = Object.keys(v.values);
    if (pk.length !== keys.length) continue;
    let ok = true;
    let grew = false;
    for (const k of keys) {
      if (!(k in v.values)) {
        ok = false;
        break;
      }
      const d = now[k] - v.values[k];
      if (d < 0) {
        ok = false;
        break;
      }
      if (d > 0) {
        grew = true;
        if ((s.watch.lastZero[k] ?? -1) > v.step) {
          ok = false;
          break;
        }
      }
    }
    if (ok) return { visit: v, reason: grew ? 'growing' : 'same-state' };
  }
  return null;
}

function displayValues(s: MachineState, values: Record<string, number>): Record<string, number> {
  // stable keys → readable labels ("A", "B (רמה 1)")
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(values)) {
    const [scope, name] = k.split(':');
    if (scope === 'g') out[name] = v;
    else {
      const f = s.frames[Number(scope)];
      out[`${name} (${f ? f.unit : 'רמה ' + scope})`] = v;
    }
  }
  return out;
}

/** Executes one instruction in place. Returns the event that describes it. */
function exec(program: Program, s: MachineState, prove = true): StepEvent {
  const f = s.frames[s.frames.length - 1];
  const unit = unitOf(program, f.unit);
  const ins = unit.code[f.pc];

  if (s.status !== 'running') {
    if (s.status === 'error' && s.error) return { kind: 'error', unit: f.unit, line: ins.line, error: s.error };
    if (s.status === 'diverges' && s.divergence) return { kind: 'diverges', unit: f.unit, line: ins.line, proof: s.divergence };
    return { kind: 'done', unit: f.unit, line: ins.line };
  }

  switch (ins.op) {
    case 'add': {
      const cell = f.bind[ins.arg];
      const before = s.cells[cell];
      s.cells[cell] = before + 1;
      f.pc++;
      s.steps++;
      return { kind: 'add', unit: f.unit, line: ins.line, written: ins.arg, cell, before, after: before + 1 };
    }
    case 'sub': {
      const cell = f.bind[ins.arg];
      const before = s.cells[cell];
      if (before === 0) {
        const error: AlgolemRuntimeError = {
          kind: 'runtime',
          code: 'sub-empty',
          unit: f.unit,
          line: ins.line,
          cell,
          written: ins.arg,
          message: `ניסיון להוציא כדור מהמונה ${cellName(cell)} כשהוא ריק — פעולה לא חוקית. לריצה הזו אין משמעות (אין פלט).`,
        };
        s.status = 'error';
        s.error = error;
        s.steps++;
        return { kind: 'error', unit: f.unit, line: ins.line, error };
      }
      s.cells[cell] = before - 1;
      f.pc++;
      s.steps++;
      return { kind: 'sub', unit: f.unit, line: ins.line, written: ins.arg, cell, before, after: before - 1 };
    }
    case 'while': {
      const cell = f.bind[ins.arg];
      const value = s.cells[cell];
      // ---- non-termination proof (before the test)
      const sig = controlSignature(s);
      const now = snapshot(s);
      const history = (s.watch.visits[sig] as unknown as Visit[] | undefined) ?? [];
      const proof = prove ? proveDivergence(s, history, now) : null;
      if (proof) {
        const divergence: DivergenceProof = {
          unit: f.unit,
          line: ins.line,
          cell,
          reason: proof.reason,
          before: displayValues(s, proof.visit.values),
          after: displayValues(s, now),
          stepA: proof.visit.step,
          stepB: s.steps,
        };
        s.status = 'diverges';
        s.divergence = divergence;
        return { kind: 'diverges', unit: f.unit, line: ins.line, proof: divergence };
      }
      const nextHistory = [...history, { step: s.steps, values: now }].slice(-VISIT_HISTORY);
      (s.watch.visits as unknown as Record<string, Visit[]>)[sig] = nextHistory;
      // ---- the test itself
      const top = f.loops[f.loops.length - 1];
      s.steps++;
      if (value > 0) {
        let iteration = 1;
        if (top && top.pc === f.pc) iteration = ++top.iteration;
        else f.loops.push({ pc: f.pc, iteration: 1 });
        f.pc++;
        return { kind: 'while-enter', unit: f.unit, line: ins.line, endLine: ins.endLine, written: ins.arg, cell, value, iteration };
      }
      let completed = 0;
      if (top && top.pc === f.pc) completed = f.loops.pop()!.iteration;
      s.watch.lastZero[stableKey(s, cell)] = s.steps;
      f.pc = ins.exit;
      return { kind: 'while-exit', unit: f.unit, line: ins.line, endLine: ins.endLine, written: ins.arg, cell, value, iteration: completed };
    }
    case 'endw': {
      const top = f.loops[f.loops.length - 1];
      const iteration = top && top.pc === ins.head ? top.iteration : 0;
      f.pc = ins.head;
      s.steps++;
      return { kind: 'endw', unit: f.unit, line: ins.line, whileLine: ins.whileLine, iteration };
    }
    case 'call': {
      if (s.frames.length >= MAX_CALL_DEPTH) {
        const error: AlgolemRuntimeError = { kind: 'runtime', code: 'call-depth', unit: f.unit, line: ins.line, message: 'יותר מדי קריאות מקוננות לפרוצדורות.' };
        s.status = 'error';
        s.error = error;
        return { kind: 'error', unit: f.unit, line: ins.line, error };
      }
      const callee = program.procs[ins.proc];
      const serial = s.nextSerial++;
      const bind: Record<string, string> = {};
      callee.params.forEach((p, i) => {
        bind[p] = f.bind[ins.args[i]];
      });
      const owns: string[] = [];
      for (const name of callee.freeCounters) {
        if (program.helperMode === 'local') {
          const key = `${name}@${serial}`;
          s.cells[key] = 0;
          owns.push(key);
          bind[name] = key;
        } else {
          if (!(name in s.cells)) s.cells[name] = 0;
          bind[name] = name;
        }
      }
      f.pc++;
      s.frames.push({ serial, unit: callee.id, pc: 0, bind, owns, loops: [], callLine: ins.line });
      s.steps++;
      return { kind: 'call', unit: f.unit, line: ins.line, proc: callee.id, bind, serial };
    }
    case 'end': {
      s.steps++;
      if (s.frames.length === 1) {
        s.status = 'done';
        return { kind: 'done', unit: f.unit, line: ins.line };
      }
      s.frames.pop();
      for (const key of f.owns) delete s.cells[key];
      const caller = s.frames[s.frames.length - 1];
      const callerUnit = unitOf(program, caller.unit);
      const next = callerUnit.code[caller.pc];
      return { kind: 'return', unit: f.unit, line: ins.line, proc: f.unit, toUnit: caller.unit, toLine: next ? next.line : null };
    }
  }
}

/** Pure single step: returns a new state and the event that happened. */
export function step(program: Program, state: MachineState): StepResult {
  const s = cloneState(state);
  const event = exec(program, s);
  return { state: s, event };
}

export interface RunResult {
  state: MachineState;
  /** `limit` = the step budget ran out; this does NOT mean the program is infinite. */
  stoppedBy: 'done' | 'error' | 'diverges' | 'limit';
  events?: StepEvent[];
  /** States after each executed step (only when `trace` is requested). */
  states?: MachineState[];
}

/** Runs until the program stops, is proven infinite, or `maxSteps` instructions were executed. */
export function run(
  program: Program,
  state: MachineState,
  opts: { maxSteps?: number; events?: boolean; trace?: boolean; /** testing only: disable the non-termination proof */ prove?: boolean } = {},
): RunResult {
  const maxSteps = opts.maxSteps ?? 100_000;
  let s = cloneState(state);
  const events: StepEvent[] | undefined = opts.events ? [] : undefined;
  const states: MachineState[] | undefined = opts.trace ? [] : undefined;
  let count = 0;
  while (s.status === 'running' && count < maxSteps) {
    if (states) {
      const r = step(program, s);
      s = r.state;
      events?.push(r.event);
      states.push(s);
    } else {
      const e = exec(program, s, opts.prove ?? true);
      events?.push(e);
    }
    count++;
  }
  const stoppedBy = s.status === 'running' ? 'limit' : s.status;
  return { state: s, stoppedBy, events, states };
}

/** Values of the main algorithm's counters (the visible "board"). */
export function visibleCounters(program: Program, s: MachineState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of [...program.counters, ...program.hiddenCounters]) out[n] = s.cells[n] ?? 0;
  return out;
}

/** Current source line of the top frame (for highlighting). */
export function currentLocation(program: Program, s: MachineState): { unit: string; line: number; frame: Frame } {
  const f = s.frames[s.frames.length - 1];
  const ins = unitOf(program, f.unit).code[f.pc];
  return { unit: f.unit, line: ins ? ins.line : 0, frame: f };
}

export { unitOf };
