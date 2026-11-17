# photo-47

- **PDF page:** 69
- **Document / deck title (as seen):** Google Slides deck; active browser tab title appears to be "א.3 (1) אלגולם בסיסי" (other open tabs: "א.2 (2) פרוצדורות לנ…", "א.2 (3) דיון במשתנים", "א.2 (א) היכרות עם לו…", plus two cut-off tabs at the edges); URL type `docs.google.com/presentation/d/…/edit?slide=id.g291881a02ee_0_31#slide=id.g291881…` (end cut off; read from the un-zoomed photo). Green header bar of the slide: "א. רקע" (right) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" (centre-left).
- **Kind:** slide
- **Page / slide number visible:** 10 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (complete, in the Google Slides editor view)
- **Continuity:** Same deck as photos 53–44 ("פעולות ראשונות"). This is slide 10 = "דוגמה 5". By the printed slide numbers it comes after photo 48 (slide 9, "דוגמה 4") and photo 49 (slide 8, "דוגמה 3"), and before photo 44 (slide 17, "דוגמה 7"); photos 45–46 (not read by me) presumably hold the slides in between. Nothing is repeated from the neighbouring photos except the green header; the sub-block "WHILE (R2) / SUB (R2) / ENDW" labelled "אפס את R2" is the whole of the previous slide (photo 48, slide 9, "דוגמה 4 — איפוס מונה", same code, same label) and also row 1 of the table in photo 44 (slide 17); the three "ADD (R2)" lines are the same code as "דוגמה 1" (photo 51, slide 4).

## Transcription

**Green header bar (white text):**

- Right side (large): א. רקע
- Centre-left: א.3 היכרות עם שפת אלגולם / פעולות ראשונות

**Title line (top-right of the slide body, bold):**

דוגמה 5 (מודגש, עם קו תחתון)    החלפת ערך מונה במספר מסויים (למשל, 3) (מודגש)

(The two parts are on the same line, separated by a wide gap; there is no colon after "דוגמה 5". Spelling as on the slide: "מסויים" with double yod; "(למשל, 3)" with a comma.)

**Nested table (top-left of the slide body, level with the title line).** No header row. Physical layout: 3 columns × 2 rows; the **rightmost column is one merged cell spanning both rows**. Column order from right to left: (1) overall description [merged], (2) description of each code block, (3) the code.

| עמודה ימנית — תא אחד ממוזג על פני 2 השורות | עמודה אמצעית — תיאור הבלוק | עמודה שמאלית (קוד) |
|---|---|---|
| הכנס 3 למונה R2 | אפס את R2 | `WHILE (R2)` / [small box: `SUB (R2)`] / `ENDW` |
| ↑ (אותו תא ממוזג) | הוסף 3 ל-R2 | `ADD (R2)` / `ADD (R2)` / `ADD (R2)` |

The code column, read top to bottom, is one continuous program of 6 lines (no line numbers on the slide):

```
WHILE (R2)
    SUB (R2)
ENDW
ADD (R2)
ADD (R2)
ADD (R2)
```

(`SUB (R2)` is indented and enclosed in its own small rectangle inside the top-left cell; see Visuals.)

Exactly which code lines each label cell spans:
1. **"אפס את R2"** (middle column, row 1) — spans code lines 1–3: `WHILE (R2)` / `SUB (R2)` / `ENDW`. The text sits in the lower half of its cell, level with `ENDW`.
2. **"הוסף 3 ל-R2"** (middle column, row 2) — spans code lines 4–6: the three `ADD (R2)` lines. The text sits in the upper half of its cell, between the first and second `ADD (R2)`.
3. **"הכנס 3 למונה R2"** (right column, merged over both rows) — spans **all** code lines 1–6. Written on three lines: "הכנס 3" / "למונה" / "R2", right-aligned, at the top of the cell (level with `WHILE (R2)` … `ENDW`); the lower part of the cell, beside the `ADD` lines, is blank.
- The small box around `SUB (R2)` contains no label of its own.

Notes on exact writing as seen: counter written `R2` with a full-size digit everywhere; in "הוסף 3 ל-R2" the prefix ל is joined to R2 by a hyphen with no spaces.

**Slide number (bottom-left):** 10

## Visuals

1. **Header bar:** full-width green rectangle at the top of the slide (darker green at its left end, lighter yellow-green towards the right in this photo); white text "א. רקע" at the right end (larger font) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" towards the left/centre.

2. **The nested table** (the only graphic element; top-left of the slide body, its top edge level with the title line): rectangle with a thick dark outer border and thinner inner lines, about 2.7 times as wide as it is tall; text in a serif (Times-like) font, dark/black.
   - Columns, left to right on screen: code column ≈ 40% of the table width; middle (block-label) column ≈ 38%; right (merged) column ≈ 22%.
   - Two rows of roughly equal height (the top row slightly taller). The horizontal line between them runs across the left and middle columns only and stops at the right column, so the right column is a single tall cell.
   - Top-left cell: `WHILE (R2)` at the top-left; `ENDW` at the bottom-left (same left alignment); between them a **small rectangle with a thin border**, indented (its left edge is under the "IL" of WHILE) and reaching to about 90% of the cell width, containing `SUB (R2)` near its left side; the rest of the small box is empty (no vertical divider inside it).
   - Bottom-left cell: `ADD (R2)` three times, stacked, left-aligned like `WHILE`.
   - Middle cells: "אפס את R2" (top, centred horizontally, in the lower half) and "הוסף 3 ל-R2" (bottom, centred horizontally, in the upper half).
   - Right merged cell: "הכנס 3" / "למונה" / "R2" right-aligned at the top; blank below.
   The layout shows two levels of meaning: each code block (zeroing loop; three ADDs) with its own label, and one label for the whole program.

3. No other pictures, arrows or coloured marks. The rest of the slide (right of and below the table) is empty.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פעולות ראשונות"; "דוגמה 5 — החלפת ערך מונה במספר מסויים (למשל, 3)" (the dash is mine; on the slide the two parts are separated by a gap)
- **Definitions / concepts:** replacing a counter's value with a given number = first zero the counter, then add the number of balls.
- **Commands / instructions introduced:** none new (uses `WHILE … ENDW`, `SUB`, `ADD`)
- **Algorithms / code blocks:** `photo-47-code-1` — Example 5: `WHILE (R2)` / `SUB (R2)` / `ENDW` / `ADD (R2)` ×3 = put the value 3 into counter R2 (zero R2, then add 3).
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** דוגמה 5: החלפת ערך מונה במספר מסויים (למשל, 3) — step 1 "אפס את R2" (`WHILE (R2)` / `SUB (R2)` / `ENDW`); step 2 "הוסף 3 ל-R2" (`ADD (R2)` ×3); whole program "הכנס 3 למונה R2".
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit (reuses the zeroing block of דוגמה 4 / photo 48 and the three-ADD block of דוגמה 1 / photo 51)
- **Lecturer's solution method / emphasis:** the nested "interpretation table": code blocks on the left, a label per block in the middle, and a merged right cell naming what the whole program does; the loop body is boxed inside the WHILE … ENDW frame. "דוגמה 5" is bold and underlined; the example's name is bold.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Browser chrome only (not slide content): the slide id in the URL ("…_0_31") and the active-tab identification were read from the un-zoomed photo and not verified at zoom.
  - Everything on the slide itself (title, all six code lines, all three labels, cell spans, slide number) was read with confidence at 2.5x–4x zoom.
