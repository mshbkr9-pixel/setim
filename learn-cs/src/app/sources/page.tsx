import Link from 'next/link';
import type { Metadata } from 'next';
import { DOCS, PHOTOS } from '@/content/sources';
import { LESSONS, QUESTIONS } from '@/content';
import { PhotoThumb } from '@/components/sources/PhotoThumb';

export const metadata: Metadata = { title: 'מקורות ודוח כיסוי' };

const DIFFS: { topic: string; guide: string; photo: string; photos: number[] }[] = [
  { topic: 'שם הפרוצדורה בדוגמה 5 של פרק השגיאות', guide: 'HEI', photo: 'HE', photos: [18] },
  { topic: 'גוף הפרוצדורה MOVE (A,B)', guide: 'איפוס B ו־C בלולאות WHILE מפורשות', photo: 'קריאות ZERO (B) ו־ZERO (C)', photos: [26, 27] },
  { topic: 'סימון הפרש קבוצות', guide: 'A \\ B', photo: 'A - B (מקף)', photos: [38, 39] },
  { topic: 'כותרת אמצעי הניתוח השני', guide: '"טבלת מעקב מודולרית"', photo: '"תרשים (של פירוק הדרגתי)"', photos: [11] },
  { topic: 'התנאי השני ב־DALET', guide: 'A > 0', photo: 'A ≠ 0', photos: [19] },
  { topic: 'משימת "תהליכים דטרמיניסטיים" (ב.0)', guide: 'לא מופיעה', photo: 'משחק מלכת הלבבות עם S (A,B,C)', photos: [16, 17] },
  { topic: 'מקרה 4 בדיון על מחסניות', guide: 'לא מתואר', photo: ':SIZE מחוק בהגדרת TOOTH ובקריאה; מסגרת TOOTH ריקה ("?")', photos: [73] },
  { topic: 'כותרת עמוד 6 בקריאה על פונקציות', guide: '—', photo: '"תחום וטווח למול כלל ההתאמה"', photos: [57, 58] },
];

export default function Page() {
  const usedIn = (n: number) => {
    const ls = LESSONS.filter((l) => [...l.sources.photos, ...(l.fromSource ?? []).flatMap((f) => f.photos), ...l.glossary.flatMap((g) => g.photos ?? [])].includes(n));
    const qs = QUESTIONS.filter((q) => q.sources?.photos.includes(n)).length;
    return { ls, qs };
  };
  const covered = PHOTOS.filter((p) => usedIn(p.photo).ls.length > 0).length;
  const sourceQuestions = QUESTIONS.filter((q) => q.origin === 'source').length;
  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-2">
        <p className="kicker">מקורות</p>
        <h1 className="text-3xl sm:text-4xl">מקורות ודוח כיסוי</h1>
        <p className="text-ink-2">
          קובץ המקור כולל 98 עמודים: עמודים 1–22 הם מחברת לימוד מעובדת (סיכום משני), ועמודים 23–98 הם 76 צילומים של חומר הקורס המקורי. כל אחד מ־76 הצילומים
          חולץ כקובץ נפרד, הוגדל ונקרא אחד־אחד; התמלול המלא של כל צילום שמור בפרויקט (<code className="inline-code">content/source/analysis</code>), כולל רשימת הפרטים שלא נקראו בוודאות.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          { k: 'צילומי מקור שנבדקו', v: `${PHOTOS.length}/76` },
          { k: 'ודאות פענוח גבוהה', v: `${PHOTOS.filter((p) => p.confidence === 'high').length}/76` },
          { k: 'צילומים שמקושרים לשיעור', v: `${covered}/76` },
          { k: 'שאלות מקור במאגר', v: `${sourceQuestions}` },
        ].map((s) => (
          <div key={s.k} className="card-flat p-4"><div className="text-sm muted">{s.k}</div><div className="display text-3xl">{s.v}</div></div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl">הבדלים בין המחברת המעובדת לבין צילומי המקור</h2>
        <p className="text-sm text-ink-2">כשהמחברת (עמ׳ 1–22) והצילום אינם מתאימים — הצילום קובע. אלה ההבדלים שנמצאו בבדיקה:</p>
        <div className="thin-scroll overflow-x-auto">
          <table className="ttable min-w-full">
            <thead><tr><th>נושא</th><th>במחברת המעובדת</th><th>בצילום המקור</th><th>צילום</th></tr></thead>
            <tbody>
              {DIFFS.map((d) => (
                <tr key={d.topic}><td className="whitespace-normal text-start">{d.topic}</td><td className="whitespace-normal text-start">{d.guide}</td><td className="whitespace-normal text-start font-semibold">{d.photo}</td><td className="num">{d.photos.join(', ')}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-2xl">החלטות מימוש שאינן מופיעות בחומר</h2>
        <ul className="rich text-[0.95rem]">
          <li><b>מוני עזר בתוך פרוצדורה:</b> החומר אינו קובע אם הם פרטיים או משותפים. ברירת המחדל בסימולטור — פרטיים, כי רק כך HUN (צילום 28) נותנת 100: היא קוראת ל־<code className="inline-code">TEN (B)</code>, ו־TEN עצמה משתמשת במונה עזר בשם B (צילום 29). אפשר להחליף מצב בסימולטור.</li>
          <li><b>שפת LOGO:</b> המשתנים נחפשים במחסנית מלמעלה למטה (כמו ב־MSWLogo שבשקפים) — זה מה שמסביר את מקרה 4 (צילום 73).</li>
          <li><b>&quot;אינסופי&quot;:</b> הסימולטור קובע שריצה אינסופית רק כשיש הוכחה (חזרה של מצב, או לולאה שרק מגדילה מונים שלא נבדקו כריקים). מגבלת צעדים לבדה אינה פסיקה.</li>
        </ul>
      </section>

      {DOCS.map((d) => (
        <section key={d.id} className="space-y-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="chip">{d.code}</span>
            <h2 className="text-xl">{d.title}</h2>
            <span className="text-sm muted">{d.kind === 'slides' ? 'מצגת' : d.kind === 'task' ? 'דף משימה' : 'דף קריאה'} · {d.photos.length} צילומים</span>
          </div>
          <p className="text-sm text-ink-2">{d.note}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[...d.photos].sort((a, b) => b - a).map((n) => {
              const info = PHOTOS.find((p) => p.photo === n)!;
              const u = usedIn(n);
              return (
                <div key={n} className="card-flat space-y-1 p-2 text-xs">
                  <PhotoThumb photo={n} />
                  <div className="flex items-center gap-1"><b>צילום {n}</b><span className="muted">· עמ׳ {n + 22}</span></div>
                  <div className="muted">{info.number.replace(/\(.*$/, '').replace(/"/g, '').slice(0, 26) || '—'}</div>
                  <div>ודאות: {info.confidence === 'high' ? 'גבוהה' : info.confidence} {info.uncertain ? `· ${info.uncertain} פרטים לבדיקה` : ''}</div>
                  <div className="flex flex-wrap gap-1">
                    {u.ls.slice(0, 3).map((l) => <Link key={l.id} href={`/learn/${l.id}`} className="underline">{l.title}</Link>)}
                    {u.ls.length === 0 && <span className="text-warn">עדיין לא מקושר לשיעור</span>}
                  </div>
                  {u.qs > 0 && <div className="muted">{u.qs} שאלות</div>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
