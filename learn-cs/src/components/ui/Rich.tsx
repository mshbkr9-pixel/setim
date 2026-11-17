import katex from 'katex';
import type { ReactNode } from 'react';

/** Renders the RichText subset: **bold**, `code`, $math$, line breaks, "- " bullets. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  // math-like runs ("4 → 3", "B = B + 2·A", "−1") are isolated as LTR so the bidi algorithm cannot reverse them
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$|(?:[A-Za-z0-9\u05D0-\u05EA_()=+\-−·×²³'^]+(?:\.[A-Za-z0-9_]+)*\s*[→←⇒↔]\s*)+[A-Za-z0-9\u05D0-\u05EA_()=+\-−·×²³'^]+(?:\.[A-Za-z0-9_]+)*|[A-Za-z0-9_()²³'^]+(?:\.[A-Za-z0-9_]+)*(?:(?:\s*[=+−·×<>≤≥≠]\s*|\s+-\s+)[A-Za-z0-9_()²³'^]+(?:\.[A-Za-z0-9_]+)*)+|(?<=^|[\s(])[−-]\d+(?:\.\d+)?)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith('**')) out.push(<strong key={k}>{inline(tok.slice(2, -2), k)}</strong>);
    else if (tok.startsWith('`')) out.push(<code key={k} className="inline-code">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith('$') && tok.endsWith('$') && tok.length > 1) out.push(<Math key={k} tex={tok.slice(1, -1)} />);
    else out.push(<span key={k} dir="ltr" className="whitespace-nowrap" style={{ unicodeBidi: 'isolate' }}>{tok}</span>);
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

const TEX: [RegExp, string][] = [
  [/\\mathbb\{N\}/g, 'ℕ'], [/\\mathbb\{Z\}/g, 'ℤ'], [/\\mathbb\{R\}/g, 'ℝ'], [/\\notin/g, '∉'], [/\\in/g, '∈'],
  [/\\subseteq/g, '⊆'], [/\\not\\subseteq/g, '⊈'], [/\\subset/g, '⊂'], [/\\emptyset|\\varnothing/g, '∅'], [/\\setminus/g, '\\'],
  [/\\cdot/g, '·'], [/\\times/g, '×'], [/\\to|\\rightarrow/g, '→'], [/\\le(q)?/g, '≤'], [/\\ge(q)?/g, '≥'], [/\\neq|\\ne/g, '≠'],
  [/\\cup/g, '∪'], [/\\cap/g, '∩'], [/\\\{/g, '{'], [/\\\}/g, '}'], [/\\mid/g, '|'], [/\^2/g, '²'], [/\^3/g, '³'], [/\^0/g, '⁰'],
  [/\\sqrt\{([^}]*)\}/g, '√$1'], [/\\text\{([^}]*)\}/g, '$1'], [/\\[,;! ]/g, ' '], [/[{}]/g, ''],
];

/** Plain-text version of RichText (for places that cannot hold markup, such as <option>). */
export function plainText(text: string): string {
  return text
    .replace(/\$([^$]+)\$/g, (_, tex: string) => TEX.reduce((acc, [re, rep]) => acc.replace(re, rep), tex))
    .replace(/\*\*|`/g, '');
}
