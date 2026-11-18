'use client';
import { useState } from 'react';
import { DICTIONARY, KIND_LABEL, type DictionaryEntry } from '@/content/dictionary';
import { LIBRARY_BY_NAME } from '@/engines/algolem/library';
import { AlgolemLab } from '@/components/algolem/AlgolemLab';
import { Listing } from '@/components/ui/Listing';
import { OriginTag, PhotoRefs } from '@/components/ui/Origin';

const BASIC_TEXT: Record<string, string> = {
  ADD: 'הוראת יסוד של המכונה: מוסיפה כדור אחד למונה.',
  SUB: 'הוראת יסוד של המכונה: מוציאה כדור אחד מהמונה. ממונה ריק אי אפשר להוציא כדור — זו שגיאה בזמן ריצה, ואין פלט.',
  'WHILE-ENDW': 'הוראת בקרה: כל עוד המונה שבסוגריים של WHILE אינו ריק, מבצעים את ההוראות שעד ENDW, ואז בודקים שוב. כשהמונה ריק, ממשיכים אחרי ENDW.',
};

function Meaning({ d, className = '' }: { d: DictionaryEntry; className?: string }) {
  return (
    <span className={`flex flex-wrap gap-x-4 ${d.kind === 'control' ? '' : 'font-mono'} ${className}`} dir={d.kind === 'control' ? 'rtl' : 'ltr'}>
      {d.meaning.map((m) => (
        <span key={m}>{m}</span>
      ))}
    </span>
  );
}

function Toggle({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className={`shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <path d="m3 5.25 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Details({ d }: { d: DictionaryEntry }) {
  const lib = d.library ? LIBRARY_BY_NAME[d.library] : undefined;
  return (
    <div className="space-y-3 border-t border-line bg-card-2 px-4 pb-4 pt-3">
      <p className="text-[0.97rem]">{lib ? `${lib.purpose}.` : BASIC_TEXT[d.word]}</p>
      {lib && (
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="kicker">ההגדרה בשפת אלגולם</span>
            {lib.status === 'dictionary' ? <OriginTag origin="explanation" /> : <OriginTag origin="source" />}
            <PhotoRefs photos={lib.photos} label={false} />
          </div>
          <Listing code={lib.source} className="text-[0.88rem]" />
          {lib.status === 'dictionary' && (
            <p className="text-xs muted">
              במילון של הקורס מופיע רק הפירוש. את הגוף כתבנו כדי שהסימולטור יוכל להריץ את המילה: מוני הקלט לא משתנים, וזה עובד גם כשהתוצאה נכתבת לאחד מהם,
              למשל <code className="inline-code">SUM (B,E,B)</code>.
            </p>
          )}
        </div>
      )}
      <div>
        <span className="kicker">נסו בעצמכם</span>
        <AlgolemLab code={d.example.code} inputs={d.example.inputs} />
      </div>
    </div>
  );
}

/** The course dictionary as one grouped table; a row opens its definition and a small simulator. */
export function DictionaryView() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="card overflow-hidden">
      <div className="hidden grid-cols-[8.5rem_10.5rem_1fr_7.5rem_1rem] gap-x-3 border-b border-line bg-card-2 px-4 py-2 text-sm font-semibold text-ink-2 sm:grid" aria-hidden>
        <span>ביטוי</span>
        <span>תחביר</span>
        <span>פירוש</span>
        <span>סוג</span>
        <span />
      </div>
      <ul className="divide-y divide-line">
        {DICTIONARY.map((d) => {
          const isOpen = open === d.word;
          const panel = `dict-${d.word}`;
          return (
            <li key={d.word} id={d.word}>
              <button
                type="button"
                className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 px-4 py-3 text-start transition-colors active:bg-[var(--pressed)] sm:grid-cols-[8.5rem_10.5rem_1fr_7.5rem_1rem] [@media(hover:hover)]:hover:bg-card-2"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? null : d.word)}
              >
                <span className={`font-mono font-semibold ${d.red ? 'text-[var(--origin-source)]' : ''}`} dir="ltr" style={{ textAlign: 'right' }}>
                  {d.word}
                </span>
                <span className="font-mono text-ink-2 max-sm:hidden" dir="ltr" style={{ textAlign: 'right' }}>
                  {d.syntax}
                </span>
                <span className="max-sm:hidden">
                  <Meaning d={d} className={d.kind === 'control' ? '' : 'justify-end'} />
                </span>
                <span className="max-sm:hidden">
                  <span className="chip">{KIND_LABEL[d.kind]}</span>
                </span>
                <Toggle open={isOpen} />
                <span className="col-span-full flex flex-wrap items-baseline gap-x-3 text-[0.95rem] text-ink-2 sm:hidden">
                  {d.syntax && (
                    <span className="font-mono" dir="ltr">
                      {d.syntax}
                    </span>
                  )}
                  <Meaning d={d} />
                </span>
              </button>
              {isOpen && (
                <div id={panel}>
                  <Details d={d} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
