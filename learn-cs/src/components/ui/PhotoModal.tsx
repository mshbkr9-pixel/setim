'use client';
import { useEffect, useRef, useState } from 'react';

/** Original source photo with zoom and pan. */
export function PhotoModal({ photo, onClose }: { photo: number; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={`צילום מקור ${photo}`}>
      <div ref={ref} tabIndex={-1} className="card flex max-h-full w-full max-w-4xl flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <strong className="display">צילום מקור {photo}</strong>
          <span className="text-xs muted">עמוד {photo + 22} בקובץ ה־PDF · תיעוד מצולם של החומר המקורי</span>
          <div className="ms-auto flex gap-1">
            <button className="btn btn-sm" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} aria-label="הקטנה">−</button>
            <button className="btn btn-sm" onClick={() => setZoom((z) => Math.min(4, z + 0.5))} aria-label="הגדלה">+</button>
            <button className="btn btn-sm" onClick={onClose} aria-label="סגירה">✕</button>
          </div>
        </div>
        <div className="thin-scroll overflow-auto bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/source/photo-${String(photo).padStart(2, '0')}.jpg`} alt={`צילום מקור ${photo}`} style={{ width: `${zoom * 100}%`, maxWidth: 'none' }} className="mx-auto block" />
        </div>
      </div>
    </div>
  );
}
