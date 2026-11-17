import { describe, expect, it } from 'vitest';
import { compile, createMachine, run, visibleCounters } from '../index';
import { evalEffect, formatEffect, segmentProgram, summarizeProgram } from '../symbolic';
import { buildTrace, iterationTable, lineTable, roundFormula } from '../trace';
import { describeEvent, explainProgram } from '@/explain/algolem';

const prog = (main: string) => {
  const r = compile({ main });
  if (!r.ok) throw new Error(r.errors[0].message);
  return r.program;
};
const formulas = (main: string) => {
  const p = prog(main);
  const e = summarizeProgram(p);
  return e ? Object.fromEntries(formatEffect(e, p.counters).map((f) => [f.counter, f.expr])) : null;
};

describe('symbolic summaries (modular trace table)', () => {
  it('A = 0, B = B + 2·A (photos 7, 13)', () => {
    expect(formulas('WHILE (A)\n ADD (B)\n ADD (B)\n SUB (A)\nENDW')).toEqual({ A: '0', B: 'B + 2·A' });
  });
  it('11.2: C = A + B + 1 (photo 4)', () => {
    expect(formulas('WHILE (A)\n ADD (B)\n SUB (A)\nENDW\nONE (C)\nWHILE (B)\n ADD (C)\n SUB (B)\nENDW')).toEqual({ A: '0', B: '0', C: 'A + B + 1' });
  });
  it('FIVE (A), ADD (A), loop → B = B + 12 (photo 7)', () => {
    expect(formulas('FIVE (A)\nADD (A)\nWHILE (A)\n ADD (B)\n ADD (B)\n SUB (A)\nENDW')).toEqual({ A: '0', B: 'B + 12' });
  });
  it('MOVE (A,B) → B = A, A unchanged', () => {
    expect(formulas('MOVE (A,B)')).toEqual({ A: 'A', B: 'A' });
  });
  it('HUN (A) → A = 100 (nested loops)', () => {
    expect(formulas('HUN (A)')).toEqual({ A: '100' });
  });
  it('multiplication-like loop gives a product term', () => {
    expect(formulas('WHILE (A)\n MOVE (B,T)\n WHILE (T)\n  ADD (C)\n  SUB (T)\n ENDW\n SUB (A)\nENDW')).toMatchObject({ A: '0', C: 'C + A·B' });
  });
  it('summaries agree with the engine on many inputs', () => {
    const codes = ['WHILE (A)\n ADD (B)\n ADD (B)\n SUB (A)\nENDW', 'MOVE (A,B)\nWHILE (B)\n ADD (C)\n SUB (B)\nENDW', 'S (A,B,C)', 'GIMEL (A,B)'];
    for (const code of codes) {
      const p = prog(code);
      const e = summarizeProgram(p)!;
      for (let a = 0; a < 4; a++)
        for (let b = 0; b < 4; b++) {
          const input = { A: a, B: b, C: 2 };
          const r = run(p, createMachine(p, input));
          const ev = evalEffect(e, { ...Object.fromEntries(p.counters.map((c) => [c, 0])), ...input });
          for (const c of p.counters) expect(ev[c]).toBe(visibleCounters(p, r.state)[c]);
        }
    }
  });
  it('segments the main algorithm into straight runs, loops and calls', () => {
    const segs = segmentProgram(prog('FIVE (A)\nADD (A)\nWHILE (A)\n ADD (B)\n ADD (B)\n SUB (A)\nENDW'));
    expect(segs.map((s) => [s.kind, s.from, s.to])).toEqual([['call', 1, 1], ['straight', 2, 2], ['loop', 3, 7]]);
  });
});

describe('trace tables', () => {
  const p = prog('WHILE (R1)\n ADD (R2)\n SUB (R1)\nENDW');
  const t = buildTrace(p, { R1: 5, R2: 2 });
  it('round table matches the guide (5,2) → (4,3) … (0,7)', () => {
    const cols = iterationTable(t);
    expect(cols.map((c) => c.values && [c.values.R1, c.values.R2])).toEqual([[5, 2], [4, 3], [3, 4], [2, 5], [1, 6], [0, 7], [0, 7]]);
  });
  it('line table has a column per executed line, grouped by rounds', () => {
    const cols = lineTable(t);
    expect(cols.length).toBe(1 + 10 + 1);
    expect(cols[1]).toMatchObject({ group: 'סיבוב 1', label: "ש' 2" });
  });
  it('round formula: R1 = 5 − n, R2 = 2 + n, 5 rounds', () => {
    expect(roundFormula(t)).toMatchObject({ loopCounter: 'R1', delta: { R1: -1, R2: 1 }, rounds: 5 });
  });
  it('explanations exist for every event at every level', () => {
    for (const r of t.rows) for (const lvl of [1, 2, 3] as const) expect(describeEvent(r.event, t.final, lvl).length).toBeGreaterThan(5);
    expect(explainProgram('WHILE (A)\n SUB (A)\nENDW').map((x) => x.depth)).toEqual([0, 1, 0]);
  });
});
