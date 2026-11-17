'use client';
import { useMemo, useState } from 'react';
import { SetsLab } from '@/components/widgets/SetsLab';
import { parseSetAnswer, formatSet, uniq, type El } from '@/engines/sets';

/** ℕ² explorer: pairs are ordered — (a,b) and (b,a) are different points. */
function PairsGrid() {
  const [picked, setPicked] = useState<[number, number][]>([[1, 2]]);
  const N = 5;
  const has = (a: number, b: number) => picked.some(([x, y]) => x === a && y === b);
  const toggle = (a: number, b: number) => setPicked((p) => (has(a, b) ? p.filter(([x, y]) => !(x === a && y === b)) : [...p, [a, b]]));
  const s = 34;
  return (
    <div className="card space-y-2 p-3 sm:p-4">
      <h3 className="text-lg">זוגות סדורים ב־ℕ²</h3>
      <svg viewBox={`0 0 ${(N + 1) * s + 20} ${(N + 1) * s + 20}`} className="mx-auto w-full max-w-xs" direction="ltr" role="img" aria-label="רשת זוגות סדורים">
        {Array.from({ length: N + 1 }, (_, a) =>
          Array.from({ length: N + 1 }, (_, b) => (
            <g key={`${a}-${b}`} onClick={() => toggle(a, b)} style={{ cursor: 'pointer' }}>
              <circle cx={20 + a * s} cy={(N - b) * s + 10} r={has(a, b) ? 8 : 4} fill={has(a, b) ? 'var(--t-sets)' : 'var(--line-2)'} />
            </g>
          )),
        )}
        {Array.from({ length: N + 1 }, (_, i) => (
          <g key={i}>
            <text x={20 + i * s} y={(N + 1) * s + 4} textAnchor="middle" fontSize={11} fill="var(--ink-3)">{i}</text>
            <text x={4} y={(N - i) * s + 14} fontSize={11} fill="var(--ink-3)">{i}</text>
          </g>
        ))}
      </svg>
      <p className="font-mono text-sm" dir="ltr">{picked.length ? `{${picked.map(([a, b]) => `(${a},${b})`).join(', ')}}` : '∅'}</p>
      <p className="text-sm">לחצו על נקודות. שימו לב: <span className="font-mono" dir="ltr">(1,2)</span> ו־<span className="font-mono" dir="ltr">(2,1)</span> הן שתי נקודות שונות — בזוג סדור הסדר חשוב, בקבוצה לא.</p>
    </div>
  );
}

/** {x ∈ ℤ | a ≤ x < b} — set-builder notation evaluated on a small range. */
function Builder() {
  const [lo, setLo] = useState(5);
  const [hi, setHi] = useState(12);
  const [loInc, setLoInc] = useState(true);
  const [hiInc, setHiInc] = useState(false);
  const els = useMemo(() => {
    const out: number[] = [];
    for (let x = -20; x <= 60; x++) if ((loInc ? x >= lo : x > lo) && (hiInc ? x <= hi : x < hi)) out.push(x);
    return out;
  }, [lo, hi, loInc, hiInc]);
  return (
    <div className="card space-y-2 p-3 sm:p-4">
      <h3 className="text-lg">הגדרת קבוצה באמצעות תנאי</h3>
      <div className="flex flex-wrap items-center gap-1.5 font-mono" dir="ltr">
        <span>{'E = { x ∈ ℤ |'}</span>
        <input className="input num-input w-14" value={lo} onChange={(e) => setLo(Number(e.target.value.replace(/[^\d-]/g, '') || 0))} />
        <button className="btn btn-sm" onClick={() => setLoInc(!loInc)}>{loInc ? '≤' : '<'}</button>
        <span>x</span>
        <button className="btn btn-sm" onClick={() => setHiInc(!hiInc)}>{hiInc ? '≤' : '<'}</button>
        <input className="input num-input w-14" value={hi} onChange={(e) => setHi(Number(e.target.value.replace(/[^\d-]/g, '') || 0))} />
        <span>{'}'}</span>
      </div>
      <p className="font-mono text-sm" dir="ltr">E = {els.length ? `{${els.join(', ')}}` : '∅'}</p>
      <p className="text-sm muted">לחצו על הסימנים כדי להחליף בין &lt; ל־≤ וראו אילו מספרים נכנסים או יוצאים.</p>
    </div>
  );
}

export function SetsWorkbench() {
  const [aText, setAText] = useState('1, 2, 3, 4, 5');
  const [bText, setBText] = useState('1, 3, 5, 7, 9');
  const A = parseSetAnswer(aText);
  const B = parseSetAnswer(bText);
  const universe: El[] = uniq([...A, ...B, ...[0, 6, 8].filter((x) => !A.includes(x) && !B.includes(x))]).slice(0, 18);
  const key = `${formatSet(A)}|${formatSet(B)}`;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5"><span className="font-mono">A =</span><input className="input w-48 font-mono" dir="ltr" value={aText} onChange={(e) => setAText(e.target.value)} aria-label="איברי A" /></label>
        <label className="flex items-center gap-1.5"><span className="font-mono">B =</span><input className="input w-48 font-mono" dir="ltr" value={bText} onChange={(e) => setBText(e.target.value)} aria-label="איברי B" /></label>
        <span className="text-xs muted">כתבו איברים מופרדים בפסיקים (עד 18 איברים בתמונה).</span>
      </div>
      <SetsLab key={key} universe={universe} sets={{ A, B }} show="difference" />
      <div className="grid gap-4 md:grid-cols-2">
        <Builder />
        <PairsGrid />
      </div>
    </div>
  );
}
