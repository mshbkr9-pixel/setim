'use client';
import type { TableColumn } from '@/engines/algolem/trace';

export interface TraceTableProps {
  counters: string[];
  columns: TableColumn[];
  /** Index of the column to emphasise (the latest one while stepping). */
  current?: number;
  /** Cells the learner fills: key `${col}:${counter}` → value typed; `check` marks right/wrong. */
  quiz?: { answers: Record<string, string>; onChange: (key: string, v: string) => void; blanks: Set<string>; checked: boolean };
  caption?: string;
}

/** The course's trace table: rows = counters, columns = input · rounds/lines · output (RTL). */
export function TraceTable({ counters, columns, current, quiz, caption }: TraceTableProps) {
  const groups: { name: string; span: number }[] = [];
  for (const c of columns) {
    const last = groups[groups.length - 1];
    if (last && last.name === c.group && c.kind === 'line') last.span++;
    else groups.push({ name: c.group, span: 1 });
  }
  const hasSub = columns.some((c) => c.label);
  return (
    <div className="thin-scroll max-w-full overflow-x-auto rounded-lg border border-line">
      <table className="ttable min-w-full">
        {caption && <caption className="p-2 text-start text-sm muted">{caption}</caption>}
        <thead>
          <tr>
            <th className="rowh" rowSpan={hasSub ? 2 : 1}>מונה</th>
            {groups.map((g, i) => (
              <th key={i} colSpan={g.span}>{g.name}</th>
            ))}
          </tr>
          {hasSub && (
            <tr>
              {columns.map((c, i) => (
                <th key={i} className="text-[0.78rem] font-normal muted">{c.label || ''}</th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {counters.map((name) => (
            <tr key={name}>
              <td className="rowh font-mono" dir="ltr">{name}</td>
              {columns.map((c, i) => {
                const key = `${i}:${name}`;
                if (c.values === null) {
                  return (
                    <td key={i} className="text-[0.78rem] text-bad">{name === counters[0] ? c.note ?? '—' : ''}</td>
                  );
                }
                const v = c.values[name];
                if (quiz && quiz.blanks.has(key)) {
                  const typed = quiz.answers[key] ?? '';
                  const ok = quiz.checked && typed.trim() !== '' && Number(typed) === v;
                  const bad = quiz.checked && !ok;
                  return (
                    <td key={i} className={ok ? 'bg-ok-soft' : bad ? 'bg-bad-soft' : ''}>
                      <input
                        aria-label={`${name}, ${c.group} ${c.label}`}
                        className="input num-input min-h-0 py-0.5"
                        inputMode="numeric"
                        value={typed}
                        onChange={(e) => quiz.onChange(key, e.target.value.replace(/[^\d]/g, ''))}
                      />
                    </td>
                  );
                }
                return (
                  <td key={i} className={`num ${c.changed.includes(name) ? 'chg' : ''} ${current === i ? 'outline outline-2 -outline-offset-2 outline-[var(--ball)]' : ''}`}>
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
