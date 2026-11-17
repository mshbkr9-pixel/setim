# photo-49

- **PDF page:** 71
- **Document / deck title (as seen):** Google Slides deck; active browser tab title appears to be "א.3 (1) אלגולם בסיסי" (same tab row as photos 47–48); URL type `docs.google.com/presentation/d/…/edit?slide=id.g291881a02ee_0_11#slide=id.g291881…` (end cut off; read from the un-zoomed photo). Green header bar of the slide: "א. רקע" (right) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" (centre-left).
- **Kind:** slide
- **Page / slide number visible:** 8 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (complete, in the Google Slides editor view)
- **Continuity:** Same deck as photos 53–44 ("פעולות ראשונות"). This is slide 8 = "דוגמה 3". By the printed slide numbers it follows photo 50 (slide 6, "דוגמה 2"; a slide numbered 7 is not among photos 47–53) and is followed by photo 48 (slide 9, "דוגמה 4"). Nothing is repeated from the neighbouring photos except the green header. The table has exactly the same nested layout as photo 50 (outer box 1 × 2, inner two-column box between `WHILE` and `ENDW`); only the loop body and the texts differ (photo 50: one `ADD (R2)`, labels "הוסף 1 ל-R2" / "הורד 1 מ-R1"; here: two `ADD (R2)`, labels "הוסף 2 ל-R2" / "הורד 1 מ-R1"). Agrees with the reference photo-50.md, which already identified photo 49 as slide 8 "דוגמה 3".

## Transcription

**Green header bar (white text):**

- Right side (large): א. רקע
- Centre-left: א.3 היכרות עם שפת אלגולם / פעולות ראשונות

**Title line (top-right of the slide body, bold):**

דוגמה 3 (מודגש, עם קו תחתון)    הוספת פי שניים מתוכן מונה אחד למונה אחר (מודגש)

(The two parts are on the same line, separated by a wide gap; there is no colon after "דוגמה 3". The title has "מתוכן" without ו.)

**Nested table (top-left of the slide body, level with the title line).** No header row.

Outer box = 1 row × 2 columns. Column order from right to left: (1) overall description, (2) the code cell.

| תא ימני (תיאור כולל) | תא שמאלי (קוד) |
|---|---|
| הוספת פי שניים מתוכנו של המונה R1 למונה R2 | `WHILE (R1)` / [inner box — see below] / `ENDW` |

Inner box (drawn inside the left cell, between `WHILE (R1)` and `ENDW`, indented) = 1 row × 2 columns, **no horizontal lines inside it**. Column order from right to left: (1) descriptions, (2) the loop-body code. Each column is one cell; the lines below are the text lines inside those two cells, in the order and at the heights they appear:

| תא ימני פנימי (תיאור) | תא שמאלי פנימי (קוד גוף הלולאה) |
|---|---|
| הוסף 2 ל-R2 | `ADD (R2)` |
| הורד 1 מ-R1 | `ADD (R2)` |
| — | `SUB (R1)` |

The complete code, top to bottom (no line numbers on the slide):

```
WHILE (R1)
    ADD (R2)
    ADD (R2)
    SUB (R1)
ENDW
```

Which label spans which code lines:
- **"הוספת פי שניים מתוכנו של המונה R1 למונה R2"** (outer right cell; written on three lines: "הוספת פי שניים" / "מתוכנו של המונה R1" / "למונה R2", right-aligned, at the top of the cell) spans the **whole block**: `WHILE (R1)`, `ADD (R2)`, `ADD (R2)`, `SUB (R1)`, `ENDW` (lines 1–5). Its first line "הוספת פי שניים" looks bold (heavier strokes than the other two lines).
- The inner right cell (one cell, no internal lines) spans the loop body, code lines 2–4. Inside it, the two text lines are typed one under the other from the top: **"הוסף 2 ל-R2"** is level with the first `ADD (R2)` (line 2) and **"הורד 1 מ-R1"** is level with the second `ADD (R2)` (line 3); nothing is written level with `SUB (R1)` (line 4). (By wording, "הוסף 2 ל-R2" matches the two `ADD (R2)` lines together and "הורד 1 מ-R1" matches `SUB (R1)`, but the slide does not line them up that way.)
- `WHILE (R1)` and `ENDW` have no label of their own.

Notes on exact writing as seen: counters written `R1`, `R2` with full-size digits; in the inner Hebrew labels the prefix is joined to the counter by a hyphen with no spaces ("ל-R2", "מ-R1"); the right cell has "מתוכנו" (with ו), the title has "מתוכן".

**Slide number (bottom-left):** 8

## Visuals

1. **Header bar:** full-width green rectangle at the top of the slide (darker at its left end, lighter yellow-green towards the right in this photo); white text "א. רקע" at the right end (larger font) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" towards the left/centre.

2. **The nested table** (the only graphic element; top-left of the slide body, its top edge level with the title line), thin dark borders, text in a serif (Times-like) font, dark/black:
   - Outer rectangle about 3.3 times as wide as it is tall, divided by one vertical line into a wide left cell (about 63% of the width) and a narrower right cell (about 37%).
   - Left cell: `WHILE (R1)` at the top-left; `ENDW` at the bottom-left, below the inner box and close to the outer bottom border (same left alignment as WHILE); between them an **inner rectangle**, indented (its left edge at about 12% of the left cell's width, to the right of the start of WHILE) and reaching to about 92% of that width. The inner rectangle is divided by one vertical line into two cells: left inner cell (about 47% of the inner width) with `ADD (R2)`, `ADD (R2)`, `SUB (R1)` stacked and centred; right inner cell (about 53%) with "הוסף 2 ל-R2" above "הורד 1 מ-R1", right-aligned, in the upper two thirds; the bottom third of the inner right cell is blank.
   - Right cell: three lines of Hebrew text, right-aligned, starting at the top: "הוספת פי שניים" (heavier) / "מתוכנו של המונה R1" / "למונה R2"; the lower part of the cell is blank.
   The layout shows the loop body as a box nested inside the WHILE … ENDW frame, the meaning of the body beside it, and the meaning of the whole loop in the outer side cell.

3. No other pictures, arrows or coloured marks. The rest of the slide (right of and below the table) is empty.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פעולות ראשונות"; "דוגמה 3 — הוספת פי שניים מתוכן מונה אחד למונה אחר" (the dash is mine; on the slide the two parts are separated by a gap)
- **Definitions / concepts:** adding twice the content of one counter (R1) to another counter (R2) with a loop controlled by R1.
- **Commands / instructions introduced:** none new (uses `WHILE … ENDW`, `ADD`, `SUB`)
- **Algorithms / code blocks:** `photo-49-code-1` — Example 3: `WHILE (R1)` / `ADD (R2)` / `ADD (R2)` / `SUB (R1)` / `ENDW` = add twice the content of R1 to R2.
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** דוגמה 3: הוספת פי שניים מתוכן מונה אחד למונה אחר — body labels "הוסף 2 ל-R2" and "הורד 1 מ-R1"; whole-loop label "הוספת פי שניים מתוכנו של המונה R1 למונה R2".
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit (same pattern as דוגמה 2 / photo 50, with a second `ADD (R2)` in the body)
- **Lecturer's solution method / emphasis:** the nested "interpretation table": the loop body is boxed inside the WHILE … ENDW frame with short labels beside it, and the outer right cell names what the whole loop does. "דוגמה 3" is bold and underlined; the example's name is bold.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Weight of the first line of the right cell ("הוספת פי שניים"): it looks bold at 2.5x, 3.5x and 6x zoom (thicker strokes than "מתוכנו של המונה R1" / "למונה R2"), but this could be rendering/blur; recorded as "looks bold".
  - No dot or other mark was seen after the last title word "אחר" at 3.9x zoom (the references for photos 44 and 50 mention a faint grey dot in that position on their slides; not checked at higher zoom here).
  - Browser chrome only (not slide content): the slide id in the URL ("…_0_11") and the active-tab identification were read from the un-zoomed photo and not verified at zoom.
