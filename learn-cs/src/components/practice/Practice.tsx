'use client';
import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { LESSONS, LESSON_BY_ID, QUESTIONS, QUESTION_BY_ID } from '@/content';
import { SKILLS, TRACKS } from '@/content/skills';
import type { Question, TrackId } from '@/content/types';
import { QuestionView } from '@/components/questions/QuestionView';
import { dueReviews, reviewConcept, useNow, useProgress } from '@/progress/store';
import { Rich } from '@/components/ui/Rich';

const TYPES: Record<string, string> = { mcq: 'בחירה מרובה', 'complete-code': 'השלמת קוד', 'find-bug': 'מציאת שגיאה', predict: 'חיזוי פלט', 'trace-fill': 'טבלת מעקב', order: 'סידור שלבים', build: 'בניית אלגוריתם', 'sim-goal': 'הפעלת סימולטור', match: 'התאמה', numeric: 'מספרית', 'set-answer': 'קבוצות', 'arrows-classify': 'דיאגרמת חצים', 'logo-state': 'מצב הצב' };

const glossaryEntry = (term: string) => {
  for (const l of LESSONS) {
    const g = l.glossary.find((x) => x.term === term);
    if (g) return { g, lesson: l };
  }
  return null;
};

function ConceptCard({ term, onDone }: { term: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const e = glossaryEntry(term);
  return (
    <div className="card space-y-3 p-5 text-center">
      <p className="kicker">חזרה על מושג</p>
      <p className="display text-3xl">{term}</p>
      {!open ? (
        <button className="btn btn-primary" onClick={() => setOpen(true)}>הסבר לי — מה זה אומר?</button>
      ) : (
        <>
          <div className="mx-auto max-w-xl text-start">{e ? <Rich text={e.g.simple} /> : 'לא נמצא הסבר.'}</div>
          {e && <Link className="text-sm underline" href={`/learn/${e.lesson.id}`}>מתוך השיעור: {e.lesson.title}</Link>}
          <div className="flex justify-center gap-2">
            <button className="btn" onClick={() => { reviewConcept(term, false); onDone(); }}>עוד לא זכרתי</button>
            <button className="btn btn-primary" onClick={() => { reviewConcept(term, true); onDone(); }}>ידעתי ✓</button>
          </div>
        </>
      )}
    </div>
  );
}

export function Practice() {
  const p = useProgress();
  // ?mode=review from the dashboard link — read on the client only (no hydration mismatch)
  const urlMode = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get('mode'),
    () => null,
  );
  const [chosen, setMode] = useState<'topic' | 'review' | null>(null);
  const mode = chosen ?? (urlMode === 'review' ? 'review' : 'topic');
  const [track, setTrack] = useState<TrackId | ''>('');
  const [skill, setSkill] = useState('');
  const [type, setType] = useState('');
  const [origin, setOrigin] = useState('');
  const [i, setI] = useState(0);

  const list = useMemo(
    () => QUESTIONS.filter((q) => (!track || q.track === track) && (!skill || q.skills.includes(skill)) && (!type || q.type === type) && (!origin || q.origin === origin)),
    [track, skill, type, origin],
  );
  const now = useNow();
  const due = now ? dueReviews(p, now) : [];
  const [reviewIdx, setReviewIdx] = useState(0);
  const item = due[reviewIdx % Math.max(1, due.length)];
  const q: Question | undefined = list[Math.min(i, list.length - 1)];

  return (
    <div className="space-y-5">
      <header>
        <p className="kicker">תרגול</p>
        <h1 className="text-3xl sm:text-4xl">מאגר השאלות</h1>
        <p className="mt-1 max-w-2xl text-ink-2">{QUESTIONS.length} שאלות בעשרה סוגים. שאלות מסומנות &quot;חומר מקור&quot; נלקחו מדפי התרגול של הקורס; &quot;תרגיל חדש&quot; נכתבו לתרגול. כל תשובה נבדקת במנוע מדויק.</p>
      </header>
      <div className="flex gap-1.5" role="tablist">
        <button role="tab" aria-selected={mode === 'topic'} className={`btn ${mode === 'topic' ? 'btn-primary' : ''}`} onClick={() => setMode('topic')}>תרגול לפי נושא</button>
        <button role="tab" aria-selected={mode === 'review'} className={`btn ${mode === 'review' ? 'btn-primary' : ''}`} onClick={() => setMode('review')}>חזרה מרווחת ({due.length})</button>
      </div>
      {mode === 'topic' ? (
        <>
          <div className="flex flex-wrap gap-2">
            <select className="input w-auto" value={track} onChange={(e) => { setTrack(e.target.value as TrackId | ''); setSkill(''); setI(0); }} aria-label="מסלול">
              <option value="">כל המסלולים</option>
              {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            <select className="input w-auto" value={skill} onChange={(e) => { setSkill(e.target.value); setI(0); }} aria-label="נושא">
              <option value="">כל הנושאים</option>
              {Object.entries(SKILLS).filter(([, s]) => !track || s.track === track).map(([k, s]) => <option key={k} value={k}>{s.title}</option>)}
            </select>
            <select className="input w-auto" value={type} onChange={(e) => { setType(e.target.value); setI(0); }} aria-label="סוג שאלה">
              <option value="">כל הסוגים</option>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input w-auto" value={origin} onChange={(e) => { setOrigin(e.target.value); setI(0); }} aria-label="מקור">
              <option value="">מקור + חדש</option>
              <option value="source">רק שאלות מקור</option>
              <option value="new">רק תרגילים חדשים</option>
            </select>
          </div>
          {q ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="muted">שאלה {Math.min(i, list.length - 1) + 1} מתוך {list.length}</span>
                {q.lesson && LESSON_BY_ID[q.lesson] && <Link className="underline" href={`/learn/${q.lesson}`}>מתוך השיעור: {LESSON_BY_ID[q.lesson].title}</Link>}
                <span className="ms-auto flex gap-1">
                  <button className="btn btn-sm" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>→ הקודמת</button>
                  <button className="btn btn-sm btn-primary" onClick={() => setI((x) => Math.min(list.length - 1, x + 1))} disabled={i >= list.length - 1}>הבאה ←</button>
                </span>
              </div>
              <div className="card p-4"><QuestionView key={q.id} q={q} simpler={q.lesson ? LESSON_BY_ID[q.lesson]?.explain.beginner : undefined} /></div>
            </div>
          ) : (
            <p className="muted">אין שאלות שמתאימות לסינון.</p>
          )}
        </>
      ) : due.length === 0 ? (
        <div className="card p-5 text-center">
          <p className="display text-2xl">אין כרגע פריטים לחזרה</p>
          <p className="mt-1 text-sm muted">שאלות שטעיתם בהן ומושגים משיעורים שהשלמתם חוזרים לכאן במרווחים הולכים וגדלים: 10 דקות, יום, 3 ימים, שבוע, שבועיים.</p>
        </div>
      ) : item?.startsWith('c:') ? (
        <ConceptCard key={item} term={item.slice(2)} onDone={() => setReviewIdx((x) => x + 1)} />
      ) : item && QUESTION_BY_ID[item] ? (
        <div className="space-y-2">
          <p className="text-sm muted">{due.length} פריטים לחזרה. אחרי תשובה נכונה הפריט יחזור בעוד זמן רב יותר.</p>
          <div className="card p-4"><QuestionView key={item} q={QUESTION_BY_ID[item]} /></div>
          <button className="btn btn-sm" onClick={() => setReviewIdx((x) => x + 1)}>לפריט הבא ←</button>
        </div>
      ) : (
        <button className="btn" onClick={() => setReviewIdx((x) => x + 1)}>לפריט הבא</button>
      )}
    </div>
  );
}
