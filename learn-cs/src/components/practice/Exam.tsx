'use client';
import Link from 'next/link';
import { useState } from 'react';
import { QUESTIONS } from '@/content';
import { MISCONCEPTIONS, SKILLS, TRACKS, TRACK_BY_ID } from '@/content/skills';
import type { Question, TrackId } from '@/content/types';
import { QuestionView } from '@/components/questions/QuestionView';
import { recordExam, useProgress } from '@/progress/store';
import type { GradeResult } from '@/questions/grade';

export function Exam() {
  const p = useProgress();
  const [tracks, setTracks] = useState<TrackId[]>(TRACKS.map((t) => t.id));
  const [size, setSize] = useState(12);
  const [paper, setPaper] = useState<Question[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Record<string, GradeResult>>({});
  const [finished, setFinished] = useState(false);

  const start = () => {
    const pool = QUESTIONS.filter((q) => tracks.includes(q.track));
    // balanced draw: round-robin over tracks, shuffled within each
    const byTrack = tracks.map((t) => pool.filter((q) => q.track === t).sort(() => Math.random() - 0.5));
    const out: Question[] = [];
    for (let k = 0; out.length < size && byTrack.some((b) => b.length); k++) {
      const b = byTrack[k % byTrack.length];
      if (b.length) out.push(b.shift()!);
    }
    setPaper(out);
    setIdx(0);
    setResults({});
    setFinished(false);
  };

  const finish = () => {
    if (!paper) return;
    const byTrack: Partial<Record<TrackId, { ok: number; total: number }>> = {};
    const bySkill: Record<string, { ok: number; total: number }> = {};
    let score = 0;
    for (const q of paper) {
      const ok = !!results[q.id]?.correct;
      if (ok) score++;
      const t = (byTrack[q.track] ??= { ok: 0, total: 0 });
      t.total++;
      if (ok) t.ok++;
      for (const s of q.skills) {
        const r = (bySkill[s] ??= { ok: 0, total: 0 });
        r.total++;
        if (ok) r.ok++;
      }
    }
    recordExam({ score, total: paper.length, tracks, byTrack, bySkill });
    setFinished(true);
  };

  if (!paper) {
    return (
      <div className="space-y-5">
        <header>
          <p className="kicker">מצב הכנה למבחן</p>
          <h1 className="text-3xl sm:text-4xl">מבחן עם ציון וניתוח טעויות</h1>
          <p className="mt-1 max-w-2xl text-ink-2">בחרו נושאים ומספר שאלות. בזמן המבחן אין רמזים — רק בסוף תקבלו ציון, ניתוח של הטעויות לפי נושא, והמלצות ממוקדות.</p>
        </header>
        <div className="card space-y-4 p-5">
          <div>
            <p className="mb-2 font-semibold">נושאים</p>
            <div className="flex flex-wrap gap-2">
              {TRACKS.map((t) => {
                const on = tracks.includes(t.id);
                const n = QUESTIONS.filter((q) => q.track === t.id).length;
                return (
                  <button key={t.id} className={`btn btn-sm ${on ? 'btn-primary' : ''}`} onClick={() => setTracks((s) => (on ? s.filter((x) => x !== t.id) : [...s, t.id]))} aria-pressed={on}>
                    {t.title} ({n})
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">מספר שאלות:</span>
            {[8, 12, 20].map((n) => <button key={n} className={`btn btn-sm ${size === n ? 'btn-primary' : ''}`} onClick={() => setSize(n)}>{n}</button>)}
          </div>
          <button className="btn btn-primary" onClick={start} disabled={tracks.length === 0}>התחלת המבחן</button>
        </div>
        {p.exams.length > 0 && (
          <div className="card p-4">
            <h2 className="mb-2 text-xl">מבחנים קודמים</h2>
            <ul className="space-y-1 text-sm">
              {[...p.exams].reverse().slice(0, 8).map((e) => (
                <li key={e.t} className="flex gap-3"><span className="font-mono" dir="ltr">{new Date(e.t).toLocaleDateString('he-IL')}</span><span>{e.score}/{e.total} ({Math.round((e.score / e.total) * 100)}%)</span><span className="muted">{e.tracks.map((t) => TRACK_BY_ID[t]?.title).join(', ')}</span></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (finished) {
    const score = paper.filter((q) => results[q.id]?.correct).length;
    const pct = Math.round((score / paper.length) * 100);
    const skillRows = Object.entries(
      paper.reduce<Record<string, { ok: number; total: number }>>((acc, q) => {
        for (const s of q.skills) {
          acc[s] ??= { ok: 0, total: 0 };
          acc[s].total++;
          if (results[q.id]?.correct) acc[s].ok++;
        }
        return acc;
      }, {}),
    ).sort((a, b) => a[1].ok / a[1].total - b[1].ok / b[1].total);
    const mis = paper.map((q) => results[q.id]?.misconception).filter(Boolean) as string[];
    const misCount = Object.entries(mis.reduce<Record<string, number>>((a, m) => ({ ...a, [m]: (a[m] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
    const weakSkills = skillRows.filter(([, r]) => r.ok < r.total);
    return (
      <div className="space-y-5">
        <header className="card p-5 text-center">
          <p className="kicker">תוצאת המבחן</p>
          <p className="display text-5xl">{pct}%</p>
          <p className="text-ink-2">{score} נכונות מתוך {paper.length}</p>
        </header>
        <section className="card p-4">
          <h2 className="mb-2 text-xl">ניתוח לפי נושא</h2>
          <table className="ttable min-w-full">
            <thead><tr><th>נושא</th><th>נכון</th><th>המלצה</th></tr></thead>
            <tbody>
              {skillRows.map(([s, r]) => (
                <tr key={s}>
                  <td className="text-start">{SKILLS[s]?.title ?? s}</td>
                  <td className="num">{r.ok}/{r.total}</td>
                  <td className="text-start">{r.ok < r.total ? <Link className="underline" href={`/learn/${SKILLS[s]?.reinforce}`}>לחזור על השיעור</Link> : <span className="text-ok">שולט ✓</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {misCount.length > 0 && (
          <section className="card space-y-1 p-4">
            <h2 className="text-xl">טעויות חוזרות שזוהו</h2>
            {misCount.map(([m, n]) => (
              <p key={m} className="text-[0.95rem]"><b>{n}×</b> {MISCONCEPTIONS[m]?.text}</p>
            ))}
          </section>
        )}
        <section className="card space-y-1 p-4">
          <h2 className="text-xl">המלצות ממוקדות</h2>
          {weakSkills.length === 0 ? <p>מצוין! כל הנושאים שנבחנו נענו נכון. נסו מבחן ארוך יותר או נושאים נוספים.</p> : (
            <ul className="rich">
              {weakSkills.slice(0, 4).map(([s]) => <li key={s}>חזרו על <Link className="underline" href={`/learn/${SKILLS[s]?.reinforce}`}>{SKILLS[s]?.title}</Link> ואז תרגלו את הנושא ב<Link className="underline" href="/practice">מאגר השאלות</Link>.</li>)}
              <li>השאלות שטעיתם בהן נוספו לחזרה המרווחת.</li>
            </ul>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="text-xl">השאלות והפתרונות</h2>
          {paper.map((q, k) => (
            <details key={q.id} className="card p-3">
              <summary className="cursor-pointer">{results[q.id]?.correct ? '✓' : '✗'} שאלה {k + 1}</summary>
              <div className="mt-2"><QuestionView q={q} /></div>
            </details>
          ))}
        </section>
        <button className="btn btn-primary" onClick={() => setPaper(null)}>מבחן חדש</button>
      </div>
    );
  }

  const q = paper[idx];
  const answered = Object.keys(results).length;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-semibold">שאלה {idx + 1} מתוך {paper.length}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2"><div className="h-full bg-accent" style={{ width: `${(answered / paper.length) * 100}%` }} /></div>
        <span className="text-sm muted">{answered} נענו</span>
      </div>
      <div className="card p-4">
        <QuestionView key={q.id} q={q} exam onAnswer={(_, r) => setResults((s) => ({ ...s, [q.id]: r }))} />
      </div>
      <div className="flex gap-2">
        <button className="btn" onClick={() => setIdx((x) => Math.max(0, x - 1))} disabled={idx === 0}>→ הקודמת</button>
        {idx < paper.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setIdx((x) => x + 1)}>הבאה ←</button>
        ) : (
          <button className="btn btn-primary" onClick={finish}>סיום והגשה</button>
        )}
        <button className="btn btn-ghost ms-auto" onClick={finish}>סיום מוקדם</button>
      </div>
    </div>
  );
}
