'use client';
import { asset } from '@/lib/asset';
import { useState } from 'react';
import { PhotoModal } from '@/components/ui/PhotoModal';

export function PhotoThumb({ photo }: { photo: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="block overflow-hidden rounded-lg border border-line" aria-label={`פתיחת צילום ${photo}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset(`/source/thumbs/photo-${String(photo).padStart(2, '0')}.jpg`)} alt="" width={130} height={173} loading="lazy" className="h-auto w-full" />
      </button>
      {open && <PhotoModal photo={photo} onClose={() => setOpen(false)} />}
    </>
  );
}
