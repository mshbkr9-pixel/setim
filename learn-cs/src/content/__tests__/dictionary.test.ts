import { describe, expect, it } from 'vitest';
import { DICTIONARY } from '../dictionary';
import { compile, createMachine, run, visibleCounters, LIBRARY_BY_NAME } from '@/engines/algolem';
import { explainLine, meaningWith } from '@/explain/algolem';

/** Runs `main` and returns the visible counters, or throws when there is no output. */
function exec(main: string, inputs: Record<string, number>, maxSteps = 2_000_000) {
  const c = compile({ main });
  if (!c.ok) throw new Error(c.errors.map((e) => e.message).join('; '));
  const r = run(c.program, createMachine(c.program, inputs), { maxSteps });
  if (r.stoppedBy !== 'done') throw new Error(`${main}: ${r.stoppedBy}`);
  return visibleCounters(c.program, r.state);
}

/** Evaluates a dictionary statement list ("C = A+B", "A = B", "B = A") simultaneously on `v`. */
function applyMeaning(meaning: string[], v: Record<string, number>): Record<string, number> {
  const out = { ...v };
  for (const st of meaning) {
    const [lhs, rhs] = st.split('=').map((x) => x.trim());
    const expr = rhs.replace(/–/g, '-').replace(/\^/g, '**').replace(/\b([A-Z])\b/g, (_, n: string) => String(v[n] ?? 0));
    if (!/^[\d\s+\-*]+$/.test(expr)) throw new Error(`unexpected meaning: ${st}`);
    out[lhs] = Function(`"use strict"; return (${expr});`)() as number;
  }
  return out;
}

describe('course dictionary', () => {
  it('every word with a procedure exists in the simulator library', () => {
    for (const d of DICTIONARY) if (d.library) expect(LIBRARY_BY_NAME[d.library], d.word).toBeDefined();
  });

  it('every example runs, and the result is exactly the meaning written in the dictionary', () => {
    for (const d of DICTIONARY) {
      if (d.kind === 'control') continue;
      const got = exec(d.example.code, d.example.inputs);
      const want = applyMeaning(d.meaning, d.example.inputs);
      for (const [k, val] of Object.entries(want)) expect(got[k], `${d.word}: ${k}`).toBe(val);
    }
  });

  it('the loop example of WHILE-ENDW moves A into B', () => {
    const d = DICTIONARY.find((x) => x.word === 'WHILE-ENDW')!;
    expect(exec(d.example.code, d.example.inputs)).toMatchObject({ A: 0, B: 4 });
  });
});

describe('dictionary words in the engine', () => {
  const grid = [0, 1, 2, 3, 5];
  it('SUM (A,B,C): C = A+B, A and B unchanged', () => {
    for (const a of grid) for (const b of grid) expect(exec('SUM (A,B,C)', { A: a, B: b, C: 9 })).toMatchObject({ A: a, B: b, C: a + b });
  });
  it('MUL (A,B,C): C = A*B, A and B unchanged', () => {
    for (const a of grid) for (const b of grid) expect(exec('MUL (A,B,C)', { A: a, B: b, C: 9 })).toMatchObject({ A: a, B: b, C: a * b });
  });
  it('POW (A,B,C): C = A^B (A^0 = 1, also for A = 0)', () => {
    for (const a of [0, 1, 2, 3]) for (const b of [0, 1, 2, 3]) expect(exec('POW (A,B,C)', { A: a, B: b, C: 9 })).toMatchObject({ A: a, B: b, C: a ** b });
  });
  it('SUCC (A,B): B = A+1', () => {
    for (const a of grid) expect(exec('SUCC (A,B)', { A: a, B: 7 })).toMatchObject({ A: a, B: a + 1 });
  });
  it('EXCH (A,B): swaps', () => {
    expect(exec('EXCH (A,B)', { A: 2, B: 7 })).toMatchObject({ A: 7, B: 2 });
    expect(exec('EXCH (A,B)', { A: 0, B: 4 })).toMatchObject({ A: 4, B: 0 });
  });
  it('the result may be written into one of the inputs (as in the recursion-pattern task)', () => {
    expect(exec('SUM (B,E,B)', { B: 6, E: 5 })).toMatchObject({ B: 11, E: 5 });
    expect(exec('MUL (N,B,B)', { N: 3, B: 4 })).toMatchObject({ N: 3, B: 12 });
    expect(exec('MUL (N,N,T)', { N: 4 })).toMatchObject({ N: 4, T: 16 });
    expect(exec('SUM (A,A,A)', { A: 4 })).toMatchObject({ A: 8 });
    expect(exec('SUCC (A,A)', { A: 4 })).toMatchObject({ A: 5 });
    expect(exec('POW (A,B,A)', { A: 3, B: 2 })).toMatchObject({ A: 9, B: 2 });
  });
});

describe('explanations use the dictionary meaning with the real counters', () => {
  it('meaningWith renames parameters', () => {
    expect(meaningWith('SUM', ['D', 'E', 'D'])).toBe('D = D+E');
    expect(meaningWith('MOVE', ['A', 'D'])).toBe('D = A, A = A');
    expect(meaningWith('EXCH', ['X', 'Y'])).toBe('X = Y, Y = X');
    expect(meaningWith('ALEF', ['A', 'B'])).toBeNull();
  });
  it('explainLine mentions the result', () => {
    expect(explainLine('MUL (C,A,E)')).toContain('E = C*A');
  });
});
