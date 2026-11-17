import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LESSONS, LESSON_BY_ID, lessonsOf, questionsOf } from '@/content';
import { LessonView } from '@/components/lesson/LessonView';

export function generateStaticParams() {
  return LESSONS.map((l) => ({ lesson: l.id }));
}

type Props = { params: Promise<{ lesson: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lesson } = await params;
  const l = LESSON_BY_ID[lesson];
  return { title: l ? l.title : 'שיעור' };
}

/** The route shell is URL-independent; the lesson (URL data) streams in behind Suspense. */
export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl animate-pulse space-y-4"><div className="h-10 w-2/3 rounded bg-paper-2" /><div className="h-40 rounded bg-paper-2" /></div>}>
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: Props) {
  const { lesson: id } = await params;
  const lesson = LESSON_BY_ID[id];
  if (!lesson) notFound();
  const list = lessonsOf(lesson.track);
  const i = list.findIndex((l) => l.id === id);
  const prev = i > 0 ? { id: list[i - 1].id, title: list[i - 1].title } : undefined;
  const next = i < list.length - 1 ? { id: list[i + 1].id, title: list[i + 1].title } : undefined;
  const quiz = questionsOf({ lesson: id }).filter((q) => q.id !== lesson.check.id).slice(0, 4);
  return <LessonView lesson={lesson} prev={prev} next={next} quiz={quiz} />;
}
