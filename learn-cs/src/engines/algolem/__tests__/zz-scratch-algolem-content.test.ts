// TEMPORARY scratch test for writing the algolem track content. Delete after use.
import { it } from 'vitest';
import { compile, createMachine, run, visibleCounters } from '@/engines/algolem';
import type { HelperMode } from '@/engines/algolem';

function exec(main: string, inputs: Record<string, number>, helperMode: HelperMode = 'local', procedures?: string[]) {
  const c = compile({ main, helperMode, procedures });
  if (!c.ok) return { compile: c.errors.map((e) => `${e.line}: ${e.message}`).join('; ') };
  const r = run(c.program, createMachine(c.program, inputs), { maxSteps: 200_000, events: true });
  const ev = r.events ?? [];
  const adds: Record<string, number> = {};
  const calls: Record<string, number> = {};
  for (const e of ev) {
    if (e.kind === 'add' || e.kind === 'sub') adds[`${e.kind}:${e.unit}:${e.written}`] = (adds[`${e.kind}:${e.unit}:${e.written}`] ?? 0) + 1;
    if (e.kind === 'call') calls[e.proc] = (calls[e.proc] ?? 0) + 1;
  }
  return {
    counters: c.program.counters,
    stoppedBy: r.stoppedBy,
    out: r.stoppedBy === 'done' ? visibleCounters(c.program, r.state) : null,
    steps: r.state.steps,
    err: r.state.error?.message,
    div: r.state.divergence ? `${r.state.divergence.reason} line ${r.state.divergence.line} ${r.state.divergence.unit}` : undefined,
    adds,
    calls,
  };
}

const cases: [string, string, Record<string, number>, HelperMode?, string[]?][] = [
  ['HUN shared', 'HUN (A)', { A: 0 }, 'shared'],
  ['HUN private', 'HUN (A)', { A: 7 }],
  ['TEN(B) shared', 'TEN (B)', { B: 3 }, 'shared'],
  ['TEN(B) private', 'TEN (B)', { B: 3 }],
  ['TEN then ADD B private', 'TEN (A)\nADD (B)', { A: 3, B: 7 }],
  ['TEN then ADD B shared', 'TEN (A)\nADD (B)', { A: 3, B: 7 }, 'shared'],
  ['MOVE then ADD C private', 'MOVE (R1,R2)\nADD (C)', { R1: 4, R2: 9, C: 7 }],
  ['MOVE then ADD C shared', 'MOVE (R1,R2)\nADD (C)', { R1: 4, R2: 9, C: 7 }, 'shared'],
  ['MOVE R1 R1', 'MOVE (R1,R1)', { R1: 6 }],
  ['MOVE R2 R1', 'MOVE (R2,R1)', { R1: 4, R2: 9 }],
  ['HUN-like shared with TWO(B)', 'ZERO (A)\nTWO (B)\nWHILE (B)\n   TEN (T)\n   WHILE (T)\n      SUB (T)\n      ADD (A)\n   ENDW\n   SUB (B)\nENDW', { A: 0 }, 'shared'],
  ['HUN body as main', '@HUN (A)\n   ZERO (A)\n   TEN (B)\n   WHILE(B)\n      TEN (T)\n      WHILE (T)\n         SUB(T)\n         ADD(A)\n      ENDW\n      SUB (B)\n   ENDW', { A: 3 }],
  ['HUN body as main shared', '@ HUN (A)\n   ZERO (A)\n   TEN (B)\n   WHILE (B)\n      TEN (T)\n      WHILE (T)\n         SUB (T)\n         ADD (A)\n      ENDW\n      SUB (B)\n   ENDW', { A: 3 }, 'shared'],
  ['HUN variant FIVE(B)', '@ HUN (A)\n   ZERO (A)\n   FIVE (B)\n   WHILE (B)\n      TEN (T)\n      WHILE (T)\n         SUB (T)\n         ADD (A)\n      ENDW\n      SUB (B)\n   ENDW', { A: 3 }],
  ['TEN calls', 'TEN (A)', { A: 3 }],
  ['FIVE calls', 'FIVE (C)', { C: 8 }],
  ['MOVE body as main', '@ MOVE(A,B)\n   ZERO (B)\n   ZERO (C)\n   WHILE (A)\n       ADD(B)\n       ADD (C)\n       SUB (A)\n   ENDW\n   WHILE (C)\n       ADD(A)\n       SUB (C)\n   ENDW', { A: 4, B: 9, C: 2 }],
  ['TEN slide spelling', '@TEN(A)\n  FIVE(A)\n  FIVE(B)\n  WHILE (B)\n     SUB(B)\n     ADD(A)\n  ENDW', { A: 3 }],
  ['check L08', 'TWO (A)\nFIVE (B)\nWHILE (A)\n   ADD (B)\n   SUB (A)\nENDW', { A: 9, B: 1 }],
  ['check L02', 'SUB (R5)\nSUB (R5)\nSUB (R5)\nADD (R5)', { R5: 2 }],
  ['ex7', 'WHILE (R2)\n    SUB (R2)\nENDW\nWHILE (R3)\n    SUB (R3)\nENDW\nWHILE (R1)\n    ADD (R2)\n    ADD (R3)\n    SUB (R1)\nENDW\nWHILE (R3)\n    ADD (R1)\n    SUB (R3)\nENDW', { R1: 4, R2: 9, R3: 2 }],
  ['ex7 skip zero R3', 'WHILE (R2)\n    SUB (R2)\nENDW\nWHILE (R1)\n    ADD (R2)\n    ADD (R3)\n    SUB (R1)\nENDW\nWHILE (R3)\n    ADD (R1)\n    SUB (R3)\nENDW', { R1: 4, R2: 9, R3: 2 }],
  ['ADDTO call', 'ADDTO (R2,R5)', { R2: 9, R5: 6 }, 'local', ['@ ADDTO (A,B)\n   WHILE (A)\n      ADD (B)\n      SUB (A)\n   ENDW']],
  ['ADDTO (B,A)', 'ADDTO (B,A)', { A: 3, B: 4 }, 'local', ['@ ADDTO (A,B)\n   WHILE (A)\n      ADD (B)\n      SUB (A)\n   ENDW']],
  ['small nested', 'ZERO (A)\nTWO (B)\nADD (B)\nWHILE (B)\n   FIVE (T)\n   WHILE (T)\n      SUB (T)\n      ADD (A)\n   ENDW\n   SUB (B)\nENDW', { A: 4 }],
  ['L09 check build', 'MOVE (R5,R2)', { R5: 6, R2: 9 }],
  ['build 30', 'ZERO (A)\nTWO (B)\nADD (B)\nWHILE (B)\n   TEN (T)\n   WHILE (T)\n      SUB (T)\n      ADD (A)\n   ENDW\n   SUB (B)\nENDW', { A: 7 }],
  ['double keep', 'MOVE (R1,R2)\nMOVE (R1,R3)\nWHILE (R3)\n   ADD (R2)\n   SUB (R3)\nENDW', { R1: 3, R2: 7, R3: 4 }],
  ['ZERO generalize bug', 'ZBUG (R5)', { R5: 3 }, 'local', ['@ ZBUG (A)\n   WHILE (A)\n      SUB (R1)\n   ENDW']],
  ['move bug', 'MBUG (R1,R2)', { R1: 4, R2: 9 }, 'local', ['@ MBUG (A,B)\n   ZERO (B)\n   ZERO (C)\n   WHILE (A)\n      ADD (B)\n      ADD (C)\n      SUB (A)\n   ENDW\n   WHILE (C)\n      ADD (B)\n      SUB (C)\n   ENDW']],
  ['zero loop wrong sub', 'WHILE (R2)\n   SUB (R3)\nENDW\nADD (R2)\nADD (R2)\nADD (R2)', { R2: 9, R3: 2 }],
  ['ex6 code', 'WHILE (R2)\n   SUB (R2)\nENDW\nWHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', { R1: 4, R2: 9 }],
  ['L05 pred', 'WHILE (R6)\n   SUB (R6)\nENDW\nADD (R6)\nWHILE (R5)\n   ADD (R6)\n   SUB (R5)\nENDW', { R5: 6, R6: 11 }],
  ['L04 pred', 'WHILE (R5)\n   ADD (R1)\n   ADD (R3)\n   SUB (R5)\nENDW', { R1: 4, R3: 2, R5: 6 }],
  ['L09 check pred', 'MOVE (R1,R2)\nWHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', { R1: 3, R2: 8 }],
];

it('scratch', () => {
  for (const [name, code, inputs, mode, procs] of cases) console.log(name.padEnd(28), JSON.stringify(exec(code, inputs, mode, procs)));
});
