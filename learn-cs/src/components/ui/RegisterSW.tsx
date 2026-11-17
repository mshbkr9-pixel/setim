'use client';
import { useEffect } from 'react';
import { BASE_PATH } from '@/lib/asset';

/** Registers the offline service worker — only in the published static build (not in dev). */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !BASE_PATH || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => {});
  }, []);
  return null;
}
