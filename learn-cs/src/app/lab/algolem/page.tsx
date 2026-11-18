import type { Metadata } from 'next';
import Link from 'next/link';
import { AlgolemWorkbench } from '@/components/algolem/AlgolemWorkbench';

export const metadata: Metadata = { title: 'סימולטור אלגולם' };

export default function Page() {
  return (
    <div className="space-y-4">
      <header>
        <p className="kicker">מעבדה</p>
        <h1 className="text-3xl">סימולטור אלגולם</h1>
        <p className="mt-1 max-w-3xl text-ink-2">
          כתבו קוד, קבעו כמה כדורים יש בכל מונה, והריצו צעד אחרי צעד. אפשר לחזור אחורה, לראות את טבלת המעקב מתמלאת, ולבחון פרוצדורות מהקורס.
          כל התוצאות מחושבות במנוע מדויק — בלי ניחושים.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/dictionary" className="font-medium text-accent-strong underline underline-offset-4">מילון אלגולם</Link>
          <span className="muted"> — כל המילים שאפשר לכתוב כאן, עם התחביר והפירוש.</span>
        </p>
      </header>
      <AlgolemWorkbench />
    </div>
  );
}
