'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createLogo, describeLogo, parseLogo, runLogo, sameDrawing, stepLogo, type LogoEvent, type LogoProgram, type LogoState, type Segment } from '@/engines/logo';
import { CodeEditor } from '@/components/code/CodeEditor';
import { useProgress, setSettings } from '@/progress/store';

const SPEEDS = [1100, 800, 600, 420, 300, 200, 130, 80, 40, 10];
const MAX_HISTORY = 6000;

export interface LogoLabProps {
  code: string;
  run?: string;
  editable?: boolean;
  showStack?: boolean;
  goal?: { text: string; target: string };
  variant?: 'full' | 'embed';
}

function bounds(segs: Segment[], t: { x: number; y: number }) {
  let minX = Math.min(-60, t.x), maxX = Math.max(60, t.x), minY = Math.min(-60, t.y), maxY = Math.max(60, t.y);
  for (const s of segs) {
    minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2);
    minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2);
  }
  const pad = Math.max(20, 0.12 * Math.max(maxX - minX, maxY - minY));
  return { minX: minX - pad, maxX: maxX + pad, minY: minY - pad, maxY: maxY + pad };
}

export function TurtleCanvas({ state, target, height = 300 }: { state: LogoState; target?: Segment[]; height?: number }) {
  const b = bounds([...state.segments, ...(target ?? [])], state.turtle);
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const t = state.turtle;
  const unit = Math.max(w, h) / 60;
  const lastLine = state.segments.length ? state.segments[state.segments.length - 1] : null;
  return (
    <svg viewBox={`${b.minX} ${-b.maxY} ${w} ${h}`} className="grid-paper w-full rounded-xl border border-line" style={{ height }} role="img" aria-label={`ציור הצב: ${state.segments.length} קווים, הצב בנקודה (${t.x}, ${t.y}) ופונה ל־${t.heading} מעלות`}>
      <line x1={b.minX} y1={0} x2={b.maxX} y2={0} stroke="var(--line-2)" strokeWidth={unit * 0.12} strokeDasharray={`${unit} ${unit}`} />
      <line x1={0} y1={-b.maxY} x2={0} y2={-b.minY} stroke="var(--line-2)" strokeWidth={unit * 0.12} strokeDasharray={`${unit} ${unit}`} />
      {target?.map((s, i) => (
        <line key={'t' + i} x1={s.x1} y1={-s.y1} x2={s.x2} y2={-s.y2} stroke="var(--info)" strokeOpacity={0.35} strokeWidth={unit * 0.9} strokeLinecap="round" />
      ))}
      {state.segments.map((s, i) => (
        <line key={i} x1={s.x1} y1={-s.y1} x2={s.x2} y2={-s.y2} stroke={s === lastLine ? 'var(--ball-dark)' : 'var(--ink)'} strokeWidth={unit * 0.35} strokeLinecap="round" />
      ))}
      {t.visible && (
        <g transform={`translate(${t.x} ${-t.y}) rotate(${t.heading})`}>
          <path d={`M0 ${-unit * 2.4} L${unit * 1.5} ${unit * 1.3} L0 ${unit * 0.6} L${-unit * 1.5} ${unit * 1.3} Z`} fill="var(--t-logo)" stroke="var(--card)" strokeWidth={unit * 0.15} />
          <circle r={unit * 0.35} fill={t.pen ? 'var(--ink)' : 'var(--card)'} stroke="var(--ink)" strokeWidth={unit * 0.12} />
        </g>
      )}
    </svg>
  );
}

/** Memory stack in the style of the slides: open-top boxes, top frame on top (LIFO). */
export function StackView({ frames }: { frames: { proc: string | null; vars: { name: string; value: number | string }[] }[] }) {
  const shown = frames.filter((f) => f.proc !== null);
  return (
    <div className="flex flex-col items-center" aria-label="מחסנית הזיכרון">
      <div className="mb-1 flex w-56 justify-between text-[0.68rem] muted"><span>LAST IN ↓</span><span>↑ FIRST OUT</span></div>
      <div className="w-56 border-x-2 border-b-2 border-ink-2 px-2 pb-2 pt-1">
        {shown.length === 0 && <div className="py-4 text-center text-sm muted">המחסנית ריקה</div>}
        {[...shown].reverse().map((f, i) => (
          <div key={i} className={`relative mt-1 border-b border-dashed border-ink-3 pb-1 ${i === 0 ? '' : 'opacity-80'}`}>
            <div className="absolute -start-[4.6rem] top-1 w-16 text-end font-mono text-[0.72rem] font-semibold" dir="ltr">{f.proc}</div>
            {f.vars.length === 0 && <div className="py-1 text-center font-mono text-sm muted">?</div>}
            {[...f.vars].reverse().map((v) => (
              <div key={v.name} className="flex items-center justify-end gap-2 py-0.5 font-mono text-sm" dir="ltr">
                <span className="text-ink-2">{v.name.toLowerCase()}</span>
                <span className="min-w-[2.4rem] border border-ink-2 bg-card px-1 text-center">{v.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const headingWord = (h: number) => ({ 0: 'למעלה', 90: 'ימינה', 180: 'למטה', 270: 'שמאלה' } as Record<number, string>)[h] ?? '';

export function LogoLab({ code: initialCode, run: initialRun = '', editable = false, showStack = false, goal, variant = 'embed' }: LogoLabProps) {
  const progress = useProgress();
  const speed = progress.settings.speed;
  const [code, setCode] = useState(initialCode);
  const [runLine, setRunLine] = useState(initialRun);
  const parsed = useMemo(() => parseLogo(code, runLine), [code, runLine]);
  const program: LogoProgram | null = parsed.program;
  const codeLines = code.split('\n').length;

  const [hist, setHist] = useState<{ states: LogoState[]; events: LogoEvent[] }>(() => ({ states: program ? [createLogo(program)] : [], events: [] }));
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState('');

  const key = `${code}|${runLine}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setPlaying(false);
    setIdx(0);
    setNote('');
    setHist({ states: program ? [createLogo(program)] : [], events: [] });
  }

  const state = hist.states[idx] ?? null;
  const ev = idx > 0 ? hist.events[idx - 1] : null;
  const finished = !!state && state.status !== 'running';

  const histRef = useRef(hist);
  const idxRef = useRef(idx);
  useEffect(() => {
    histRef.current = hist;
    idxRef.current = idx;
  }, [hist, idx]);
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
      setNote('הגענו למגבלת ההיסטוריה. לחצו "עד הסוף" כדי להמשיך בבת אחת.');
      return false;
    }
    const r = stepLogo(program, cur);
    const next = { states: [...h.states, r.state], events: [...h.events, r.event] };
    histRef.current = next;
    idxRef.current = i + 1;
    setHist(next);
    setIdx(i + 1);
    return r.state.status === 'running';
  }, [program]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => forward() || setPlaying(false), SPEEDS[speed - 1] ?? 300);
    return () => clearTimeout(t);
  }, [playing, forward, speed, idx]);

  const toEnd = () => {
    if (!program || !state) return;
    setPlaying(false);
    const r = runLogo(program, hist.states[hist.states.length - 1], 100_000);
    setHist((h) => ({ states: [...h.states, r.state], events: [...h.events, r.stoppedBy === 'error' && r.state.error ? { kind: 'error', line: r.state.error.line, error: r.state.error } : { kind: 'done', line: 0 }] }));
    setIdx(hist.states.length);
    setNote(r.stoppedBy === 'limit' ? 'הגענו למגבלה של 100,000 צעדים. זה לא אומר בהכרח שהתוכנית אינסופית.' : '');
  };

  const targetSegs = useMemo(() => {
    if (!goal) return undefined;
    const p = parseLogo(goal.target);
    return p.program ? runLogo(p.program).state.segments : undefined;
  }, [goal]);
  const goalOk = !!(targetSegs && state && finished && state.status === 'done' && sameDrawing(state.segments, targetSegs));

  const activeLine = ev && ev.line > 0 && ev.line <= codeLines ? ev.line : null;
  const onRunLine = ev && ev.line > codeLines;
  const topFrame = state?.frames[state.frames.length - 1];

  return (
    <div className={`space-y-3 ${variant === 'full' ? '' : 'card p-3 sm:p-4'}`}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="min-w-0 space-y-2">
          <CodeEditor lang="logo" value={code} onChange={editable ? setCode : undefined} readOnly={!editable} activeLines={activeLine ? [activeLine] : []} errorLines={parsed.errors.filter((e) => e.line <= codeLines).map((e) => e.line)} minHeight={variant === 'full' ? 240 : 110} ariaLabel="קוד LOGO" />
          <div className="flex items-center gap-2">
            <span className="text-xs muted" title="שורת הפקודה של LOGO (Commander)">Commander</span>
            <input className={`input font-mono ${onRunLine ? 'ring-2 ring-[var(--ball)]' : ''}`} dir="ltr" value={runLine} readOnly={!editable} onChange={(e) => setRunLine(e.target.value)} aria-label="שורת הפקודה" placeholder="TEETH 3 20" />
            <button className="btn btn-primary" onClick={() => !finished && setPlaying(true)} disabled={!program || finished}>Execute</button>
          </div>
          {parsed.errors.length > 0 && (
            <ul className="rounded-lg border border-bad/40 bg-bad-soft p-2 text-sm" role="alert">
              {parsed.errors.slice(0, 4).map((e, i) => (
                <li key={i}><b>{e.line > codeLines ? 'שורת הפקודה' : `שורה ${e.line}`}:</b> {e.message}{e.hint && <span className="block text-xs text-ink-2">{e.hint}</span>}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          {state && <TurtleCanvas state={state} target={targetSegs} height={variant === 'full' ? 340 : 250} />}
          <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="שליטה בצב">
            {playing ? (
              <button className="btn btn-primary" onClick={() => setPlaying(false)}>⏸ עצירה</button>
            ) : (
              <button className="btn btn-primary" onClick={() => setPlaying(true)} disabled={!program || finished}>▶ הרצה</button>
            )}
            <button className="btn" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} aria-label="צעד אחורה">⏮ אחורה</button>
            <button className="btn" onClick={() => forward()} disabled={!program || (finished && idx === hist.states.length - 1)} aria-label="צעד קדימה">צעד ⏭</button>
            <button className="btn" onClick={toEnd} disabled={!program || finished}>⏩ עד הסוף</button>
            <button className="btn btn-ghost" onClick={() => { setPlaying(false); setIdx(0); }} disabled={idx === 0}>⟲ איפוס</button>
            <input type="range" min={1} max={10} value={speed} onChange={(e) => setSettings({ speed: Number(e.target.value) })} aria-label="מהירות" className="ms-auto w-20 accent-[var(--accent)]" />
          </div>
        </div>
      </div>
      {state && (
        <div className={`grid gap-3 ${showStack ? 'md:grid-cols-[1fr_auto]' : ''}`}>
          <div className="rounded-xl border border-line bg-card-2 p-3" aria-live="polite">
            <div className="mb-1 flex flex-wrap gap-1.5 text-sm">
              <span className="chip" dir="ltr">x = {state.turtle.x}</span>
              <span className="chip" dir="ltr">y = {state.turtle.y}</span>
              <span className="chip">כיוון: {state.turtle.heading}° {headingWord(state.turtle.heading)}</span>
              <span className="chip">עט: {state.turtle.pen ? 'למטה (מצייר)' : 'למעלה (לא מצייר)'}</span>
              <span className="chip">קווים: {state.segments.length}</span>
              {topFrame && topFrame.proc && topFrame.vars.map((v) => <span key={v.name} className="chip font-mono" dir="ltr">:{v.name} = {v.value}</span>)}
            </div>
            <p className="text-[0.98rem]">{ev ? describeLogo(ev) : 'לחצו "צעד" כדי לבצע פקודה אחת, או Execute כדי להריץ את שורת הפקודה.'}</p>
            {note && <p className="mt-1 text-sm text-warn">{note}</p>}
            {goal && (
              <p className={`mt-2 text-sm ${goalOk ? 'text-ok' : 'muted'}`}>
                <b>משימה:</b> {goal.text} {finished && (goalOk ? '✓ הציור זהה לציור המטרה!' : '— הציור עדיין שונה מציור המטרה (בכחול בהיר).')}
              </p>
            )}
          </div>
          {showStack && <StackView frames={state.frames} />}
        </div>
      )}
    </div>
  );
}
