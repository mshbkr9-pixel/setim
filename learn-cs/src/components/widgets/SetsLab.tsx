'use client';
import { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { difference, formatSet, intersection, isEqual, isProperSubset, isSubset, type El } from '@/engines/sets';

type Region = 'A' | 'B' | 'AB' | 'out';
const W = 420;
const H = 250;
const CA = { x: 160, y: 125, r: 92 };
const CB = { x: 262, y: 125, r: 92 };

function regionAt(x: number, y: number): Region {
  const inA = (x - CA.x) ** 2 + (y - CA.y) ** 2 <= CA.r ** 2;
  const inB = (x - CB.x) ** 2 + (y - CB.y) ** 2 <= CB.r ** 2;
  return inA && inB ? 'AB' : inA ? 'A' : inB ? 'B' : 'out';
}

const SLOTS: Record<Region, [number, number][]> = {
  A: [[110, 85], [100, 125], [110, 165], [140, 60], [140, 190], [135, 105], [135, 145]],
  AB: [[211, 80], [211, 115], [211, 150], [211, 185]],
  B: [[312, 85], [322, 125], [312, 165], [282, 60], [282, 190], [287, 105], [287, 145]],
  out: [[30, 30], [30, 220], [390, 30], [390, 220], [70, 230], [350, 230], [210, 22], [210, 232], [20, 125], [400, 125]],
};

export interface SetsLabProps {
  universe: El[];
  sets: Record<string, El[]>;
  show?: 'none' | 'difference' | 'intersection' | 'union' | 'subset' | 'equal';
  draggable?: boolean;
  /** false = do not print computed results (used as a hint inside a question). */
  reveal?: boolean;
}

/** Venn diagram with draggable elements; the notation updates live. */
export function SetsLab({ universe, sets, show = 'none', draggable = true, reveal = true }: SetsLabProps) {
  const names = Object.keys(sets);
  const nA = names[0] ?? 'A';
  const single = names.length < 2;
  const nB = names[1] ?? 'B';
  const extra = names.slice(2);
  const [place, setPlace] = useState<Record<string, Region>>(() => {
    const r: Record<string, Region> = {};
    for (const e of universe) {
      const a = (sets[nA] ?? []).includes(e);
      const b = (sets[nB] ?? []).includes(e);
      r[String(e)] = a && b ? 'AB' : a ? 'A' : b ? 'B' : 'out';
    }
    return r;
  });
  const [mode, setMode] = useState(show);
  const [picked, setPicked] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const A = universe.filter((e) => place[String(e)] === 'A' || place[String(e)] === 'AB');
  const B = universe.filter((e) => place[String(e)] === 'B' || place[String(e)] === 'AB');

  const positions = useMemo(() => {
    const used: Record<Region, number> = { A: 0, B: 0, AB: 0, out: 0 };
    const out: Record<string, [number, number]> = {};
    for (const e of universe) {
      const r = place[String(e)];
      const slots = SLOTS[r];
      const i = used[r]++;
      const base = slots[i % slots.length];
      out[String(e)] = [base[0] + Math.floor(i / slots.length) * 14, base[1] + Math.floor(i / slots.length) * 10];
    }
    return out;
  }, [universe, place]);

  const moveTo = (el: string, r: Region) => setPlace((p) => ({ ...p, [el]: r }));

  const dropAt = (el: string, clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    moveTo(el, regionAt(x, y));
  };

  const fill = (r: Region) => {
    const hl =
      (mode === 'difference' && r === 'A') ||
      (mode === 'intersection' && r === 'AB') ||
      (mode === 'union' && r !== 'out');
    return hl ? 'color-mix(in oklab, var(--ball) 30%, transparent)' : 'transparent';
  };

  const diffAB = difference(A, B);
  const diffBA = difference(B, A);
  const inter = intersection(A, B);
  const subLine = (X: El[], Y: El[], nx: string, ny: string) =>
    isSubset(X, Y)
      ? `${nx} ⊆ ${ny}: כל איבר של ${nx} נמצא גם ב־${ny}${isProperSubset(X, Y) ? ` (הכלה ממש: ${nx} ⊂ ${ny})` : ''}.`
      : `${nx} ⊄ ${ny}: האיבר ${difference(X, Y)[0]} נמצא ב־${nx} אבל לא ב־${ny}.`;
  const verdictSub = `${subLine(A, B, nA, nB)} ${subLine(B, A, nB, nA)}`;
  const verdictEq = isEqual(A, B) ? `${nA} = ${nB}: יש להן בדיוק אותם איברים.` : `${nA} ≠ ${nB}: ${diffAB.length ? `${diffAB[0]} נמצא רק ב־${nA}` : `${diffBA[0]} נמצא רק ב־${nB}`}.`;

  return (
    <div className="card space-y-3 p-3 sm:p-4">
      <div className="flex flex-wrap gap-1" role="group" aria-label="מה להדגיש">
        {(
          [
            ['none', 'בלי הדגשה'],
            ['difference', `${nA} − ${nB}`],
            ['intersection', 'חיתוך'],
            ['subset', 'הכלה'],
            ['equal', 'שוויון'],
          ] as const
        ).map(([m, label]) => (
          <button key={m} className={`btn btn-sm ${mode === m ? 'btn-primary' : ''}`} onClick={() => setMode(m)}>
            {label}
          </button>
        ))}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none rounded-xl border border-line bg-card-2" style={{ maxHeight: 300 }} role="img" aria-label={`דיאגרמת ון: ${nA} = ${formatSet(A)}, ${nB} = ${formatSet(B)}`} direction="ltr">
        <defs>
          <clipPath id="clipA"><circle cx={CA.x} cy={CA.y} r={CA.r} /></clipPath>
          <clipPath id="clipB"><circle cx={CB.x} cy={CB.y} r={CB.r} /></clipPath>
        </defs>
        <rect x={4} y={4} width={W - 8} height={H - 8} rx={14} fill="none" stroke="var(--line-2)" strokeDasharray="5 5" />
        <text x={14} y={22} fontSize={12} fill="var(--ink-3)">U</text>
        <circle cx={CA.x} cy={CA.y} r={CA.r} fill={fill('A')} />
        <circle cx={CB.x} cy={CB.y} r={CB.r} fill={mode === 'union' ? fill('B') : 'transparent'} />
        {mode === 'difference' && <circle cx={CB.x} cy={CB.y} r={CB.r} fill="var(--card-2)" />}
        {(mode === 'intersection' || mode === 'union') && <circle cx={CB.x} cy={CB.y} r={CB.r} clipPath="url(#clipA)" fill="color-mix(in oklab, var(--ball) 30%, transparent)" />}
        {mode === 'difference' && <circle cx={CB.x} cy={CB.y} r={CB.r} clipPath="url(#clipA)" fill="var(--card-2)" />}
        <circle cx={CA.x} cy={CA.y} r={CA.r} fill="none" stroke="var(--t-sets)" strokeWidth={2} />
        {!single && <circle cx={CB.x} cy={CB.y} r={CB.r} fill="none" stroke="var(--info)" strokeWidth={2} />}
        <text x={CA.x - 70} y={CA.y - 78} fontSize={16} fontWeight={700} fill="var(--t-sets)">{nA}</text>
        {!single && <text x={CB.x + 58} y={CB.y - 78} fontSize={16} fontWeight={700} fill="var(--info)">{nB}</text>}
        {universe.map((e) => {
          const k = String(e);
          const [x, y] = positions[k];
          return (
            <motion.g
              key={k}
              drag={draggable}
              dragMomentum={false}
              dragSnapToOrigin
              onDragEnd={(ev, info) => dropAt(k, info.point.x - window.scrollX, info.point.y - window.scrollY)}
              animate={{ x, y }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              style={{ cursor: draggable ? 'grab' : 'default' }}
              onClick={() => setPicked(picked === k ? null : k)}
            >
              <circle r={14} fill={picked === k ? 'var(--ball)' : 'var(--card)'} stroke="var(--ink-2)" strokeWidth={1.3} />
              <text textAnchor="middle" dominantBaseline="central" fontSize={k.length > 3 ? 9 : 12} fontFamily="var(--font-mono)" fill="var(--ink)">{k}</text>
            </motion.g>
          );
        })}
      </svg>
      {picked && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>להעביר את <b className="font-mono">{picked}</b> אל:</span>
          {(['A', 'AB', 'B', 'out'] as Region[]).map((r) => (
            <button key={r} className="btn btn-sm" onClick={() => { moveTo(picked, r); setPicked(null); }}>
              {r === 'A' ? `רק ${nA}` : r === 'B' ? `רק ${nB}` : r === 'AB' ? `גם ${nA} וגם ${nB}` : 'מחוץ לשתיהן'}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-2 text-[0.95rem] sm:grid-cols-2">
        <div className="rounded-lg bg-card-2 p-2 font-mono" dir="ltr">
          <div>{nA} = {formatSet(A)}</div>
          <div>{nB} = {formatSet(B)}</div>
          {reveal && !single && (
            <>
              <div className={mode === 'difference' ? 'font-bold text-[var(--ball-dark)]' : ''}>{nA} − {nB} = {formatSet(diffAB)}</div>
              <div>{nB} − {nA} = {formatSet(diffBA)}</div>
              {mode === 'intersection' && <div className="font-bold text-[var(--ball-dark)]">{nA} ∩ {nB} = {formatSet(inter)}</div>}
            </>
          )}
          {extra.length > 0 && <div className="font-sans text-xs muted" dir="rtl">בציור מוצגות רק שתי הקבוצות הראשונות ({extra.join(', ')} לא מצוירות).</div>}
        </div>
        <div className="space-y-1 rounded-lg bg-card-2 p-2 text-sm">
          {picked ? (
            <>
              <div dir="ltr" className="font-mono">{picked} {A.map(String).includes(picked) ? '∈' : '∉'} {nA},  {picked} {B.map(String).includes(picked) ? '∈' : '∉'} {nB}</div>
              <div>שייכות (∈) מחברת <b>איבר</b> לקבוצה.</div>
            </>
          ) : (
            <div className="muted">גררו איבר לאזור אחר (או לחצו עליו ובחרו לאן). לחיצה על איבר מראה את השייכות שלו.</div>
          )}
          {reveal && !single && mode === 'subset' && <div>{verdictSub}</div>}
          {reveal && !single && mode === 'equal' && <div>{verdictEq}</div>}
          {mode === 'difference' && <div>{nA} − {nB}: כל מה שב־{nA} ואינו ב־{nB}.{reveal && diffAB.length === 0 && ' כאן ההפרש ריק — כלומר ∅.'}</div>}
        </div>
      </div>
    </div>
  );
}
