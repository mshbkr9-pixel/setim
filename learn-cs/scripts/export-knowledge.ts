/**
 * Exports the structured knowledge base and the reports:
 *   content/knowledge-base.json  — every topic (lesson) and question, with engine-verified solutions
 *   content/COURSE_MAP.md        — the full course map
 *   content/SOURCE_COVERAGE.md   — proof that all 76 photos were examined + where each is used
 * Run: npx tsx scripts/export-knowledge.ts
 */
import { writeFileSync } from 'node:fs';
import { LESSONS, QUESTIONS } from '../src/content';
import { TRACKS, SKILLS } from '../src/content/skills';
import { DOCS, PHOTOS } from '../src/content/sources';
import { solutionText } from '../src/questions/grade';
import type { Widget } from '../src/content/types';

const codeOf = (w: Widget): string | null => ('code' in w ? (w as { code: string }).code : null);

const kb = {
  generatedAt: new Date().toISOString(),
  source: {
    pdfPages: 98,
    guidePages: '1–22 (processed study guide, secondary)',
    photos: 76,
    note: 'Photo N = PDF page N+22. Per-photo transcriptions: content/source/analysis/photo-NN.md',
  },
  contentKinds: { source: 'original lecturer material', explanation: 'new explanation', new: 'new example/exercise' },
  tracks: TRACKS.map((t) => ({ id: t.id, title: t.title, units: t.units })),
  topics: LESSONS.map((l) => ({
    id: l.id,
    track: l.track,
    title: l.title,
    description: l.subtitle,
    concepts: l.glossary.map((g) => ({ term: g.term, simple: g.simple, formal: g.formal ?? null })),
    explanation: l.explain,
    sourceQuotes: (l.fromSource ?? []).map((f) => ({ text: f.text, photos: f.photos, origin: 'source' })),
    examples: [
      { title: l.walkthrough.title, origin: l.walkthrough.origin, steps: l.walkthrough.steps.length },
      ...(l.moreExamples ?? []).map((e) => ({ title: e.title, origin: e.origin, code: e.widget ? codeOf(e.widget) : null })),
    ],
    code: [codeOf(l.visual), codeOf(l.tryIt.widget)].filter(Boolean),
    questions: QUESTIONS.filter((q) => q.lesson === l.id).map((q) => q.id),
    sourcePhotos: l.sources.photos,
    pdfPages: l.sources.photos.map((p) => p + 22),
    guidePages: l.sources.guidePages ?? [],
    difficulty: l.difficulty,
    prerequisites: l.prerequisites,
    interactive: [l.visual.kind, l.tryIt.widget.kind],
    sourceConfidence: l.confidence,
    skills: l.skills,
  })),
  questions: QUESTIONS.map((q) => ({
    id: q.id,
    track: q.track,
    lesson: q.lesson ?? null,
    type: q.type,
    origin: q.origin,
    difficulty: q.difficulty,
    skills: q.skills,
    prompt: q.prompt,
    hints: q.hints,
    explanation: q.explanation,
    verifiedSolution: solutionText(q),
    sourcePhotos: q.sources?.photos ?? [],
  })),
};
writeFileSync('content/knowledge-base.json', JSON.stringify(kb, null, 1));

// ---------------------------------------------------------------- course map
const md: string[] = ['# מפת הקורס', '', `${LESSONS.length} שיעורים, ${QUESTIONS.length} שאלות. נוצר אוטומטית מתוך תוכן האתר (scripts/export-knowledge.ts).`, ''];
for (const t of TRACKS) {
  md.push(`## ${t.title} (${t.units.join(', ')})`, '');
  md.push('| # | שיעור | צילומי מקור | עמודי PDF | קושי | שאלות | המחשה |', '|---|---|---|---|---|---|---|');
  for (const l of LESSONS.filter((x) => x.track === t.id).sort((a, b) => a.order - b.order)) {
    const qs = QUESTIONS.filter((q) => q.lesson === l.id).length;
    md.push(`| ${l.order} | ${l.title} | ${l.sources.photos.join(', ')} | ${l.sources.photos.map((p) => p + 22).join(', ')} | ${l.difficulty} | ${qs} | ${l.visual.kind}, ${l.tryIt.widget.kind} |`);
  }
  md.push('');
}
md.push('## נושאי המיומנויות ושיעורי החיזוק', '', '| מיומנות | מסלול | שיעור חיזוק |', '|---|---|---|');
for (const [k, s] of Object.entries(SKILLS)) md.push(`| ${s.title} (\`${k}\`) | ${s.track} | ${s.reinforce} |`);
writeFileSync('content/COURSE_MAP.md', md.join('\n') + '\n');

// ---------------------------------------------------------------- source coverage
const cov: string[] = [
  '# דוח כיסוי מקורות',
  '',
  'קובץ המקור: 98 עמודים. עמודים 1–22 — מחברת לימוד מעובדת (הטקסט חולץ ל־`content/source/pdf-text/`). עמודים 23–98 — 76 צילומי מקור (`public/source/photo-NN.jpg`, צילום N = עמוד N+22).',
  '',
  'כל צילום חולץ כקובץ נפרד (זהה בבתים לקובץ שבתוך ה־PDF), הוגדל לאריחים ונקרא בנפרד. התמלול המלא — טקסט, קוד, טבלאות, תיאור חזותי ורשימת פרטים לא ודאיים — נמצא ב־`content/source/analysis/photo-NN.md`.',
  '',
  `- צילומים שנבדקו: **${PHOTOS.length}/76**`,
  `- ודאות פענוח כוללת "גבוהה": ${PHOTOS.filter((p) => p.confidence === 'high').length}/76 (פרטים בודדים לא ודאיים מסומנים בכל קובץ)`,
  `- צילומים שמקושרים לפחות לשיעור אחד: ${PHOTOS.filter((p) => LESSONS.some((l) => l.sources.photos.includes(p.photo) || (l.fromSource ?? []).some((f) => f.photos.includes(p.photo)))).length}/76`,
  '',
];
for (const d of DOCS) {
  cov.push(`## ${d.code} — ${d.title}`, '', d.note, '', '| צילום | עמוד PDF | עמוד/שקף | ודאות | פרטים לבדיקה | שיעורים | שאלות |', '|---|---|---|---|---|---|---|');
  for (const n of [...d.photos].sort((a, b) => b - a)) {
    const p = PHOTOS.find((x) => x.photo === n)!;
    const ls = LESSONS.filter((l) => l.sources.photos.includes(n) || (l.fromSource ?? []).some((f) => f.photos.includes(n))).map((l) => l.id);
    const qs = QUESTIONS.filter((q) => q.sources?.photos.includes(n)).length;
    cov.push(`| ${n} | ${n + 22} | ${p.number.replace(/\|/g, '/').slice(0, 40)} | ${p.confidence} | ${p.uncertain} | ${ls.join(', ') || '—'} | ${qs} |`);
  }
  cov.push('');
}
writeFileSync('content/SOURCE_COVERAGE.md', cov.join('\n') + '\n');
console.log(`exported ${LESSONS.length} topics, ${QUESTIONS.length} questions`);
