import type { Metadata } from 'next';
import { CourseMap } from '@/components/course/CourseMap';
import { lessonIndex } from '@/content/lessonIndex';

export const metadata: Metadata = { title: 'מסלול הלימוד' };

export default function Page() {
  return <CourseMap lessons={lessonIndex()} />;
}
