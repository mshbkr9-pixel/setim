# photo-52

- **PDF page:** 74
- **Document / deck title (as seen):** Google Slides deck; active browser tab title "א.3 (1) אלגולם בסיסי"; URL type `docs.google.com/presentation/d/…/edit?slide=id.g291881a02ee_0_21#slide=id.g291881a02ee_0_21`. Green header bar of the slide: "א. רקע" (right) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" (centre-left).
- **Kind:** slide
- **Page / slide number visible:** 5 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (complete, in the Google Slides editor view)
- **Continuity:** Same deck as photos 53–47. By the printed slide numbers the order is: photo 53 = slide 3, photo 51 = slide 4, **this photo = slide 5**, photo 50 = slide 6. So this slide comes *after* the slide in photo 51 ("דוגמה 1") and *before* the slide in photo 50 ("דוגמה 2", the first example that uses WHILE … ENDW). Nothing on this slide is repeated from the neighbouring photos except the green header.

## Transcription

**Green header bar (white text):**

- Right side (large): א. רקע
- Centre-left: א.3 היכרות עם שפת אלגולם / פעולות ראשונות

**Right half of the slide (Hebrew text, right-aligned):**

לולאה בשפת אלגולם: (מודגש, עם קו תחתון)

חזור על גוף הלולאה, כל עוד מונה הבקרה R_x אינו ריק :

(In the sentence the counter is written as a serif `R` with a small subscript `x`: Rₓ. The line ends with a colon, with a space before it.)

**Left half of the slide — a framed box (a 1-row, 2-column table).** Left (wide) cell contains the loop template; right (narrow) cell is empty:

```
WHILE (R_x)
    ┌──────────────┐
    │              │      (empty inner rectangle = place of the loop body)
    └──────────────┘
ENDW
```

i.e. the code text in the box is exactly two lines, with an empty framed rectangle between them:

```
WHILE (R_x)
ENDW
```

As a table (column order from right to left: narrow empty cell, then the code cell):

| (right cell) | (left cell) |
|---|---|
| — | `WHILE (R_x)` / [empty inner rectangle] / `ENDW` |

**Slide number (bottom-left):** 5

## Visuals

1. **Header bar:** full-width green rectangle at the top of the slide; white text "א. רקע" at the right end (larger font) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" towards the left/centre.

2. **Loop template box** (upper-left area of the slide, directly under the header, level with the two text lines on the right): an outer rectangle with a thin black border, about 1.8 times as wide as it is tall, split by one vertical line into two cells — a wide left cell (about 72% of the width) and a narrow right cell (about 28% of the width).
   - Left cell: the text `WHILE (Rₓ)` in a black serif font at the top-left (x is a small subscript); below it an **empty rectangle** with a black border, indented to the right of the `WHILE` text's left edge (its left edge starts roughly under the letter "H" of WHILE) and extending almost to the cell's right edge, about one third of the box height; below it, at the bottom-left, aligned with `WHILE`, the text `ENDW`.
   - Right cell: empty (blank white).
   The picture illustrates the general shape of a loop in the Algolem language: `WHILE (Rₓ)` … body … `ENDW`, with the body drawn as an inner (nested) rectangle. (In the example slides that follow — photos 50, 49, 48, 47 — the same box layout is used with real instructions in the inner rectangle and a Hebrew description in the right-hand cell.)

3. No other pictures. (A mouse pointer is visible on the empty part of the slide, lower right — not part of the slide content.)

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פעולות ראשונות"; "לולאה בשפת אלגולם:"
- **Definitions / concepts:** loop in the Algolem language ("לולאה בשפת אלגולם"); loop body ("גוף הלולאה"); control counter ("מונה הבקרה") R_x; the rule: "חזור על גוף הלולאה, כל עוד מונה הבקרה R_x אינו ריק".
- **Commands / instructions introduced:** `WHILE (R_x)` … `ENDW`
- **Algorithms / code blocks:** `photo-52-code-1` — generic loop template: `WHILE (R_x)`, empty body rectangle, `ENDW`.
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** none
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit (uses the counter notation R_x from slide 3 / photo 53)
- **Lecturer's solution method / emphasis:** the heading "לולאה בשפת אלגולם:" is bold and underlined; the loop body is drawn as a nested rectangle inside the WHILE … ENDW frame, with an empty side cell to its right.

## Legibility

- **Overall confidence:** high
- **Uncertain items:** none (the subscript after R, in both the sentence and the box, was read as a lowercase x at 6x zoom)
