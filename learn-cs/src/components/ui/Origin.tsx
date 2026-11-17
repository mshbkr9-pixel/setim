'use client';
import { useState } from 'react';
import type { Origin } from '@/content/types';
import { PhotoModal } from './PhotoModal';

const LABEL: Record<Origin, { text: string; title: string; cls: string }> = {
  source: { text: 'חומר מקור', title: 'חומר מקורי של המרצה — מצוטט או משוחזר מצילום המקור', cls: 'bg-[var(--origin-source-soft)] text-[var(--origin-source)] border-[color-mix(in_oklab,var(--origin-source)_35%,transparent)]' },
  explanation: { text: 'הסבר חדש', title: 'הסבר שנכתב כדי להבהיר את החומר — אינו מופיע כך במקור', cls: 'bg-[var(--origin-expl-soft)] text-[var(--origin-expl)] border-[color-mix(in_oklab,var(--origin-expl)_35%,transparent)]' },
  new: { text: 'תרגיל חדש', title: 'דוגמה או תרגיל שנוצרו לצורך תרגול — אינם מהמקור', cls: 'bg-[var(--origin-new-soft)] text-[var(--origin-new)] border-[color-mix(in_oklab,var(--origin-new)_35%,transparent)]' },
};

export function OriginTag({ origin }: { origin: Origin }) {
  const l = LABEL[origin];
  return (
    <span className={`chip ${l.cls}`} title={l.title}>
      {l.text}
    </span>
  );
}

/** Chips "צילום 28" that open the original photo. */
export function PhotoRefs({ photos, label = true }: { photos: number[]; label?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {label && <span className="text-xs muted">מקור:</span>}
      {photos.map((n) => (
        <button key={n} type="button" className="chip cursor-pointer hover:border-ink-3" onClick={() => setOpen(n)} title={`צילום מקור ${n} (עמוד ${n + 22} בקובץ)`}>
          צילום {n}
        </button>
      ))}
      {open !== null && <PhotoModal photo={open} onClose={() => setOpen(null)} />}
    </span>
  );
}
