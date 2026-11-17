/**
 * Algolem engine — shared types.
 *
 * Algolem ("אלגולם") is the teaching language of the course: a machine with counters
 * ("מונים") that hold balls. Elementary instructions (source: photos 52–53):
 *   ADD (X)              put one ball into counter X
 *   SUB (X)              take one ball out of counter X — only when X is not empty
 *   WHILE (X) ... ENDW   repeat the body as long as X is not empty
 * Naming an algorithm (source: photo 25): "@ NAME (P1, P2, ...)" followed by its body.
 *
 * Everything in this folder is pure and deterministic: no React, no timers, no randomness.
 */

export interface Ident {
  /** Upper-cased name. */
  name: string;
  line: number;
  col: number;
}

export type Stmt =
  | { type: 'add'; arg: Ident; line: number }
  | { type: 'sub'; arg: Ident; line: number }
  | { type: 'while'; arg: Ident; body: Stmt[]; line: number; endLine: number }
  | { type: 'call'; name: string; args: Ident[]; line: number; col: number };

export interface Unit {
  /** `null` for an algorithm without an `@ NAME (...)` header. */
  name: string | null;
  params: Ident[];
  body: Stmt[];
  headerLine: number | null;
  source: string;
  lineCount: number;
}

export type SyntaxErrorCode =
  | 'unexpected-char'
  | 'unexpected-token'
  | 'expected-open-paren'
  | 'expected-close-paren'
  | 'expected-counter'
  | 'number-as-counter'
  | 'endw-without-while'
  | 'while-without-endw'
  | 'header-not-first'
  | 'header-missing'
  | 'bad-header'
  | 'duplicate-param'
  | 'reserved-name'
  | 'undefined-procedure'
  | 'wrong-arg-count'
  | 'recursive-procedure'
  | 'duplicate-procedure'
  | 'empty-program';

/** A problem with the *form* of the program (שגיאת תחביר). Found before running. */
export interface AlgolemSyntaxError {
  kind: 'syntax';
  code: SyntaxErrorCode;
  /** Code unit the error is in: `null` = the main algorithm, otherwise a procedure name. */
  unit: string | null;
  line: number;
  col: number;
  message: string;
  hint?: string;
}

export type Instr =
  | { op: 'add'; arg: string; line: number }
  | { op: 'sub'; arg: string; line: number }
  /** WHILE check: counter empty → jump to `exit`; otherwise fall through into the body. */
  | { op: 'while'; arg: string; exit: number; line: number; endLine: number }
  /** ENDW: jump back to the WHILE check at `head`. */
  | { op: 'endw'; head: number; line: number; whileLine: number }
  | { op: 'call'; proc: string; args: string[]; line: number }
  | { op: 'end'; line: number };

export interface CompiledUnit {
  /** `'main'` or the procedure name. */
  id: string;
  name: string | null;
  params: string[];
  code: Instr[];
  /** Names used in the body that are not parameters (helper counters). */
  freeCounters: string[];
  source: string;
  lineCount: number;
  /** Where this procedure comes from (for the UI). */
  origin: 'main' | 'library' | 'user';
}

/**
 * How counters that a procedure uses but does not receive as parameters behave.
 * - `local`  (default): every call gets its own private helper counters, starting at 0.
 *            This is the reading under which all the lecturer's procedures work
 *            (HUN calls TEN(B) while TEN itself uses a helper named B).
 * - `shared`: helper counters are the global counters with the same name.
 * The course material does not state this rule explicitly — see the knowledge base.
 */
export type HelperMode = 'local' | 'shared';

export interface Program {
  main: CompiledUnit;
  procs: Record<string, CompiledUnit>;
  helperMode: HelperMode;
  /** Global counters of the main algorithm, in order of first appearance (header params first). */
  counters: string[];
  /** In `shared` mode: global counters touched only inside procedures. */
  hiddenCounters: string[];
}

export interface LoopInfo {
  /** pc of the WHILE instruction inside its unit. */
  pc: number;
  /** Iteration currently running (1-based). */
  iteration: number;
}

export interface Frame {
  /** Unique per created frame (main = 0). */
  serial: number;
  unit: string;
  pc: number;
  /** Every name the unit uses → the cell it stands for. */
  bind: Record<string, string>;
  /** Cells owned by this frame (private helpers); deleted on return. */
  owns: string[];
  loops: LoopInfo[];
  /** Line of the call in the caller, `null` for main. */
  callLine: number | null;
}

export type RuntimeErrorCode = 'sub-empty' | 'call-depth';

export interface AlgolemRuntimeError {
  kind: 'runtime';
  code: RuntimeErrorCode;
  unit: string;
  line: number;
  cell?: string;
  written?: string;
  message: string;
}

export type MachineStatus = 'running' | 'done' | 'error' | 'diverges';

export interface DivergenceProof {
  unit: string;
  line: number;
  /** Cell tested by the WHILE whose check can never fail from now on. */
  cell: string;
  /** `same-state`: the exact same state came back. `growing`: the loop only grows the relevant counters. */
  reason: 'same-state' | 'growing';
  /** Counter values (by display key) at the two compared visits. */
  before: Record<string, number>;
  after: Record<string, number>;
  stepA: number;
  stepB: number;
}

export interface WatchState {
  /** stable cell key → last step at which a WHILE check found that cell empty. */
  lastZero: Record<string, number>;
  /** control signature → previous visit of that WHILE check. */
  visits: Record<string, { step: number; values: Record<string, number> }>;
}

export interface MachineState {
  /** cell key → number of balls. Global cells use the counter name; private cells `NAME@serial`. */
  cells: Record<string, number>;
  frames: Frame[];
  nextSerial: number;
  status: MachineStatus;
  steps: number;
  error?: AlgolemRuntimeError;
  divergence?: DivergenceProof;
  watch: WatchState;
}

export type StepEvent =
  | {
      kind: 'add' | 'sub';
      unit: string;
      line: number;
      written: string;
      cell: string;
      before: number;
      after: number;
    }
  | {
      kind: 'while-enter' | 'while-exit';
      unit: string;
      line: number;
      endLine: number;
      written: string;
      cell: string;
      value: number;
      /** enter: the iteration that starts now; exit: number of completed iterations. */
      iteration: number;
    }
  | { kind: 'endw'; unit: string; line: number; whileLine: number; iteration: number }
  | { kind: 'call'; unit: string; line: number; proc: string; bind: Record<string, string>; serial: number }
  | { kind: 'return'; unit: string; line: number; proc: string; toUnit: string; toLine: number | null }
  | { kind: 'done'; unit: string; line: number }
  | { kind: 'error'; unit: string; line: number; error: AlgolemRuntimeError }
  | { kind: 'diverges'; unit: string; line: number; proof: DivergenceProof };

export interface StepResult {
  state: MachineState;
  event: StepEvent;
}

export type CompileResult =
  | { ok: true; program: Program; errors: [] }
  | { ok: false; program: null; errors: AlgolemSyntaxError[] };

export interface ProgramSource {
  /** The algorithm in the editor. May start with a `@ NAME (...)` header. */
  main: string;
  /** Extra procedure definitions written by the learner. */
  procedures?: string[];
  /** Which course procedures to make available (default: all). */
  library?: string[] | 'all' | 'none';
  helperMode?: HelperMode;
}
