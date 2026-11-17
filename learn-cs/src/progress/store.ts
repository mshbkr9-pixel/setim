/**
 * Learner progress — kept in localStorage in this first version.
 * The store is a tiny external store (useSyncExternalStore), so a future backend
 * (Supabase, accounts, sync between devices) only has to replace load()/save().
 */
import { useSyncExternalStore } from 'react';
import type { TrackId } from '@/content/types';

export interface Attempt {
  q: string;
  ok: boolean;
  t: number;
  skills: string[];
  misconception?: string;
  hints: number;
}

export interface ExamRecord {
  t: number;
  score: number;
  total: number;
  tracks: TrackId[];
  byTrack: Partial<Record<TrackId, { ok: number; total: number }>>;
  bySkill: Record<string, { ok: number; total: number }>;
}

export interface ProgressData {
  version: 1;
  lessons: Record<string, { visitedAt: number; completedAt?: number }>;
  attempts: Attempt[];
  /** skill → counters; `reinforcedAt` = last time the reinforcement lesson was completed. */
  skills: Record<string, { ok: number; bad: number; reinforcedAt?: number }>;
  /** Spaced repetition (Leitner boxes 1–5). key = question id or "c:<term>". */
  srs: Record<string, { box: number; due: number }>;
  exams: ExamRecord[];
  concepts: Record<string, number>;
  lastLesson?: string;
  /** YYYY-MM-DD → activity */
  daily: Record<string, { answered: number; correct: number; lessons: number }>;
  settings: { level: 1 | 2 | 3; speed: number; helperMode: 'local' | 'shared' };
}

const KEY = 'cs-course-progress-v1';
const DAY = 86_400_000;
export const SRS_INTERVALS = [0, 10 * 60_000, DAY, 3 * DAY, 7 * DAY, 16 * DAY];

export const emptyProgress = (): ProgressData => ({
  version: 1,
  lessons: {},
  attempts: [],
  skills: {},
  srs: {},
  exams: [],
  concepts: {},
  daily: {},
  settings: { level: 2, speed: 5, helperMode: 'local' },
});

const SERVER_SNAPSHOT = emptyProgress();
let current: ProgressData | null = null;
const listeners = new Set<() => void>();

function load(): ProgressData {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressData;
    if (parsed.version !== 1) return emptyProgress();
    return { ...emptyProgress(), ...parsed, settings: { ...emptyProgress().settings, ...parsed.settings } };
  } catch {
    return emptyProgress();
  }
}

function save(p: ProgressData) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* storage full or blocked — progress stays in memory for this visit */
  }
}

export function getProgress(): ProgressData {
  if (current === null) current = load();
  return current;
}

export function update(fn: (p: ProgressData) => ProgressData) {
  current = fn(getProgress());
  save(current);
  listeners.forEach((l) => l());
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = load();
      cb();
    }
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

export function useProgress(): ProgressData {
  return useSyncExternalStore(subscribe, getProgress, () => SERVER_SNAPSHOT);
}

const today = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

function bumpDaily(p: ProgressData, field: 'answered' | 'correct' | 'lessons', t = Date.now()): ProgressData['daily'] {
  const d = today(t);
  const cur = p.daily[d] ?? { answered: 0, correct: 0, lessons: 0 };
  return { ...p.daily, [d]: { ...cur, [field]: cur[field] + 1 } };
}

// ------------------------------------------------------------------ actions

export function visitLesson(id: string) {
  update((p) => ({ ...p, lastLesson: id, lessons: { ...p.lessons, [id]: { ...p.lessons[id], visitedAt: Date.now() } } }));
}

export function completeLesson(id: string, skills: string[], terms: string[]) {
  update((p) => {
    if (p.lessons[id]?.completedAt) return p;
    const now = Date.now();
    const sk = { ...p.skills };
    // completing a lesson counts as reinforcement for its skills
    for (const s of skills) sk[s] = { ...(sk[s] ?? { ok: 0, bad: 0 }), reinforcedAt: now };
    const concepts = { ...p.concepts };
    const srs = { ...p.srs };
    for (const term of terms) {
      if (!concepts[term]) concepts[term] = now;
      if (!srs['c:' + term]) srs['c:' + term] = { box: 1, due: now + DAY };
    }
    let next = { ...p, skills: sk, concepts, srs, lessons: { ...p.lessons, [id]: { visitedAt: now, completedAt: now } } };
    next = { ...next, daily: bumpDaily(next, 'lessons', now) };
    return next;
  });
}

export function recordAttempt(a: Omit<Attempt, 't'>) {
  update((p) => {
    const t = Date.now();
    const attempts = [...p.attempts, { ...a, t }].slice(-3000);
    const skills = { ...p.skills };
    for (const s of a.skills) {
      const cur = skills[s] ?? { ok: 0, bad: 0 };
      skills[s] = { ...cur, ok: cur.ok + (a.ok ? 1 : 0), bad: cur.bad + (a.ok ? 0 : 1) };
    }
    // spaced repetition: wrong answers enter box 1; right answers move up
    const srs = { ...p.srs };
    const item = srs[a.q];
    if (!a.ok) srs[a.q] = { box: 1, due: t + SRS_INTERVALS[1] };
    else if (item) {
      const box = Math.min(5, item.box + 1);
      srs[a.q] = { box, due: t + SRS_INTERVALS[box] };
    }
    let next: ProgressData = { ...p, attempts, skills, srs };
    next = { ...next, daily: bumpDaily(next, 'answered', t) };
    if (a.ok) next = { ...next, daily: bumpDaily(next, 'correct', t) };
    return next;
  });
}

export function reviewConcept(term: string, ok: boolean) {
  update((p) => {
    const t = Date.now();
    const item = p.srs['c:' + term] ?? { box: 1, due: t };
    const box = ok ? Math.min(5, item.box + 1) : 1;
    return { ...p, srs: { ...p.srs, ['c:' + term]: { box, due: t + SRS_INTERVALS[box] } } };
  });
}

export function recordExam(e: Omit<ExamRecord, 't'>) {
  update((p) => ({ ...p, exams: [...p.exams, { ...e, t: Date.now() }] }));
}

export function setSettings(s: Partial<ProgressData['settings']>) {
  update((p) => ({ ...p, settings: { ...p.settings, ...s } }));
}

export function resetProgress() {
  update(() => emptyProgress());
}

// ------------------------------------------------------------------ derived

/**
 * A skill needs reinforcement when at least 3 of its last 6 attempts were wrong and those
 * mistakes happened after the last time its reinforcement lesson was completed.
 */
export function weakSkills(p: ProgressData): string[] {
  const bySkill = new Map<string, Attempt[]>();
  for (const a of p.attempts) for (const s of a.skills) bySkill.set(s, [...(bySkill.get(s) ?? []), a]);
  const out: string[] = [];
  for (const [s, list] of bySkill) {
    const since = p.skills[s]?.reinforcedAt ?? 0;
    const recent = list.slice(-6);
    const bad = recent.filter((a) => !a.ok && a.t > since).length;
    if (bad >= 3) out.push(s);
  }
  return out;
}

export function dueReviews(p: ProgressData, now = Date.now()): string[] {
  return Object.entries(p.srs)
    .filter(([, v]) => v.due <= now && v.box < 6)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([k]) => k);
}

export function questionStats(p: ProgressData) {
  const seen = new Map<string, boolean>();
  for (const a of p.attempts) if (a.ok) seen.set(a.q, true);
  return { answered: p.attempts.length, correct: p.attempts.filter((a) => a.ok).length, distinctCorrect: seen.size };
}

// ------------------------------------------------------------------ time (client only)
let nowCache = 0;
const noopSubscribe = () => () => {};
/** Current time on the client (null while prerendering), cached so renders stay consistent. */
export function useNow(): number | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      if (!nowCache || Date.now() - nowCache > 60_000) nowCache = Date.now();
      return nowCache;
    },
    () => null,
  );
}
