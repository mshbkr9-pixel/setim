import type { MetadataRoute } from 'next';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const dynamic = 'force-static';

/** Lets the site be added to a phone's home screen and opened like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'מעבדת מדעי המחשב',
    short_name: 'מדעי המחשב',
    description: 'לימוד אינטראקטיבי: LOGO, אלגולם, טבלאות מעקב, שגיאות, קבוצות ופונקציות',
    lang: 'he',
    dir: 'rtl',
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}/icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}/icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
