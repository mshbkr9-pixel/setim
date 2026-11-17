# photo-35

- **PDF page:** 57
- **Document / deck title (as seen):** Google Slides deck; active browser tab title is truncated: "א.3 (2) טב…" (the slide header reads "א.3 היכרות עם שפת אלגולם / טבלאות מעקב"). URL type: `docs.google.com/presentation/d/…/edit?slide=id.g1e98197dd4c_0_1#slide=id.g1e98197dd4c_0_1` (Google Slides, edit mode).
- **Kind:** slide
- **Page / slide number visible:** 8 (printed at the bottom-left of the slide)
- **Parts in this photo:** one slide (whole slide visible)
- **Continuity:** Same deck as photos 33, 34, 36. Photos were taken in reverse order: this slide (8) comes after the slide in photo 36 (trace-table version "1") and before the slides in photos 34 (slide 14, version "3") and 33 (slide 15). The code box, the header and the label "דוגמה" are identical to photos 34 and 36; what is specific to this photo is trace-table version "2": one column per loop iteration (each iteration column covering lines 2-3 together), input R1=5, R2=2, five iterations and an output column.

## Transcription

### Slide header (green bar across the top of the slide, white text)

- Right side of the bar (large): **א. רקע**
- Left side of the bar: **א.3 היכרות עם שפת אלגולם / טבלאות מעקב**

### Label at the top right of the slide body

**דוגמה** (מודגש, עם קו תחתון)

### Code box (top-left of the slide body, light-grey background, line numbers shown)

```
1.  WHILE (R1)
2.      ADD (R2)
3.      SUB (R1)
4.  ENDW
```

(Lines 2 and 3 are indented relative to lines 1 and 4.)

### Trace table (centre of the slide)

A table of 8 columns x 3 rows. The first row is the header row; the rightmost column is the header column holding the counter names. Column order below is as it appears **from right to left** (the first markdown column is the rightmost column on the slide).

| שורה / מונה (תא אלכסוני) | קלט | סיבוב 1 — ש' 3-2 | סיבוב 2 — ש' 3-2 | סיבוב 3 — ש' 3-2 | סיבוב 4 — ש' 3-2 | סיבוב 5 — ש' 3-2 | פלט |
|---|---|---|---|---|---|---|---|
| **R1** | 5 | 4 | 3 | 2 | 1 | 0 | 0 |
| **R2** | 2 | 3 | 4 | 5 | 6 | 7 | 7 |

Notes on the header cells:

- Rightmost header cell: split by a diagonal line from the top-right corner to the bottom-left corner; **שורה** in the upper-left triangle, **מונה** in the lower-right triangle.
- "קלט" and "פלט" — single line each.
- Each iteration header has two lines: first line "סיבוב 1" … "סיבוב 5", second line a sub-label that appears on screen (left to right) as `3-2 'ש`, i.e. the abbreviation ש' (= שורה/שורות) followed by the line numbers 2 and 3 — the digit 2 is the right-hand one, so read right-to-left it is "ש' 2-3" (lines 2–3 of the code, the loop body).
- All numeric cells are right-aligned in their cells. No coloured marks in the table.

### Big number

A large bold olive-green **2** stands to the right of the table (level with the R1 row), outside the table.

### Slide number

8

## Visuals

- **Green header bar:** full-width olive/green rectangle with white text, as on the other slides of this deck.
- **Code box:** small rectangle with a light-grey fill, no visible border, at the top-left of the slide body; four numbered code lines in a serif (Times-like) bold font, dark navy text.
- **Trace table:** thin dark grid, white cells, 8 columns of roughly equal width (rightmost "שורה/מונה" column slightly wider), header row about twice as tall as each of the two data rows. Positioned across the centre of the slide.
- **Big "2":** olive-green, bold, sans-serif, to the right of the table.
- No pictures, no arrows.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / טבלאות מעקב"; "דוגמה".
- **Definitions / concepts:** trace table with one column per loop iteration ("סיבוב k"), each iteration column summarising lines 2-3 (the loop body), plus input (קלט) and output (פלט) columns.
- **Commands / instructions introduced:** none new (uses WHILE / ADD / SUB / ENDW).
- **Algorithms / code blocks:** `photo-35-code-1` — 4-line program: `WHILE (R1)` / `ADD (R2)` / `SUB (R1)` / `ENDW` (same program as in photos 34 and 36).
- **Trace tables:** one table, version "2": rows R1, R2; columns קלט (5, 2), סיבוב 1 (4, 3), סיבוב 2 (3, 4), סיבוב 3 (2, 5), סיבוב 4 (1, 6), סיבוב 5 (0, 7), פלט (0, 7).
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** Example with input R1=5, R2=2: after each iteration (lines 2-3) R2 grows by 1 and R1 drops by 1: (4,3), (3,4), (2,5), (1,6), (0,7); output R1=0, R2=7.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** same program as in photo 36 (version "1" of the trace table) — see that photo.
- **Lecturer's solution method / emphasis:** compress the trace: instead of one column per executed line, one column per iteration labelled with the iteration number and the lines it covers ("ש' 2-3").

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Sub-label of the iteration columns: on screen it shows `3-2 'ש` (digits "3-2" left to right). It denotes lines 2 and 3 (ש' 2-3); only the typing direction is ambiguous, not the digits.
  - Browser tab title is cut off: "א.3 (2) טב…" (not part of the slide).
