'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { motion, useReducedMotion } from 'motion/react';

type IconName = 'home' | 'map' | 'lab' | 'practice' | 'exam' | 'sources';

/** `short` is the label in the phone tab bar; `tab: false` = reached from the phone navigation bar instead. */
const LINKS: { href: string; label: string; short: string; icon: IconName; tab: boolean }[] = [
  { href: '/', label: 'בית', short: 'בית', icon: 'home', tab: true },
  { href: '/learn', label: 'מסלול לימוד', short: 'שיעורים', icon: 'map', tab: true },
  { href: '/lab', label: 'מעבדות', short: 'מעבדות', icon: 'lab', tab: true },
  { href: '/practice', label: 'תרגול', short: 'תרגול', icon: 'practice', tab: true },
  { href: '/exam', label: 'מבחן', short: 'מבחן', icon: 'exam', tab: true },
  { href: '/sources', label: 'מקורות', short: 'מקורות', icon: 'sources', tab: false },
];

/** Line icons; the selected tab gets a tinted fill, like the filled symbols of iOS tab bars. */
function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: filled ? 2 : 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const f = filled ? { fill: 'currentColor', fillOpacity: 0.22 } : {};
  switch (name) {
    case 'home':
      return (<svg {...p}><path d="M4 11.2 12 4.8l8 6.4V19a1.5 1.5 0 0 1-1.5 1.5h-3.8v-5.3H9.3v5.3H5.5A1.5 1.5 0 0 1 4 19z" {...f} /></svg>);
    case 'map':
      return (<svg {...p}><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z" {...f} /><path d="M9 4v14M15 6v14" /></svg>);
    case 'lab':
      return (<svg {...p}><path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" {...f} /><path d="M9 3h6" /><circle cx="10" cy="16" r="1" /><circle cx="14" cy="17.5" r="1" /></svg>);
    case 'practice':
      return (<svg {...p}><circle cx="12" cy="12" r="8.5" {...f} /><path d="m8.2 12.3 2.6 2.6 5-5.4" /></svg>);
    case 'exam':
      return (<svg {...p}><rect x="5" y="3.5" width="14" height="17" rx="2.2" {...f} /><path d="M9 8h6M9 12h6M9 16h3" /></svg>);
    case 'sources':
      return (<svg {...p}><rect x="3.5" y="5" width="17" height="14" rx="2.2" {...f} /><circle cx="9" cy="10" r="1.6" /><path d="m20.5 16-5-5-8 8" /></svg>);
  }
}

const isActive = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

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

/**
 * iOS large-title behaviour: once the page's <h1> scrolls under the bar, its text is shown in the bar.
 * Re-binds when the page (or a late Suspense boundary) replaces the heading.
 */
function useCollapsedTitle(path: string, bar: RefObject<HTMLElement | null>) {
  const [seen, setSeen] = useState<{ path: string; title: string | null }>({ path: '', title: null });
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    let io: IntersectionObserver | null = null;
    let bound: Element | null = null;
    const bind = () => {
      const h1 = main.querySelector('h1');
      if (h1 === bound) return;
      io?.disconnect();
      bound = h1;
      if (!h1) return;
      const top = bar.current?.offsetHeight ?? 56;
      io = new IntersectionObserver(
        ([e]) => setSeen({ path, title: e.isIntersecting || e.boundingClientRect.top > top ? null : (h1.textContent ?? '').trim() || null }),
        { rootMargin: `-${top}px 0px 0px 0px` },
      );
      io.observe(h1);
    };
    bind();
    const mo = new MutationObserver(bind);
    mo.observe(main, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io?.disconnect();
    };
  }, [path, bar]);
  return seen.path === path ? seen.title : null;
}

export function SiteHeader() {
  const path = usePathname();
  const ref = useRef<HTMLElement>(null);
  const title = useCollapsedTitle(path, ref);
  const sources = LINKS.find((l) => !l.tab)!;
  return (
    <header ref={ref} className="site-header sticky top-0 z-30" data-collapsed={title ? 'true' : 'false'}>
      <div className="hdr-row mx-auto flex max-w-6xl items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1 md:flex-none">
          <Link href="/" className="-ms-[7px] grid h-11 w-11 shrink-0 place-items-center" aria-label="דף הבית">
            <Logo />
          </Link>
          <div className="hdr-swap">
            <Link href="/" className="hdr-brand display block truncate text-lg leading-[2.75rem] font-semibold">
              מעבדת מדעי המחשב
            </Link>
            <button type="button" className="hdr-title" tabIndex={title ? 0 : -1} aria-hidden={!title} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              {title}
            </button>
          </div>
        </div>
        <nav className="ms-auto hidden items-center gap-1 md:flex" aria-label="ניווט ראשי">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link rounded-lg px-3 py-1.5 text-[0.93rem] transition-colors ${isActive(path, l.href) ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link href={sources.href} className="hdr-action shrink-0" aria-current={isActive(path, sources.href) ? 'page' : undefined}>
          <Icon name={sources.icon} size={19} />
          {sources.label}
        </Link>
      </div>
    </header>
  );
}

/** Phone tab bar: a floating glass capsule; the selected-tab pill slides between tabs. */
export function MobileNav() {
  const path = usePathname();
  const reduce = useReducedMotion();
  return (
    <nav className="tabbar" aria-label="ניווט">
      <div className="tabbar-list">
        {LINKS.filter((l) => l.tab).map((l) => {
          const on = isActive(path, l.href);
          return (
            <Link key={l.href} href={l.href} className="tab" aria-current={on ? 'page' : undefined}>
              {on && <motion.span layoutId="tab-pill" className="tab-pill" transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 40 }} />}
              <Icon name={l.icon} size={24} filled={on} />
              <span>{l.short}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
