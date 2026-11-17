# photo-48

- **PDF page:** 70
- **Document / deck title (as seen):** Google Slides deck; active browser tab title appears to be "א.3 (1) אלגולם בסיסי" (same tab row as photo 47); URL type `docs.google.com/presentation/d/…/edit?slide=id.g291881a02ee_0_16#slide=id.g29188…` (end cut off; read from the un-zoomed photo). Green header bar of the slide: "א. רקע" (right) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" (centre-left).
- **Kind:** slide
- **Page / slide number visible:** 9 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (complete, in the Google Slides editor view)
- **Continuity:** Same deck as photos 53–44 ("פעולות ראשונות"). This is slide 9 = "דוגמה 4". By the printed slide numbers it comes right after photo 49 (slide 8, "דוגמה 3") and right before photo 47 (slide 10, "דוגמה 5"). Nothing is repeated from the neighbouring photos except the green header; the whole code block of this slide (`WHILE (R2)` / `SUB (R2)` / `ENDW`, labelled "אפס את R2") reappears with the same label as the first block of photo 47 (slide 10) and as row 1 of the table in photo 44 (slide 17).

## Transcription

**Green header bar (white text):**

- Right side (large): א. רקע
- Centre-left: א.3 היכרות עם שפת אלגולם / פעולות ראשונות

**Title line (top-right of the slide body, bold):**

דוגמה 4 (מודגש, עם קו תחתון)    איפוס מונה (מודגש)

(The two parts are on the same line, separated by a gap; there is no colon after "דוגמה 4".)

**Nested table (top-left of the slide body, level with the title line).** No header row. Outer box = 1 row × 2 columns. Column order from right to left: (1) description, (2) the code.

| תא ימני (תיאור) | תא שמאלי (קוד) |
|---|---|
| אפס את R2 | `WHILE (R2)` / [small box: `SUB (R2)`] / `ENDW` |

The code, top to bottom (no line numbers on the slide):

```
WHILE (R2)
    SUB (R2)
ENDW
```

(`SUB (R2)` is indented and enclosed in its own small rectangle inside the code cell; see Visuals.)

Exactly which code lines the label cell spans:
- **"אפס את R2"** (right cell, one line of text) spans **all three** code lines 1–3: `WHILE (R2)` / `SUB (R2)` / `ENDW`. The text sits in the upper part of the cell, between the heights of `WHILE (R2)` and `SUB (R2)`.
- The small box around `SUB (R2)` contains no label of its own.

Notes on exact writing as seen: counter written `R2` with a full-size digit, in the code and in the Hebrew cell.

**Slide number (bottom-left):** 9

## Visuals

1. **Header bar:** full-width green rectangle at the top of the slide (darker green at its left end, lighter yellow-green towards the right in this photo); white text "א. רקע" at the right end (larger font) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" towards the left/centre.

2. **The nested table** (the only graphic element; top-left of the slide body, its top edge level with the title line): rectangle with a thick dark outer border, about 3.5 times as wide as it is tall, divided by one thin vertical line into two cells of almost equal width (left/code ≈ 51%, right/label ≈ 49%); text in a serif (Times-like) font, dark/black.
   - Left cell: `WHILE (R2)` at the top-left; `ENDW` at the bottom-left (same left alignment); between them a **small rectangle with a thin border**, indented (its left edge at about 20% of the cell width, under the "H" of WHILE) and reaching to about 76% of the cell width, containing `SUB (R2)` roughly centred in it (no vertical divider inside the box).
   - Right cell: "אפס את R2" roughly centred horizontally, in the upper part of the cell; the rest of the cell is blank.
   The layout shows the loop body boxed inside the WHILE … ENDW frame and one label for what the whole loop does.

3. No other pictures, arrows or coloured marks. The rest of the slide (right of and below the table) is empty.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פעולות ראשונות"; "דוגמה 4 — איפוס מונה" (the dash is mine; on the slide the two parts are separated by a gap)
- **Definitions / concepts:** zeroing a counter (איפוס מונה) with a loop that removes one ball at a time while the counter is non-empty.
- **Commands / instructions introduced:** none new (uses `WHILE … ENDW`, `SUB`)
- **Algorithms / code blocks:** `photo-48-code-1` — Example 4: `WHILE (R2)` / `SUB (R2)` / `ENDW` = zero counter R2.
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** דוגמה 4: איפוס מונה — code `WHILE (R2)` / `SUB (R2)` / `ENDW`, labelled "אפס את R2".
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit (uses the loop form of slide 5 / photo 52)
- **Lecturer's solution method / emphasis:** the "interpretation table": code on the left with the loop body boxed inside WHILE … ENDW, and a cell to its right naming what the code does. "דוגמה 4" is bold and underlined; the example's name is bold.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - A faint small grey speck lies on the title line far to the left of "איפוס מונה" (about 1.5 word-widths away; seen at 2.5x and 4.5x zoom). It has no character shape (blurred blob, much lighter than the text) and looks like a mark on the screen; it was not transcribed.
  - Browser chrome only (not slide content): the slide id in the URL ("…_0_16") and the active-tab identification were read from the un-zoomed photo and not verified at zoom.
