'use client';
import { useState } from 'react';
import type { MachineState, Program, StepEvent } from '@/engines/algolem';
import { step } from '@/engines/algolem';
import { cellLabel, describeEvent } from '@/explain/algolem';
import { recordAttempt } from '@/progress/store';

type Q =
  | { kind: 'value'; counter: string; label: string; before: number; event: StepEvent; expected: number | 'impossible'; line: string }
  | { kind: 'enter'; counter: string; label: string; value: number; event: StepEvent; expected: boolean };

/** Builds the tutor's question for the NEXT instruction (preview on a copy — nothing is committed). */
export function nextQuestion(program: Program, state: MachineState): Q | null {
  if (state.status !== 'running') return null;
  const preview = step(program, state);
  const e = preview.event;
  if (e.kind === 'add' || e.kind === 'sub') {
    return { kind: 'value', counter: e.cell, label: cellLabel(state, e.cell), before: e.before, event: e, expected: e.after, line: `${e.kind.toUpperCase()} (${e.written})` };
  }
  if (e.kind === 'error' && e.error.code === 'sub-empty' && e.error.cell) {
    return { kind: 'value', counter: e.error.cell, label: cellLabel(state, e.error.cell), before: 0, event: e, expected: 'impossible', line: `SUB (${e.error.written})` };
  }
  if (e.kind === 'while-enter' || e.kind === 'while-exit') {
    return { kind: 'enter', counter: e.cell, label: cellLabel(state, e.cell), value: e.value, event: e, expected: e.kind === 'while-enter' };
  }
  return null;
}

export interface StepTutorProps {
  program: Program;
  state: MachineState;
  /** Commit the next step (called after a correct answer or "show me"). */
  onCommit: () => void;
  onFlash: (cell: string | null) => void;
}

/** "מה לדעתך יקרה למונה A אחרי הפקודה הבאה?" — deterministic tutor on top of the engine. */
export function StepTutor({ program, state, onCommit, onFlash }: StepTutorProps) {
  const q = nextQuestion(program, state);
  const [value, setValue] = useState('');
  const [tries, setTries] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const [lastKey, setLastKey] = useState('');
  const key = `${state.steps}`;
  if (key !== lastKey) {
    setLastKey(key);
    setValue('');
    setTries(0);
    setFeedback(null);
  }
  if (!q) {
    return (
      <div className="rounded-xl border border-info/40 bg-info-soft p-3 text-sm">
        {state.status === 'running' ? 'בצעד הבא אין שאלה (מעבר ללולאה או לפרוצדורה). לחצו "צעד" כדי להמשיך.' : 'הריצה הסתיימה.'}
      </div>
    );
  }

  const skill = q.kind === 'enter' ? 'while-loop' : q.expected === 'impossible' ? 'sub-empty' : 'add-sub';
  const answer = (given: number | 'impossible' | boolean) => {
    const ok = given === q.expected;
    recordAttempt({ q: `tutor:${skill}`, ok, skills: [skill], hints: tries, misconception: !ok && q.kind === 'value' && q.expected === 'impossible' ? 'sub-negative' : undefined });
    if (ok) {
      setFeedback({ ok: true, lines: ['נכון! ' + describeEvent(q.event, state, 1)] });
      onFlash(null);
      setTimeout(onCommit, 650);
      return;
    }
    setTries((t) => t + 1);
    onFlash(q.counter);
    const lines: string[] = [];
    if (q.kind === 'value') {
      const isAdd = q.event.kind === 'add';
      if (q.expected === 'impossible') {
        lines.push(`המונה ${q.label} ריק עכשיו (0 כדורים). אי אפשר להוציא ממנו כדור — מונה לעולם אינו שלילי.`);
        lines.push('רמז: כשמנסים SUB על מונה ריק, הריצה נעצרת. בחרו "אי אפשר".');
      } else if (given === 'impossible') {
        lines.push(`יש במונה ${q.label} ${q.before} כדורים, אז הפעולה חוקית.`);
      } else if (typeof given === 'number' && given === q.before) {
        lines.push(`כתבת את הערך שלפני הפקודה. הפקודה ${q.line} משנה את המונה בכדור אחד.`);
      } else if (typeof given === 'number' && given === (isAdd ? q.before - 1 : q.before + 1)) {
        lines.push(isAdd ? 'ADD מוסיפה כדור — היא לא מוציאה.' : 'SUB מוציאה כדור — היא לא מוסיפה.');
      } else {
        lines.push(`הסתכלו בכלי ${q.label}: יש בו עכשיו ${q.before} כדורים.`);
      }
      if (q.expected !== 'impossible') lines.push(`רמז: ${isAdd ? 'מוסיפים' : 'מוציאים'} כדור אחד בדיוק. כמה יהיו אחרי זה?`);
    } else {
      lines.push(q.value > 0 ? `במונה ${q.label} יש ${q.value} כדורים — הוא לא ריק.` : `המונה ${q.label} ריק (0 כדורים).`);
      lines.push('רמז: WHILE נכנסת לגוף הלולאה רק אם המונה שבסוגריים אינו ריק.');
    }
    setFeedback({ ok: false, lines });
  };

  return (
    <div className="space-y-2 rounded-xl border border-accent/40 bg-accent-soft p-3" aria-live="polite">
      <p className="kicker">המורה שואל</p>
      {q.kind === 'value' ? (
        <>
          <p className="text-[0.98rem]">
            הפקודה הבאה: <code className="inline-code">{q.line}</code>. מה לדעתך יהיה ערך המונה <b className="font-mono">{q.label}</b> אחריה?
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input className="input num-input" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ''))} aria-label="הערך שאתם צופים" onKeyDown={(e) => e.key === 'Enter' && value !== '' && answer(Number(value))} />
            <button className="btn btn-primary btn-sm" disabled={value === ''} onClick={() => answer(Number(value))}>בדיקה</button>
            <button className="btn btn-sm" onClick={() => answer('impossible')}>אי אפשר — הפקודה לא חוקית</button>
          </div>
        </>
      ) : (
        <>
          <p className="text-[0.98rem]">
            הפקודה הבאה: <code className="inline-code">WHILE ({q.label.split(' ')[0]})</code>. האם ניכנס לגוף הלולאה?
          </p>
          <div className="flex gap-2">
            <button className="btn btn-sm btn-primary" onClick={() => answer(true)}>כן, נכנסים</button>
            <button className="btn btn-sm" onClick={() => answer(false)}>לא, מדלגים אחרי ENDW</button>
          </div>
        </>
      )}
      {feedback && (
        <div className={`rounded-lg p-2 text-sm ${feedback.ok ? 'bg-ok-soft text-ok' : 'bg-card'}`}>
          {feedback.lines.map((l, i) => <p key={i}>{l}</p>)}
          {!feedback.ok && <p className="mt-1 muted">נסו שוב.</p>}
        </div>
      )}
      {tries >= 2 && !feedback?.ok && (
        <button className="btn btn-sm btn-ghost" onClick={() => { onFlash(null); onCommit(); }}>הראה לי מה קורה</button>
      )}
    </div>
  );
}
