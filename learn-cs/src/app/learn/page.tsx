import type { Metadata } from 'next';
import { CourseMap } from '@/components/course/CourseMap';

export const metadata: Metadata = { title: 'מסלול הלימוד' };

export default function Page() {
  return <CourseMap />;
}
