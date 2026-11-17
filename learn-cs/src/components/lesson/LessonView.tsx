'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Lesson, Question, Widget as W } from '@/content/types';
import { TRACK_BY_ID, SKILLS } from '@/content/skills';
import { Rich, RichInline } from '@/components/ui/Rich';
import { OriginTag, PhotoRefs } from '@/components/ui/Origin';
import { Listing } from '@/components/ui/Listing';
import { Widget } from '@/components/widgets/Widget';
import { QuestionView } from '@/components/questions/QuestionView';
import { completeLesson, setSettings, useProgress, visitLesson, weakSkills } from '@/progress/store';
import { explainProgram } from '@/explain/algolem';
import { explainLogoLine } from '@/explain/logo';

const LEVEL_NAME = { 1: 'מתחיל', 2: 'רגיל', 3: 'מתקדם' } as const;

function Section({ letter, title, children, id, origin }: { letter: string; title: string; children: React.ReactNode; id: string; origin?: 'source' | 'explanation' | 'new' }) {
  return (
    <section id={id} className="scroll-mt-28 space-y-3">
      <h2 className="flex items-center gap-2 text-xl">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft font-sans text-base font-bold text-accent">{letter}</span>
        {title}
        {origin && <OriginTag origin={origin} />}
      </h2>
      {children}
    </section>
  );
}

function codeOf(w: W): { code: string; lang: 'algolem' | 'logo' } | null {
  if (w.kind === 'algolem' || w.kind === 'trace' || w.kind === 'meaning-grid') return { code: w.code, lang: 'algolem' };
  if (w.kind === 'logo') return { code: w.code + (w.run ? '\n' + w.run : ''), lang: 'logo' };
  if (w.kind === 'label-table') return { code: w.code, lang: w.lang };
  return null;
}

export function LessonView({ lesson, prev, next, quiz }: { lesson: Lesson; prev?: { id: string; title: string }; next?: { id: string; title: string }; quiz: Question[] }) {
  const progress = useProgress();
  const [level, setLevel] = useState<1 | 2 | 3>(progress.settings.level);
  const [step, setStep] = useState(0);
  const [exampleIdx, setExampleIdx] = useState<number | null>(null);
  const [showLines, setShowLines] = useState(false);
  const [showConfused, setShowConfused] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [hintTick, setHintTick] = useState(0);
  const [pulse, setPulse] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);
  const track = TRACK_BY_ID[lesson.track];
  const done = !!progress.lessons[lesson.id]?.completedAt;

  useEffect(() => {
    visitLesson(lesson.id);
  }, [lesson.id]);

  const weak = weakSkills(progress).filter((s) => lesson.prerequisites.some((p) => SKILLS[s]?.reinforce === p) || (lesson.skills.includes(s) && SKILLS[s]?.reinforce !== lesson.id));
  const changeLevel = (l: 1 | 2 | 3) => {
    setLevel(l);
    setSettings({ level: l });
  };
  const explainText = level === 1 ? lesson.explain.beginner : level === 2 ? lesson.explain.regular : lesson.explain.advanced;
  const ws = lesson.walkthrough.steps[step];
  const lineSource = codeOf(lesson.visual) ?? codeOf(lesson.tryIt.widget);
  const lineRows = useMemo(() => {
    if (!lineSource) return [];
    if (lineSource.lang === 'algolem') return explainProgram(lineSource.code).map((r) => ({ text: r.text, exp: r.explanation }));
    return lineSource.code.split('\n').map((t) => ({ text: t, exp: explainLogoLine(t) }));
  }, [lineSource]);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const showPicture = () => {
    go('visual');
    setPulse(true);
    setTimeout(() => setPulse(false), 1400);
  };

  const tutorButtons: { label: string; onClick: () => void }[] = [
    { label: 'לא הבנתי', onClick: () => { changeLevel(1); setShowConfused(true); go('explain'); } },
    { label: 'תסביר יותר פשוט', onClick: () => { changeLevel(Math.max(1, level - 1) as 1 | 2 | 3); go('explain'); } },
    { label: 'תראה לי ציור', onClick: showPicture },
    ...(lesson.moreExamples?.length ? [{ label: 'תן לי דוגמה אחרת', onClick: () => { setExampleIdx((i) => (i === null ? 0 : (i + 1) % lesson.moreExamples!.length)); setTimeout(() => go('examples'), 50); } }] : []),
    ...(lineRows.length ? [{ label: 'תסביר כל שורת קוד', onClick: () => { setShowLines(true); setTimeout(() => go('lines'), 50); } }] : []),
    { label: 'תן לי רמז', onClick: () => { setHintTick((t) => t + 1); go('check'); } },
    { label: 'תבחן אותי', onClick: () => { setQuizOpen(true); setTimeout(() => go('quiz'), 50); } },
  ];

  return (
    <article className="mx-auto max-w-4xl space-y-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/learn" className="muted hover:underline">מסלול הלימוד</Link>
          <span className="muted">/</span>
          <span className="chip" style={{ color: track.color, borderColor: track.color }}>{track.title}</span>
          <span className="chip">שיעור {lesson.order}</span>
          <span className="chip">{lesson.minutes} דק׳</span>
          <span className="chip">קושי {'●'.repeat(lesson.difficulty)}{'○'.repeat(3 - lesson.difficulty)}</span>
          {done && <span className="chip border-ok text-ok">✓ הושלם</span>}
        </div>
        <h1 className="text-3xl sm:text-4xl">{lesson.title}</h1>
        <p className="text-lg text-ink-2">{lesson.subtitle}</p>
        <div className="flex flex-wrap items-center gap-2">
          <PhotoRefs photos={lesson.sources.photos} />
          {lesson.sources.note && <span className="text-xs muted">{lesson.sources.note}</span>}
          <span className="text-xs muted">· ודאות בפענוח המקור: {lesson.confidence === 'high' ? 'גבוהה' : lesson.confidence === 'medium' ? 'בינונית' : 'נמוכה'}</span>
        </div>
        {weak.length > 0 && (
          <div className="rounded-xl border border-warn/50 bg-warn-soft p-3 text-sm">
            <b>שיעור חיזוק מומלץ:</b> היו כמה טעויות לאחרונה ב{weak.map((s) => `"${SKILLS[s].title}"`).join(', ')}. כדאי לעבור קודם על{' '}
            {weak.map((s, i) => (
              <span key={s}>{i > 0 && ', '}<Link className="font-semibold underline" href={`/learn/${SKILLS[s].reinforce}`}>שיעור החיזוק</Link></span>
            ))}
            .
          </div>
        )}
      </header>

      <div className="sticky top-14 z-20 -mx-4 border-y border-line bg-paper/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="thin-scroll flex items-center gap-1.5 overflow-x-auto md:flex-wrap md:overflow-visible">
          <span className="kicker shrink-0">המורה שלך</span>
          {tutorButtons.map((b) => (
            <button key={b.label} className="btn btn-sm shrink-0" onClick={b.onClick}>{b.label}</button>
          ))}
          <span className="ms-auto flex shrink-0 gap-1 ps-2" role="group" aria-label="רמת הסבר">
            {([1, 2, 3] as const).map((l) => (
              <button key={l} className={`btn btn-sm ${level === l ? 'btn-primary' : ''}`} onClick={() => changeLevel(l)}>{LEVEL_NAME[l]}</button>
            ))}
          </span>
        </div>
      </div>

      <Section letter="א" title="הקדמה" id="intro">
        <div className="card space-y-3 p-4">
          <div><span className="kicker">מה לומדים</span><Rich text={lesson.intro.what} /></div>
          <div><span className="kicker">למה זה חשוב</span><Rich text={lesson.intro.why} /></div>
          <div>
            <span className="kicker">בסוף השיעור תדעו</span>
            <ul className="rich">{lesson.intro.goals.map((g, i) => <li key={i}><RichInline text={g} /></li>)}</ul>
          </div>
        </div>
      </Section>

      <Section letter="ב" title="מילון מושגים" id="glossary">
        <dl className="grid gap-2 sm:grid-cols-2">
          {lesson.glossary.map((g) => (
            <div key={g.term} className="card-flat p-3">
              <dt className="flex items-center gap-2 font-semibold">{g.term}{g.photos && <PhotoRefs photos={g.photos} label={false} />}</dt>
              <dd className="text-[0.95rem] text-ink-2"><Rich text={g.simple} />{level === 3 && g.formal && <div className="mt-1 text-sm"><Rich text={g.formal} /></div>}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section letter="ג" title="הסבר ויזואלי" id="explain">
        <div className="card space-y-2 p-4">
          <div className="flex items-center gap-2"><span className="chip">רמה: {LEVEL_NAME[level]}</span><OriginTag origin="explanation" /></div>
          <Rich text={explainText} className="text-[1.02rem]" />
          {showConfused && (
            <div className="mt-2 rounded-lg border border-info/40 bg-info-soft p-3 text-[0.95rem]">
              <b>בואו ננסה אחרת:</b>
              <Rich text={lesson.explain.beginner} />
              {lesson.walkthrough.steps[0] && <p className="mt-1">ועכשיו צעד אחרי צעד — <button className="underline" onClick={() => go('walk')}>להדגמה המפורקת</button>.</p>}
            </div>
          )}
        </div>
        {lesson.fromSource?.map((f, i) => (
          <blockquote key={i} className="rounded-xl border-s-4 border-[var(--origin-source)] bg-[var(--origin-source-soft)] p-3">
            <div className="mb-1 flex items-center gap-2"><OriginTag origin="source" /><PhotoRefs photos={f.photos} label={false} /></div>
            <Rich text={f.text} />
          </blockquote>
        ))}
        <div id="visual" ref={visualRef} className={`scroll-mt-28 rounded-2xl transition-shadow ${pulse ? 'shadow-[0_0_0_4px_var(--ball)]' : ''}`}>
          <Widget w={lesson.visual} />
        </div>
      </Section>

      {showLines && lineRows.length > 0 && (
        <section id="lines" className="scroll-mt-28 space-y-2">
          <h2 className="text-xl">הסבר לכל שורת קוד</h2>
          <ol className="card divide-y divide-line">
            {lineRows.map((r, i) => (
              <li key={i} className="grid grid-cols-1 gap-1 p-2 sm:grid-cols-[minmax(10rem,auto)_1fr] sm:gap-3">
                <code className="whitespace-pre text-[0.85rem]" dir="ltr">{r.text || ' '}</code>
                <span className="text-sm">{r.text.trim() ? r.exp : ''}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <Section letter="ד" title="הדגמה מפורקת" id="walk" origin={lesson.walkthrough.origin}>
        <div className="card space-y-3 p-4">
          <p className="font-medium"><RichInline text={lesson.walkthrough.title} /></p>
          <div className="flex items-center gap-2 text-sm">
            <span className="muted">שלב {step + 1} מתוך {lesson.walkthrough.steps.length}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2">
              <div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / lesson.walkthrough.steps.length) * 100}%` }} />
            </div>
          </div>
          {ws && (
            <div className="grid gap-3 md:grid-cols-2">
              {ws.code && <Listing code={ws.code} highlight={ws.highlight} className="text-[0.9rem]" />}
              <div className="space-y-2">
                <Rich text={ws.text} className="text-[1.02rem]" />
                {ws.state && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(ws.state).map(([k, v]) => (
                      <span key={k} className="chip font-mono text-[0.9rem]" dir="ltr">{k} = {v}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>→ הקודם</button>
            <button className="btn btn-primary" onClick={() => setStep((s) => Math.min(lesson.walkthrough.steps.length - 1, s + 1))} disabled={step === lesson.walkthrough.steps.length - 1}>הבא ←</button>
          </div>
        </div>
      </Section>

      <Section letter="ה" title="התנסות" id="try">
        <div className="rounded-xl border border-accent/30 bg-accent-soft p-3"><Rich text={lesson.tryIt.task} /></div>
        <Widget w={lesson.tryIt.widget} />
      </Section>

      {exampleIdx !== null && lesson.moreExamples?.[exampleIdx] && (
        <section id="examples" className="scroll-mt-28 space-y-2">
          <h2 className="flex items-center gap-2 text-xl">דוגמה נוספת <OriginTag origin={lesson.moreExamples[exampleIdx].origin} /></h2>
          <p className="font-medium"><RichInline text={lesson.moreExamples[exampleIdx].title} /></p>
          {lesson.moreExamples[exampleIdx].text && <Rich text={lesson.moreExamples[exampleIdx].text!} />}
          {lesson.moreExamples[exampleIdx].widget && <Widget key={exampleIdx} w={lesson.moreExamples[exampleIdx].widget!} />}
          {lesson.moreExamples.length > 1 && <button className="btn btn-sm" onClick={() => setExampleIdx((i) => ((i ?? 0) + 1) % lesson.moreExamples!.length)}>עוד דוגמה</button>}
        </section>
      )}

      <Section letter="ו" title="שאלה לבדיקת ההבנה" id="check">
        <div className="card p-4">
          <QuestionView q={lesson.check} simpler={lesson.explain.beginner} hintTick={hintTick} />
        </div>
      </Section>

      {quizOpen && (
        <section id="quiz" className="scroll-mt-28 space-y-3">
          <h2 className="text-xl">תבחן אותי</h2>
          {quiz.length === 0 && <p className="muted">אין עדיין שאלות נוספות לשיעור הזה.</p>}
          {quiz.map((q) => (
            <div key={q.id} className="card p-4"><QuestionView q={q} simpler={lesson.explain.beginner} /></div>
          ))}
        </section>
      )}

      <Section letter="ח" title="סיכום והמשך" id="summary">
        <div className="card space-y-3 p-4">
          <div>
            <span className="kicker">מה למדנו</span>
            <ul className="rich">{lesson.summary.learned.map((g, i) => <li key={i}><RichInline text={g} /></li>)}</ul>
          </div>
          <p className="text-sm muted">מושגים שכבר למדתם בקורס: {Object.keys(progress.concepts).length}. שיעורים שהושלמו: {Object.values(progress.lessons).filter((l) => l.completedAt).length}.</p>
          <div><span className="kicker">מה הלאה</span><Rich text={lesson.summary.next} /></div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {!done ? (
              <button className="btn btn-primary" onClick={() => completeLesson(lesson.id, lesson.skills, lesson.glossary.map((g) => g.term))}>✓ סיימתי את השיעור</button>
            ) : (
              <span className="chip border-ok text-ok">השיעור הושלם</span>
            )}
            {next && <Link href={`/learn/${next.id}`} className="btn">לשיעור הבא: {next.title} ←</Link>}
            {prev && <Link href={`/learn/${prev.id}`} className="btn btn-ghost">→ {prev.title}</Link>}
          </div>
        </div>
      </Section>
    </article>
  );
}
