import katex from 'katex';
import type { ReactNode } from 'react';

/** Renders the RichText subset: **bold**, `code`, $math$, line breaks, "- " bullets. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k}>{inline(tok.slice(2, -2), k)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k} className="inline-code">{tok.slice(1, -1)}</code>);
    else out.push(<Math key={k} tex={tok.slice(1, -1)} />);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Math({ tex, block = false }: { tex: string; block?: boolean }) {
  let html: string;
  try {
    html = katex.renderToString(tex, { throwOnError: false, displayMode: block, strict: 'ignore' });
  } catch {
    html = tex;
  }
  return <span className={block ? 'block text-center' : ''} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Rich({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = (k: string) => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={k}>
        {bullets.map((b, i) => (
          <li key={i}>{inline(b, `${k}-${i}`)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  lines.forEach((l, i) => {
    const t = l.trimEnd();
    if (/^\s*[-•]\s+/.test(t)) {
      bullets.push(t.replace(/^\s*[-•]\s+/, ''));
      return;
    }
    flush(`u${i}`);
    if (t.trim() === '') return;
    blocks.push(<p key={`p${i}`}>{inline(t, `p${i}`)}</p>);
  });
  flush('u-end');
  return <div className={`rich ${className}`}>{blocks}</div>;
}

/** Inline-only variant (no paragraphs), for titles and table cells. */
export function RichInline({ text }: { text: string }) {
  return <>{inline(text, 'i')}</>;
}
