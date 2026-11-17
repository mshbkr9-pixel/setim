# Brief: writing one track of the course (lessons + question bank)

Project root: `/home/user/setim/learn-cs` (Next.js + TypeScript). You write **data files only**.

## Audience and goal
A Hebrew-speaking adult who starts from zero (no programming, no math background) learns the whole
course from this site without opening the PDF. Every lesson must be understandable by a beginner,
split into short steps — never long paragraphs. Hebrew text, code in English.

## Read first (in this order)
1. `src/content/types.ts` — the schema. Your files must type-check against it.
2. `src/content/skills.ts` — track list, skill tags (with the lesson id that reinforces each skill)
   and misconception tags. Use only these tags. Your lesson ids MUST match the `reinforce` ids of
   your track's skills (e.g. `algolem-01` … `algolem-10`).
3. `src/content/lessons/_example.ts` — the model lesson. Match its depth, tone and structure.
4. The source material for your track (listed in your task): the per-photo transcriptions in
   `content/source/analysis/photo-NN.md` and the relevant pages of the PDF study guide in
   `content/source/pdf-text/pNNN.txt` (pages 1–22 of the PDF; it is a *secondary*, processed
   summary — when it disagrees with a photo transcription, the photo wins).
   The transcriptions are faithful readings of the lecturer's slides/pages with an "Uncertain items"
   list — never present an uncertain reading as certain.

## Output
- `src/content/lessons/<track>.ts` exporting `export const <track>Lessons: Lesson[]`
- `src/content/questions/<track>.ts` exporting `export const <track>Questions: Question[]`
(Replace the placeholder files. Do not edit any other file. The algolem writer re-exports the model
lesson as `algolem-03`: `import { exampleLesson } from './_example'` and put it in the array.)

## Three kinds of content — never mix them without the label
- `origin: 'source'` — the lecturer's original material: quoted or faithfully restated from a photo,
  always with the photo numbers. Use `fromSource` in lessons for the lecturer's own wording,
  definitions and examples. Source exercises (from exercise pages / task sheets) become questions
  with `origin: 'source'` and `sources.photos`.
- `origin: 'explanation'` — a new explanation written to clarify (walkthroughs usually).
- `origin: 'new'` — a new example or exercise you wrote for practice.

## Lesson requirements (every lesson has all eight parts)
א intro (what / why / goals) · ב glossary (3–6 terms, each explained for a 12-year-old) ·
ג explanation in 3 levels (beginner / regular / advanced) + an interactive `visual` widget ·
ד walkthrough of 4–8 small steps (no skipped actions; show state in `state` when useful) ·
ה tryIt: a task + an interactive widget the learner changes · ו one `check` question (no answer
revealed in the prompt) · ז feedback: 2–3 graded hints, an explanation, and for MCQ a `feedback` +
`misconception` on each wrong choice · ח summary (learned + what comes next).
Add 1–3 `moreExamples` (for the "תן לי דוגמה אחרת" button). Cite `sources.photos` for every lesson.
Prefer interactive widgets over text: whatever can be shown by running code or dragging should be.
Use the original order of the material when it is clear; add a preparation lesson when needed.

## Question bank requirements (per track, at least 24 questions besides the lesson checks)
Mix the types: `mcq`, `predict`, `complete-code`, `find-bug`, `trace-fill`, `order`, `build`,
`sim-goal`, `match`, `numeric`, `set-answer`, `arrows-classify`, `logo-state` — whichever fit your
track (at least 6 different types). Difficulty mix 1/2/3. Include every exercise from the source
exercise pages of your track as `origin: 'source'` questions (adapt the format, keep the content).
Every question: id `<track>-q-NNN`, `lesson` (the lesson it belongs to), skills, 2–3 hints that do
not give the answer away, and a full explanation.

**Never hard-code an answer that an engine can compute.** For `predict`, `trace-fill`, `build`,
`complete-code`, `set-answer`, `arrows-classify`, `logo-state` you give only the program/data —
the site computes the correct answer with the deterministic engines. For `build` you also give a
`solution` (hidden), and for `complete-code` exactly one option must pass the tests.
For `mcq` / `numeric` / `order` / `match` / `find-bug` answers you write yourself, verify them
(for Algolem/LOGO facts, by running the engine — see "Checking" below).

## Facts about the engines (they are the ground truth)
- Algolem (`src/engines/algolem`): `ADD (X)`, `SUB (X)` (illegal on an empty counter → no output),
  `WHILE (X) ... ENDW`; procedures `@ NAME (A,B)`. The course library is always available, verbatim
  from the photos: ZERO, ONE, TWO, FIVE, TEN, HUN, MOVE, S, ALEF, BET, GIMEL, DALET, HE — see
  `src/engines/algolem/library.ts`. Helper counters inside a procedure are private to the call by
  default (an implementation choice; the course does not say — do not claim the course says it).
  Line numbers like `1.` at the start of a line are allowed (as on the slides).
  A run ends in one of: output, SUB from an empty counter, proven infinite loop, or step limit.
- LOGO (`src/engines/logo`): FD BK RT LT PU PD HOME CS REPEAT n [ ... ], TO NAME :P ... END,
  expressions with + − * / and parentheses. Turtle starts at (0,0) facing up (heading 0), angles
  clockwise. Variables are looked up through the call stack (MSWLogo behaviour, photo 73).
  In a `logo` widget, `code` holds definitions (and commands); `run` is the Commander line.
- Sets (`src/engines/sets`): finite sets of numbers/strings; `set-answer.expr` like `"A - B"` (the
  course writes difference with a hyphen; `\` also works). Infinite sets (ℕ, ℤ, ℝ) cannot be
  computed — ask about them with mcq/match instead.
- Functions (`src/engines/functions`): arrow diagrams → function / one-to-one / onto.

## Text format (RichText)
`**bold**`, `` `code` `` (rendered LTR), `$math$` (KaTeX: write `\\mathbb{N}`, `\\in`, `\\subseteq`,
`\\emptyset` inside TS strings with escaped backslashes), "\n" line breaks, lines starting "- " are
bullets. Keep sentences short. Do not use HTML.

## Widgets
See `Widget` in types.ts. Notes:
- `algolem`: runnable simulator (balls in jars, step/back/run, trace). `inputs` keys must be
  counters that appear in the code. `panels` can open 'trace', 'frames', 'modular', 'lines'.
- `counters`: static jars (e.g. the R1–R6 drawing of photo 53: 4, 9, 2, 0, 6, 11 balls).
- `trace`: a generated trace table ('lines' = column per executed line, 'rounds' = per loop round,
  'modular' = per code segment with formulas); `quiz: true` lets the learner fill cells.
- `label-table`: the lecturer's nested label tables (photos 3, 28, 44–51) — code + label cells
  spanning line ranges (`level` 1 = next to the code, higher = further right).
- `chain`: the "generalisation → naming" diagrams (photos 25, 32, 69, 70); arrows.length = steps − 1.
- `stack`: a static memory-stack drawing (LOGO frames, top frame last in the array? — no: list
  frames **bottom first**, the last element is the top of the stack).
- `logo`: turtle simulator; `showStack: true` shows the memory stack while stepping.
- `venn` (draggable elements), `arrows` (editable arrow diagram), `graph` (discrete vs continuous),
  `meaning-grid` (for which inputs an Algolem procedure has meaning), `error-tree` (photo 24),
  `queen-game` (the determinism task, photos 16–17), `photo` (show an original photo).

## Checking (mandatory before you finish)
Run `npx tsc --noEmit -p .` and `npx vitest run src/content` from the project root and fix every
error in your files. The content test compiles/runs every program in your lessons and questions.
(Failures caused by *other* tracks' missing lessons are not yours — ignore them.)
To try code quickly you may write a temporary test file under `/tmp/claude-0/...` (not in src) or
use a scratch `*.test.ts` that you delete afterwards.

## Finish
Reply with a short report: lesson ids + titles, number of questions per type, which source
exercises you included (photo numbers), and anything in the sources you could not use because it
was uncertain.
