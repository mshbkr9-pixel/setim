'use client';
import { useMemo, useState } from 'react';
import type { Question } from '@/content/types';
import { MISCONCEPTIONS } from '@/content/skills';
import { grade, solutionText, traceBlanks, traceColumns, LOGO_ASK, type Answer, type GradeResult } from '@/questions/grade';
import { recordAttempt } from '@/progress/store';
import { Rich, RichInline, plainText } from '@/components/ui/Rich';
import { Listing } from '@/components/ui/Listing';
import { OriginTag, PhotoRefs } from '@/components/ui/Origin';
import { CodeEditor } from '@/components/code/CodeEditor';
import { CounterJar } from '@/components/algolem/CounterJar';
import { TraceTable } from '@/components/algolem/TraceTable';
import { AlgolemLab } from '@/components/algolem/AlgolemLab';
import { LogoLab } from '@/components/logo/LogoLab';
import { ArrowsLab } from '@/components/widgets/FunctionsLab';
import { SetsLab } from '@/components/widgets/SetsLab';

const TYPE_LABEL: Record<Question['type'], string> = {
  mcq: 'בחירה',
  predict: 'חיזוי פלט',
  'complete-code': 'השלמת קוד',
  'find-bug': 'מציאת שגיאה',
  'trace-fill': 'השלמת טבלת מעקב',
  order: 'סידור שלבים',
  build: 'בניית אלגוריתם',
  'sim-goal': 'הפעלת סימולטור',
  match: 'התאמה',
  numeric: 'תשובה מספרית',
  'set-answer': 'קבוצות',
  'arrows-classify': 'דיאגרמת חצים',
  'logo-state': 'מצב הצב',
};

/** Deterministic shuffle (by question id) — the same order every time. */
function shuffled<T>(items: T[], seedText: string): number[] {
  let seed = [...seedText].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const idx = items.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  if (idx.every((v, i) => v === i) && idx.length > 1) idx.push(idx.shift()!);
  return idx;
}

export interface QuestionViewProps {
  q: Question;
  /** Beginner-level explanation of the lesson, for "תסביר יותר פשוט". */
  simpler?: string;
  onResult?: (correct: boolean) => void;
  compact?: boolean;
  /** Exam mode: no hints, no tutor, single submission. */
  exam?: boolean;
  onAnswer?: (answer: Answer, result: GradeResult) => void;
  /** Incremented by the tutor bar's "תן לי רמז" button. */
  hintTick?: number;
}

export function QuestionView({ q, simpler, onResult, exam = false, onAnswer, hintTick = 0 }: QuestionViewProps) {
  const [answer, setAnswer] = useState<Answer>(() => initialAnswer(q));
  const [result, setResult] = useState<GradeResult | null>(null);
  const [tries, setTries] = useState(0);
  const [hints, setHints] = useState(0);
  const [showVisual, setShowVisual] = useState(false);
  const [showSimpler, setShowSimpler] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solved, setSolved] = useState(false);
  const [lastTick, setLastTick] = useState(hintTick);
  if (hintTick !== lastTick) {
    setLastTick(hintTick);
    if (!exam) setHints((h) => Math.min(q.hints.length, h + 1));
  }

  const submit = () => {
    const r = grade(q, answer);
    setResult(r);
    setTries((t) => t + 1);
    recordAttempt({ q: q.id, ok: r.correct, skills: q.skills, misconception: r.misconception, hints });
    if (r.correct) setSolved(true);
    onResult?.(r.correct);
    onAnswer?.(answer, r);
  };

  const locked = solved || (exam && tries > 0);
  const misText = result?.misconception ? MISCONCEPTIONS[result.misconception]?.text : undefined;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip">{TYPE_LABEL[q.type]}</span>
        <span className="chip">רמה {q.difficulty}</span>
        <OriginTag origin={q.origin} />
        {q.sources?.photos.length ? <PhotoRefs photos={q.sources.photos} /> : null}
      </div>
      <div className="text-[1.02rem] font-medium">
        <Rich text={q.prompt} />
      </div>
      {q.code && q.type !== 'find-bug' && <Listing code={q.code} className="text-[0.88rem]" />}

      <AnswerInput q={q} answer={answer} setAnswer={(a) => { setAnswer(a); if (result && !result.correct) setResult(null); }} locked={locked} wrong={result?.wrong} showTrace={showSolution} />

      {!locked && (
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-primary" onClick={submit}>בדיקה</button>
          {!exam && q.hints.length > 0 && (
            <button className="btn" onClick={() => setHints((h) => Math.min(q.hints.length, h + 1))} disabled={hints >= q.hints.length}>
              💡 תן לי רמז {hints > 0 ? `(${hints}/${q.hints.length})` : ''}
            </button>
          )}
        </div>
      )}
      {!exam && hints > 0 && (
        <ol className="space-y-1 rounded-lg border border-warn/40 bg-warn-soft p-2 text-sm">
          {q.hints.slice(0, hints).map((h, i) => (
            <li key={i}><b>רמז {i + 1}:</b> <RichInline text={h} /></li>
          ))}
        </ol>
      )}

      {result && !exam && (
        <div className={`rounded-xl border p-3 ${result.correct ? 'border-ok/40 bg-ok-soft' : 'border-bad/30 bg-bad-soft'}`} aria-live="polite">
          {result.correct ? (
            <>
              <p className="font-semibold text-ok">נכון! {tries > 1 ? 'יפה שהתמדת.' : ''}</p>
              <div className="mt-1 text-[0.95rem]"><Rich text={q.explanation} /></div>
            </>
          ) : (
            <>
              <p className="font-semibold text-bad">עוד לא. בואו נבין מה קרה.</p>
              {result.feedback.map((f, i) => <p key={i} className="text-[0.95rem]"><RichInline text={f} /></p>)}
              {misText && <p className="mt-1 text-[0.95rem]"><b>מה כנראה התבלבל:</b> {misText}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button className="btn btn-sm" onClick={() => setShowSimpler((v) => !v)}>לא הבנתי — תסביר יותר פשוט</button>
                {hasVisual(q) && <button className="btn btn-sm" onClick={() => setShowVisual((v) => !v)}>תראה לי ציור</button>}
                {hints < q.hints.length && <button className="btn btn-sm" onClick={() => setHints((h) => h + 1)}>תן לי רמז</button>}
                {tries >= 2 && <button className="btn btn-sm btn-ghost" onClick={() => setShowSolution(true)}>הצג פתרון</button>}
              </div>
              <p className="mt-2 text-sm muted">שנו את התשובה ולחצו שוב &quot;בדיקה&quot;.</p>
            </>
          )}
        </div>
      )}
      {exam && result && <p className="text-sm muted">התשובה נשמרה.</p>}
      {showSimpler && !exam && (
        <div className="rounded-xl border border-info/40 bg-info-soft p-3 text-[0.95rem]">
          <Rich text={simpler ?? misText ?? q.hints[0] ?? q.explanation} />
        </div>
      )}
      {showVisual && !exam && <Visual q={q} />}
      {showSolution && !exam && !solved && (
        <div className="rounded-xl border border-line bg-card-2 p-3">
          <p className="kicker">הפתרון</p>
          <Rich text={solutionText(q)} />
          <div className="mt-1 text-[0.95rem]"><Rich text={q.explanation} /></div>
        </div>
      )}
    </div>
  );
}

function hasVisual(q: Question) {
  return ['predict', 'trace-fill', 'logo-state', 'set-answer', 'complete-code', 'build'].includes(q.type);
}

function Visual({ q }: { q: Question }) {
  switch (q.type) {
    case 'predict':
    case 'trace-fill':
      return <AlgolemLab code={q.program.code} inputs={q.program.inputs} procedures={q.program.procedures} panels={['trace']} />;
    case 'complete-code':
    case 'build':
      return q.tests[0] ? <AlgolemLab code={q.type === 'build' ? q.starter ?? '' : q.template.replace('___', q.options[0])} inputs={q.tests[0].inputs} procedures={q.procedures} editable /> : null;
    case 'logo-state':
      return <LogoLab code={q.code} run={q.run} showStack />;
    case 'set-answer': {
      const names = Object.keys(q.sets);
      const universe = [...new Set(Object.values(q.sets).flat())];
      return <SetsLab universe={universe} sets={Object.fromEntries(names.slice(0, 2).map((n) => [n, q.sets[n]]))} show="none" reveal={false} />;
    }
    default:
      return null;
  }
}

function initialAnswer(q: Question): Answer {
  switch (q.type) {
    case 'mcq': return { type: 'mcq', picks: [] };
    case 'predict': return { type: 'predict', values: {}, noOutput: false };
    case 'complete-code': return { type: 'complete-code', option: -1 };
    case 'find-bug': return { type: 'find-bug', lines: [] };
    case 'trace-fill': return { type: 'trace-fill', cells: {} };
    case 'order': return { type: 'order', order: shuffled(q.items, q.id) };
    case 'build': return { type: 'build', code: q.starter ?? '' };
    case 'sim-goal': return { type: 'sim-goal', state: { ...q.start } };
    case 'match': return { type: 'match', mapping: {} };
    case 'numeric': return { type: 'numeric', value: '' };
    case 'set-answer': return { type: 'set-answer', text: '' };
    case 'arrows-classify': return { type: 'arrows-classify', picks: {} };
    case 'logo-state': return { type: 'logo-state', values: {} };
  }
}

function AnswerInput({ q, answer, setAnswer, locked, wrong, showTrace }: { q: Question; answer: Answer; setAnswer: (a: Answer) => void; locked: boolean; wrong?: string[]; showTrace: boolean }) {
  const traceData = useMemo(() => (q.type === 'trace-fill' ? traceColumns(q) : null), [q]);
  switch (q.type) {
    case 'mcq': {
      if (answer.type !== 'mcq') return null;
      return (
        <div className="grid gap-1.5" role={q.multi ? 'group' : 'radiogroup'}>
          {q.multi && <p className="text-xs muted">אפשר לבחור יותר מתשובה אחת.</p>}
          {q.choices.map((c, i) => {
            const on = answer.picks.includes(i);
            return (
              <button
                key={i}
                disabled={locked}
                role={q.multi ? 'checkbox' : 'radio'}
                aria-checked={on}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-start transition-colors ${on ? 'border-accent bg-accent-soft' : 'border-line bg-card hover:bg-card-2'}`}
                onClick={() => setAnswer({ type: 'mcq', picks: q.multi ? (on ? answer.picks.filter((p) => p !== i) : [...answer.picks, i]) : [i] })}
              >
                <span className={`mt-1 inline-block h-3.5 w-3.5 shrink-0 border border-ink-3 ${q.multi ? 'rounded-sm' : 'rounded-full'} ${on ? 'bg-accent' : ''}`} />
                <span className="min-w-0"><RichInline text={c.text} /></span>
              </button>
            );
          })}
        </div>
      );
    }
    case 'predict': {
      if (answer.type !== 'predict') return null;
      return (
        <div className="space-y-2">
          <Listing code={q.program.code} className="text-[0.88rem]" />
          <p className="text-sm">
            ערכי התחלה:{' '}
            <span className="font-mono" dir="ltr">{Object.entries(q.program.inputs).map(([k, v]) => `${k}=${v}`).join(', ') || '—'}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {q.ask.map((k) => (
              <label key={k} className="flex items-center gap-1.5">
                <span className="font-mono" dir="ltr">{k} =</span>
                <input className={`input num-input ${wrong?.includes(k) ? 'border-bad' : ''}`} inputMode="numeric" disabled={locked || answer.noOutput} value={answer.values[k] ?? ''} onChange={(e) => setAnswer({ ...answer, values: { ...answer.values, [k]: e.target.value.replace(/[^\d]/g, '') } })} aria-label={`ערך ${k} בסיום`} />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={answer.noOutput} disabled={locked} onChange={(e) => setAnswer({ ...answer, noOutput: e.target.checked })} className="accent-[var(--accent)]" />
            אין פלט (חיסור ממונה ריק או לולאה שלא נגמרת)
          </label>
        </div>
      );
    }
    case 'complete-code': {
      if (answer.type !== 'complete-code') return null;
      const filled = q.template.replace('___', answer.option >= 0 ? q.options[answer.option] : '______');
      return (
        <div className="space-y-2">
          <Listing code={filled} highlight={filled.split('\n').map((l, i) => (q.template.split('\n')[i]?.includes('___') ? i + 1 : 0)).filter(Boolean)} className="text-[0.88rem]" />
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {q.options.map((o, i) => (
              <button key={i} disabled={locked} className={`btn btn-sm font-mono ${answer.option === i ? 'btn-primary' : ''}`} onClick={() => setAnswer({ type: 'complete-code', option: i })}>{o}</button>
            ))}
          </div>
        </div>
      );
    }
    case 'find-bug': {
      if (answer.type !== 'find-bug') return null;
      const lines = q.listing.split('\n');
      return (
        <div className="listing py-1" dir="ltr">
          <p className="px-3 pb-1 text-xs muted" dir="rtl">לחצו על השורה (או השורות) שבהן הטעות.</p>
          {lines.map((l, i) => {
            const on = answer.lines.includes(i + 1);
            return (
              <button key={i} disabled={locked} className={`ln w-full text-start font-mono ${on ? 'bg-bad-soft' : 'hover:bg-paper-2'}`} onClick={() => setAnswer({ type: 'find-bug', lines: on ? answer.lines.filter((x) => x !== i + 1) : [...answer.lines, i + 1] })}>
                <span>{i + 1}</span>
                <span className="whitespace-pre">{l || ' '}</span>
              </button>
            );
          })}
        </div>
      );
    }
    case 'trace-fill': {
      if (answer.type !== 'trace-fill' || !traceData) return null;
      const blanks = traceBlanks(q, traceData.columns, traceData.counters);
      return (
        <div className="space-y-2">
          <Listing code={q.program.code} className="text-[0.88rem]" />
          <TraceTable
            counters={traceData.counters}
            columns={traceData.columns}
            quiz={showTrace || locked ? undefined : { answers: answer.cells, onChange: (k, v) => setAnswer({ type: 'trace-fill', cells: { ...answer.cells, [k]: v } }), blanks, checked: !!wrong }}
          />
        </div>
      );
    }
    case 'order': {
      if (answer.type !== 'order') return null;
      const move = (from: number, to: number) => {
        const o = [...answer.order];
        const [x] = o.splice(from, 1);
        o.splice(to, 0, x);
        setAnswer({ type: 'order', order: o });
      };
      return (
        <ol className="space-y-1.5">
          {answer.order.map((itemIdx, pos) => (
            <li key={itemIdx} className="flex items-center gap-2 rounded-lg border border-line bg-card px-2 py-1.5">
              <span className="w-6 text-center font-mono text-sm muted">{pos + 1}</span>
              <span className="min-w-0 flex-1"><RichInline text={q.items[itemIdx]} /></span>
              <button className="btn btn-sm btn-ghost" disabled={locked || pos === 0} onClick={() => move(pos, pos - 1)} aria-label="למעלה">▲</button>
              <button className="btn btn-sm btn-ghost" disabled={locked || pos === answer.order.length - 1} onClick={() => move(pos, pos + 1)} aria-label="למטה">▼</button>
            </li>
          ))}
        </ol>
      );
    }
    case 'build': {
      if (answer.type !== 'build') return null;
      return (
        <div className="space-y-1">
          {q.allowed && <p className="text-xs muted">מותר להשתמש רק ב: <span className="font-mono" dir="ltr">{q.allowed.join(', ')}</span></p>}
          <CodeEditor value={answer.code} onChange={(v) => setAnswer({ type: 'build', code: v })} readOnly={locked} minHeight={150} ariaLabel="כתבו כאן את האלגוריתם" />
          <p className="text-xs muted">הבדיקה מריצה את האלגוריתם על כמה קלטים ומשווה לתוצאה הנדרשת.</p>
        </div>
      );
    }
    case 'sim-goal': {
      if (answer.type !== 'sim-goal') return null;
      return (
        <div className="space-y-2">
          <p className="text-sm">המטרה: <span className="font-mono" dir="ltr">{Object.entries(q.target).map(([k, v]) => `${k}=${v}`).join(', ')}</span></p>
          <div className="grid-paper flex flex-wrap justify-center gap-4 rounded-xl border border-line p-3">
            {Object.keys(q.start).map((k) => (
              <div key={k} className="flex flex-col items-center gap-1">
                <CounterJar name={k} value={answer.state[k] ?? 0} />
                <div className="flex gap-1" dir="ltr">
                  <button className="btn btn-sm font-mono" disabled={locked} onClick={() => setAnswer({ type: 'sim-goal', state: { ...answer.state, [k]: (answer.state[k] ?? 0) + 1 } })}>ADD ({k})</button>
                  <button className="btn btn-sm font-mono" disabled={locked || (answer.state[k] ?? 0) === 0} onClick={() => setAnswer({ type: 'sim-goal', state: { ...answer.state, [k]: (answer.state[k] ?? 0) - 1 } })} title={(answer.state[k] ?? 0) === 0 ? 'אי אפשר להוציא כדור ממונה ריק' : undefined}>SUB ({k})</button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-sm btn-ghost" disabled={locked} onClick={() => setAnswer({ type: 'sim-goal', state: { ...q.start } })}>⟲ התחלה מחדש</button>
        </div>
      );
    }
    case 'match': {
      if (answer.type !== 'match') return null;
      const order = shuffled(q.pairs, q.id + 'm');
      return (
        <div className="space-y-1.5">
          {q.pairs.map(([left], i) => (
            <div key={i} className={`grid items-center gap-2 rounded-lg border px-2 py-1.5 sm:grid-cols-2 ${wrong?.includes(String(i)) ? 'border-bad bg-bad-soft' : 'border-line bg-card'}`}>
              <span className="font-medium"><RichInline text={left} /></span>
              <select className="input" disabled={locked} value={answer.mapping[i] ?? ''} onChange={(e) => setAnswer({ type: 'match', mapping: { ...answer.mapping, [i]: Number(e.target.value) } })} aria-label={`התאמה ל: ${left}`}>
                <option value="">בחרו…</option>
                {order.map((j) => (
                  <option key={j} value={j}>{plainText(q.pairs[j][1])}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }
    case 'numeric': {
      if (answer.type !== 'numeric') return null;
      return (
        <label className="flex items-center gap-2">
          <input className="input num-input w-28" inputMode="decimal" disabled={locked} value={answer.value} onChange={(e) => setAnswer({ type: 'numeric', value: e.target.value.replace(/[^\d.\-]/g, '') })} aria-label="התשובה" />
          {q.unit && <span>{q.unit}</span>}
        </label>
      );
    }
    case 'set-answer': {
      if (answer.type !== 'set-answer') return null;
      return (
        <div className="space-y-2">
          <div className="rounded-lg bg-card-2 p-2 font-mono text-sm" dir="ltr">
            {Object.entries(q.sets).map(([k, v]) => <div key={k}>{k} = {`{${v.join(', ')}}`}</div>)}
          </div>
          <label className="flex flex-wrap items-center gap-2">
            <span className="font-mono" dir="ltr">{q.expr} =</span>
            <input className="input w-60 font-mono" dir="ltr" disabled={locked} value={answer.text} placeholder="{1, 2, 3}  או  ∅" onChange={(e) => setAnswer({ type: 'set-answer', text: e.target.value })} aria-label="האיברים של הקבוצה" />
            <button className="btn btn-sm" disabled={locked} onClick={() => setAnswer({ type: 'set-answer', text: '∅' })}>∅</button>
          </label>
          <p className="text-xs muted">כתבו את האיברים מופרדים בפסיקים. קבוצה ריקה: ∅.</p>
        </div>
      );
    }
    case 'arrows-classify': {
      if (answer.type !== 'arrows-classify') return null;
      const names = { function: 'האם זו פונקציה?', injective: 'האם היא חד־חד־ערכית?', surjective: 'האם היא על?' } as const;
      return (
        <div className="space-y-2">
          <ArrowsLab domain={q.domain} codomain={q.codomain} arrows={q.arrows} editable={false} hideVerdict />
          {q.ask.map((k) => (
            <div key={k} className={`flex flex-wrap items-center gap-2 rounded-lg border px-2 py-1 ${wrong?.includes(k) ? 'border-bad bg-bad-soft' : 'border-line'}`}>
              <span className="basis-full sm:basis-auto sm:min-w-[11rem]">{names[k]}</span>
              {[true, false].map((v) => (
                <button key={String(v)} disabled={locked} className={`btn btn-sm ${answer.picks[k] === v ? 'btn-primary' : ''}`} onClick={() => setAnswer({ type: 'arrows-classify', picks: { ...answer.picks, [k]: v } })}>{v ? 'כן' : 'לא'}</button>
              ))}
            </div>
          ))}
        </div>
      );
    }
    case 'logo-state': {
      if (answer.type !== 'logo-state') return null;
      return (
        <div className="space-y-2">
          <Listing code={q.code + (q.run ? `\n\n; Commander:\n${q.run}` : '')} className="text-[0.88rem]" />
          <p className="text-xs muted">הצב מתחיל בנקודה (0,0), פונה למעלה (0°), והעט למטה. זוויות נמדדות עם כיוון השעון.</p>
          <div className="flex flex-wrap gap-3">
            {q.ask.map((k) =>
              k === 'pen' ? (
                <label key={k} className="flex items-center gap-1.5">
                  {LOGO_ASK[k]}:
                  <select className="input w-auto" disabled={locked} value={answer.values[k] ?? ''} onChange={(e) => setAnswer({ type: 'logo-state', values: { ...answer.values, [k]: e.target.value } })}>
                    <option value="">בחרו…</option>
                    <option value="down">למטה (מצייר)</option>
                    <option value="up">למעלה (לא מצייר)</option>
                  </select>
                </label>
              ) : (
                <label key={k} className="flex items-center gap-1.5">
                  {LOGO_ASK[k]}:
                  <input className={`input num-input ${wrong?.includes(k) ? 'border-bad' : ''}`} disabled={locked} value={answer.values[k] ?? ''} onChange={(e) => setAnswer({ type: 'logo-state', values: { ...answer.values, [k]: e.target.value.replace(/[^\d.\-]/g, '') } })} />
                </label>
              ),
            )}
          </div>
        </div>
      );
    }
  }
}
