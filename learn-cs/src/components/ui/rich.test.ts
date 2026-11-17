import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { Rich } from '@/components/ui/Rich';
const html = (t: string) => renderToStaticMarkup(createElement(Rich, { text: t }));
it('isolates math-like runs but not Hebrew hyphenated words', () => {
  expect(html('אחרי n סיבובים: 65 − n כדורים.')).toContain('dir="ltr"');
  expect(html('הנוסחה B = B + 2·A נכונה')).toContain('>B = B + 2·A<');
  expect(html('פונקציה חד-חד-ערכית היא')).not.toContain('dir="ltr"');
  expect(html('ב-5 סיבובים')).not.toContain('dir="ltr"');
  expect(html('מ־5 → 4.')).toContain('>5 → 4<');
});
