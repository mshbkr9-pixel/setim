'use client';
import { useState } from 'react';
import { ArrowsLab, GraphLab } from '@/components/widgets/FunctionsLab';
import { checkRule, RULES, SET_LABEL, type NumSet, type Rule } from '@/engines/functions';

const PRESETS: { id: string; title: string; d: string[]; c: string[]; a: [string, string][] }[] = [
  { id: '1', title: '(1) חץ אחד מכל איבר', d: ['1', '2', '3'], c: ['א', 'ב', 'ג'], a: [['1', 'א'], ['2', 'ב'], ['3', 'ג']] },
  { id: '2', title: '(2) איבר בטווח בלי חץ', d: ['1', '2', '3'], c: ['א', 'ב', 'ג', 'ד'], a: [['1', 'א'], ['2', 'ב'], ['3', 'ג']] },
  { id: '3', title: '(3) שני קלטים לאותו פלט', d: ['1', '2', '3'], c: ['א', 'ב'], a: [['1', 'א'], ['2', 'ב'], ['3', 'ב']] },
  { id: '4', title: '(4) קלט אחד לשני פלטים', d: ['1', '2', '3'], c: ['א', 'ב', 'ג', 'ד'], a: [['1', 'א'], ['2', 'ב'], ['2', 'ג'], ['3', 'ד']] },
  { id: '5', title: '(5) קלט בלי חץ', d: ['1', '2', '3'], c: ['א', 'ב', 'ג'], a: [['1', 'א'], ['3', 'ג']] },
];

function RuleChecker() {
  const [rule, setRule] = useState<Rule>('square');
  const [dom, setDom] = useState<NumSet>('R');
  const [rng, setRng] = useState<NumSet>('N');
  const r = checkRule(rule, dom, rng);
  return (
    <div className="card space-y-3 p-3 sm:p-4">
      <h3 className="text-lg">תחום וטווח מול כלל ההתאמה</h3>
      <div className="flex flex-wrap items-center gap-2" dir="ltr">
        <span className="font-mono">f :</span>
        <select className="input w-auto font-mono" value={dom} onChange={(e) => setDom(e.target.value as NumSet)} aria-label="תחום">{(['N', 'Z', 'R', '012'] as NumSet[]).map((s) => <option key={s} value={s}>{SET_LABEL[s]}</option>)}</select>
        <span className="font-mono">→</span>
        <select className="input w-auto font-mono" value={rng} onChange={(e) => setRng(e.target.value as NumSet)} aria-label="טווח">{(['N', 'Z', 'R'] as NumSet[]).map((s) => <option key={s} value={s}>{SET_LABEL[s]}</option>)}</select>
        <span className="font-mono">,</span>
        <select className="input w-auto font-mono" value={rule} onChange={(e) => setRule(e.target.value as Rule)} aria-label="כלל התאמה">{(Object.keys(RULES) as Rule[]).map((k) => <option key={k} value={k}>{RULES[k].label}</option>)}</select>
      </div>
      <p className={`rounded-lg p-2 ${r.ok ? 'bg-ok-soft' : 'bg-bad-soft'}`}>
        {r.ok ? (
          <>✓ זו פונקציה: לכל קלט מ־{SET_LABEL[dom]} הכלל נותן תשובה אחת, והיא שייכת ל־{SET_LABEL[rng]}.</>
        ) : r.counter!.reason === 'undefined' ? (
          <>✗ זו אינה פונקציה בהגדרה הזו: עבור <span className="font-mono" dir="ltr">a = {r.counter!.a}</span> הכלל לא נותן תשובה בכלל.</>
        ) : (
          <>✗ זו אינה פונקציה בהגדרה הזו: עבור <span className="font-mono" dir="ltr">a = {r.counter!.a}</span> מתקבל <span className="font-mono" dir="ltr">{Number.isInteger(r.counter!.value) ? r.counter!.value : r.counter!.value.toFixed(4).replace(/0+$/, '')}</span>, שאינו שייך ל־{SET_LABEL[rng]}.</>
        )}
      </p>
      <p className="text-sm muted">נסו את דוגמאות המחברת: f(a)=a² עם ℝ→ℕ (נכשל ב־2.5), עם ℕ→ℝ (תקין), ועם {'{0,1,2}'}→ℕ (תקין — צמצום התחום).</p>
    </div>
  );
}

export function FunctionsWorkbench() {
  const [p, setP] = useState(PRESETS[0]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-medium">דיאגרמה:</span>
        {PRESETS.map((x) => <button key={x.id} className={`btn btn-sm ${p.id === x.id ? 'btn-primary' : ''}`} onClick={() => setP(x)}>{x.title}</button>)}
      </div>
      <ArrowsLab key={p.id} domain={p.d} codomain={p.c} arrows={p.a} editable />
      <div className="grid gap-4 md:grid-cols-2">
        <RuleChecker />
        <GraphLab rules={['square', 'identity']} domain="R" />
      </div>
    </div>
  );
}
