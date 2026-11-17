'use client';
import { useMemo, useState } from 'react';
import { analyzeArrows, explainArrows } from '@/engines/functions';

export interface ArrowsLabProps {
  domain: string[];
  codomain: string[];
  arrows: [string, string][];
  editable?: boolean;
  /** Hide the verdict (used inside questions). */
  hideVerdict?: boolean;
}

/** Arrow diagram: domain (left oval) → range (right oval). Click an input, then an output, to add/remove an arrow. */
export function ArrowsLab({ domain, codomain, arrows: initial, editable = true, hideVerdict = false }: ArrowsLabProps) {
  const [arrows, setArrows] = useState<[string, string][]>(initial);
  const [from, setFrom] = useState<string | null>(null);
  const r = useMemo(() => analyzeArrows(domain, codomain, arrows), [domain, codomain, arrows]);
  const W = 420;
  const rows = Math.max(domain.length, codomain.length);
  const H = Math.max(180, rows * 42 + 50);
  const yOf = (i: number, n: number) => 25 + ((H - 50) * (i + 0.5)) / n;
  const DX = 100;
  const CX = 320;
  const pos = (el: string, side: 'd' | 'c') => (side === 'd' ? { x: DX, y: yOf(domain.indexOf(el), domain.length) } : { x: CX, y: yOf(codomain.indexOf(el), codomain.length) });

  const toggle = (a: string, b: string) =>
    setArrows((as) => (as.some(([x, y]) => x === a && y === b) ? as.filter(([x, y]) => !(x === a && y === b)) : [...as, [a, b]]));

  return (
    <div className="card space-y-3 p-3 sm:p-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-line bg-card-2" style={{ maxHeight: 360 }} direction="ltr" role="img" aria-label="דיאגרמת חצים">
        <defs>
          <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        <ellipse cx={DX} cy={H / 2} rx={70} ry={H / 2 - 10} fill="none" stroke="var(--ink-2)" strokeWidth={1.5} />
        <ellipse cx={CX} cy={H / 2} rx={70} ry={H / 2 - 10} fill="none" stroke="var(--ink-2)" strokeWidth={1.5} />
        <text x={DX} y={16} textAnchor="middle" fontSize={12} fill="var(--ink-3)" direction="rtl">תחום</text>
        <text x={CX} y={16} textAnchor="middle" fontSize={12} fill="var(--ink-3)" direction="rtl">טווח</text>
        {arrows.map(([a, b], i) => {
          if (!domain.includes(a) || !codomain.includes(b)) return null;
          const p = pos(a, 'd');
          const q = pos(b, 'c');
          const bad = r.multiple.includes(a);
          return (
            <line key={i} x1={p.x + 24} y1={p.y} x2={q.x - 26} y2={q.y} stroke={bad ? 'var(--bad)' : 'var(--info)'} strokeWidth={2} markerEnd="url(#arrowhead)" />
          );
        })}
        {domain.map((d) => {
          const p = pos(d, 'd');
          const missing = r.missing.includes(d);
          return (
            <g key={d} onClick={() => editable && setFrom(from === d ? null : d)} style={{ cursor: editable ? 'pointer' : 'default' }}>
              <circle cx={p.x} cy={p.y} r={4} fill="var(--ink)" />
              <rect x={p.x - 52} y={p.y - 13} width={74} height={26} rx={8} fill={from === d ? 'var(--accent-soft)' : 'transparent'} stroke={missing ? 'var(--bad)' : 'transparent'} strokeDasharray={missing ? '4 3' : undefined} />
              <text x={p.x - 10} y={p.y} textAnchor="end" dominantBaseline="central" fontSize={13} fill="var(--ink)" direction="rtl">{d}</text>
            </g>
          );
        })}
        {codomain.map((c) => {
          const p = pos(c, 'c');
          return (
            <g key={c} onClick={() => { if (editable && from) { toggle(from, c); setFrom(null); } }} style={{ cursor: editable && from ? 'pointer' : 'default' }}>
              <circle cx={p.x} cy={p.y} r={4} fill={r.unreached.includes(c) ? 'var(--ink-3)' : 'var(--ink)'} />
              <rect x={p.x - 22} y={p.y - 13} width={74} height={26} rx={8} fill={from ? 'color-mix(in oklab, var(--accent-soft) 60%, transparent)' : 'transparent'} />
              <text x={p.x + 10} y={p.y} textAnchor="start" dominantBaseline="central" fontSize={13} fill="var(--ink)" direction="rtl">{c}</text>
            </g>
          );
        })}
      </svg>
      {editable && (
        <p className="text-sm muted">
          {from ? <>בחרתם את <b>{from}</b> בתחום. לחצו על איבר בטווח כדי להוסיף חץ (או להסיר חץ קיים).</> : 'לחצו על איבר בתחום (משמאל) ואז על איבר בטווח (מימין) כדי להוסיף או להסיר חץ.'}
        </p>
      )}
      {!hideVerdict && (
        <ul className="space-y-0.5 rounded-lg bg-card-2 p-2 text-[0.95rem]" aria-live="polite">
          {explainArrows(r).map((l, i) => (
            <li key={i} className={l.startsWith('✗') ? 'text-bad' : l.startsWith('⇒') ? 'font-semibold' : ''}>{l}</li>
          ))}
        </ul>
      )}
      {editable && (
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={() => setArrows(initial)}>חזרה להתחלה</button>
          <button className="btn btn-sm" onClick={() => setArrows([])}>מחיקת כל החצים</button>
        </div>
      )}
    </div>
  );
}

export interface GraphLabProps {
  rules: ('square' | 'identity')[];
  domain: 'R' | 'N' | number[];
}

/** f(a)=a² (red) and g(a)=a (blue) over ℝ (continuous) or ℕ / a finite set (separate points). Photo 61. */
export function GraphLab({ rules, domain: initialDomain }: GraphLabProps) {
  const [domain, setDomain] = useState(initialDomain);
  const [connect, setConnect] = useState(false);
  const W = 420, H = 300;
  const xmin = -4, xmax = 6, ymin = -1, ymax = 10;
  const sx = (x: number) => ((x - xmin) / (xmax - xmin)) * W;
  const sy = (y: number) => H - ((y - ymin) / (ymax - ymin)) * H;
  const fns = { square: (a: number) => a * a, identity: (a: number) => a } as const;
  const colors = { square: 'var(--bad)', identity: 'var(--info)' } as const;
  const discrete = domain !== 'R';
  const points = domain === 'N' ? [0, 1, 2, 3, 4, 5] : Array.isArray(domain) ? domain : [];
  return (
    <div className="card space-y-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm">התחום:</span>
        <button className={`btn btn-sm ${domain === 'R' ? 'btn-primary' : ''}`} onClick={() => setDomain('R')}>ℝ (ממשיים)</button>
        <button className={`btn btn-sm ${domain === 'N' ? 'btn-primary' : ''}`} onClick={() => setDomain('N')}>ℕ (טבעיים)</button>
        {Array.isArray(initialDomain) && <button className={`btn btn-sm ${Array.isArray(domain) ? 'btn-primary' : ''}`} onClick={() => setDomain(initialDomain)}>{`{${initialDomain.join(',')}}`}</button>}
        {discrete && (
          <label className="ms-auto flex items-center gap-1 text-sm">
            <input type="checkbox" checked={connect} onChange={(e) => setConnect(e.target.checked)} className="accent-[var(--accent)]" />
            לחבר את הנקודות בקו (טעות נפוצה)
          </label>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="grid-paper w-full rounded-xl border border-line" direction="ltr" role="img" aria-label="גרף פונקציות">
        <line x1={0} y1={sy(0)} x2={W} y2={sy(0)} stroke="var(--ink-2)" strokeWidth={1.2} />
        <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke="var(--ink-2)" strokeWidth={1.2} />
        {Array.from({ length: xmax - xmin - 1 }, (_, i) => xmin + 1 + i).map((x) => (
          <text key={x} x={sx(x)} y={sy(0) + 13} fontSize={10} textAnchor="middle" fill="var(--ink-3)">{x}</text>
        ))}
        {rules.map((r) => {
          const f = fns[r];
          if (!discrete) {
            const d = Array.from({ length: 201 }, (_, i) => xmin + ((xmax - xmin) * i) / 200)
              .map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(Math.min(f(x), ymax + 2)).toFixed(1)}`)
              .join(' ');
            return <path key={r} d={d} fill="none" stroke={colors[r]} strokeWidth={2.2} />;
          }
          const pts = points.filter((x) => f(x) <= ymax + 1);
          return (
            <g key={r}>
              {connect && <polyline points={pts.map((x) => `${sx(x)},${sy(f(x))}`).join(' ')} fill="none" stroke={colors[r]} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.7} />}
              {pts.map((x) => (r === 'square' ? <rect key={x} x={sx(x) - 4.5} y={sy(f(x)) - 4.5} width={9} height={9} fill={colors[r]} /> : <circle key={x} cx={sx(x)} cy={sy(f(x))} r={4.6} fill={colors[r]} />))}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-3 text-sm">
        {rules.includes('square') && <span><span className="inline-block h-2.5 w-2.5 bg-bad" /> f(a) = a²</span>}
        {rules.includes('identity') && <span><span className="inline-block h-2.5 w-2.5 rounded-full bg-info" /> g(a) = a</span>}
      </div>
      <p className="text-[0.95rem]">
        {discrete
          ? connect
            ? 'הקו המקווקו מטעה: בתחום בדיד אין קלטים בין הנקודות (אין "2.5 אנשים"), ולכן הגרף הוא רק הנקודות עצמן.'
            : 'תחום בדיד: הגרף הוא נקודות נפרדות — יש ערך רק לקלטים שבתחום.'
          : 'תחום ממשי: כל מספר הוא קלט חוקי, ולכן הגרף הוא קו רציף.'}
      </p>
    </div>
  );
}
