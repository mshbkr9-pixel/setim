# photo-34

- **PDF page:** 56
- **Document / deck title (as seen):** Google Slides deck; active browser tab title is truncated: "א.3 (2) טב…" (the slide header reads "א.3 היכרות עם שפת אלגולם / טבלאות מעקב"). URL type: `docs.google.com/presentation/d/…/edit?slide=id.g1e98197dd4c_0_7#slide=id.g1e98197dd4c_0_7` (Google Slides, edit mode).
- **Kind:** slide
- **Page / slide number visible:** 14 (printed at the bottom-left of the slide)
- **Parts in this photo:** one slide (whole slide visible)
- **Continuity:** Same deck as photos 33, 35, 36. Photos were taken in reverse order: this slide (14) comes after the slides in photos 35 and 36 and before the slide in photo 33 (slide 15). It is the third trace-table version (big green "3") of the same 4-line program shown in photos 36 and 35 (versions "1" and "2"). New here compared with them: the generalised column "סיבוב n" with symbolic values 65-n and 10+n, the "סיבוב אחרון n=65" column, the green "=" mark and the boxed equation.

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

A table of 6 columns x 3 rows. The first row is the header row; the rightmost column is the header column holding the counter names. Column order below is as it appears **from right to left** (the first markdown column is the rightmost column on the slide).

| שורה / מונה (תא אלכסוני) | קלט | סיבוב 1 — ש' 3-2 | סיבוב 2 — ש' 3-2 | סיבוב n — ש' 3-2 | סיבוב אחרון — n=65 |
|---|---|---|---|---|---|
| **R1** | 65 | 64 | 63 | 65-n | 0 |
| **R2** | 10 | 11 | 12 | 10+n | 75 |

Notes on the header cells:

- Rightmost header cell: split by a diagonal line from the top-right corner to the bottom-left corner; **שורה** in the upper-left triangle, **מונה** in the lower-right triangle.
- "קלט" — single line.
- Each iteration header has two lines: first line "סיבוב 1" / "סיבוב 2" / "סיבוב n", second line a sub-label that appears on screen (left to right) as `3-2 'ש`, i.e. the abbreviation ש' (= שורה/שורות) followed by the line numbers 2 and 3 — the digit 2 is the right-hand one, so read right-to-left it is "ש' 2-3" (lines 2–3 of the code, the loop body).
- Leftmost header cell has three lines: "סיבוב" / "אחרון" / "n=65".
- All numeric cells are right-aligned in their cells.

Mark inside the table: a thick olive-green **"="** sign is drawn on the R1 row, straddling the vertical border between the leftmost column (value 0) and the "סיבוב n" column (value 65-n), so that the row reads visually `0 = 65-n`.

### Boxed equation (below the table, under its left part; rectangle with an olive-green border)

```
0 = 65 − n   /+n
n = 65
```

(Two lines, bold italic math font; the "/+n" on the first line is the "add n to both sides" annotation.)

### Big number

A large bold olive-green **3** stands to the right of the table (level with the R1 row), outside the table.

### Slide number

14

## Visuals

- **Green header bar:** full-width olive/green rectangle with white text, as on the other slides of this deck.
- **Code box:** small rectangle with a light-grey fill, no visible border, at the top-left of the slide body; four numbered code lines in a serif (Times-like) bold font, dark navy text.
- **Trace table:** thin dark grid, white cells, 6 columns of roughly equal width (the rightmost "שורה/מונה" column slightly wider), header row about twice as tall as the two data rows. Positioned in the centre of the slide.
- **Green "=" sign:** two short thick olive-green horizontal bars, placed exactly on the border line between the last two columns on the R1 row (between "0" and "65-n").
- **Equation box:** rectangle with a ~2-3 px olive-green outline, white fill, about as wide as the two leftmost table columns, positioned directly under the left part of the table.
- **Big "3":** olive-green, bold, sans-serif, roughly the height of one table row and a half, to the right of the table.
- No pictures.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / טבלאות מעקב"; "דוגמה".
- **Definitions / concepts:** generalised loop column "סיבוב n" in a trace table; "סיבוב אחרון" (last iteration) found by equating the loop counter to 0.
- **Commands / instructions introduced:** none new (uses WHILE / ADD / SUB / ENDW).
- **Algorithms / code blocks:** `photo-34-code-1` — 4-line program: `WHILE (R1)` / `ADD (R2)` / `SUB (R1)` / `ENDW` (moves the contents of R1 into R2 one ball at a time).
- **Trace tables:** one table, version "3": rows R1, R2; columns קלט (65, 10), סיבוב 1 ש' 2-3 (64, 11), סיבוב 2 ש' 2-3 (63, 12), סיבוב n ש' 2-3 (65-n, 10+n), סיבוב אחרון n=65 (0, 75).
- **Formulas:** `0 = 65 − n  /+n` ; `n = 65` ; symbolic cell values `65-n`, `10+n`.
- **Worked examples (with the lecturer's solution steps):** Example with input R1=65, R2=10: after iteration 1 → 64, 11; after iteration 2 → 63, 12; after iteration n → 65-n, 10+n; the last iteration is when R1 = 0, so 0 = 65 − n, adding n to both sides gives n = 65; in the last iteration R1 = 0, R2 = 75.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** same program and input as in photos 36 and 35 (trace-table versions 1 and 2).
- **Lecturer's solution method / emphasis:** instead of writing every iteration, write a general column "סיבוב n" with expressions in n, then solve for the n at which the loop counter reaches 0 (green "=" between 0 and 65-n, boxed equation) to get the last iteration and the output values.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Sub-label of the iteration columns: on screen it shows `3-2 'ש` (digits "3-2" left to right). It is ambiguous only in typing direction: it denotes lines 2 and 3 (ש' 2-3). No alternative reading of the digits themselves.
  - Browser tab title is cut off: "א.3 (2) טב…" (not part of the slide).
