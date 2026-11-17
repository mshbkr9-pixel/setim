/**
 * Finite set engine (תורת הקבוצות). Elements are numbers or strings; ordered pairs are strings "(a,b)".
 * Difference may be written "A - B", "A − B" (as in the course, photos 38–39) or "A \ B".
 */
export type El = number | string;

const key = (e: El) => (typeof e === 'number' ? `n:${e}` : `s:${e}`);

export function uniq(xs: El[]): El[] {
  const seen = new Set<string>();
  const out: El[] = [];
  for (const x of xs) if (!seen.has(key(x))) { seen.add(key(x)); out.push(x); }
  return out.sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b))));
}

export const has = (s: El[], x: El) => s.some((y) => key(y) === key(x));
export const difference = (a: El[], b: El[]) => uniq(a.filter((x) => !has(b, x)));
export const intersection = (a: El[], b: El[]) => uniq(a.filter((x) => has(b, x)));
export const union = (a: El[], b: El[]) => uniq([...a, ...b]);
export const isSubset = (a: El[], b: El[]) => a.every((x) => has(b, x));
export const isEqual = (a: El[], b: El[]) => isSubset(a, b) && isSubset(b, a);
export const isProperSubset = (a: El[], b: El[]) => isSubset(a, b) && !isSubset(b, a);

export function product(a: El[], b: El[]): El[] {
  const out: El[] = [];
  for (const x of a) for (const y of b) out.push(`(${x},${y})`);
  return out;
}

/** Evaluates expressions such as "A - B", "(A - B) - C", "A ∩ B", "{1,2} - A". */
export function evalSetExpr(expr: string, sets: Record<string, El[]>): El[] {
  const src = expr.replace(/\\/g, '-').replace(/−/g, '-');
  let p = 0;
  const ws = () => { while (src[p] === ' ') p++; };
  const atom = (): El[] => {
    ws();
    if (src[p] === '(') { p++; const v = expr0(); ws(); if (src[p] !== ')') throw new Error('חסר סוגר )'); p++; return v; }
    if (src[p] === '{') {
      const end = src.indexOf('}', p);
      if (end < 0) throw new Error('חסר סוגר }');
      const inner = src.slice(p + 1, end).trim();
      p = end + 1;
      return inner ? uniq(inner.split(',').map((t) => parseEl(t.trim()))) : [];
    }
    if (src[p] === '∅') { p++; return []; }
    const m = /^[A-Za-zא-ת][A-Za-z0-9א-ת]*/.exec(src.slice(p));
    if (!m) throw new Error(`לא הבנתי את "${src.slice(p)}"`);
    p += m[0].length;
    if (!(m[0] in sets)) throw new Error(`הקבוצה ${m[0]} לא הוגדרה`);
    return uniq(sets[m[0]]);
  };
  function expr0(): El[] {
    let v = atom();
    for (;;) {
      ws();
      const op = src[p];
      if (op === '-') { p++; v = difference(v, atom()); }
      else if (op === '∩') { p++; v = intersection(v, atom()); }
      else if (op === '∪') { p++; v = union(v, atom()); }
      else return v;
    }
  }
  const v = expr0();
  ws();
  if (p < src.length) throw new Error(`לא הבנתי את "${src.slice(p)}"`);
  return v;
}

export function parseEl(t: string): El {
  const n = Number(t);
  return t !== '' && Number.isFinite(n) ? n : t;
}

/** Parses the learner's answer "{2, 4}" / "2,4" / "∅" into elements. */
export function parseSetAnswer(text: string): El[] {
  const t = text.trim().replace(/^\{|\}$/g, '').trim();
  if (t === '' || t === '∅') return [];
  return uniq(t.split(/[,،]/).map((x) => parseEl(x.trim())).filter((x) => x !== ''));
}

export const formatSet = (s: El[]) => (s.length ? `{${uniq(s).join(', ')}}` : '∅');
