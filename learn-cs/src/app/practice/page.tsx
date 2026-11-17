import type { Metadata } from 'next';
import { Practice } from '@/components/practice/Practice';

export const metadata: Metadata = { title: 'תרגול' };

export default function Page() {
  return <Practice />;
}
