/**
 * Arrow diagrams (דיאגרמות חצים): is the correspondence a function from the domain to the range,
 * is it one-to-one (חד-חד-ערכית), is it onto (על).  Source: photos 62–66.
 */
export interface ArrowAnalysis {
  /** Every domain element has at least one arrow (כוללות). */
  total: boolean;
  /** No domain element has two different targets (חד-ערכיות). */
  singleValued: boolean;
  isFunction: boolean;
  injective: boolean;
  surjective: boolean;
  /** Domain elements without an arrow. */
  missing: string[];
  /** Domain elements with more than one target. */
  multiple: string[];
  /** Range elements reached by two or more domain elements. */
  shared: string[];
  /** Range elements nobody reaches. */
  unreached: string[];
  /** Arrows that start or end outside the declared sets. */
  invalid: [string, string][];
}

export function analyzeArrows(domain: string[], codomain: string[], arrows: [string, string][]): ArrowAnalysis {
  const invalid = arrows.filter(([a, b]) => !domain.includes(a) || !codomain.includes(b));
  const valid = uniqPairs(arrows.filter(([a, b]) => domain.includes(a) && codomain.includes(b)));
  const out = new Map<string, Set<string>>(domain.map((d) => [d, new Set()]));
  const inc = new Map<string, Set<string>>(codomain.map((c) => [c, new Set()]));
  for (const [a, b] of valid) { out.get(a)!.add(b); inc.get(b)!.add(a); }
  const missing = domain.filter((d) => out.get(d)!.size === 0);
  const multiple = domain.filter((d) => out.get(d)!.size > 1);
  const shared = codomain.filter((c) => inc.get(c)!.size > 1);
  const unreached = codomain.filter((c) => inc.get(c)!.size === 0);
  const total = missing.length === 0;
  const singleValued = multiple.length === 0;
  const isFunction = total && singleValued && invalid.length === 0;
  return {
    total, singleValued, isFunction,
    injective: isFunction && shared.length === 0,
    surjective: isFunction && unreached.length === 0,
    missing, multiple, shared, unreached, invalid,
  };
}

function uniqPairs(ps: [string, string][]): [string, string][] {
  const seen = new Set<string>();
  return ps.filter(([a, b]) => { const k = `${a}\u0000${b}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

/** Hebrew verdict lines for the UI (explanation layer). */
export function explainArrows(r: ArrowAnalysis): string[] {
  const lines: string[] = [];
  if (r.invalid.length) lines.push('יש חץ שיוצא מחוץ לתחום או מגיע מחוץ לטווח.');
  lines.push(r.total ? '✓ לכל איבר בתחום יש לפחות חץ אחד (כוללות).' : `✗ לאיברים ${r.missing.join(', ')} שבתחום אין חץ — לא כל קלט מקבל פלט.`);
  lines.push(r.singleValued ? '✓ לאף איבר בתחום אין שני חצים (חד־ערכיות).' : `✗ מהאיבר ${r.multiple.join(', ')} יוצאים שני חצים או יותר — קלט אחד עם כמה פלטים.`);
  lines.push(r.isFunction ? '⇒ זו פונקציה.' : '⇒ זו אינה פונקציה מהתחום לטווח.');
  if (r.isFunction) {
    lines.push(r.injective ? '✓ חד־חד־ערכית: אין שני קלטים שמגיעים לאותו פלט.' : `• לא חד־חד־ערכית: ל־${r.shared.join(', ')} מגיעים כמה קלטים (וזה מותר בפונקציה).`);
    lines.push(r.surjective ? '✓ על: כל איבר בטווח מתקבל.' : `• לא על: ${r.unreached.join(', ')} בטווח לא מתקבלים (וזה מותר בפונקציה).`);
  }
  return lines;
}

// ------------------------------------------------------------------ rule + domain + range (photos 56–59)
export type NumSet = 'N' | 'Z' | 'R' | '012';
export type Rule = 'square' | 'identity' | 'plus1' | 'minus1' | 'double' | 'half' | 'sqrt';

export const RULES: Record<Rule, { label: string; f: (a: number) => number }> = {
  square: { label: 'f(a) = a²', f: (a) => a * a },
  identity: { label: 'f(a) = a', f: (a) => a },
  plus1: { label: 'f(a) = a + 1', f: (a) => a + 1 },
  minus1: { label: 'f(a) = a − 1', f: (a) => a - 1 },
  double: { label: 'f(a) = 2·a', f: (a) => 2 * a },
  half: { label: 'f(a) = a / 2', f: (a) => a / 2 },
  sqrt: { label: 'f(a) = √a', f: (a) => (a < 0 ? NaN : Math.sqrt(a)) },
};
export const SET_LABEL: Record<NumSet, string> = { N: 'ℕ', Z: 'ℤ', R: 'ℝ', '012': '{0,1,2}' };
const SAMPLES: Record<NumSet, number[]> = {
  N: Array.from({ length: 21 }, (_, i) => i),
  Z: Array.from({ length: 21 }, (_, i) => i - 10),
  R: [-2.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3.7],
  '012': [0, 1, 2],
};
const member = (s: NumSet, v: number) =>
  Number.isFinite(v) && (s === 'R' || (Number.isInteger(v) && (s === 'Z' || (s === 'N' && v >= 0) || (s === '012' && v >= 0 && v <= 2))));

/**
 * Is "rule : domain → range" a function? Looks for a counterexample among representative inputs
 * (for the rules offered here the representatives are enough to decide).
 */
export function checkRule(rule: Rule, domain: NumSet, range: NumSet): { ok: boolean; counter?: { a: number; value: number; reason: 'undefined' | 'outside' } } {
  for (const a of SAMPLES[domain]) {
    const v = RULES[rule].f(a);
    if (!Number.isFinite(v)) return { ok: false, counter: { a, value: v, reason: 'undefined' } };
    if (!member(range, v)) return { ok: false, counter: { a, value: v, reason: 'outside' } };
  }
  return { ok: true };
}
