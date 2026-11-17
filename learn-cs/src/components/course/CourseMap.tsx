'use client';
import Link from 'next/link';
import type { LessonMeta } from '@/content/lessonIndex';
import { TRACKS } from '@/content/skills';
import { useProgress, weakSkills } from '@/progress/store';
import { SKILLS } from '@/content/skills';

export function CourseMap({ lessons: LESSONS }: { lessons: LessonMeta[] }) {
  const lessonsOf = (t: string) => LESSONS.filter((l) => l.track === t).sort((a, b) => a.order - b.order);
  const p = useProgress();
  const weak = new Set(weakSkills(p).map((s) => SKILLS[s]?.reinforce));
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="kicker">מפת הקורס</p>
        <h1 className="text-3xl sm:text-4xl">מסלול הלימוד</h1>
        <p className="mt-2 text-ink-2">
          {LESSONS.length} שיעורים בשישה מסלולים, לפי סדר החומר המקורי. כל שיעור כולל הקדמה, מילון מושגים, הסבר ויזואלי, הדגמה מפורקת, התנסות,
          שאלה עם משוב, וסיכום. אפשר להתחיל מכל מסלול — אבל מומלץ ללכת לפי הסדר.
        </p>
      </header>
      {TRACKS.map((t, ti) => {
        const ls = lessonsOf(t.id);
        const done = ls.filter((l) => p.lessons[l.id]?.completedAt).length;
        return (
          <section key={t.id} className="space-y-3" aria-labelledby={`track-${t.id}`}>
            <div className="flex flex-wrap items-end gap-3">
              <span className="display text-4xl leading-none" style={{ color: t.color }}>{ti + 1}</span>
              <div>
                <h2 id={`track-${t.id}`} className="text-2xl">{t.title}</h2>
                <p className="text-sm muted">{t.subtitle} · יחידות {t.units.join(', ')}</p>
              </div>
              <span className="ms-auto text-sm muted">{done}/{ls.length} הושלמו</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
              <div className="h-full transition-all" style={{ width: `${ls.length ? (done / ls.length) * 100 : 0}%`, background: t.color }} />
            </div>
            {ls.length === 0 ? (
              <p className="text-sm muted">השיעורים של המסלול הזה עדיין בהכנה.</p>
            ) : (
              <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ls.map((l) => {
                  const st = p.lessons[l.id];
                  return (
                    <li key={l.id}>
                      <Link href={`/learn/${l.id}`} className="card-flat group flex h-full flex-col gap-1 p-3 transition-colors hover:border-ink-3">
                        <div className="flex items-center gap-2 text-xs muted">
                          <span>שיעור {l.order}</span>
                          <span>· {l.minutes} דק׳</span>
                          {st?.completedAt ? <span className="ms-auto text-ok">✓ הושלם</span> : st ? <span className="ms-auto">התחלתם</span> : null}
                          {weak.has(l.id) && <span className="chip border-warn text-warn">חיזוק</span>}
                        </div>
                        <span className="font-semibold group-hover:text-accent-strong">{l.title}</span>
                        <span className="text-sm muted">{l.subtitle}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
