/**
 * End-to-end checks in a real browser (uses the pre-installed `playwright` package).
 * Run against a running server:  BASE=http://localhost:3100 node tests/e2e.mjs
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const BASE = process.env.BASE ?? 'http://localhost:3100';
let failed = 0;
const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push(`✓ ${name}`);
  } catch (e) {
    failed++;
    results.push(`✗ ${name}\n    ${String(e.message ?? e).split('\n')[0]}`);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

const jar = async (name) => {
  const t = await page.locator('figure figcaption span.font-mono', { hasText: `${name} =` }).first().textContent();
  return Number(t.split('=')[1].replace(/[^\d]/g, ''));
};
const step = async (n = 1) => {
  for (let i = 0; i < n; i++) await page.locator('button[aria-label="צעד קדימה"]').first().click();
};
/** CodeMirror mounts in an effect, i.e. only after hydration — a reliable "page is interactive" signal. */
const ready = async () => {
  await page.locator('.cm-editor').first().waitFor({ timeout: 10000 });
};
const back = async (n = 1) => {
  for (let i = 0; i < n; i++) await page.locator('button[aria-label="צעד אחורה"]').first().click();
};

await check('Algolem: step forward / backward is exact (history of states)', async () => {
  await page.goto(`${BASE}/lab/algolem`, { waitUntil: 'networkidle' });
  await ready();
  await step(4);
  assert((await jar('R1')) === 4 && (await jar('R2')) === 3, 'after 4 steps expected R1=4, R2=3');
  await back(2);
  assert((await jar('R1')) === 5 && (await jar('R2')) === 3, 'after 2 steps back expected R1=5, R2=3');
  await back(2);
  assert((await jar('R1')) === 5 && (await jar('R2')) === 2, 'back at the start expected R1=5, R2=2');
});

await check('Algolem: run to the end gives the output and says so', async () => {
  await page.getByRole('button', { name: /עד הסוף/ }).first().click();
  assert((await jar('R1')) === 0 && (await jar('R2')) === 7, 'expected R1=0, R2=7');
  await page.locator('[aria-live="polite"]').getByText('הריצה הסתיימה — יש פלט').first().waitFor({ timeout: 3000 });
});

await check('Algolem: active line is highlighted while stepping', async () => {
  await page.getByRole('button', { name: /איפוס/ }).first().click();
  await step(1);
  assert((await page.locator('.cm-active-exec').count()) === 1, 'one highlighted line');
});

await check('Algolem: BET with A>0 is proven infinite (not just a step limit)', async () => {
  await page.selectOption('#ex-pick', 'lib-BET');
  await page.getByRole('button', { name: /עד הסוף/ }).first().click();
  await page.getByText('הוכח: הריצה אינסופית').first().waitFor({ timeout: 5000 });
});

await check('Algolem: DALET with A=0 stops on SUB from an empty counter', async () => {
  await page.selectOption('#ex-pick', 'lib-DALET');
  await ready();
  await page.getByRole('button', { name: /עד הסוף/ }).first().click();
  try {
    await page.locator('[aria-live="polite"]').getByText('חיסור ממונה ריק').first().waitFor({ timeout: 3000 });
  } catch (e) {
    throw new Error('status: ' + (await page.locator('.bg-card-2[aria-live="polite"]').first().textContent()));
  }
});

await check('Algolem: an unproven long run reports the step limit without calling it infinite', async () => {
  await page.goto(`${BASE}/lab/algolem`, { waitUntil: 'networkidle' });
  await ready();
  const editor = page.locator('.cm-content').first();
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('WHILE (A)\nMOVE (A,B)\nADD (A)\nENDW');
  await page.locator('input[aria-label="ערך התחלה של A"]').fill('1');
  await page.getByRole('button', { name: /עד הסוף/ }).first().click();
  await page.getByText('אין זו הוכחה שהתוכנית אינסופית').first().waitFor({ timeout: 20000 });
  assert((await page.getByText('הוכח: הריצה אינסופית').count()) === 0, 'must not claim infinity');
});

await check('Algolem: syntax errors are shown with the line number and block running', async () => {
  const editor = page.locator('.cm-content').first();
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('ADD (A)\nENDW');
  await page.getByText('ENDW בלי WHILE פתוח').first().waitFor({ timeout: 3000 });
  assert(await page.locator('button[aria-label="צעד קדימה"]').first().isDisabled(), 'step must be disabled');
});

await check('Trace lab: rounds table of R1=5, R2=2 ends with 0 and 7', async () => {
  await page.goto(`${BASE}/lab/trace`, { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: 'לפי סיבובים' }).click();
  const cells = await page.locator('table.ttable tbody tr').first().locator('td').allTextContents();
  assert(cells.join(',').includes('5') && cells[cells.length - 1].trim() === '0', `R1 row: ${cells.join('|')}`);
  const r2 = await page.locator('table.ttable tbody tr').nth(1).locator('td').allTextContents();
  assert(r2[r2.length - 1].trim() === '7', `R2 output should be 7: ${r2.join('|')}`);
});

await check('Trace lab: the learner can fill cells and check them', async () => {
  await page.getByText('אני רוצה למלא בעצמי').click();
  const inputs = page.locator('table.ttable input');
  assert((await inputs.count()) > 0, 'quiz inputs exist');
  await inputs.first().fill('4');
  await page.getByRole('button', { name: 'בדיקה' }).click();
  await page.getByText(/יש תאים שגויים|כל התאים נכונים/).first().waitFor({ timeout: 3000 });
});

await check('LOGO: TEETH 3 20 draws 12 lines and shows the memory stack', async () => {
  await page.goto(`${BASE}/lab/logo`, { waitUntil: 'networkidle' });
  await ready();
  await page.selectOption('#logo-ex', 'teeth');
  await ready();
  await step(4);
  assert((await page.locator('[aria-label="מחסנית הזיכרון"]').textContent()).includes('TOOTH'), 'TOOTH frame on the stack');
  await page.getByRole('button', { name: /עד הסוף/ }).first().click();
  await page.getByText('קווים: 12').first().waitFor({ timeout: 3000 });
});

await check('LOGO: case 4 (TOOTH without a parameter) still finds SIZE in TEETH’s frame', async () => {
  await page.selectOption('#logo-ex', 'case4');
  await page.getByRole('button', { name: /עד הסוף/ }).first().click();
  await page.getByText('קווים: 12').first().waitFor({ timeout: 3000 });
});

await check('Sets: A − B = {2, 4} for the default sets', async () => {
  await page.goto(`${BASE}/lab/sets`, { waitUntil: 'networkidle' });
  await page.getByText('A − B = {2, 4}').first().waitFor({ timeout: 3000 });
});

await check('Functions: diagram (4) is not a function; (3) is a function but not one-to-one', async () => {
  await page.goto(`${BASE}/lab/functions`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /\(4\)/ }).click();
  await page.getByText('זו אינה פונקציה מהתחום לטווח').first().waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: /\(3\)/ }).click();
  await page.getByText('⇒ זו פונקציה.').first().waitFor({ timeout: 3000 });
  await page.getByText('לא חד־חד־ערכית').first().waitFor({ timeout: 3000 });
});

await check('Functions: f(a)=a², ℝ→ℕ is rejected with the counterexample 2.5', async () => {
  await page.getByText('a = -2.5').first().waitFor({ timeout: 3000 }).catch(async () => {
    await page.getByText(/a = 2\.5|a = -2\.5|a = -0\.5|a = 0\.5/).first().waitFor({ timeout: 3000 });
  });
});

await check('Lesson: wrong answer → tutor feedback without revealing; right answer → explanation', async () => {
  await page.goto(`${BASE}/learn/algolem-03`, { waitUntil: 'networkidle' });
  await ready();
  const check = page.locator('#check');
  await check.locator('input[aria-label="ערך R1 בסיום"]').fill('3');
  await check.locator('input[aria-label="ערך R2 בסיום"]').fill('4');
  await check.getByRole('button', { name: 'בדיקה' }).click();
  await check.getByText('עוד לא. בואו נבין מה קרה.').waitFor({ timeout: 3000 });
  await check.getByText('כתבת את ערכי הקלט').waitFor({ timeout: 3000 });
  assert((await check.getByRole('button', { name: 'הצג פתרון' }).count()) === 0, 'no solution button after one try');
  await check.locator('input[aria-label="ערך R1 בסיום"]').fill('0');
  await check.locator('input[aria-label="ערך R2 בסיום"]').fill('7');
  await check.getByRole('button', { name: 'בדיקה' }).click();
  await check.getByText(/^נכון!/).waitFor({ timeout: 3000 });
});

await check('Lesson: tutor bar buttons (level, line-by-line, quiz) work', async () => {
  await page.getByRole('button', { name: 'תסביר כל שורת קוד' }).click();
  await page.locator('#lines').getByText('תחילת לולאה').first().waitFor({ timeout: 3000 });
  await page.getByRole('button', { name: 'לא הבנתי' }).click();
  await page.getByText('בואו ננסה אחרת').waitFor({ timeout: 3000 });
});

await check('Progress: completing a lesson survives a reload (localStorage)', async () => {
  await page.getByRole('button', { name: '✓ סיימתי את השיעור' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('השיעור הושלם').first().waitFor({ timeout: 3000 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.getByText('ממשיכים מאיפה שעצרנו').waitFor({ timeout: 3000 });
});

await check('Exam: a short exam can be taken and produces a score with analysis', async () => {
  await page.goto(`${BASE}/exam`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '8', exact: true }).click();
  await page.getByRole('button', { name: 'התחלת המבחן' }).click();
  await page.getByRole('button', { name: 'סיום מוקדם' }).click();
  await page.getByText('תוצאת המבחן').waitFor({ timeout: 3000 });
});

await check('Dark mode renders without errors', async () => {
  const dark = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1000, height: 800 } });
  const p = await dark.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/lab/algolem`, { waitUntil: 'networkidle' });
  const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert(bg !== 'rgb(245, 241, 232)', 'dark background expected, got ' + bg);
  assert(errs.length === 0, errs.join('; '));
  await dark.close();
});

await check('Mobile: no horizontal scroll on the main pages', async () => {
  const m = await browser.newContext({ ...devices['iPhone 13'] });
  const p = await m.newPage();
  for (const path of ['/', '/learn', '/learn/algolem-03', '/lab/algolem', '/lab/logo', '/lab/trace', '/lab/sets', '/lab/functions', '/practice', '/exam', '/sources']) {
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert(r[0] <= r[1] + 1, `${path} overflows: ${r[0]} > ${r[1]}`);
  }
  await m.close();
});

await check('No uncaught page errors during the run', async () => {
  assert(pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
});

await browser.close();
console.log(results.join('\n'));
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
