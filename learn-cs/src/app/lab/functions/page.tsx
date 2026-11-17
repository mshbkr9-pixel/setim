import type { Metadata } from 'next';
import { FunctionsWorkbench } from '@/components/labs/FunctionsWorkbench';

export const metadata: Metadata = { title: 'פונקציות' };

export default function Page() {
  return (
    <div className="space-y-4">
      <header>
        <p className="kicker">מעבדה</p>
        <h1 className="text-3xl">פונקציות</h1>
        <p className="mt-1 max-w-3xl text-ink-2">חברו חצים מהתחום לטווח ובדקו: האם זו פונקציה? האם לכל קלט יש פלט, ורק אחד? האם היא חד־חד־ערכית? האם היא על? ובנוסף — מה קורה כשמשנים תחום או טווח לאותו כלל התאמה, ומה ההבדל בין גרף בדיד לרציף.</p>
      </header>
      <FunctionsWorkbench />
    </div>
  );
}
