import type { Metadata } from 'next';
import { LogoWorkbench } from '@/components/logo/LogoWorkbench';

export const metadata: Metadata = { title: 'סימולטור LOGO' };

export default function Page() {
  return (
    <div className="space-y-4">
      <header>
        <p className="kicker">מעבדה</p>
        <h1 className="text-3xl">סימולטור LOGO</h1>
        <p className="mt-1 max-w-3xl text-ink-2">
          בחלון העליון כותבים הגדרות (TO ... END) או פקודות, ובשורת ה־Commander מפעילים — כמו בתוכנה שבשקפים. הריצו פקודה אחת בכל פעם וראו את מיקום הצב, הכיוון, מצב העט ומחסנית הזיכרון.
        </p>
      </header>
      <LogoWorkbench />
    </div>
  );
}
