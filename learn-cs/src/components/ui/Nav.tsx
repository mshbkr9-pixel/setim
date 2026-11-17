'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'בית', icon: 'home' },
  { href: '/learn', label: 'מסלול לימוד', icon: 'map' },
  { href: '/lab', label: 'מעבדות', icon: 'lab' },
  { href: '/practice', label: 'תרגול', icon: 'practice' },
  { href: '/exam', label: 'מבחן', icon: 'exam' },
  { href: '/sources', label: 'מקורות', icon: 'sources' },
] as const;

function Icon({ name }: { name: (typeof LINKS)[number]['icon'] }) {
  const p = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'home':
      return (<svg {...p}><path d="M4 11.5 12 5l8 6.5" /><path d="M6.5 10v9h11v-9" /></svg>);
    case 'map':
      return (<svg {...p}><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z" /><path d="M9 4v14M15 6v14" /></svg>);
    case 'lab':
      return (<svg {...p}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" /><circle cx="10" cy="16" r="1" /><circle cx="14" cy="17.5" r="1" /></svg>);
    case 'practice':
      return (<svg {...p}><path d="M5 12.5 9.5 17 19 7" /></svg>);
    case 'exam':
      return (<svg {...p}><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>);
    case 'sources':
      return (<svg {...p}><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m20.5 16-5-5-8 8" /></svg>);
  }
}

const active = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

export function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
      <path d="M8 6v19a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="13" cy="24" r="3" fill="var(--ball)" />
      <circle cx="19.2" cy="24" r="3" fill="var(--ball)" />
      <circle cx="16.1" cy="18.8" r="3" fill="var(--ball)" />
    </svg>
  );
}

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="site-header sticky top-0 z-30 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="דף הבית">
          <Logo />
          <span className="display text-lg font-semibold">מעבדת מדעי המחשב</span>
        </Link>
        <nav className="ms-auto hidden items-center gap-1 md:flex" aria-label="ניווט ראשי">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link rounded-lg px-3 py-1.5 text-[0.93rem] transition-colors ${active(path, l.href) ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur md:hidden" aria-label="ניווט">
      <div className="mx-auto grid max-w-md grid-cols-6">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`flex flex-col items-center gap-0.5 py-2 text-[0.68rem] ${active(path, l.href) ? 'text-accent-strong' : 'text-ink-3'}`}>
            <Icon name={l.icon} />
            <span>{l.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
