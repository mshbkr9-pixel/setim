import { describe, expect, it } from 'vitest';
import { LESSONS, QUESTIONS } from '../index';
import { MISCONCEPTIONS, SKILLS, TRACKS } from '../skills';
import type { AlgolemTest, Question, Widget } from '../types';
import { compile, createMachine, run, visibleCounters } from '@/engines/algolem';
import { execLogo, parseLogo } from '@/engines/logo';
import { evalSetExpr } from '@/engines/sets';

const algolem = (code: string, procedures?: string[]) => compile({ main: code, procedures });

function runTests(code: string, tests: AlgolemTest[], procedures?: string[]): string | null {
  const c = algolem(code, procedures);
  if (!c.ok) return 'compile: ' + c.errors[0].message;
  for (const t of tests) {
    const r = run(c.program, createMachine(c.program, t.inputs), { maxSteps: 200_000 });
    if (t.expect === 'no-output') {
      if (r.stoppedBy === 'done') return `expected no output for ${JSON.stringify(t.inputs)}`;
      continue;
    }
    if (r.stoppedBy !== 'done') return `no output for ${JSON.stringify(t.inputs)} (${r.stoppedBy})`;
    const out = visibleCounters(c.program, r.state);
    for (const [k, v] of Object.entries(t.expect)) if (out[k] !== v) return `${JSON.stringify(t.inputs)}: ${k}=${out[k]} expected ${v}`;
  }
  return null;
}

function checkWidget(w: Widget, where: string) {
  const ctx = `${where} [${w.kind}]`;
  switch (w.kind) {
    case 'algolem':
    case 'trace': {
      const c = algolem(w.code, w.procedures);
      expect(c.ok, `${ctx}: ${!c.ok ? c.errors.map((e) => `${e.line}: ${e.message}`).join('; ') : ''}\n${w.code}`).toBe(true);
      if (c.ok) for (const k of Object.keys(w.inputs)) expect(c.program.counters.includes(k), `${ctx}: input ${k} is not a counter of the code`).toBe(true);
      if (w.kind === 'algolem' && w.goal) {
        // the goal must be achievable: tests must be internally consistent (non-empty)
        expect(w.goal.tests.length, `${ctx}: goal needs tests`).toBeGreaterThan(0);
      }
      break;
    }
    case 'meaning-grid': {
      const c = algolem(w.code, w.procedures);
      expect(c.ok, `${ctx}: ${!c.ok ? c.errors[0].message : ''}`).toBe(true);
      break;
    }
    case 'logo': {
      const p = parseLogo(w.code, w.run ?? '');
      expect(p.program, `${ctx}: ${p.errors.map((e) => `${e.line}: ${e.message}`).join('; ')}\n${w.code}\n${w.run ?? ''}`).not.toBeNull();
      if (p.program) {
        const r = execLogo(w.code, w.run ?? '');
        expect(r.ok && r.stoppedBy !== 'error', `${ctx}: runtime error ${r.ok && r.state.error?.message}`).toBe(true);
      }
      if (w.goal) expect(parseLogo(w.goal.target).program, `${ctx}: goal target does not parse`).not.toBeNull();
      break;
    }
    case 'chain':
      expect(w.arrows.length, `${ctx}: arrows = steps − 1`).toBe(w.steps.length - 1);
      break;
    case 'label-table': {
      const n = w.code.split('\n').length;
      for (const l of w.labels) {
        expect(l.from >= 1 && l.to <= n && l.from <= l.to, `${ctx}: label lines ${l.from}-${l.to} outside 1-${n}`).toBe(true);
        expect((l.span ?? 1) >= 1 && l.level >= 1, `${ctx}: label level/span`).toBe(true);
      }
      break;
    }
    case 'arrows':
      for (const [a, b] of w.arrows) expect(w.domain.includes(a) && w.codomain.includes(b), `${ctx}: arrow ${a}→${b} outside sets`).toBe(true);
      break;
    case 'venn':
      for (const [name, els] of Object.entries(w.sets)) for (const e of els) expect(w.universe.includes(e), `${ctx}: ${name} has ${e} not in universe`).toBe(true);
      break;
    case 'photo':
      expect(w.photo >= 1 && w.photo <= 76, ctx).toBe(true);
      break;
    default:
      break;
  }
}

function checkQuestion(q: Question) {
  const ctx = `question ${q.id}`;
  expect(q.hints.length, `${ctx}: needs at least 1 hint`).toBeGreaterThan(0);
  expect(q.explanation.length, `${ctx}: needs an explanation`).toBeGreaterThan(10);
  for (const s of q.skills) expect(SKILLS[s], `${ctx}: unknown skill ${s}`).toBeDefined();
  for (const p of q.sources?.photos ?? []) expect(p >= 1 && p <= 76, `${ctx}: photo ${p}`).toBe(true);
  if (q.origin === 'source') expect(q.sources?.photos.length, `${ctx}: source questions must cite photos`).toBeGreaterThan(0);
  switch (q.type) {
    case 'mcq': {
      const correct = q.choices.filter((c) => c.correct).length;
      expect(correct, `${ctx}: correct choices`).toBeGreaterThan(0);
      if (!q.multi) expect(correct, `${ctx}: single-answer mcq must have exactly one correct choice`).toBe(1);
      for (const c of q.choices) if (c.misconception) expect(MISCONCEPTIONS[c.misconception], `${ctx}: unknown misconception ${c.misconception}`).toBeDefined();
      break;
    }
    case 'predict':
    case 'trace-fill': {
      const c = algolem(q.program.code, q.program.procedures);
      expect(c.ok, `${ctx}: ${!c.ok ? c.errors[0].message : ''}`).toBe(true);
      if (!c.ok) break;
      const r = run(c.program, createMachine(c.program, q.program.inputs), { maxSteps: 200_000 });
      expect(r.stoppedBy, `${ctx}: run must end (done / error / proven infinite), not hit the limit`).not.toBe('limit');
      if (q.type === 'predict') for (const a of q.ask) expect(c.program.counters.includes(a), `${ctx}: asks about unknown counter ${a}`).toBe(true);
      if (q.type === 'trace-fill') expect(r.stoppedBy, `${ctx}: trace-fill needs a run with output`).toBe('done');
      break;
    }
    case 'complete-code': {
      expect(q.template.includes('___'), `${ctx}: template needs ___`).toBe(true);
      const passing = q.options.filter((o) => runTests(q.template.replace('___', o), q.tests, q.procedures) === null);
      expect(passing, `${ctx}: exactly one option must pass the tests`).toHaveLength(1);
      break;
    }
    case 'build': {
      const err = runTests(q.solution, q.tests, q.procedures);
      expect(err, `${ctx}: the solution fails its own tests: ${err}`).toBeNull();
      break;
    }
    case 'find-bug': {
      const n = q.listing.split('\n').length;
      for (const l of q.bugLines) expect(l >= 1 && l <= n, `${ctx}: bug line ${l}`).toBe(true);
      break;
    }
    case 'order':
      expect(q.items.length, ctx).toBeGreaterThanOrEqual(3);
      break;
    case 'match':
      expect(q.pairs.length, ctx).toBeGreaterThanOrEqual(3);
      break;
    case 'set-answer':
      expect(() => evalSetExpr(q.expr, q.sets), `${ctx}: expression`).not.toThrow();
      break;
    case 'arrows-classify':
      for (const [a, b] of q.arrows) expect(q.domain.includes(a) && q.codomain.includes(b), `${ctx}: arrow ${a}→${b}`).toBe(true);
      break;
    case 'logo-state': {
      const r = execLogo(q.code, q.run ?? '');
      expect(r.ok && r.stoppedBy === 'done', `${ctx}: LOGO code must run to the end: ${!r.ok ? r.errors[0].message : r.state.error?.message}`).toBe(true);
      break;
    }
    case 'sim-goal':
      for (const v of Object.values(q.target)) expect(v >= 0, ctx).toBe(true);
      break;
    default:
      break;
  }
}

describe('course content', () => {
  it('ids are unique', () => {
    const ids = [...LESSONS.map((l) => l.id), ...QUESTIONS.map((q) => q.id)];
    expect(ids.filter((x, i) => ids.indexOf(x) !== i)).toEqual([]);
  });
  it('every reinforcement lesson in the skill map exists (once content is complete)', () => {
    const lessonIds = new Set(LESSONS.map((l) => l.id));
    const missing = Object.entries(SKILLS)
      .filter(([, s]) => LESSONS.some((l) => l.track === s.track) && !lessonIds.has(s.reinforce))
      .map(([k, s]) => `${k} → ${s.reinforce}`);
    expect(missing).toEqual([]);
  });
  for (const l of LESSONS) {
    it(`lesson ${l.id}`, () => {
      expect(TRACKS.some((t) => t.id === l.track)).toBe(true);
      expect(l.id.startsWith(l.track + '-')).toBe(true);
      for (const p of l.prerequisites) expect(LESSONS.some((x) => x.id === p), `${l.id}: prerequisite ${p}`).toBe(true);
      for (const s of l.skills) expect(SKILLS[s], `${l.id}: unknown skill ${s}`).toBeDefined();
      for (const p of [...l.sources.photos, ...(l.fromSource ?? []).flatMap((f) => f.photos)]) expect(p >= 1 && p <= 76, `${l.id}: photo ${p}`).toBe(true);
      expect(l.intro.goals.length).toBeGreaterThan(0);
      expect(l.glossary.length, `${l.id}: glossary`).toBeGreaterThan(0);
      expect(l.walkthrough.steps.length, `${l.id}: walkthrough steps`).toBeGreaterThanOrEqual(3);
      expect(l.summary.learned.length).toBeGreaterThan(0);
      checkWidget(l.visual, `${l.id} visual`);
      checkWidget(l.tryIt.widget, `${l.id} tryIt`);
      for (const [i, ex] of (l.moreExamples ?? []).entries()) if (ex.widget) checkWidget(ex.widget, `${l.id} example ${i}`);
      for (const st of l.walkthrough.steps) if (st.code && st.highlight) for (const h of st.highlight) expect(h <= st.code.split('\n').length, `${l.id}: highlight ${h}`).toBe(true);
      expect(l.check.lesson ?? l.id).toBe(l.id);
      checkQuestion(l.check);
    });
  }
  for (const q of QUESTIONS) it(`question ${q.id}`, () => checkQuestion(q));
});
