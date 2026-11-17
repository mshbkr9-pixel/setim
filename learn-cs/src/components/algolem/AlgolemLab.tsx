'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { compile, createMachine, currentLocation, run, step, unitOf, visibleCounters } from '@/engines/algolem';
import type { AlgolemSyntaxError, HelperMode, MachineState, Program, StepEvent } from '@/engines/algolem';
import { buildTrace, iterationTable, lineTable, type Trace } from '@/engines/algolem/trace';
import { formatEffect, segmentProgram } from '@/engines/algolem/symbolic';
import { cellLabel, describeEvent, explainProgram, statusText, type Level } from '@/explain/algolem';
import type { AlgolemTest } from '@/content/types';
import { CodeEditor } from '@/components/code/CodeEditor';
import { Listing } from '@/components/ui/Listing';
import { CounterJar, type CounterJarProps } from './CounterJar';
import { TraceTable } from './TraceTable';
import { setSettings, useProgress } from '@/progress/store';
import { StepTutor } from './StepTutor';

type Panel = 'trace' | 'rounds' | 'frames' | 'modular' | 'lines';
type HistEvent = StepEvent | { kind: 'jump'; steps: number };

const SPEEDS = [1300, 950, 700, 500, 340, 230, 150, 90, 45, 12];
const MAX_HISTORY = 20_000;
const RUN_TO_END = 100_000;

export interface AlgolemLabProps {
  code: string;
  inputs: Record<string, number>;
  procedures?: string[];
  editable?: boolean;
  panels?: ('trace' | 'frames' | 'modular' | 'lines')[];
  helperMode?: HelperMode;
  goal?: { text: string; tests: AlgolemTest[] };
  variant?: 'full' | 'embed';
  onGoalChecked?: (ok: boolean) => void;
  /** Called on every state change (used by the tutor). */
  onStep?: (info: { state: MachineState; event: HistEvent | null; program: Program }) => void;
  /** Start in tutor mode ("predict every step"). */
  tutor?: boolean;
}

export function AlgolemLab(props: AlgolemLabProps) {
  const { editable = false, variant = 'embed', procedures } = props;
  const progress = useProgress();
  const [code, setCode] = useState(props.code);
  const [mode, setMode] = useState<HelperMode>(props.helperMode ?? 'local');
  const [inputs, setInputs] = useState<Record<string, number>>(props.inputs);
  const [level, setLevel] = useState<Level>(progress.settings.level);
  const speed = progress.settings.speed;

  const compiled = useMemo(() => compile({ main: code, procedures, helperMode: mode }), [code, procedures, mode]);
  const program = compiled.ok ? compiled.program : null;
  const counterNames = useMemo(() => (program ? [...program.counters, ...program.hiddenCounters] : []), [program]);
  const effectiveInputs = useMemo(() => Object.fromEntries(counterNames.map((n) => [n, inputs[n] ?? 0])), [counterNames, inputs]);

  // ---------------------------------------------------------------- history of states
  const [hist, setHist] = useState<{ states: MachineState[]; events: HistEvent[]; trimmed: number }>(() => ({
    states: program ? [createMachine(program, effectiveInputs)] : [],
    events: [],
    trimmed: 0,
  }));
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [tutorMode, setTutorMode] = useState(!!props.tutor);
  const [tutorFlash, setTutorFlash] = useState<string | null>(null);

  const resetKey = `${code}|${mode}|${JSON.stringify(effectiveInputs)}|${(procedures ?? []).join('#')}`;
  const lastKey = useRef(resetKey);
  useEffect(() => {
    if (lastKey.current === resetKey) return;
    lastKey.current = resetKey;
    setPlaying(false);
    setLimitHit(false);
    setIdx(0);
    setHist({ states: program ? [createMachine(program, effectiveInputs)] : [], events: [], trimmed: 0 });
  }, [resetKey, program, effectiveInputs]);

  const state = hist.states[idx] ?? null;
  const lastEvent: HistEvent | null = idx > 0 ? hist.events[idx - 1] ?? null : null;
  const finished = !!state && state.status !== 'running';

  // functional updates through refs, so rapid clicks never act on a stale history
  const histRef = useRef(hist);
  histRef.current = hist;
  const idxRef = useRef(idx);
  idxRef.current = idx;
  const forward = useCallback(() => {
    if (!program) return false;
    const h = histRef.current;
    const i = idxRef.current;
    if (i < h.states.length - 1) {
      idxRef.current = i + 1;
      setIdx(i + 1);
      return true;
    }
    const cur = h.states[i];
    if (!cur || cur.status !== 'running') return false;
    if (h.states.length >= MAX_HISTORY) {
      setLimitHit(true);
      setPlaying(false);
      return false;
    }
    const r = step(program, cur);
    const next = { ...h, states: [...h.states, r.state], events: [...h.events, r.event] };
    histRef.current = next;
    idxRef.current = i + 1;
    setHist(next);
    setIdx(i + 1);
    return r.state.status === 'running';
  }, [program]);

  const back = () => setIdx((i) => Math.max(0, i - 1));
  const reset = () => {
    setPlaying(false);
    setIdx(0);
    setLimitHit(false);
  };
  const toEnd = () => {
    if (!program || !state) return;
    setPlaying(false);
    // keep full history for short runs, jump for long ones
    const r = run(program, hist.states[hist.states.length - 1], { maxSteps: 4000, trace: true, events: true });
    let states = [...hist.states, ...(r.states ?? [])];
    let events: HistEvent[] = [...hist.events, ...(r.events ?? [])];
    let last = r.state;
    if (last.status === 'running') {
      const more = run(program, last, { maxSteps: RUN_TO_END });
      last = more.state;
      states = [...states, last];
      events = [...events, { kind: 'jump', steps: last.steps - (r.state.steps ?? 0) }];
    }
    let trimmed = hist.trimmed;
    if (states.length > MAX_HISTORY) {
      const cut = states.length - MAX_HISTORY;
      states = states.slice(cut);
      events = events.slice(cut);
      trimmed += cut;
    }
    setHist({ states, events, trimmed });
    setIdx(states.length - 1);
    setLimitHit(last.status === 'running');
  };
  const continueAfterLimit = () => {
    setHist((h) => {
      const keep = 5000;
      const cut = Math.max(0, h.states.length - keep);
      return { states: h.states.slice(cut), events: h.events.slice(cut), trimmed: h.trimmed + cut };
    });
    setIdx((i) => Math.min(i, 4999));
    setLimitHit(false);
    setPlaying(true);
  };

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      const more = forward();
      if (!more) setPlaying(false);
    }, SPEEDS[speed - 1] ?? 300);
    return () => clearTimeout(t);
  }, [playing, forward, speed, idx]);

  const onStep = props.onStep;
  useEffect(() => {
    if (state && program) onStep?.({ state, event: lastEvent, program });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ---------------------------------------------------------------- derived views
  const location = program && state ? currentLocation(program, state) : null;
  const mainLine = useMemo(() => {
    if (!program || !state) return null;
    const f0 = state.frames[0];
    if (state.frames.length > 1) return program.main.code[f0.pc - 1]?.line ?? null; // the call being executed
    return finished ? null : program.main.code[f0.pc]?.line ?? null;
  }, [program, state, finished]);

  const flashes: Record<string, CounterJarProps['flash']> = {};
  if (lastEvent && 'cell' in lastEvent) {
    const k = lastEvent.cell;
    if (lastEvent.kind === 'add') flashes[k] = 'add';
    else if (lastEvent.kind === 'sub') flashes[k] = 'sub';
    else if (lastEvent.kind === 'while-enter') flashes[k] = 'test-full';
    else if (lastEvent.kind === 'while-exit') flashes[k] = 'test-empty';
  }
  if (lastEvent?.kind === 'error' && lastEvent.error.cell) flashes[lastEvent.error.cell] = 'error';
  if (tutorFlash) flashes[tutorFlash] = 'test-full';

  const explanation = (() => {
    if (!compiled.ok) return 'יש שגיאת תחביר — תקנו אותה כדי להריץ.';
    if (!lastEvent || !state) return 'לחצו "צעד" כדי לבצע את השורה הראשונה, או "הרצה" כדי לראות הכול ברצף.';
    if (lastEvent.kind === 'jump') return `דילגנו ${lastEvent.steps.toLocaleString('he-IL')} צעדים קדימה בבת אחת.`;
    return describeEvent(lastEvent, state, level);
  })();

  const beforeAfter = lastEvent && (lastEvent.kind === 'add' || lastEvent.kind === 'sub') ? lastEvent : null;

  const fullTrace: Trace | null = useMemo(() => (program ? buildTrace(program, effectiveInputs, 3000) : null), [program, effectiveInputs]);

  const initialPanels = props.panels ?? (variant === 'full' ? ['trace', 'frames'] : []);
  const [panel, setPanel] = useState<Panel | null>((initialPanels[0] as Panel) ?? null);

  const usesProcs = !!program && program.main.code.some((i) => i.op === 'call');

  // ---------------------------------------------------------------- goal
  const [goalResult, setGoalResult] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const checkGoal = () => {
    if (!props.goal || !program) return;
    const lines: string[] = [];
    let ok = true;
    for (const t of props.goal.tests) {
      const r = run(program, createMachine(program, t.inputs), { maxSteps: 200_000 });
      const inp = Object.entries(t.inputs).map(([k, v]) => `${k}=${v}`).join(', ');
      if (t.expect === 'no-output') {
        const pass = r.stoppedBy !== 'done';
        ok &&= pass;
        lines.push(`${pass ? '✓' : '✗'} קלט ${inp}: ${pass ? 'אין פלט, כמצופה' : 'התקבל פלט, אבל ציפינו שלא יהיה'}`);
        continue;
      }
      if (r.stoppedBy !== 'done') {
        ok = false;
        lines.push(`✗ קלט ${inp}: ${r.stoppedBy === 'error' ? 'חיסור ממונה ריק' : r.stoppedBy === 'diverges' ? 'הריצה אינסופית' : 'הריצה לא הסתיימה'}`);
        continue;
      }
      const out = visibleCounters(program, r.state);
      const wrong = Object.entries(t.expect).filter(([k, v]) => out[k] !== v);
      ok &&= wrong.length === 0;
      lines.push(
        wrong.length === 0
          ? `✓ קלט ${inp}: ${Object.entries(t.expect).map(([k, v]) => `${k}=${v}`).join(', ')}`
          : `✗ קלט ${inp}: ${wrong.map(([k, v]) => `${k} יצא ${out[k] ?? '—'} במקום ${v}`).join(', ')}`,
      );
    }
    setGoalResult({ ok, lines });
    props.onGoalChecked?.(ok);
  };

  // ---------------------------------------------------------------- render
  const errors: AlgolemSyntaxError[] = compiled.ok ? [] : compiled.errors;
  const errorLines = errors.filter((e) => e.unit === null || e.unit === compiled.program?.main.name).map((e) => e.line);
  const procFrame = state && state.frames.length > 1 ? state.frames[state.frames.length - 1] : null;
  const procUnit = program && procFrame ? unitOf(program, procFrame.unit) : null;

  const controls = (
    <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="שליטה בהרצה">
      {playing ? (
        <button className="btn btn-primary" onClick={() => setPlaying(false)} aria-label="עצירה">⏸ עצירה</button>
      ) : (
        <button className="btn btn-primary" onClick={() => !finished && setPlaying(true)} disabled={!program || finished || limitHit} aria-label="הרצה אוטומטית">▶ הרצה</button>
      )}
      <button className="btn" onClick={back} disabled={idx === 0} aria-label="צעד אחורה">⏮ אחורה</button>
      <button className="btn" onClick={() => forward()} disabled={!program || (finished && idx === hist.states.length - 1) || limitHit} aria-label="צעד קדימה">צעד ⏭</button>
      <button className="btn" onClick={toEnd} disabled={!program || finished} title="הרצה עד הסוף (עד 100,000 צעדים)">⏩ עד הסוף</button>
      <button className="btn btn-ghost" onClick={reset} disabled={idx === 0} aria-label="איפוס">⟲ איפוס</button>
      <button className={`btn btn-sm ${tutorMode ? 'btn-primary' : ''}`} onClick={() => { setTutorMode((m) => !m); setPlaying(false); setTutorFlash(null); }} aria-pressed={tutorMode} title="המורה שואל מה יקרה לפני כל פקודה">
        🧑‍🏫 מצב מורה
      </button>
      <label className="ms-auto flex items-center gap-2 text-sm muted">
        מהירות
        <input type="range" min={1} max={10} value={speed} onChange={(e) => setSettings({ speed: Number(e.target.value) })} aria-label="מהירות ההרצה" className="w-24 accent-[var(--accent)]" />
      </label>
    </div>
  );

  const inputsBox = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">ערכי התחלה:</span>
      {counterNames.map((n) => (
        <label key={n} className="flex items-center gap-1 rounded-lg border border-line bg-card px-1.5 py-0.5">
          <span className="font-mono text-sm" dir="ltr">{n}</span>
          <button className="btn btn-ghost btn-sm min-h-0 px-1.5" onClick={() => setInputs((s) => ({ ...s, [n]: Math.max(0, (s[n] ?? 0) - 1) }))} aria-label={`הפחת ${n}`}>−</button>
          <input
            className="input num-input min-h-0 w-12 py-0.5"
            inputMode="numeric"
            value={effectiveInputs[n]}
            aria-label={`ערך התחלה של ${n}`}
            onChange={(e) => {
              const v = Math.min(9999, Number(e.target.value.replace(/[^\d]/g, '') || 0));
              setInputs((s) => ({ ...s, [n]: v }));
            }}
          />
          <button className="btn btn-ghost btn-sm min-h-0 px-1.5" onClick={() => setInputs((s) => ({ ...s, [n]: Math.min(9999, (s[n] ?? 0) + 1) }))} aria-label={`הוסף ל־${n}`}>+</button>
        </label>
      ))}
    </div>
  );

  const board = (
    <div className="grid-paper rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-3">
        {counterNames.map((n) => (
          <CounterJar
            key={n}
            name={n}
            value={state?.cells[n] ?? 0}
            flash={flashes[n] ?? null}
            caption={program?.hiddenCounters.includes(n) ? 'מונה עזר משותף' : procFrame ? Object.entries(procFrame.bind).filter(([, c]) => c === n).map(([p]) => (p === n ? '' : `${procFrame.unit}: ${p}`)).filter(Boolean).join(' ') || undefined : undefined}
          />
        ))}
      </div>
      {state && state.frames.length > 1 && (
        <div className="mt-3 flex flex-wrap justify-center gap-3 border-t border-dashed border-line pt-3">
          {state.frames.slice(1).map((f) =>
            f.owns.map((cell) => (
              <CounterJar key={cell} name={cellLabel(state, cell).split(' ')[0]} caption={`עזר פרטי של ${f.unit}`} value={state.cells[cell] ?? 0} flash={flashes[cell] ?? null} size="sm" />
            )),
          )}
        </div>
      )}
    </div>
  );

  const status = state ? statusText(state, limitHit) : '';
  const statusTone = state?.status === 'done' ? 'text-ok' : state?.status === 'error' || state?.status === 'diverges' ? 'text-bad' : limitHit ? 'text-warn' : 'muted';

  const explainBox = (
    <div className="rounded-xl border border-line bg-card-2 p-3" aria-live="polite">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="kicker">מה קרה עכשיו</span>
        <span className={`text-sm ${statusTone}`}>{status}</span>
        <span className="ms-auto flex gap-1" role="group" aria-label="רמת הסבר">
          {([1, 2, 3] as Level[]).map((l) => (
            <button key={l} className={`btn btn-sm ${level === l ? 'btn-primary' : ''}`} onClick={() => { setLevel(l); setSettings({ level: l }); }}>
              {l === 1 ? 'מתחיל' : l === 2 ? 'רגיל' : 'מתקדם'}
            </button>
          ))}
        </span>
      </div>
      <p className="text-[0.98rem]">{explanation}</p>
      {beforeAfter && (
        <div className="mt-2 flex items-center gap-3 text-sm" dir="rtl">
          <span className="chip">לפני: <b className="font-mono" dir="ltr">{beforeAfter.written}={beforeAfter.before}</b></span>
          <span aria-hidden>←</span>
          <span className="chip border-[var(--ball)]">אחרי: <b className="font-mono" dir="ltr">{beforeAfter.written}={beforeAfter.after}</b></span>
        </div>
      )}
      {state?.status === 'diverges' && state.divergence && (
        <div className="mt-2 rounded-lg border border-bad/40 bg-bad-soft p-2 text-sm">
          <b>ההוכחה:</b> בבדיקת השורה {state.divergence.line} (צעד {state.divergence.stepA}):{' '}
          <span className="font-mono" dir="ltr">{Object.entries(state.divergence.before).map(([k, v]) => `${k}=${v}`).join(' ')}</span>; ובביקור הבא (צעד {state.divergence.stepB}):{' '}
          <span className="font-mono" dir="ltr">{Object.entries(state.divergence.after).map(([k, v]) => `${k}=${v}`).join(' ')}</span>.{' '}
          {state.divergence.reason === 'same-state' ? 'המצב זהה — הוא יחזור לנצח.' : 'אף מונה לא קטן, והמונים שגדלו לא נבדקו כריקים — אותו מסלול יחזור לנצח.'}
        </div>
      )}
      {limitHit && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-warn">
          הגענו למגבלת הצעדים. אין זו הוכחה שהתוכנית אינסופית.
          <button className="btn btn-sm" onClick={continueAfterLimit}>להמשיך להריץ</button>
        </div>
      )}
    </div>
  );

  const panelTabs: { id: Panel; label: string; show: boolean }[] = [
    { id: 'trace', label: 'טבלת מעקב', show: true },
    { id: 'rounds', label: 'לפי סיבובים', show: !!program?.main.code.some((i) => i.op === 'while') },
    { id: 'frames', label: 'מסגרות קריאה', show: usesProcs },
    { id: 'modular', label: 'פירוק לקטעים', show: true },
    { id: 'lines', label: 'הסבר לכל שורה', show: true },
  ];

  const panelBody = (() => {
    if (!panel || !program || !fullTrace || !state) return null;
    if (panel === 'trace' || panel === 'rounds') {
      const steps = state.steps;
      const partial = steps < fullTrace.rows.length || (fullTrace.stoppedBy === 'limit');
      const trunc: Trace = { ...fullTrace, rows: fullTrace.rows.slice(0, steps), output: partial ? null : fullTrace.output };
      let cols = panel === 'trace' ? lineTable(trunc) : iterationTable(trunc);
      if (partial) cols = cols.slice(0, -1);
      return (
        <div className="space-y-2">
          <TraceTable counters={fullTrace.counters} columns={cols} current={cols.length - 1} />
          <p className="text-xs muted">
            {panel === 'trace' ? 'עמודה אחרי כל שורה שמשנה מונה (קריאה לפרוצדורה = שורה אחת). התא המודגש השתנה בשורה הזו.' : 'עמודה אחרי כל סיבוב של הלולאה הראשונה באלגוריתם.'}
            {fullTrace.rows.length >= 3000 && ' הטבלה מוגבלת ל־3,000 הצעדים הראשונים.'}
          </p>
        </div>
      );
    }
    if (panel === 'frames') {
      return (
        <div className="space-y-2" aria-label="מחסנית מסגרות">
          {[...state.frames].reverse().map((f, i) => (
            <div key={f.serial} className={`rounded-lg border p-2 ${i === 0 ? 'border-[var(--ball)] bg-card' : 'border-line bg-card-2'}`}>
              <div className="flex items-center gap-2 text-sm">
                <b className="font-mono" dir="ltr">{f.unit === 'main' ? 'main' : f.unit}</b>
                <span className="muted">{f.unit === 'main' ? 'האלגוריתם הראשי' : `נקראה בשורה ${f.callLine}`}</span>
                {i === 0 && <span className="chip ms-auto">פעילה</span>}
              </div>
              {f.unit !== 'main' && (
                <div className="mt-1 flex flex-wrap gap-1.5 text-sm">
                  {Object.entries(f.bind).map(([name, cell]) => (
                    <span key={name} className="chip" dir="ltr">
                      {name} → {cell.includes('@') ? `${name} (פרטי) = ${state.cells[cell] ?? 0}` : `${cell} = ${state.cells[cell] ?? 0}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <p className="text-xs muted">
            {mode === 'local' ? 'מוני עזר פרטיים: לכל קריאה מונים משלה, שנעלמים כשהיא מסתיימת.' : 'מוני עזר משותפים: פרוצדורה משתמשת במונים הגלובליים באותו שם.'}
          </p>
        </div>
      );
    }
    if (panel === 'modular') {
      const segs = segmentProgram(program);
      return (
        <div className="space-y-2">
          <div className="thin-scroll overflow-x-auto">
            <table className="ttable min-w-full">
              <thead>
                <tr><th>שורות</th><th>הקטע</th><th>מה הקטע עושה (ערכים מימין = לפני הקטע)</th></tr>
              </thead>
              <tbody>
                {segs.map((s, i) => {
                  const lines = s.effect ? formatEffect(s.effect, program.counters).filter((f) => !f.unchanged) : null;
                  return (
                    <tr key={i}>
                      <td className="num">{s.from === s.to ? s.from : `${s.from}–${s.to}`}</td>
                      <td className="text-start"><pre className="code text-[0.8rem] leading-tight">{s.code.split('\n').map((l) => l.trim()).join('\n')}</pre></td>
                      <td className="text-start font-mono" dir="ltr">
                        {lines === null ? <span className="font-sans text-xs muted" dir="rtl">אין נוסחה פשוטה — עקבו בטבלת המעקב</span> : lines.length === 0 ? '—' : lines.map((f) => `${f.counter} = ${f.expr}`).join(',  ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs muted">בכל נוסחה, אגף ימין מתייחס לערכים שהיו לפני הקטע — זו השמה, לא משוואה. הנוסחאות מניחות שאין חיסור ממונה ריק.</p>
        </div>
      );
    }
    return (
      <ol className="space-y-1">
        {explainProgram(code).map((l) => (
          <li key={l.line} className={`grid grid-cols-[2rem_minmax(7rem,auto)_1fr] items-baseline gap-2 rounded px-1 ${mainLine === l.line ? 'bg-[var(--code-line)]' : ''}`}>
            <span className="font-mono text-xs muted" dir="ltr">{l.line}</span>
            <code className="whitespace-pre text-[0.85rem]" dir="ltr">{l.text.trim() || ' '}</code>
            <span className="text-sm">{l.text.trim() ? l.explanation : ''}</span>
          </li>
        ))}
      </ol>
    );
  })();

  return (
    <div className={`space-y-3 ${variant === 'full' ? '' : 'card p-3 sm:p-4'}`}>
      <div className={variant === 'full' ? 'grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]' : 'grid gap-3 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'}>
        <div className="min-w-0 space-y-2">
          <CodeEditor value={code} onChange={editable ? setCode : undefined} readOnly={!editable} activeLines={mainLine ? [mainLine] : []} errorLines={errorLines} minHeight={variant === 'full' ? 260 : 120} ariaLabel="קוד אלגולם" />
          {errors.length > 0 && (
            <ul className="space-y-1 rounded-lg border border-bad/40 bg-bad-soft p-2 text-sm" role="alert">
              {errors.slice(0, 5).map((e, i) => (
                <li key={i}>
                  <b>{e.unit && e.unit !== compiled.program?.main.name ? `${e.unit}, ` : ''}שורה {e.line}:</b> {e.message}
                  {e.hint && <span className="block text-xs text-ink-2">{e.hint}</span>}
                </li>
              ))}
            </ul>
          )}
          {procUnit && procFrame && (
            <div className="space-y-1">
              <div className="text-sm"><span className="kicker">בתוך הפרוצדורה</span> <b className="font-mono">{procUnit.id}</b></div>
              <Listing code={procUnit.source} highlight={location && location.unit === procUnit.id ? [location.line] : []} className="text-[0.82rem]" />
            </div>
          )}
          {(variant === 'full' || usesProcs) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="muted">מוני עזר בתוך פרוצדורה:</span>
              <button className={`btn btn-sm ${mode === 'local' ? 'btn-primary' : ''}`} onClick={() => setMode('local')}>פרטיים</button>
              <button className={`btn btn-sm ${mode === 'shared' ? 'btn-primary' : ''}`} onClick={() => setMode('shared')}>משותפים</button>
              <span className="text-xs muted" title="החומר אינו קובע זאת במפורש. ברירת המחדל: פרטיים — כך HUN של המרצה נותנת 100.">(?)</span>
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-3">
          {inputsBox}
          {board}
          {controls}
        </div>
      </div>
      {tutorMode && program && state && idx === hist.states.length - 1 && (
        <StepTutor program={program} state={state} onCommit={() => forward()} onFlash={setTutorFlash} />
      )}
      {explainBox}
      {props.goal && (
        <div className="rounded-xl border border-info/40 bg-info-soft p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="kicker">משימה</span>
            <span className="text-sm">{props.goal.text}</span>
            <button className="btn btn-sm btn-primary ms-auto" onClick={checkGoal} disabled={!program}>בדיקה</button>
          </div>
          {goalResult && (
            <ul className={`mt-2 space-y-0.5 text-sm ${goalResult.ok ? 'text-ok' : ''}`}>
              {goalResult.lines.map((l, i) => <li key={i}>{l}</li>)}
              <li className="font-semibold">{goalResult.ok ? 'כל הבדיקות עברו — מצוין!' : 'עדיין לא. בדקו את השורות המסומנות ב־✗ ונסו שוב.'}</li>
            </ul>
          )}
        </div>
      )}
      <div>
        <div className="mb-2 flex flex-wrap gap-1" role="tablist">
          {panelTabs.filter((t) => t.show).map((t) => (
            <button key={t.id} role="tab" aria-selected={panel === t.id} className={`btn btn-sm ${panel === t.id ? 'btn-primary' : ''}`} onClick={() => setPanel(panel === t.id ? null : t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        {panelBody}
      </div>
    </div>
  );
}
