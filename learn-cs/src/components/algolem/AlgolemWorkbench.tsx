'use client';
import { useState } from 'react';
import { LIBRARY } from '@/engines/algolem/library';
import { AlgolemLab } from './AlgolemLab';
import { PhotoRefs } from '@/components/ui/Origin';

interface Example {
  id: string;
  title: string;
  code: string;
  inputs: Record<string, number>;
  photos: number[];
  note?: string;
  /** Where the shown procedure body comes from. */
  noteLabel?: string;
}

const EXAMPLES: Example[] = [
  { id: 'move1', title: 'העברת R1 אל R2', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', inputs: { R1: 5, R2: 2 }, photos: [50] },
  { id: 'double', title: 'הוספת פי שניים', code: 'WHILE (R1)\n   ADD (R2)\n   ADD (R2)\n   SUB (R1)\nENDW', inputs: { R1: 3, R2: 0 }, photos: [49] },
  { id: 'zero', title: 'איפוס מונה', code: 'WHILE (R2)\n   SUB (R2)\nENDW', inputs: { R2: 6 }, photos: [48] },
  { id: 'three', title: 'הכנסת 3 למונה', code: 'WHILE (R2)\n   SUB (R2)\nENDW\nADD (R2)\nADD (R2)\nADD (R2)', inputs: { R2: 8 }, photos: [47] },
  {
    id: 'copy',
    title: 'העתקה בעזרת מונה עזר (דוגמה 7)',
    code: 'WHILE (R2)\n   SUB (R2)\nENDW\nWHILE (R3)\n   SUB (R3)\nENDW\nWHILE (R1)\n   ADD (R2)\n   ADD (R3)\n   SUB (R1)\nENDW\nWHILE (R3)\n   ADD (R1)\n   SUB (R3)\nENDW',
    inputs: { R1: 4, R2: 1, R3: 2 },
    photos: [44, 45],
  },
  { id: 'trace65', title: 'טבלת מעקב: R1=65, R2=10', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', inputs: { R1: 65, R2: 10 }, photos: [34] },
  { id: 'ex5', title: 'דוגמה 5 (ב.1): B גדל ב־12', code: 'FIVE (A)\nADD (A)\nWHILE (A)\n   ADD (B)\n   ADD (B)\n   SUB (A)\nENDW', inputs: { A: 0, B: 42 }, photos: [7, 6] },
  { id: 'ex6', title: 'דוגמה 6 (ב.1): C = A + B + 1', code: 'WHILE (A)\n   ADD (B)\n   SUB (A)\nENDW\nONE (C)\nWHILE (B)\n   ADD (C)\n   SUB (B)\nENDW', inputs: { A: 3, B: 4, C: 9 }, photos: [5, 4] },
  ...LIBRARY.map((p) => {
    const params = /\(([^)]*)\)/.exec(p.source.split('\n')[0])?.[1].split(',').map((s) => s.trim()) ?? [];
    const call = `${p.name} (${params.join(',')})`;
    const defaults: Record<string, Record<string, number>> = {
      ALEF: { A: 3, B: 5 }, BET: { A: 1, B: 2 }, GIMEL: { A: 3, B: 4 }, DALET: { A: 0 }, HE: { A: 1, B: 3 }, MOVE: { A: 4, B: 9 }, S: { A: 3, B: 40, C: 2 },
      SUM: { A: 3, B: 4, C: 0 }, MUL: { A: 3, B: 4, C: 0 }, POW: { A: 2, B: 3, C: 0 }, SUCC: { A: 4, B: 0 }, EXCH: { A: 2, B: 7 },
    };
    return {
      id: 'lib-' + p.name,
      title: `${p.name} — ${p.purpose}`,
      code: call,
      inputs: defaults[p.name] ?? Object.fromEntries(params.map((x) => [x, 3])),
      photos: p.photos,
      note: p.source,
      noteLabel: p.status === 'dictionary' ? 'המימוש בסימולטור (נכתב לאתר; במילון של הקורס מופיע רק הפירוש)' : 'הגדרת הפרוצדורה (מהמקור)',
    };
  }),
];

export function AlgolemWorkbench() {
  const [ex, setEx] = useState<Example>(EXAMPLES[0]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium" htmlFor="ex-pick">דוגמה מהקורס:</label>
        <select id="ex-pick" className="input w-auto max-w-full" value={ex.id} onChange={(e) => setEx(EXAMPLES.find((x) => x.id === e.target.value)!)}>
          {EXAMPLES.map((x) => (
            <option key={x.id} value={x.id}>{x.title}</option>
          ))}
        </select>
        <PhotoRefs photos={ex.photos} />
      </div>
      {ex.note && (
        <details className="text-sm">
          <summary className="cursor-pointer muted">{ex.noteLabel ?? 'הגדרת הפרוצדורה (מהמקור)'}</summary>
          <pre className="listing mt-1 p-2 code" dir="ltr">{ex.note}</pre>
        </details>
      )}
      <AlgolemLab key={ex.id} code={ex.code} inputs={ex.inputs} editable variant="full" panels={['trace']} />
    </div>
  );
}
