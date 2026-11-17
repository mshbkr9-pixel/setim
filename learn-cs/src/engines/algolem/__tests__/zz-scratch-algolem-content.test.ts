// TEMPORARY scratch test for writing the algolem track content. Delete after use.
import { expect, it } from 'vitest';
import { compile, createMachine, run, visibleCounters } from '@/engines/algolem';
import { buildTrace, iterationTable, lineTable } from '@/engines/algolem/trace';
import { algolemLessons } from '@/content/lessons/algolem';
import { algolemQuestions } from '@/content/questions/algolem';
import type { AlgolemTest, AlgolemWidget, Question } from '@/content/types';

function out(code: string, inputs: Record<string, number>, procedures?: string[]) {
  const c = compile({ main: code, procedures });
  if (!c.ok) return 'compile: ' + c.errors[0].message;
  const r = run(c.program, createMachine(c.program, inputs), { maxSteps: 200_000 });
  return r.stoppedBy === 'done' ? visibleCounters(c.program, r.state) : r.stoppedBy;
}

function passes(code: string, tests: AlgolemTest[]) {
  for (const t of tests) {
    const o = out(code, t.inputs);
    if (typeof o === 'string') return `${JSON.stringify(t.inputs)} -> ${o}`;
    for (const [k, v] of Object.entries(t.expect as Record<string, number>)) if (o[k] !== v) return `${JSON.stringify(t.inputs)}: ${k}=${o[k]} expected ${v}`;
  }
  return null;
}

/** Intended learner solutions for the tryIt goals. */
const goalSolutions: Record<string, string> = {
  'algolem-04': 'WHILE (R1)\n   ADD (R2)\n   ADD (R2)\n   SUB (R1)\nENDW',
  'algolem-05': 'WHILE (R2)\n   SUB (R2)\nENDW\nADD (R2)\nADD (R2)\nADD (R2)\nADD (R2)\nADD (R2)',
  'algolem-06':
    'WHILE (R2)\n   SUB (R2)\nENDW\nWHILE (R4)\n   SUB (R4)\nENDW\nWHILE (R3)\n   SUB (R3)\nENDW\nWHILE (R1)\n   ADD (R2)\n   ADD (R4)\n   ADD (R3)\n   SUB (R1)\nENDW\nWHILE (R3)\n   ADD (R1)\n   SUB (R3)\nENDW',
  'algolem-07': '@ ADDTO (A,B)\n   WHILE (A)\n      ADD (B)\n      SUB (A)\n   ENDW',
  'algolem-08': '@ THREE (A)\n   TWO (A)\n   ADD (A)',
  'algolem-10': '@ HUN (A)\n   ZERO (A)\n   TEN (B)\n   WHILE (B)\n      FIVE (T)\n      WHILE (T)\n         SUB (T)\n         ADD (A)\n      ENDW\n      SUB (B)\n   ENDW',
};

it('tryIt goals are reachable, and the starter code does not already pass', () => {
  for (const l of algolemLessons) {
    const w = l.tryIt.widget as AlgolemWidget;
    if (w.kind !== 'algolem' || !w.goal) continue;
    const sol = goalSolutions[l.id];
    expect(sol, `${l.id}: no intended solution`).toBeDefined();
    expect(passes(sol, w.goal.tests), `${l.id}: intended solution`).toBeNull();
    expect(passes(w.code, w.goal.tests), `${l.id}: starter already passes`).not.toBeNull();
    console.log(l.id, 'goal ok');
  }
});

it('prints engine results for every program-based question and widget', () => {
  const qs: Question[] = [...algolemQuestions, ...algolemLessons.map((l) => l.check)];
  for (const q of qs) {
    if (q.type === 'predict' || q.type === 'trace-fill') {
      const c = compile({ main: q.program.code, procedures: q.program.procedures });
      if (!c.ok) throw new Error(q.id);
      const tr = buildTrace(c.program, q.program.inputs);
      const cols = q.type === 'trace-fill' && q.mode === 'rounds' ? iterationTable(tr) : lineTable(tr);
      console.log(q.id, q.type, tr.stoppedBy, JSON.stringify(tr.output), q.type === 'trace-fill' ? cols.map((col) => `${col.group}${col.label}:${JSON.stringify(col.values)}`).join(' | ') : '');
    }
    if (q.code && (q.type === 'mcq' || q.type === 'numeric')) console.log(q.id, q.type, 'code shown:', JSON.stringify(q.code).slice(0, 60));
  }
  // MCQ / numeric answers that depend on running code
  console.log('L02 check', JSON.stringify(out('SUB (R5)\nSUB (R5)\nSUB (R5)\nADD (R5)', { R5: 2 })));
  console.log('L04 check', JSON.stringify(out('WHILE (R3)\n   ADD (R5)\n   ADD (R5)\n   ADD (R5)\n   SUB (R3)\nENDW', { R3: 4, R5: 1 })));
  console.log('q-006 A=0', ['ADD (A)\nSUB (A)', 'SUB (A)\nADD (A)', 'ADD (A)\nSUB (A)\nSUB (A)', 'ADD (A)\nADD (A)\nSUB (A)\nSUB (A)\nSUB (A)'].map((c) => JSON.stringify(out(c, { A: 0 }))).join(' '));
  console.log('q-006 A=5', ['ADD (A)\nSUB (A)', 'SUB (A)\nADD (A)', 'ADD (A)\nSUB (A)\nSUB (A)', 'ADD (A)\nADD (A)\nSUB (A)\nSUB (A)\nSUB (A)'].map((c) => JSON.stringify(out(c, { A: 5 }))).join(' '));
  console.log('q-009', JSON.stringify(out('WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', { R1: 0, R2: 6 })));
  console.log('q-012', JSON.stringify(out('WHILE (A)\n   ADD (B)\n   SUB (A)\nENDW', { A: 3, B: 5 })));
  console.log('q-016 R2=0', JSON.stringify(out('WHILE (R2)\n   SUB (R3)\nENDW\nADD (R2)\nADD (R2)\nADD (R2)', { R2: 0, R3: 4 })), 'R2=2,R3=9', JSON.stringify(out('WHILE (R2)\n   SUB (R3)\nENDW\nADD (R2)\nADD (R2)\nADD (R2)', { R2: 2, R3: 9 })));
  console.log('q-025', JSON.stringify(out('ADDTO (B,A)', { A: 3, B: 4 }, ['@ ADDTO (A,B)\n   WHILE (A)\n      ADD (B)\n      SUB (A)\n   ENDW'])));
  console.log('L07 bug', JSON.stringify(out('ZBUG (R5)', { R5: 3 }, ['@ ZBUG (A)\n   WHILE (A)\n      SUB (R1)\n   ENDW'])));
  console.log('L07 fixed', JSON.stringify(out('ZFIX (R5)', { R5: 3 }, ['@ ZFIX (A)\n   WHILE (A)\n      SUB (A)\n   ENDW'])));
  console.log('L01 tryIt', JSON.stringify(out('ADD (R1)\nADD (R2)\nADD (R3)\nADD (R4)\nADD (R5)\nADD (R6)', { R1: 4, R2: 9, R3: 2, R4: 0, R5: 6, R6: 11 })));
  console.log('L02 visual', JSON.stringify(out('SUB (R1)\nADD (R4)\nADD (R4)\nSUB (R6)', { R1: 4, R4: 0, R6: 11 })));
  console.log('L02 tryIt', JSON.stringify(out('ADD (R4)\nSUB (R4)\nSUB (R4)', { R4: 0 })), JSON.stringify(out('ADD (R4)\nSUB (R4)\nSUB (R4)', { R4: 1 })));
  console.log('L09 two dests', JSON.stringify(out('MOVE (R1,R2)\nMOVE (R1,R3)', { R1: 6, R2: 1, R3: 2 })));
  console.log('L08 FIVE(C)', JSON.stringify(out('FIVE (C)', { C: 8 })));
  console.log('ZERO B C', JSON.stringify(out('ZERO (B)\nZERO (C)', { B: 3, C: 5 })));
  console.log('L06 forget zero', JSON.stringify(out('WHILE (R2)\n   SUB (R2)\nENDW\nWHILE (R1)\n   ADD (R2)\n   ADD (R3)\n   SUB (R1)\nENDW\nWHILE (R3)\n   ADD (R1)\n   SUB (R3)\nENDW', { R1: 4, R2: 9, R3: 2 })));
});
