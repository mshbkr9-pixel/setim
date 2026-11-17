import { LESSONS } from './index';
import type { TrackId } from './types';

/** Slim lesson list for client components that only need titles and order (keeps the full bank off the client). */
export interface LessonMeta {
  id: string;
  track: TrackId;
  order: number;
  title: string;
  subtitle: string;
  minutes: number;
}

export function lessonIndex(): LessonMeta[] {
  return LESSONS.map(({ id, track, order, title, subtitle, minutes }) => ({ id, track, order, title, subtitle, minutes }));
}
