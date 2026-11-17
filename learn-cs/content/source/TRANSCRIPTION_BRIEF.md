# Brief: faithful visual transcription of course source photos

## Goal
76 photos of a laptop screen show the original material of a Hebrew computer-science course
(lecture slides and reading/exercise pages). Your job is to produce, for each photo assigned to
you, a **faithful, complete transcription and visual description**, saved as one markdown file per
photo. These files become the primary source for an interactive learning site, so **accuracy
matters more than fluency**: a wrong counter name or a guessed word is worse than an honest
"[לא קריא]".

You are transcribing, not teaching. Do not add explanations of your own, do not "fix" the
lecturer's text, and do not fill gaps from what you think the course probably says.

## Files
- Photos: `/tmp/claude-0/-home-user-setim/d530c746-7282-503d-b395-8d3454c79d92/scratchpad/photos/photo-NN.jpg`
  (NN = 01..76, each 1157x1536 px). Photo NN is PDF page NN+22.
- Zoom helper (use it — the text is too small to read reliably from the full photo):
  `python3 -I /tmp/claude-0/-home-user-setim/d530c746-7282-503d-b395-8d3454c79d92/scratchpad/scripts/tile.py NN x0 y0 x1 y1 [cols] [rows] [scale] [outdir]`
  It cuts region (x0,y0)-(x1,y1) of the original photo into cols x rows overlapping tiles,
  upscales and sharpens them, and prints the PNG paths. View each PNG with the Read tool.
  Write your tiles to `/tmp/claude-0/-home-user-setim/d530c746-7282-503d-b395-8d3454c79d92/scratchpad/crops/<your-group-name>/`.
- Output, one file per photo:
  `/tmp/claude-0/-home-user-setim/d530c746-7282-503d-b395-8d3454c79d92/scratchpad/analysis/photo-NN.md`

## Method (do this for every photo, one photo at a time)
1. Read the full photo once to see the layout and find the content area (the lit screen region;
   ignore the laptop keyboard and the browser chrome, but do note the browser tab title / URL
   type if it names the document).
2. Run the zoom helper on the content area. Slides with little content: 2x2 tiles at scale 2.5
   is usually enough. Dense text pages: use 2 columns x 3-4 rows at scale 2.5-3 so each text
   line is comfortably legible. Read **every** tile.
3. If something is still unclear (small code, subscripts/superscripts, table cells, formula
   symbols), zoom again on just that region with a higher scale (3-4) before deciding. Only
   after a second look may you mark it as uncertain.
4. Write the output file for that photo before moving to the next photo (so nothing is lost).

## Reading rules
- Hebrew text: transcribe as written, in normal reading order (right to left), sentence by
  sentence. Keep the lecturer's wording. Keep emphasis worth knowing (bold/underline/red text)
  with a short note like `(מודגש)` or `(באדום)`.
- Code: copy line by line inside a fenced code block, preserving line breaks, indentation,
  line numbers if shown, and exact spelling/case. Counter and parameter names matter
  (A vs B, R1 vs R2, :SIZE vs :MOO). Never normalise or "correct" code.
- Tables: reproduce as a markdown table with **every** cell, including empty cells (write `—`
  for an empty cell) and marks such as a red X or a tick. Say which row/column is the header.
  Note that Hebrew tables are laid out right-to-left: state the column order as it appears
  from right to left.
- Formulas and notation: copy exactly, including superscripts/subscripts (write `A^I`, `A^O`,
  `R_1`, `ℕ²`), set symbols (∈ ∉ ⊆ ⊂ ∅ ℕ ℤ ℝ \ ×), arrows (→), and inequality signs.
- Diagrams / drawings / screenshots: describe precisely enough that someone could redraw them
  as vector graphics: what shapes, how many, their relative positions, labels and values inside
  them, arrows (from → to), colours, and what the diagram is illustrating. For a drawing made
  by the LOGO turtle, describe the shape exactly (number of segments, directions, proportions).
- Uncertainty: if a word/number/symbol cannot be read with confidence after zooming, write
  `[לא קריא]` in its place, or append `[?]` to a best reading you are unsure of, and list it in
  the "Legibility" section with the alternatives you considered. **Do not guess silently.**
- A photo may show parts of two pages or two slides (e.g. the bottom of one page and the top of
  the next). Transcribe each part under its own sub-heading and say which part is cut off.
- Consecutive photos often overlap (the same page scrolled a little, or the same slide with one
  more animation step). Still transcribe each photo fully, and in the "Continuity" field say
  what overlaps with which neighbouring photo and what is new. Within a document, the photos
  were taken in **reverse** order: a higher photo number is usually an *earlier* page/slide.

## Vocabulary you may meet (recognition aid only — not a list of what must appear)
- LOGO turtle language: `FD n`, `BK n`, `RT n`, `LT n`, `PU`, `PD`, `REPEAT n [ ... ]`,
  `TO name :param ... END`, parameters written `:SIZE`, memory-stack ("מחסנית") drawings.
- "אלגולם" — a tiny teaching language over counters ("מונים") that hold balls: `ADD (X)`,
  `SUB (X)`, `WHILE (X) ... ENDW`; procedure definitions begin with `@ NAME (A,B)`; counters
  are named with capital letters or R1, R2, ...; trace tables ("טבלת מעקב"), input/output
  values, "סיבוב" = loop iteration.
- Set theory ("תורת הקבוצות") and functions ("פונקציה", "תחום", "טווח", "כלל התאמה",
  "חד-חד-ערכית", "על"), arrow diagrams, graphs.

## Output file format (use exactly these headings)
```
# photo-NN

- **PDF page:** NN+22
- **Document / deck title (as seen):** ...
- **Kind:** slide | reading page | exercise page | task sheet | mixed
- **Page / slide number visible:** ... (or "not visible")
- **Parts in this photo:** e.g. "one slide" / "bottom of page 3 + top of page 4"
- **Continuity:** overlaps / continues from / continues in which neighbouring photos

## Transcription
(the full faithful transcription, in reading order; code in fenced blocks; tables as markdown
tables; sub-headings per page/slide part when there are several)

## Visuals
(precise description of every diagram, drawing, screenshot, picture, coloured mark;
write "none" if there are none)

## Structured inventory
- **Headings / topics:** ...
- **Definitions / concepts:** ...
- **Commands / instructions introduced:** ...
- **Algorithms / code blocks:** (give each a short id like `photo-NN-code-1` and one line saying what it is)
- **Trace tables:** ...
- **Formulas:** ...
- **Worked examples (with the lecturer's solution steps):** ...
- **Questions / exercises (verbatim, with numbers):** ...
- **References to earlier material:** ...
- **Lecturer's solution method / emphasis:** ...
(write "none" for a category that does not occur)

## Legibility
- **Overall confidence:** high | medium | low
- **Uncertain items:** bullet list — what, where, and the alternatives considered
  (write "none" if everything was read with confidence)
```

## When you finish
Reply with a short report only (the content lives in the files): the photos you completed, a
one-line topic summary per photo, and a consolidated list of everything you marked uncertain.
If you could not process a photo, say so explicitly — never report a photo as analysed if you
did not read its tiles.

## Budget rules for the second run (important — be economical)
- View the full photo once to locate the content area.
- Then tile only the content area with tile.py: dense pages → 2 cols × 3 rows at scale 2.2;
  slides → crop just the slide rectangle, 2 × 2 at scale 2.5 (1 × 2 if the slide content is small).
- Re-zoom only on specific unclear items (code lines, sub/superscripts, table cells), at most ~4
  extra zooms per photo. Aim for about 10 images or fewer per photo. Never re-read an image.
- Reference transcriptions of neighbouring photos already exist in analysis/ (named in your task).
  Do your own reading of the tiles first, then use the reference to check yourself. Text that the
  reference covers AND that you confirmed line by line against your own tiles may reuse its wording;
  spend zoom effort on what is new or different. State every disagreement with a reference
  explicitly (in Continuity / Legibility). Never edit the reference files.
