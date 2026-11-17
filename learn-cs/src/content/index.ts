import type { Lesson, Question, TrackId } from './types';
import { exampleLesson } from './lessons/_example';
import { logoLessons } from './lessons/logo';
import { algolemLessons } from './lessons/algolem';
import { traceLessons } from './lessons/trace';
import { errorsLessons } from './lessons/errors';
import { setsLessons } from './lessons/sets';
import { functionsLessons } from './lessons/functions';
import { logoQuestions } from './questions/logo';
import { algolemQuestions } from './questions/algolem';
import { traceQuestions } from './questions/trace';
import { errorsQuestions } from './questions/errors';
import { setsQuestions } from './questions/sets';
import { functionsQuestions } from './questions/functions';

const withExample = (ls: Lesson[]) => (ls.some((l) => l.id === exampleLesson.id) ? ls : [...ls, exampleLesson]);

export const LESSONS: Lesson[] = [
  ...logoLessons,
  ...withExample(algolemLessons),
  ...traceLessons,
  ...errorsLessons,
  ...setsLessons,
  ...functionsLessons,
].sort((a, b) => (a.track === b.track ? a.order - b.order : 0));

export const QUESTIONS: Question[] = [
  ...logoQuestions,
  ...algolemQuestions,
  ...traceQuestions,
  ...errorsQuestions,
  ...setsQuestions,
  ...functionsQuestions,
  ...LESSONS.map((l) => l.check),
];

export const LESSON_BY_ID: Record<string, Lesson> = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

export function lessonsOf(track: TrackId): Lesson[] {
  return LESSONS.filter((l) => l.track === track).sort((a, b) => a.order - b.order);
}

export function questionsOf(filter: { track?: TrackId; lesson?: string; skill?: string }): Question[] {
  return QUESTIONS.filter(
    (q) => (!filter.track || q.track === filter.track) && (!filter.lesson || q.lesson === filter.lesson) && (!filter.skill || q.skills.includes(filter.skill)),
  );
}
