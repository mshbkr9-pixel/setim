import type { Metadata } from 'next';
import { TraceLab } from '@/components/trace/TraceLab';

export const metadata: Metadata = { title: 'טבלאות מעקב' };

export default function Page() {
  return (
    <div className="space-y-4">
      <header>
        <p className="kicker">מעבדה</p>
        <h1 className="text-3xl">טבלאות מעקב</h1>
        <p className="mt-1 max-w-3xl text-ink-2">המנוע מריץ את האלגוריתם ובונה את הטבלה בעצמו: יומן צעדים עם ערכים לפני ואחרי כל פעולה, טבלה כללית בסגנון הקורס, טבלה לפי סיבובים, וטבלה מודולרית עם נוסחאות. אפשר גם למלא תאים לבד ולבדוק.</p>
      </header>
      <TraceLab />
    </div>
  );
}
