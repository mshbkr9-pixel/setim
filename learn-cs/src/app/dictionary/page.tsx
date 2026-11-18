import type { Metadata } from 'next';
import Link from 'next/link';
import { DictionaryView } from '@/components/dictionary/DictionaryView';
import { OriginTag } from '@/components/ui/Origin';

export const metadata: Metadata = { title: 'מילון אלגולם' };

export default function Page() {
  return (
    <div className="space-y-5">
      <header className="max-w-3xl">
        <p className="kicker">מילון</p>
        <h1 className="text-3xl sm:text-4xl">מילון אלגולם</h1>
        <p className="mt-1 text-ink-2">
          המילים של שפת אלגולם לפי המילון של הקורס: הביטוי, התחביר והפירוש. לחיצה על שורה פותחת הסבר, את ההגדרה של המילה בשפה, וסימולטור קטן שמריץ אותה.
          כל המילים האלה עובדות גם ב<Link href="/lab/algolem" className="underline underline-offset-4">סימולטור אלגולם</Link>.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="flex items-center gap-1.5">
            <OriginTag origin="source" />
            <span className="muted">הטבלה מהמילון של הקורס</span>
          </span>
          <span className="flex items-center gap-1.5 muted">
            <span className="font-mono font-semibold text-[var(--origin-source)]" dir="ltr">SUM</span>
            מילה שמסומנת באדום בטבלה של הקורס
          </span>
        </div>
      </header>
      <DictionaryView />
      <p className="text-sm muted">
        מחפשים מושג ולא מילה של השפה? ב<Link href="/glossary" className="underline underline-offset-4">מילון המושגים</Link> יש את כל המושגים מהשיעורים.
      </p>
    </div>
  );
}
