import { describe, expect, it } from 'vitest';
import { evalSetExpr, formatSet, isEqual, parseSetAnswer, product } from './index';
import { analyzeArrows, checkRule } from '../functions';
import { plainText } from '@/components/ui/Rich';

describe('sets engine', () => {
  const sets = { A: [1, 2, 3, 4, 5], B: [1, 3, 5, 7, 9] };
  it('difference as written in the course (hyphen) and with a backslash', () => {
    expect(evalSetExpr('A - B', sets)).toEqual([2, 4]);
    expect(evalSetExpr('A \\ B', sets)).toEqual([2, 4]);
    expect(evalSetExpr('B - A', sets)).toEqual([7, 9]);
  });
  it('empty results and literals', () => {
    expect(formatSet(evalSetExpr('A - A', sets))).toBe('∅');
    expect(evalSetExpr('{1,2} - A', sets)).toEqual([]);
  });
  it('parses learner answers, including ordered pairs', () => {
    expect(parseSetAnswer('{4, 2}')).toEqual([2, 4]);
    expect(parseSetAnswer('∅')).toEqual([]);
    expect(isEqual(parseSetAnswer('{(1, 1), (2,3)}'), ['(1,1)', '(2,3)'])).toBe(true);
    expect(isEqual(parseSetAnswer('(2,3),(1,1)'), product([1], [1]).concat(['(2,3)']))).toBe(true);
  });
});

describe('functions engine', () => {
  it('two inputs to one output is still a function; one input to two outputs is not', () => {
    expect(analyzeArrows(['1', '2'], ['a'], [['1', 'a'], ['2', 'a']]).isFunction).toBe(true);
    expect(analyzeArrows(['1'], ['a', 'b'], [['1', 'a'], ['1', 'b']]).isFunction).toBe(false);
    expect(analyzeArrows(['1', '2'], ['a'], [['1', 'a']]).missing).toEqual(['2']);
  });
  it('rule checker reproduces the course examples (photos 56–59)', () => {
    expect(checkRule('square', 'R', 'N').ok).toBe(false);
    expect(checkRule('square', 'N', 'R').ok).toBe(true);
    expect(checkRule('square', '012', 'N').ok).toBe(true);
    expect(checkRule('minus1', 'N', 'N').counter?.a).toBe(0);
  });
});

describe('plain text for dropdowns', () => {
  it('turns KaTeX into readable Unicode', () => {
    expect(plainText('$2 \\in \\mathbb{N}$ ו־$\\emptyset \\subseteq A$')).toBe('2 ∈ ℕ ו־∅ ⊆ A');
  });
});
