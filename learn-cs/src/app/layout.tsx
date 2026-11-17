import type { Metadata, Viewport } from 'next';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-400.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-500.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-600.css';
import '@fontsource/ibm-plex-sans-hebrew/hebrew-700.css';
import '@fontsource/ibm-plex-sans-hebrew/latin-400.css';
import '@fontsource/ibm-plex-sans-hebrew/latin-600.css';
import '@fontsource-variable/frank-ruhl-libre/wght.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import 'katex/dist/katex.min.css';
import './globals.css';
import { SiteHeader, MobileNav } from '@/components/ui/Nav';
import { RegisterSW } from '@/components/ui/RegisterSW';
import { asset } from '@/lib/asset';

export const metadata: Metadata = {
  title: { default: 'מעבדת מדעי המחשב', template: '%s · מעבדת מדעי המחשב' },
  description: 'לימוד אינטראקטיבי של חומר הקורס: LOGO, אלגולם, טבלאות מעקב, שגיאות, תורת הקבוצות ופונקציות.',
  icons: { icon: asset('/icons/icon-192.png'), apple: asset('/icons/apple-touch-icon.png') },
  appleWebApp: { capable: true, title: 'מדעי המחשב', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f1e8' },
    { media: '(prefers-color-scheme: dark)', color: '#15181f' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">{children}</main>
        <MobileNav />
        <RegisterSW />
      </body>
    </html>
  );
}
