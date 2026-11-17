import { Dashboard } from '@/components/dashboard/Dashboard';
import { lessonIndex } from '@/content/lessonIndex';

export default function Home() {
  return <Dashboard lessons={lessonIndex()} />;
}
