import type { Metadata } from 'next';
import { Exam } from '@/components/practice/Exam';

export const metadata: Metadata = { title: 'הכנה למבחן' };

export default function Page() {
  return <Exam />;
}
