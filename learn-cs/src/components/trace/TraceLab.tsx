'use client';
import { useMemo, useState } from 'react';
import { compile } from '@/engines/algolem';
import { buildTrace, iterationTable, lineTable, roundFormula } from '@/engines/algolem/trace';
import { formatEffect, segmentProgram, summarizeProgram } from '@/engines/algolem/symbolic';
import { describeEvent } from '@/explain/algolem';
import { CodeEditor } from '@/components/code/CodeEditor';
import { TraceTable } from '@/components/algolem/TraceTable';
import { PhotoRefs } from '@/components/ui/Origin';

const EX: { id: string; title: string; code: string; inputs: Record<string, number>; photos: number[] }[] = [
  { id: 'a', title: 'R1=5, R2=2 (המחברת)', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', inputs: { R1: 5, R2: 2 }, photos: [36] },
  { id: 'b', title: 'R1=65, R2=10 (שקף 14)', code: 'WHILE (R1)\n   ADD (R2)\n   SUB (R1)\nENDW', inputs: { R1: 65, R2: 10 }, photos: [34] },
  { id: 'c', title: 'דוגמה 1 (ב.1): B = B + 2·A', code: 'WHILE (A)\n   ADD (B)\n   ADD (B)\n   SUB (A)\nENDW', inputs: { A: 4, B: 3 }, photos: [15, 14] },
  { id: 'd', title: 'דוגמה 6 (ב.1): שתי לולאות', code: 'WHILE (A)\n   ADD (B)\n   SUB (A)\nENDW\nONE (C)\nWHILE (B)\n   ADD (C)\n   SUB (B)\nENDW', inputs: { A: 3, B: 4, C: 9 }, photos: [5, 4] },
  { id: 'e', title: 'MOVE (A,B)', code: 'MOVE (A,B)', inputs: { A: 3, B: 7 }, photos: [27] },
];

type Mode = 'log' | 'lines' | 'rounds' | 'modular';

export function TraceLab() {
  const [ex, setEx] = useState(EX[0]);
  const [code, setCode] = useState(ex.code);
  const [inputs, setInputs] = useState<Record<string, number>>(ex.inputs);
  const [mode, setMode] = useState<Mode>('log');
  const [quiz, setQuiz] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const pick = (id: string) => {
    const e = EX.find((x) => x.id === id)!;
    setEx(e); setCode(e.code); setInputs(e.inputs); setAnswers({}); setChecked(false);
  };

  const built = useMemo(() => {
    const c = compile({ main: code });
    if (!c.ok) return { error: c.errors.map((e) => `שורה ${e.line}: ${e.message}`).join(' · ') };
    const counters = [...c.program.counters, ...c.program.hiddenCounters];
    const inp = Object.fromEntries(counters.map((n) => [n, inputs[n] ?? 0]));
    const trace = buildTrace(c.program, inp, 2000);
    return { program: c.program, trace, counters, inp };
  }, [code, inputs]);

  if ('error' in built) {
    return (
      <div className="space-y-3">
        <CodeEditor value={code} onChange={setCode} minHeight={160} />
        <p className="rounded-lg border border-bad/40 bg-bad-soft p-2 text-sm" role="alert">{built.error}</p>
      </div>
    );
  }
  const { program, trace, counters } = built;
  const cols = mode === 'lines' ? lineTable(trace) : mode === 'rounds' ? iterationTable(trace) : [];
  const blanks = new Set<string>();
  if (quiz && (mode === 'lines' || mode === 'rounds')) cols.forEach((c, i) => c.kind !== 'input' && c.values && counters.forEach((n) => blanks.add(`${i}:${n}`)));
  const allRight = [...blanks].every((k) => {
    const [i, n] = k.split(':');
    return (answers[k] ?? '') !== '' && Number(answers[k]) === cols[Number(i)].values![n];
  });
  const rf = roundFormula(trace);
  const summary = summarizeProgram(program);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="tr-ex" className="text-sm font-medium">דוגמה:</label>
        <select id="tr-ex" className="input w-auto" value={ex.id} onChange={(e) => pick(e.target.value)}>
          {EX.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
        </select>
        <PhotoRefs photos={ex.photos} />
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <CodeEditor value={code} onChange={(v) => { setCode(v); setAnswers({}); setChecked(false); }} minHeight={180} />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">קלט:</span>
            {counters.map((n) => (
              <label key={n} className="flex items-center gap-1">
                <span className="font-mono text-sm" dir="ltr">{n}</span>
                <input className="input num-input w-16" inputMode="numeric" value={built.inp[n]} onChange={(e) => { setInputs((s) => ({ ...s, [n]: Math.min(500, Number(e.target.value.replace(/[^\d]/g, '') || 0)) })); setAnswers({}); setChecked(false); }} />
              </label>
            ))}
          </div>
          <div className="rounded-lg bg-card-2 p-3 text-sm">
            <div><b>קלט:</b> <span className="font-mono" dir="ltr">{Object.entries(trace.input).map(([k, v]) => `${k}=${v}`).join(', ')}</span></div>
            <div><b>פלט:</b> {trace.output ? <span className="font-mono" dir="ltr">{Object.entries(trace.output).map(([k, v]) => `${k}=${v}`).join(', ')}</span> : <span className="text-bad">{trace.stoppedBy === 'error' ? 'אין — חיסור ממונה ריק' : trace.stoppedBy === 'diverges' ? 'אין — לולאה אינסופית (מוכחת)' : 'הריצה לא הסתיימה ב־2,000 צעדים'}</span>}</div>
            {rf && (
              <div className="mt-1">
                <b>בכל סיבוב:</b> <span className="font-mono" dir="ltr">{Object.entries(rf.delta).filter(([, d]) => d !== 0).map(([k, d]) => `${k} ${d > 0 ? '+' : '−'} ${Math.abs(d)}`).join(', ')}</span>
                {rf.rounds !== null && (
                  <span> · אחרי n סיבובים: <span className="font-mono" dir="ltr">{Object.entries(rf.delta).map(([k, d]) => `${k} = ${rf.start[k]}${d ? ` ${d > 0 ? '+' : '−'} ${Math.abs(d) === 1 ? '' : Math.abs(d) + '·'}n` : ''}`).join(', ')}</span>; הלולאה נעצרת כש־<span className="font-mono" dir="ltr">{rf.loopCounter} = 0</span>, כלומר n = {rf.rounds}.</span>
                )}
              </div>
            )}
            {summary && <div className="mt-1"><b>נוסחת פלט:</b> <span className="font-mono" dir="ltr">{formatEffect(summary, program.counters).map((f) => `${f.counter} = ${f.expr}`).join(',  ')}</span> <span className="text-xs muted">(בערכי הקלט)</span></div>}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5" role="tablist">
        {([['log', 'יומן צעדים מפורט'], ['lines', 'טבלה כללית (לפי שורות)'], ['rounds', 'לפי סיבובים'], ['modular', 'טבלה מודולרית']] as [Mode, string][]).map(([m, l]) => (
          <button key={m} role="tab" aria-selected={mode === m} className={`btn btn-sm ${mode === m ? 'btn-primary' : ''}`} onClick={() => setMode(m)}>{l}</button>
        ))}
        {(mode === 'lines' || mode === 'rounds') && (
          <label className="ms-auto flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={quiz} onChange={(e) => { setQuiz(e.target.checked); setAnswers({}); setChecked(false); }} className="accent-[var(--accent)]" />
            אני רוצה למלא בעצמי
          </label>
        )}
      </div>
      {mode === 'log' && (
        <div className="thin-scroll max-h-[32rem] overflow-auto rounded-lg border border-line">
          <table className="ttable min-w-full">
            <thead>
              <tr><th>צעד</th><th>שורה</th><th>הוראה</th><th>סיבוב</th><th>לפני</th><th>אחרי</th><th className="min-w-[16rem]">הסבר</th></tr>
            </thead>
            <tbody>
              {trace.rows.slice(0, 400).map((r) => {
                const e = r.event;
                const text = e.kind === 'add' ? `ADD (${e.written})` : e.kind === 'sub' ? `SUB (${e.written})` : e.kind === 'while-enter' || e.kind === 'while-exit' ? `WHILE (${e.written})` : e.kind === 'endw' ? 'ENDW' : e.kind === 'call' ? e.proc : e.kind === 'return' ? `סוף ${e.proc}` : e.kind === 'done' ? 'סיום' : e.kind === 'error' ? 'שגיאה' : '∞';
                const changed = Object.keys(r.after).filter((k) => r.after[k] !== r.before[k]);
                return (
                  <tr key={r.step} className={r.depth > 0 ? 'opacity-70' : ''}>
                    <td className="num">{r.step}</td>
                    <td className="num">{r.depth > 0 ? `${'unit' in e ? e.unit : ''}:${e.line}` : e.line}</td>
                    <td className="num text-start">{' '.repeat(r.depth * 2)}{text}</td>
                    <td className="num">{r.loops.length ? r.loops.map((l) => l.iteration).join('.') : '—'}</td>
                    <td className="num" dir="ltr">{counters.map((c) => `${c}=${r.before[c]}`).join(' ')}</td>
                    <td className={`num ${changed.length ? 'chg' : ''}`} dir="ltr">{counters.map((c) => `${c}=${r.after[c]}`).join(' ')}</td>
                    <td className="whitespace-normal text-start text-[0.82rem]">{describeEvent(e, trace.final, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {trace.rows.length > 400 && <p className="p-2 text-xs muted">מוצגים 400 הצעדים הראשונים מתוך {trace.rows.length}.</p>}
        </div>
      )}
      {(mode === 'lines' || mode === 'rounds') && (
        <div className="space-y-2">
          <TraceTable counters={counters} columns={cols} quiz={quiz ? { answers, onChange: (k, v) => { setAnswers((s) => ({ ...s, [k]: v })); setChecked(false); }, blanks, checked } : undefined} />
          {quiz && (
            <div className="flex items-center gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => setChecked(true)}>בדיקה</button>
              {checked && <span className={`text-sm ${allRight ? 'text-ok' : 'text-bad'}`}>{allRight ? 'כל התאים נכונים!' : 'יש תאים שגויים או ריקים (מסומנים באדום).'}</span>}
            </div>
          )}
          <p className="text-xs muted">עמודת הקלט מימין ועמודת הפלט משמאל — ערכי הקלט והפלט נפרדים תמיד. תא מודגש = הערך השתנה בשורה הזו.</p>
        </div>
      )}
      {mode === 'modular' && (
        <table className="ttable min-w-full">
          <thead><tr><th>שורות</th><th>קטע</th><th>מה הקטע עושה (אגף ימין = הערכים שלפני הקטע)</th></tr></thead>
          <tbody>
            {segmentProgram(program).map((s, i) => {
              const f = s.effect ? formatEffect(s.effect, program.counters).filter((x) => !x.unchanged) : null;
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
      )}
    </div>
  );
}
