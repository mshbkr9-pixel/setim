/** Static code listing with line numbers and highlighted lines (always LTR). */
export function Listing({ code, highlight = [], className = '' }: { code: string; highlight?: number[]; className?: string }) {
  const lines = code.replace(/\r\n?/g, '\n').split('\n');
  return (
    <pre className={`listing py-2 ${className}`} dir="ltr">
      {lines.map((l, i) => (
        <div key={i} className={`ln ${highlight.includes(i + 1) ? 'hl' : ''}`}>
          <span>{i + 1}</span>
          <span className="whitespace-pre pe-3">{l || ' '}</span>
        </div>
      ))}
    </pre>
  );
}
