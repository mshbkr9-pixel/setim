import Link from 'next/link';
import type { Metadata } from 'next';
import { LESSONS } from '@/content';
import { TRACK_BY_ID } from '@/content/skills';
import { Rich } from '@/components/ui/Rich';

export const metadata: Metadata = { title: 'מילון מושגים' };

export default function Page() {
  const map = new Map<string, { simple: string; formal?: string; lessons: { id: string; title: string; track: string }[] }>();
  for (const l of LESSONS)
    for (const g of l.glossary) {
      const cur = map.get(g.term) ?? { simple: g.simple, formal: g.formal, lessons: [] };
      cur.lessons.push({ id: l.id, title: l.title, track: TRACK_BY_ID[l.track].title });
      map.set(g.term, cur);
    }
  const terms = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'he'));
  return (
    <div className="space-y-5">
      <header>
        <p className="kicker">מילון</p>
        <h1 className="text-3xl sm:text-4xl">מילון מושגים</h1>
        <p className="mt-1 text-ink-2">{terms.length} מושגים מכל השיעורים, בשפה פשוטה.</p>
      </header>
      <dl className="grid gap-2 md:grid-cols-2">
        {terms.map(([term, v]) => (
          <div key={term} id={term} className="card-flat scroll-mt-24 p-3">
            <dt className="font-semibold">{term}</dt>
            <dd className="text-[0.95rem] text-ink-2">
              <Rich text={v.simple} />
              {v.formal && <div className="mt-1 text-sm"><Rich text={v.formal} /></div>}
              <div className="mt-1 flex flex-wrap gap-1 text-xs">{v.lessons.map((l) => <Link key={l.id} href={`/learn/${l.id}`} className="chip hover:border-ink-3">{l.title}</Link>)}</div>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
