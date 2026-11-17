'use client';
import { useState } from 'react';
import { LogoLab } from './LogoLab';
import { PhotoRefs } from '@/components/ui/Origin';

const TOOTH = 'TO TOOTH :SIZE\n  FD :SIZE\n  LT 90\n  FD :SIZE\n  LT 90\n  FD :SIZE\n  RT 90\n  FD :SIZE\n  RT 90\nEND';
const TEETH = 'TO TEETH :TIMES :SIZE\n  REPEAT :TIMES [\n    TOOTH :SIZE\n  ]\nEND';
const EX = [
  { id: 'square', title: 'ריבוע עם REPEAT', code: 'REPEAT 4 [ FD 10 RT 90 ]', run: '', photos: [70] },
  { id: 'sq-proc', title: 'פרוצדורה SQUARE :SIZE', code: 'TO SQUARE :SIZE\n  REPEAT 4 [\n    FD :SIZE\n    RT 90\n  ]\nEND', run: 'SQUARE 50', photos: [70] },
  { id: 'poly', title: 'POLYGONS :SIDES :SIZE', code: 'TO POLYGONS :SIDES :SIZE\n  REPEAT :SIDES [\n    FD :SIZE\n    RT 360 / :SIDES\n  ]\nEND', run: 'POLYGONS 6 40', photos: [69] },
  { id: 'teeth', title: 'מקרה 1: TEETH ו־TOOTH', code: `${TOOTH}\n\n${TEETH}`, run: 'TEETH 3 20', photos: [76] },
  { id: 'moo', title: 'שם אחר לפרמטר: TOOTH :MOO', code: `${TOOTH.replace(/:SIZE/g, ':MOO')}\n\n${TEETH}`, run: 'TEETH 3 20', photos: [75, 74] },
  { id: 'case4', title: 'מקרה 4: TOOTH בלי פרמטר', code: `${TOOTH.replace('TO TOOTH :SIZE', 'TO TOOTH')}\n\n${TEETH.replace('TOOTH :SIZE', 'TOOTH')}`, run: 'TEETH 3 20', photos: [73] },
  { id: 'task', title: 'דף המשימה (שאלה 2)', code: 'REPEAT 4 [ FD 100 RT 90 ]\nPU LT 90 FD 50 RT 90 PD\nREPEAT 4 [ REPEAT 3 [ FD 100 LT 120 ] PU FD 150 RT 90 FD 50 PD ]', run: '', photos: [54] },
];

export function LogoWorkbench() {
  const [ex, setEx] = useState(EX[0]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="logo-ex" className="text-sm font-medium">דוגמה מהקורס:</label>
        <select id="logo-ex" className="input w-auto" value={ex.id} onChange={(e) => setEx(EX.find((x) => x.id === e.target.value)!)}>
          {EX.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
        </select>
        <PhotoRefs photos={ex.photos} />
      </div>
      <LogoLab key={ex.id} code={ex.code} run={ex.run} editable showStack variant="full" />
    </div>
  );
}
