import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'מעבדות' };

const LABS = [
  { href: '/lab/algolem', title: 'סימולטור אלגולם', text: 'מונים עם כדורים, עורך קוד, צעד קדימה ואחורה, פרוצדורות, טבלת מעקב חיה והוכחה כשלולאה אינסופית.', color: 'var(--t-algolem)' },
  { href: '/lab/logo', title: 'סימולטור LOGO', text: 'צב שמצייר לפי הוראות, פרוצדורות ופרמטרים, הרצה שורה אחר שורה ומחסנית הזיכרון.', color: 'var(--t-logo)' },
  { href: '/lab/trace', title: 'טבלאות מעקב', text: 'טבלה כללית, לפי סיבובים ומודולרית, יומן צעדים עם הסבר למה הלולאה ממשיכה או נעצרת, ומילוי עצמי של תאים.', color: 'var(--t-trace)' },
  { href: '/lab/sets', title: 'תורת הקבוצות', text: 'דיאגרמת ון עם גרירה: שייכות, הכלה, שוויון, הפרש, קבוצה ריקה וזוגות סדורים.', color: 'var(--t-sets)' },
  { href: '/lab/functions', title: 'פונקציות', text: 'חצים בין תחום לטווח, בדיקת פונקציה / חח״ע / על, תחום וטווח מול כלל ההתאמה, גרף בדיד מול רציף.', color: 'var(--t-functions)' },
];

export default function Page() {
  return (
    <div className="space-y-5">
      <header>
        <p className="kicker">מעבדות</p>
        <h1 className="text-3xl sm:text-4xl">להפעיל, לשנות ולראות</h1>
        <p className="mt-1 max-w-2xl text-ink-2">כל מעבדה היא מנוע מדויק ודטרמיניסטי: אותו קלט נותן תמיד אותה תוצאה. אפשר לשנות קוד ונתונים ולראות בדיוק מה קורה.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LABS.map((l) => (
          <Link key={l.href} href={l.href} className="card group block p-5 transition-colors hover:border-ink-3">
            <span className="mb-2 block h-1.5 w-10 rounded-full" style={{ background: l.color }} />
            <h2 className="text-xl group-hover:text-accent">{l.title}</h2>
            <p className="mt-1 text-sm text-ink-2">{l.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
