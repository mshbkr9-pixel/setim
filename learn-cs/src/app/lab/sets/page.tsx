import type { Metadata } from 'next';
import { SetsWorkbench } from '@/components/labs/SetsWorkbench';

export const metadata: Metadata = { title: 'תורת הקבוצות' };

export default function Page() {
  return (
    <div className="space-y-4">
      <header>
        <p className="kicker">מעבדה</p>
        <h1 className="text-3xl">תורת הקבוצות</h1>
        <p className="mt-1 max-w-3xl text-ink-2">גררו איברים בין הקבוצות וראו את הסימון המתמטי משתנה: שייכות (∈), הכלה (⊆), שוויון, הפרש (A − B, בכתיב הקורס), קבוצה ריקה וזוגות סדורים.</p>
      </header>
      <SetsWorkbench />
    </div>
  );
}
