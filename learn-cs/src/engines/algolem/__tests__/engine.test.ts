import { describe, expect, it } from 'vitest';
import { compile, createMachine, run, step, visibleCounters } from '../index';
import type { HelperMode, Program } from '../types';

function prog(main: string, opts: { procedures?: string[]; helperMode?: HelperMode; library?: 'all' | 'none' | string[] } = {}): Program {
  const r = compile({ main, ...opts });
  if (!r.ok) throw new Error(r.errors.map((e) => `${e.line}:${e.col} ${e.message}`).join('\n'));
  return r.program;
}

function exec(main: string, inputs: Record<string, number>, opts: Parameters<typeof prog>[1] = {}, maxSteps = 100_000) {
  const p = prog(main, opts);
  const r = run(p, createMachine(p, inputs), { maxSteps });
  return { ...r, out: visibleCounters(p, r.state), program: p };
}

describe('parser / compiler — form errors are found before running', () => {
  const errorCode = (main: string, procedures?: string[]) => {
    const r = compile({ main, procedures });
    return r.ok ? null : r.errors[0].code;
  };
  it('accepts code copied from the slides, with line numbers', () => {
    expect(errorCode('1.  WHILE (A)\n2.     SUB (A)\n3.  ENDW')).toBeNull();
  });
  it('accepts several statements on one line', () => {
    expect(errorCode('WHILE(A) ADD(B) SUB(A) ENDW')).toBeNull();
  });
  it('ENDW without WHILE', () => expect(errorCode('ADD (A)\nENDW')).toBe('endw-without-while'));
  it('WHILE without ENDW', () => expect(errorCode('WHILE (A)\n SUB (A)')).toBe('while-without-endw'));
  it('a number instead of a counter', () => expect(errorCode('ADD (5)')).toBe('number-as-counter'));
  it('Hebrew letters in code', () => expect(errorCode('ADD (א)')).toBe('unexpected-char'));
  it('unknown word', () => expect(errorCode('ADDD (A)')).toBe('undefined-procedure'));
  it('missing parenthesis', () => expect(errorCode('ADD A')).toBe('expected-open-paren'));
  it('wrong number of counters for a procedure', () => expect(errorCode('MOVE (A)')).toBe('wrong-arg-count'));
  it('two counters for ADD', () => expect(errorCode('ADD (A,B)')).toBe('expected-counter'));
  it('keyword as a counter name', () => expect(errorCode('ADD (WHILE)')).toBe('reserved-name'));
  it('procedure without header', () => expect(errorCode('ADD (A)', ['ADD (B)'])).toBe('header-missing'));
  it('@ in the middle of the code', () => expect(errorCode('ADD (A)\n@ X (A)')).toBe('header-not-first'));
  it('recursion is rejected', () => {
    expect(errorCode('P (A)', ['@ P (A)\n Q (A)', '@ Q (A)\n P (A)'])).toBe('recursive-procedure');
  });
  it('empty program', () => expect(errorCode('   \n  ')).toBe('empty-program'));
});

describe('first operations (photos 44–53)', () => {
  it('7.1 — move R1 into R2: (5,2) → (0,7), five iterations', () => {
    const p = prog('WHILE (R1)\n ADD (R2)\n SUB (R1)\nENDW');
    let s = createMachine(p, { R1: 5, R2: 2 });
    let iterations = 0;
    while (s.status === 'running') {
      const r = step(p, s);
      if (r.event.kind === 'while-enter') iterations = r.event.iteration;
      s = r.state;
    }
    expect(visibleCounters(p, s)).toEqual({ R1: 0, R2: 7 });
    expect(iterations).toBe(5);
  });
  it('7.2 — add twice the content: R2 = b + 2a', () => {
    expect(exec('WHILE (R1)\n ADD (R2)\n ADD (R2)\n SUB (R1)\nENDW', { R1: 4, R2: 7 }).out).toEqual({ R1: 0, R2: 15 });
  });
  it('replace a value by 3 (photo 47)', () => {
    expect(exec('WHILE (R2)\n SUB (R2)\nENDW\nADD (R2)\nADD (R2)\nADD (R2)', { R2: 9 }).out).toEqual({ R2: 3 });
  });
  it('trace example R1=65, R2=10 → R2=75 (photo 34)', () => {
    expect(exec('WHILE (R1)\n ADD (R2)\n SUB (R1)\nENDW', { R1: 65, R2: 10 }).out).toEqual({ R1: 0, R2: 75 });
  });
});

describe('course procedures (photos 25–31) — verbatim definitions', () => {
  it.each([
    ['ZERO (A)', { A: 9 }, { A: 0 }],
    ['ONE (A)', { A: 9 }, { A: 1 }],
    ['TWO (A)', { A: 0 }, { A: 2 }],
    ['FIVE (A)', { A: 3 }, { A: 5 }],
    ['TEN (A)', { A: 7 }, { A: 10 }],
    ['HUN (A)', { A: 3 }, { A: 100 }],
  ])('%s', (code, input, output) => {
    expect(exec(code, input).out).toEqual(output);
  });
  it('MOVE (A,B) copies A into B and keeps A; the caller’s C is untouched (private helpers)', () => {
    expect(exec('MOVE (A,B)', { A: 4, B: 9, C: 7 }, {}).out).toEqual({ A: 4, B: 4 });
    expect(exec('MOVE (A,B)\nADD (C)', { A: 4, B: 9, C: 7 }).out).toEqual({ A: 4, B: 4, C: 8 });
  });
  it('MOVE with shared helpers destroys the global C', () => {
    expect(exec('MOVE (A,B)\nADD (C)', { A: 4, B: 9, C: 7 }, { helperMode: 'shared' }).out).toEqual({ A: 4, B: 4, C: 1 });
  });
  it('HUN with shared helpers never stops: TEN(B) clashes with TEN’s own helper B (proven)', () => {
    const r = exec('HUN (A)', { A: 0 }, { helperMode: 'shared' });
    expect(r.stoppedBy).toBe('diverges');
    expect(r.state.divergence?.reason).toBe('same-state');
  });
  it('11.1 — FIVE(A), ADD(A), loop adds 2 per round: B grows by 12 (42 → 54)', () => {
    expect(exec('FIVE (A)\nADD (A)\nWHILE (A)\n ADD (B)\n ADD (B)\n SUB (A)\nENDW', { A: 75, B: 42 }).out).toEqual({ A: 0, B: 54 });
  });
  it('11.2 — two consecutive loops: C = A + B + 1', () => {
    const code = 'WHILE (A)\n ADD (B)\n SUB (A)\nENDW\nONE (C)\nWHILE (B)\n ADD (C)\n SUB (B)\nENDW';
    expect(exec(code, { A: 3, B: 4, C: 50 }).out).toEqual({ A: 0, B: 0, C: 8 });
  });
  it('S (A,B,C) of the Queen-of-Hearts task: A=0, B=5+A, C=C+A', () => {
    expect(exec('S (A,B,C)', { A: 3, B: 40, C: 2 }).out).toEqual({ A: 0, B: 8, C: 5 });
  });
  it('a procedure defined by the learner, with renamed parameters', () => {
    const r = exec('TWICE (R1,R2)', { R1: 3, R2: 1 }, { procedures: ['@ TWICE (X,Y)\n WHILE (X)\n  ADD (Y)\n  ADD (Y)\n  SUB (X)\n ENDW'] });
    expect(r.out).toEqual({ R1: 0, R2: 7 });
  });
});

describe('meaning and lack of meaning (photos 18–23)', () => {
  it('DALET: A=0 → SUB from an empty counter (no meaning)', () => {
    const r = exec('DALET (A)', { A: 0 });
    expect(r.stoppedBy).toBe('error');
    expect(r.state.error?.code).toBe('sub-empty');
  });
  it('DALET: A≠0 → A+1', () => expect(exec('DALET (A)', { A: 3 }).out).toEqual({ A: 4 }));
  it('BET: A=0 ends at once', () => expect(exec('BET (A,B)', { A: 0, B: 5 }).stoppedBy).toBe('done'));
  it('BET: A>0 is proven infinite (A only grows)', () => {
    const r = exec('BET (A,B)', { A: 2, B: 5 });
    expect(r.stoppedBy).toBe('diverges');
    expect(r.state.divergence?.reason).toBe('growing');
  });
  it('HE: A=0 has meaning; A>0 ends with an illegal SUB once B is empty', () => {
    expect(exec('HE (A,B)', { A: 0, B: 3 }).stoppedBy).toBe('done');
    const r = exec('HE (A,B)', { A: 2, B: 3 });
    expect(r.stoppedBy).toBe('error');
    expect(r.state.error?.written).toBe('B');
  });
  it('ALEF: meaning only when B ≥ A', () => {
    expect(exec('ALEF (A,B)', { A: 3, B: 5 }).out).toEqual({ A: 0, B: 2 });
    expect(exec('ALEF (A,B)', { A: 3, B: 2 }).stoppedBy).toBe('error');
  });
  it('GIMEL: meaning for every input — A gets B’s value, B empties', () => {
    for (const [a, b] of [[0, 0], [3, 4], [7, 0], [0, 6]]) expect(exec('GIMEL (A,B)', { A: a, B: b }).out).toEqual({ A: b, B: 0 });
  });
});

describe('step limit and the non-termination proof', () => {
  it('reaching the step limit is NOT a verdict of infinity', () => {
    const r = exec('WHILE (A)\n SUB (A)\nENDW', { A: 1000 }, {}, 100);
    expect(r.stoppedBy).toBe('limit');
    expect(r.state.status).toBe('running');
  });
  it('a loop that keeps the state identical is proven infinite', () => {
    expect(exec('WHILE (A)\n ADD (B)\n SUB (B)\nENDW', { A: 1, B: 0 }).stoppedBy).toBe('diverges');
  });
  it('a long finite run is not flagged', () => {
    expect(exec('HUN (A)\nWHILE (A)\n ADD (B)\n SUB (A)\nENDW', { A: 0, B: 0 }).out).toEqual({ A: 0, B: 100 });
  });
  it('nested loop that empties an inner counter each round: proven infinite when B starts at 0', () => {
    const r = exec('WHILE (A)\n ADD (B)\n WHILE (B)\n  SUB (B)\n ENDW\nENDW', { A: 1, B: 0 });
    expect(r.stoppedBy).toBe('diverges');
  });

  it('fuzz: every "proven infinite" verdict really keeps running much longer without the proof', () => {
    const counters = ['A', 'B', 'C'];
    let seed = 12345;
    const rnd = (n: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    const gen = (depth: number): string[] => {
      const lines: string[] = [];
      const len = 1 + rnd(4);
      for (let i = 0; i < len; i++) {
        const c = counters[rnd(3)];
        const r = rnd(10);
        const kind = depth > 1 ? (r < 6 ? 0 : 1) : r < 4 ? 0 : r < 6 ? 1 : 2;
        if (kind === 0) lines.push(`ADD (${c})`);
        else if (kind === 1) lines.push(`SUB (${c})`);
        else lines.push(`WHILE (${c})`, ...gen(depth + 1).map((l) => '  ' + l), 'ENDW');
      }
      return lines;
    };
    let proven = 0;
    for (let t = 0; t < 3000; t++) {
      const code = gen(0).join('\n');
      const p = prog(code, { library: 'none' });
      const inputs = { A: 1 + rnd(3), B: rnd(4), C: rnd(4) };
      const r = run(p, createMachine(p, inputs), { maxSteps: 20_000 });
      if (r.stoppedBy === 'diverges') {
        proven++;
        const check = run(p, createMachine(p, inputs), { maxSteps: Math.max(50_000, r.state.steps * 20), prove: false });
        expect(check.stoppedBy, code + JSON.stringify(inputs)).toBe('limit');
      }
      if (r.stoppedBy === 'done' || r.stoppedBy === 'error') {
        // and finite runs give the same result with the proof switched off
        const check = run(p, createMachine(p, inputs), { maxSteps: 20_000, prove: false });
        expect(check.stoppedBy).toBe(r.stoppedBy);
      }
    }
    expect(proven).toBeGreaterThan(30);
  }, 60_000);
});

describe('step-by-step events', () => {
  it('reports loop entry, iteration numbers, ENDW and exit', () => {
    const p = prog('WHILE (A)\n SUB (A)\nENDW');
    let s = createMachine(p, { A: 2 });
    const kinds: string[] = [];
    while (s.status === 'running') {
      const r = step(p, s);
      kinds.push(r.event.kind + ('iteration' in r.event ? r.event.iteration : ''));
      s = r.state;
    }
    expect(kinds).toEqual(['while-enter1', 'sub', 'endw1', 'while-enter2', 'sub', 'endw2', 'while-exit2', 'done']);
  });
  it('step() is pure: the previous state is not modified (history works)', () => {
    const p = prog('ADD (A)');
    const s0 = createMachine(p, { A: 1 });
    const s1 = step(p, s0).state;
    expect(s0.cells.A).toBe(1);
    expect(s1.cells.A).toBe(2);
  });
  it('a call opens a frame with private helpers and closes it on return', () => {
    const p = prog('TEN (R1)');
    let s = createMachine(p, { R1: 0 });
    const r1 = step(p, s);
    expect(r1.event.kind).toBe('call');
    s = r1.state;
    expect(s.frames).toHaveLength(2);
    expect(s.frames[1].bind.A).toBe('R1');
    expect(s.frames[1].bind.B).toMatch(/^B@/);
    const end = run(p, s);
    expect(end.state.frames).toHaveLength(1);
    expect(Object.keys(end.state.cells)).toEqual(['R1']);
  });
});
