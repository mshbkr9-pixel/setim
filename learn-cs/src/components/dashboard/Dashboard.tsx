'use client';
import Link from 'next/link';
import { useState } from 'react';
import { LESSONS, LESSON_BY_ID, lessonsOf } from '@/content';
import { SKILLS, TRACKS } from '@/content/skills';
import { dueReviews, questionStats, useNow, useProgress, weakSkills, type ProgressData } from '@/progress/store';
import { Logo } from '@/components/ui/Nav';

function days(n: number, now: number) {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(now - i * 86_400_000).toISOString().slice(0, 10));
  return out;
}

/** Answered vs. correct per day — grouped thin bars, one y-axis, hover tooltip, table view. */
function ActivityChart({ p, now }: { p: ProgressData; now: number }) {
  const ds = days(14, now);
  const data = ds.map((d) => ({ d, answered: p.daily[d]?.answered ?? 0, correct: p.daily[d]?.correct ?? 0, lessons: p.daily[d]?.lessons ?? 0 }));
  const max = Math.max(4, ...data.map((x) => x.answered));
  const [hover, setHover] = useState<number | null>(null);
  const W = 560, H = 170, pad = { l: 26, r: 6, t: 10, b: 22 };
  const bw = (W - pad.l - pad.r) / data.length;
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, Math.round(max / 2), max];
  const bar = (x: number, v: number, color: string) => {
    const h = H - pad.b - y(v);
    if (h <= 0) return null;
    const r = Math.min(4, h, 5);
    return <path d={`M${x} ${H - pad.b} V${y(v) + r} Q${x} ${y(v)} ${x + r} ${y(v)} H${x + 9 - r} Q${x + 9} ${y(v)} ${x + 9} ${y(v) + r} V${H - pad.b} Z`} fill={color} />;
  };
  const h = hover !== null ? data[hover] : null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-sm text-ink-2">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--series-1)]" />תשובות</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--series-2)]" />נכונות</span>
        <span className="ms-auto text-xs muted">14 הימים האחרונים</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" direction="ltr" role="img" aria-label="פעילות ב־14 הימים האחרונים">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--gridline)" strokeWidth={1} />
              <text x={pad.l - 6} y={y(t)} textAnchor="end" dominantBaseline="central" fontSize={10} fill="var(--ink-3)">{t}</text>
            </g>
          ))}
          {data.map((x, i) => {
            const x0 = pad.l + i * bw + bw / 2 - 10;
            return (
              <g key={x.d} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} tabIndex={0}>
                <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill={hover === i ? 'var(--paper-2)' : 'transparent'} />
                {bar(x0, x.answered, 'var(--series-1)')}
                {bar(x0 + 11, x.correct, 'var(--series-2)')}
                {i % 2 === 1 && <text x={pad.l + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize={9.5} fill="var(--ink-3)">{x.d.slice(8)}/{x.d.slice(5, 7)}</text>}
              </g>
            );
          })}
        </svg>
        {h && (
          <div className="pointer-events-none absolute top-0 rounded-lg border border-line bg-card px-2 py-1 text-xs shadow" style={{ left: `${((pad.l + (hover! + 0.5) * bw) / W) * 100}%`, transform: 'translateX(-50%)' }}>
            <div className="font-semibold" dir="ltr">{h.d.slice(8)}/{h.d.slice(5, 7)}</div>
            <div>תשובות: {h.answered} · נכונות: {h.correct}</div>
            <div className="muted">שיעורים שהושלמו: {h.lessons}</div>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>פעילות יומית</caption>
        <thead><tr><th>תאריך</th><th>תשובות</th><th>נכונות</th><th>שיעורים</th></tr></thead>
        <tbody>{data.map((x) => <tr key={x.d}><td>{x.d}</td><td>{x.answered}</td><td>{x.correct}</td><td>{x.lessons}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export function Dashboard() {
  const p = useProgress();
  const now = useNow();
  const stats = questionStats(p);
  const weak = weakSkills(p);
  const due = now ? dueReviews(p, now) : [];
  const completed = Object.values(p.lessons).filter((l) => l.completedAt).length;
  const last = p.lastLesson ? LESSON_BY_ID[p.lastLesson] : undefined;
  const firstOpen = LESSONS.find((l) => !p.lessons[l.id]?.completedAt) ?? LESSONS[0];
  const continueTo = last && !p.lessons[last.id]?.completedAt ? last : firstOpen;
  const concepts = Object.entries(p.concepts).sort((a, b) => b[1] - a[1]);
  const fresh = completed === 0 && stats.answered === 0;

  return (
    <div className="space-y-8">
      <section className="card relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -bottom-6 -start-6 opacity-[0.07]" aria-hidden><svg width="220" height="220" viewBox="0 0 32 32"><circle cx="13" cy="24" r="3" fill="var(--ink)" /><circle cx="19.2" cy="24" r="3" fill="var(--ink)" /><circle cx="16.1" cy="18.8" r="3" fill="var(--ink)" /></svg></div>
        <div className="flex items-center gap-2"><Logo /><span className="kicker">מחברת לימוד חיה</span></div>
        <h1 className="mt-2 text-3xl sm:text-4xl">{fresh ? 'ברוכים הבאים למעבדה' : 'ממשיכים מאיפה שעצרנו'}</h1>
        <p className="mt-2 max-w-2xl text-ink-2">
          כל חומר הקורס — LOGO, אלגולם, טבלאות מעקב, שגיאות, קבוצות ופונקציות — כשיעורים קצרים שבהם מפעילים קוד, מזיזים כדורים, גוררים חצים ועונים על שאלות.
          כל תוצאה מחושבת במנוע מדויק, וכל נושא מקושר לצילום המקור.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {continueTo && (
            <Link href={`/learn/${continueTo.id}`} className="btn btn-primary">
              {fresh ? 'להתחיל ללמוד' : 'המשך ללמוד'}: {continueTo.title} ←
            </Link>
          )}
          <Link href="/lab/algolem" className="btn">לסימולטור אלגולם</Link>
          <Link href="/exam" className="btn btn-ghost">הכנה למבחן</Link>
        </div>
        {last && <p className="mt-3 text-sm muted">השיעור האחרון: <Link className="underline" href={`/learn/${last.id}`}>{last.title}</Link></p>}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="סיכום התקדמות">
        {[
          { k: 'שיעורים שהושלמו', v: `${completed}/${LESSONS.length}` },
          { k: 'תשובות נכונות', v: `${stats.correct}`, sub: stats.answered ? `מתוך ${stats.answered} ניסיונות` : 'עוד לא נענו שאלות' },
          { k: 'מושגים שנלמדו', v: `${concepts.length}` },
          { k: 'מבחנים שבוצעו', v: `${p.exams.length}`, sub: p.exams.length ? `אחרון: ${Math.round((p.exams[p.exams.length - 1].score / p.exams[p.exams.length - 1].total) * 100)}%` : undefined },
        ].map((s) => (
          <div key={s.k} className="card-flat p-4">
            <div className="text-sm muted">{s.k}</div>
            <div className="display text-3xl">{s.v}</div>
            {s.sub && <div className="text-xs muted">{s.sub}</div>}
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">ששת המסלולים</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((t, i) => {
            const ls = lessonsOf(t.id);
            const done = ls.filter((l) => p.lessons[l.id]?.completedAt).length;
            const pct = ls.length ? Math.round((done / ls.length) * 100) : 0;
            const nextL = ls.find((l) => !p.lessons[l.id]?.completedAt) ?? ls[0];
            return (
              <Link key={t.id} href={nextL ? `/learn/${nextL.id}` : '/learn'} className="card-flat group block p-4 transition-colors hover:border-ink-3">
                <div className="flex items-center gap-2">
                  <span className="display text-2xl" style={{ color: t.color }} aria-hidden>{i + 1}</span>
                  <span className="font-semibold group-hover:text-accent">{t.title}</span>
                  <span className="ms-auto text-sm text-ink-2">{pct}%</span>
                </div>
                <p className="mt-0.5 text-sm muted">{t.subtitle}</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`התקדמות במסלול ${t.title}`}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.color }} />
                </div>
                <p className="mt-1 text-xs muted">{done}/{ls.length} שיעורים{nextL ? ` · הבא: ${nextL.title}` : ''}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-2 p-4">
          <h2 className="text-xl">התקדמות לאורך זמן</h2>
          {now ? <ActivityChart p={p} now={now} /> : <div className="h-40" />}
        </section>
        <section className="card space-y-3 p-4">
          <h2 className="text-xl">מה כדאי לעשות עכשיו</h2>
          {weak.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-sm">נושאים שדורשים חיזוק (שלוש טעויות או יותר לאחרונה):</p>
              {weak.map((s) => (
                <Link key={s} href={`/learn/${SKILLS[s].reinforce}`} className="flex items-center gap-2 rounded-lg border border-warn/50 bg-warn-soft px-3 py-2 text-sm">
                  <b>{SKILLS[s].title}</b><span className="ms-auto">לשיעור החיזוק ←</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm muted">אין כרגע נושא שמסומן לחיזוק. כשיהיו שלוש טעויות באותו נושא — הוא יופיע כאן עם שיעור חיזוק.</p>
          )}
          <Link href="/practice?mode=review" className="flex items-center gap-2 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm">
            <b>חזרה מרווחת</b><span>{due.length ? `${due.length} פריטים מחכים לחזרה` : 'אין פריטים לחזרה כרגע'}</span><span className="ms-auto">←</span>
          </Link>
          <Link href="/practice" className="flex items-center gap-2 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm"><b>תרגול לפי נושא</b><span className="ms-auto">←</span></Link>
          <Link href="/exam" className="flex items-center gap-2 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm"><b>מבחן מסכם עם ציון וניתוח טעויות</b><span className="ms-auto">←</span></Link>
        </section>
      </div>

      <section className="card space-y-2 p-4">
        <h2 className="text-xl">מושגים שכבר נלמדו</h2>
        {concepts.length ? (
          <div className="flex flex-wrap gap-1.5">
            {concepts.slice(0, 40).map(([term]) => <Link key={term} href={`/glossary#${encodeURIComponent(term)}`} className="chip hover:border-ink-3">{term}</Link>)}
          </div>
        ) : (
          <p className="text-sm muted">כשתסיימו שיעור, המושגים שלו יופיעו כאן ויכנסו לחזרה המרווחת.</p>
        )}
      </section>
    </div>
  );
}
