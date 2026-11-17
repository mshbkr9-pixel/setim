'use client';
import { useMemo, useState } from 'react';
import { compile, createMachine, run, visibleCounters } from '@/engines/algolem';
import { buildTrace, iterationTable, lineTable } from '@/engines/algolem/trace';
import { formatEffect, segmentProgram } from '@/engines/algolem/symbolic';
import { CounterJar } from '@/components/algolem/CounterJar';
import { TraceTable } from '@/components/algolem/TraceTable';
import { PhotoModal } from '@/components/ui/PhotoModal';
import { Listing } from '@/components/ui/Listing';

// ------------------------------------------------------------------ static jars (photo 53)
export function CountersStatic({ counters }: { counters: { name: string; value: number }[] }) {
  return (
    <div className="card grid-paper flex flex-wrap items-end justify-center gap-4 p-4">
      {counters.map((c) => (
        <CounterJar key={c.name} name={c.name} value={c.value} />
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ error tree (photo 24)
type Node = { text: string; sub?: string; tone: 'syn' | 'sem'; id?: string; children?: Node[] };
const TREE: Node[] = [
  {
    text: 'שגיאות סינטקטיות',
    sub: 'לא ברור למה התכוונו',
    tone: 'syn',
    id: 'syntax',
    children: [
      { text: 'מילונית', tone: 'syn' },
      { text: 'תחבירית', tone: 'syn', children: [{ text: '90%', tone: 'syn' }, { text: '50%', tone: 'syn' }, { text: '0%', tone: 'syn' }] },
    ],
  },
  {
    text: 'שגיאות סמנטיות',
    sub: 'לא קורה מה שרצינו',
    tone: 'sem',
    id: 'semantic',
    children: [
      { text: 'משמעות שגויה', sub: 'שגיאה אלגוריתמית־לוגית', tone: 'sem' },
      {
        text: 'חוסר משמעות',
        tone: 'sem',
        id: 'meaningless',
        children: [
          { text: 'אינסופיות ואי־סבירות בזמן', tone: 'sem', id: 'infinite' },
          { text: 'פעולות לא חוקיות', sub: 'Run-Time Errors', tone: 'sem', id: 'runtime' },
        ],
      },
    ],
  },
];

function TreeNode({ n, highlight }: { n: Node; highlight?: string }) {
  const hl = n.id && n.id === highlight;
  const circled = n.id === 'meaningless';
  return (
    <li className="mt-2">
      <div
        className={`inline-block rounded-lg border px-3 py-1.5 text-sm ${n.tone === 'syn' ? 'border-info/40 bg-info-soft' : 'border-[var(--t-sets)]/40 bg-[color-mix(in_oklab,var(--t-sets)_14%,var(--card))]'} ${circled ? 'ring-2 ring-[color-mix(in_oklab,#7ab317_80%,transparent)] ring-offset-2 ring-offset-[var(--card)]' : ''} ${hl ? 'outline outline-2 outline-[var(--ball)]' : ''}`}
      >
        <b>{n.text}</b>
        {n.sub && <span className="block text-xs text-ink-2">{n.sub}</span>}
      </div>
      {n.children && (
        <ul className="ms-5 border-s border-line ps-3">
          {n.children.map((c, i) => (
            <TreeNode key={i} n={c} highlight={highlight} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ErrorTree({ highlight }: { highlight?: string }) {
  return (
    <div className="card p-3 sm:p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {TREE.map((n, i) => (
          <ul key={i}>
            <TreeNode n={n} highlight={highlight} />
          </ul>
        ))}
      </div>
      <p className="mt-3 text-xs muted">שחזור של התרשים מהשקף (צילום 24). האחוזים 90%, 50%, 0% מופיעים בשקף בלי הסבר כתוב. &quot;חוסר משמעות&quot; מוקף במקור — זה נושא היחידה.</p>
    </div>
  );
}

// ------------------------------------------------------------------ generalisation chain (photos 25, 32, 69, 70)
export function Chain({ steps, arrows }: { steps: { code: string; caption?: string }[]; arrows: string[] }) {
  return (
    <div className="card thin-scroll overflow-x-auto p-3 sm:p-4">
      <div className="flex min-w-max items-center gap-2" dir="ltr">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <figure className="flex flex-col items-center gap-1">
              <pre className="code rounded-lg bg-paper-2 px-3 py-2 text-[0.85rem] font-semibold leading-snug">{s.code}</pre>
              {s.caption && <figcaption className="max-w-[12rem] text-center text-xs font-semibold" dir="rtl">{s.caption}</figcaption>}
            </figure>
            {i < arrows.length && (
              <div className="flex flex-col items-center px-1">
                <span className="text-xl leading-none text-ink-2">⟹</span>
                <span className="text-xs" dir="rtl">{arrows[i]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ nested label table (photos 3, 28, 44–51)
export function LabelTable({ code, labels }: { code: string; labels: { from: number; to: number; text: string; level: number; span?: number }[] }) {
  const lines = code.replace(/\r\n?/g, '\n').split('\n');
  const levels = Math.max(1, ...labels.map((l) => l.level + (l.span ?? 1) - 1));
  return (
    <div className="card thin-scroll overflow-x-auto p-3 sm:p-4">
      <div
        className="grid min-w-max border border-ink-3 text-[0.88rem]"
        dir="ltr"
        style={{ gridTemplateColumns: `max-content repeat(${levels}, minmax(8rem, 13rem))`, gridTemplateRows: `repeat(${lines.length}, minmax(1.7rem, auto))` }}
      >
        {lines.map((l, i) => (
          <div key={'c' + i} className="whitespace-pre border-e border-ink-3 bg-paper-2 px-2 font-mono font-semibold leading-[1.7rem]" style={{ gridColumn: 1, gridRow: i + 1 }}>
            {l || ' '}
          </div>
        ))}
        {labels.map((lab, i) => (
          <div
            key={'l' + i}
            dir="rtl"
            className="m-[2px] flex items-center whitespace-pre-line rounded border border-ink-3/60 bg-card px-2 py-1 leading-snug"
            style={{ gridColumn: `${lab.level + 1} / span ${lab.span ?? 1}`, gridRow: `${lab.from} / ${lab.to + 1}` }}
          >
            {lab.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ photo
export function PhotoFigure({ photo, caption }: { photo: number; caption?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="card overflow-hidden">
      <button className="block w-full" onClick={() => setOpen(true)} aria-label={`פתיחת צילום מקור ${photo}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/source/photo-${String(photo).padStart(2, '0')}.jpg`} alt={`צילום מקור ${photo}`} className="max-h-80 w-full object-cover object-top" loading="lazy" />
      </button>
      <figcaption className="flex items-center gap-2 p-2 text-sm">
        <span className="chip">צילום מקור {photo}</span>
        <span className="muted">{caption ?? 'לחצו להגדלה'}</span>
      </figcaption>
      {open && <PhotoModal photo={photo} onClose={() => setOpen(false)} />}
    </figure>
  );
}

// ------------------------------------------------------------------ meaning grid
export function MeaningGrid({ code, procedures, vars, max }: { code: string; procedures?: string[]; vars: [string, string]; max: number }) {
  const [sel, setSel] = useState<string | null>(null);
  const data = useMemo(() => {
    const c = compile({ main: code, procedures });
    if (!c.ok) return { error: c.errors[0].message, cells: [] as { a: number; b: number; kind: string; detail: string }[] };
    const two = vars[1] && vars[1] !== vars[0];
    const cells: { a: number; b: number; kind: string; detail: string }[] = [];
    for (let b = two ? max : 0; b >= 0; b--)
      for (let a = 0; a <= max; a++) {
        const inputs: Record<string, number> = { [vars[0]]: a };
        if (two) inputs[vars[1]] = b;
        const r = run(c.program, createMachine(c.program, inputs), { maxSteps: 20_000 });
        const out = visibleCounters(c.program, r.state);
        const detail =
          r.stoppedBy === 'done'
            ? 'פלט: ' + Object.entries(out).map(([k, v]) => `${k}=${v}`).join(', ')
            : r.stoppedBy === 'error'
              ? `חיסור ממונה ריק (שורה ${r.state.error?.line})`
              : r.stoppedBy === 'diverges'
                ? 'הוכח: הלולאה אינסופית'
                : 'לא הוכרע במסגרת מגבלת הצעדים';
        cells.push({ a, b, kind: r.stoppedBy, detail });
      }
    return { error: null, cells, two };
  }, [code, procedures, vars, max]);
  if (data.error) return <div className="card p-3 text-bad">{data.error}</div>;
  const two = 'two' in data && data.two;
  const tone: Record<string, string> = { done: 'bg-ok-soft text-ok', error: 'bg-bad-soft text-bad', diverges: 'bg-warn-soft text-warn', limit: 'bg-paper-2 text-ink-3' };
  const sym: Record<string, string> = { done: '✓', error: '✗', diverges: '∞', limit: '?' };
  const selected = data.cells.find((c) => `${c.a},${c.b}` === sel);
  return (
    <div className="card space-y-2 p-3 sm:p-4">
      <div className="thin-scroll overflow-x-auto" dir="ltr">
        <table className="mx-auto border-separate border-spacing-1 text-center text-sm">
          <tbody>
            {(two ? Array.from({ length: max + 1 }, (_, i) => max - i) : [0]).map((b) => (
              <tr key={b}>
                {two && <th className="pe-1 font-mono text-xs muted">{vars[1]}={b}</th>}
                {Array.from({ length: max + 1 }, (_, a) => {
                  const c = data.cells.find((x) => x.a === a && x.b === b)!;
                  return (
                    <td key={a}>
                      <button className={`h-9 w-9 rounded-md font-bold ${tone[c.kind]} ${sel === `${a},${b}` ? 'ring-2 ring-[var(--ball)]' : ''}`} onClick={() => setSel(`${a},${b}`)} aria-label={`${vars[0]}=${a}${two ? `, ${vars[1]}=${b}` : ''}: ${c.detail}`}>
                        {sym[c.kind]}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              {two && <th />}
              {Array.from({ length: max + 1 }, (_, a) => (
                <th key={a} className="font-mono text-xs muted">{vars[0]}={a}</th>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <span>✓ יש משמעות (יש פלט)</span><span>✗ חיסור ממונה ריק</span><span>∞ לולאה אינסופית (מוכחת)</span><span>? לא הוכרע</span>
      </div>
      <p className="text-sm">{selected ? <><b className="font-mono" dir="ltr">{vars[0]}={selected.a}{two ? `, ${vars[1]}=${selected.b}` : ''}</b> — {selected.detail}</> : 'לחצו על משבצת כדי לראות מה קורה בקלט הזה. כל משבצת היא הרצה אמיתית של המנוע.'}</p>
    </div>
  );
}

// ------------------------------------------------------------------ queen of hearts (photos 16–17)
const S_CODE = 'S (A,B,C)';
function runS(a: number, b: number, c: number) {
  const p = compile({ main: S_CODE });
  if (!p.ok) throw new Error('S');
  const r = run(p.program, createMachine(p.program, { A: a, B: b, C: c }));
  return visibleCounters(p.program, r.state);
}
type Cell = 'A' | 'B' | 'C';
const CELLS: Cell[] = ['A', 'B', 'C'];

export function QueenGame() {
  const [round, setRound] = useState<1 | 2 | 3>(1);
  const [seed, setSeed] = useState(7);
  const rnd = (k: number) => ((seed * 9301 + 49297 * (k + 1)) % 233280) % 9;
  const inputs = { A: rnd(1), B: rnd(2), C: rnd(3) };
  const revealed: Record<Cell, boolean> = round === 3 ? { A: seed % 3 !== 0, B: seed % 2 === 0, C: seed % 3 === 0 || seed % 5 === 0 } : { A: true, B: true, C: true };
  const asked: Cell[] = round === 1 ? CELLS : round === 2 ? CELLS.filter((_, i) => (seed >> i) % 2 === 1 || i === seed % 3) : CELLS.filter((_, i) => (seed >> (i + 1)) % 2 === 1 || i === (seed + 1) % 3);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const out = runS(inputs.A, inputs.B, inputs.C);
  // is the output of cell X determined by the revealed inputs? (try all hidden values 0..8)
  const determined = (x: Cell) => {
    const vals = new Set<number>();
    const range = (c: Cell) => (revealed[c] ? [inputs[c]] : Array.from({ length: 9 }, (_, i) => i));
    for (const a of range('A')) for (const b of range('B')) for (const c of range('C')) vals.add(runS(a, b, c)[x]);
    return vals.size === 1;
  };
  const judge = (x: Cell) => {
    const t = (answers[x] ?? '').trim();
    if (!determined(x)) return t === '?';
    return t !== '' && Number(t) === out[x];
  };
  const next = () => { setSeed((s) => s + 1); setAnswers({}); setChecked(false); };
  return (
    <div className="card space-y-3 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        {([1, 2, 3] as const).map((r) => (
          <button key={r} className={`btn btn-sm ${round === r ? 'btn-primary' : ''}`} onClick={() => { setRound(r); setAnswers({}); setChecked(false); }}>
            סבב {r === 1 ? 'ראשון' : r === 2 ? 'שני' : 'שלישי'}
          </button>
        ))}
        <span className="ms-auto text-xs muted">הפרוצדורה של המלכה: <code className="inline-code">S (A,B,C)</code></span>
      </div>
      <Listing code={'@ S (A,B,C)\n   FIVE (B)\n   WHILE (A)\n      ADD (B)\n      ADD (C)\n      SUB (A)\n   ENDW'} className="text-[0.85rem]" />
      <p className="text-sm">
        {round === 1 && 'המלכה מגלה את כל ערכי הקלט ומבקשת את ערכי הסיום בכל התאים.'}
        {round === 2 && 'המלכה מגלה את כל ערכי הקלט ומבקשת את ערכי הסיום רק בתאים שהיא בוחרת.'}
        {round === 3 && 'המלכה מגלה רק חלק מהקלטים (? = מוסתר) ומבקשת ערכי סיום בתאים שהיא בוחרת. אם אי אפשר לדעת — כתבו ?'}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center" dir="ltr">
        {CELLS.map((c) => (
          <div key={c} className="rounded-lg border border-line bg-card-2 p-2">
            <div className="font-mono font-bold">{c}</div>
            <div className="text-xs muted" dir="rtl">קלט</div>
            <div className="font-mono text-lg">{revealed[c] ? inputs[c] : '?'}</div>
            <div className="mt-1 text-xs muted" dir="rtl">ערך בסיום</div>
            {asked.includes(c) ? (
              <input
                className={`input num-input mx-auto mt-0.5 ${checked ? (judge(c) ? 'bg-ok-soft' : 'bg-bad-soft') : ''}`}
                value={answers[c] ?? ''}
                onChange={(e) => setAnswers((s) => ({ ...s, [c]: e.target.value.replace(/[^\d?]/g, '') }))}
                aria-label={`ערך הסיום של ${c}`}
              />
            ) : (
              <div className="mt-1 text-sm muted" dir="rtl">לא נשאל</div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" onClick={() => setChecked(true)}>הגשה למלכה</button>
        <button className="btn btn-sm" onClick={next}>שאלה חדשה</button>
      </div>
      {checked && (
        <ul className="space-y-0.5 text-sm">
          {asked.map((c) => (
            <li key={c} className={judge(c) ? 'text-ok' : 'text-bad'}>
              {c}: {determined(c) ? `הערך נקבע לגמרי לפי מה שגלוי: ${out[c]}` : 'אי אפשר לדעת — הערך תלוי בקלט מוסתר (התשובה הנכונה: ?)'} {judge(c) ? '✓' : '✗'}
            </li>
          ))}
          <li className="muted">
            {asked.every(judge) ? 'ניצחתם בסבב הזה.' : 'הפסד — המלכה צדקה. חשבו: מאילו קלטים תלוי כל ערך סיום?'}
          </li>
        </ul>
      )}
      <p className="text-xs muted">התוצאות מחושבות בהרצה אמיתית של S. בסבב השלישי המערכת בודקת את כל הערכים האפשריים של התאים המוסתרים (0–8) כדי לקבוע אם התשובה נקבעת בוודאות.</p>
    </div>
  );
}

// ------------------------------------------------------------------ trace widget (with quiz)
export function TraceWidget({ code, inputs, procedures, mode, quiz = false }: { code: string; inputs: Record<string, number>; procedures?: string[]; mode: 'lines' | 'rounds' | 'modular'; quiz?: boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const built = useMemo(() => {
    const c = compile({ main: code, procedures });
    if (!c.ok) return null;
    const t = buildTrace(c.program, inputs, 3000);
    return { program: c.program, trace: t };
  }, [code, procedures, inputs]);
  if (!built) return <div className="card p-3 text-bad">שגיאה בקוד</div>;
  if (mode === 'modular') {
    const segs = segmentProgram(built.program);
    return (
      <div className="card space-y-2 p-3 sm:p-4">
        <table className="ttable min-w-full">
          <thead><tr><th>שורות</th><th>קטע</th><th>מה הקטע עושה</th></tr></thead>
          <tbody>
            {segs.map((s, i) => {
              const f = s.effect ? formatEffect(s.effect, built.program.counters).filter((x) => !x.unchanged) : null;
              return (
                <tr key={i}>
                  <td className="num">{s.from === s.to ? s.from : `${s.from}–${s.to}`}</td>
                  <td className="text-start"><pre className="code text-[0.8rem] leading-tight">{s.code.split('\n').map((l) => l.trim()).join('\n')}</pre></td>
                  <td className="font-mono" dir="ltr">{f === null ? '—' : f.map((x) => `${x.counter} = ${x.expr}`).join(',  ') || 'ללא שינוי'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs muted">אגף ימין של כל נוסחה מתייחס לערכים שלפני הקטע (השמה, לא משוואה).</p>
      </div>
    );
  }
  const cols = mode === 'lines' ? lineTable(built.trace) : iterationTable(built.trace);
  const blanks = new Set<string>();
  if (quiz) cols.forEach((c, i) => c.kind !== 'input' && c.values && built.trace.counters.forEach((n) => blanks.add(`${i}:${n}`)));
  const allRight = quiz && [...blanks].every((k) => {
    const [i, n] = k.split(':');
    return Number(answers[k]) === cols[Number(i)].values![n] && (answers[k] ?? '') !== '';
  });
  return (
    <div className="card space-y-2 p-3 sm:p-4">
      <Listing code={code} className="text-[0.85rem]" />
      <TraceTable counters={built.trace.counters} columns={cols} quiz={quiz ? { answers, onChange: (k, v) => { setAnswers((s) => ({ ...s, [k]: v })); setChecked(false); }, blanks, checked } : undefined} />
      {quiz && (
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => setChecked(true)}>בדיקת הטבלה</button>
          <button className="btn btn-sm" onClick={() => { setAnswers({}); setChecked(false); }}>ניקוי</button>
          {checked && <span className={`text-sm ${allRight ? 'text-ok' : 'text-bad'}`}>{allRight ? 'כל התאים נכונים!' : 'יש תאים שגויים (באדום) או ריקים. מצאו את השורה הראשונה שבה טעיתם ועקבו ממנה מחדש.'}</span>}
        </div>
      )}
    </div>
  );
}
