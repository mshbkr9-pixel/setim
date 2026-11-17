# photo-50

- **PDF page:** 72
- **Document / deck title (as seen):** Google Slides deck; active browser tab title "א.3 (1) אלגולם בסיסי"; URL type `docs.google.com/presentation/d/…/edit?slide=id.g291881a02ee_0_6#slide=id.g291881a02e…` (end cut off). Green header bar of the slide: "א. רקע" (right) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" (centre-left).
- **Kind:** slide
- **Page / slide number visible:** 6 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (complete, in the Google Slides editor view)
- **Continuity:** Same deck as photos 53–47. Follows slide 5 (photo 52, the generic `WHILE (R_x)` … `ENDW` template) and uses exactly that box layout, now filled in. The next photographed slide is photo 49 = slide 8 ("דוגמה 3"); a slide numbered 7 is not among photos 47–53. Nothing is repeated from the neighbouring photos except the green header.

## Transcription

**Green header bar (white text):**

- Right side (large): א. רקע
- Centre-left: א.3 היכרות עם שפת אלגולם / פעולות ראשונות

**Title line (top-right of the slide body, bold):**

דוגמה 2 (מודגש, עם קו תחתון)    הוספת תוכן מונה אחד למונה אחר (מודגש)

(Same line, separated by a wide gap; no colon after "דוגמה 2".)

**Nested table (top-left of the slide body).** No header row.

Outer box = 1 row × 2 columns. Column order from right to left: (1) overall description, (2) the code cell.

| תא ימני (תיאור כולל) | תא שמאלי (קוד) |
|---|---|
| הוספת תוכנו של המונה R1 למונה R2 | `WHILE (R1)` / [inner box — see below] / `ENDW` |

Inner box (drawn inside the left cell, between `WHILE (R1)` and `ENDW`, indented) = 1 row × 2 columns, **no horizontal line between its two text lines**. Column order from right to left: (1) per-line description, (2) the loop-body code.

| תא ימני פנימי (תיאור) | תא שמאלי פנימי (קוד גוף הלולאה) |
|---|---|
| הוסף 1 ל-R2 | `ADD (R2)` |
| הורד 1 מ-R1 | `SUB (R1)` |

(The two rows above are two text lines inside the same pair of cells; each description line is at the same height as its code line.)

The complete code, top to bottom:

```
WHILE (R1)
    ADD (R2)
    SUB (R1)
ENDW
```

Which label spans which code lines:
- "הוספת תוכנו של המונה R1 למונה R2" (outer right cell; written on three lines: "הוספת תוכנו של" / "המונה R1" / "למונה R2", top-aligned, right-aligned) spans the **whole block**: `WHILE (R1)`, `ADD (R2)`, `SUB (R1)`, `ENDW` (lines 1–4).
- "הוסף 1 ל-R2" — first line of the inner right cell — is level with `ADD (R2)` (code line 2).
- "הורד 1 מ-R1" — second line of the inner right cell — is level with `SUB (R1)` (code line 3).
- `WHILE (R1)` and `ENDW` have no label of their own.

Notes on exact writing as seen: counters are written `R1`, `R2` with full-size digits; in the Hebrew cells the prefix is joined with a hyphen ("ל-R2", "מ-R1").

**Slide number (bottom-left):** 6

## Visuals

1. **Header bar:** full-width green rectangle at the top of the slide; white text "א. רקע" at the right end (larger font) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" towards the left/centre.

2. **The nested table** (the only graphic element; top-left of the slide body, level with the title line), thin black borders, black bold-looking serif text:
   - Outer rectangle about 3.5 times as wide as it is tall, divided by one vertical line into a wide left cell (about 64% of the width) and a narrower right cell (about 36%).
   - Left cell: `WHILE (R1)` at the top-left; `ENDW` at the bottom-left (same left alignment); between them an **inner rectangle**, indented (its left edge is to the right of the left edge of the word WHILE) and reaching almost to the outer vertical divider. The inner rectangle is divided by one vertical line into two cells: left inner cell (about 47% of the inner width) with `ADD (R2)` above `SUB (R1)`, centred; right inner cell (about 53%) with "הוסף 1 ל-R2" above "הורד 1 מ-R1", right-aligned.
   - Right cell: three short lines of Hebrew text, right-aligned, starting at the top: "הוספת תוכנו של" / "המונה R1" / "למונה R2"; the lower part of the cell is blank.
   The layout shows the loop body as a box nested inside the WHILE … ENDW frame, the meaning of each body instruction beside it, and the meaning of the whole loop in the outer side cell.

3. No other pictures.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פעולות ראשונות"; "דוגמה 2 — הוספת תוכן מונה אחד למונה אחר" (the dash is mine; on the slide the two parts are separated by a gap)
- **Definitions / concepts:** adding the content of one counter (R1) to another counter (R2) with a loop controlled by R1.
- **Commands / instructions introduced:** none new (first use of `WHILE (R1)` … `ENDW` with a real body; uses `ADD`, `SUB`)
- **Algorithms / code blocks:** `photo-50-code-1` — Example 2: `WHILE (R1)` / `ADD (R2)` / `SUB (R1)` / `ENDW` = add the content of counter R1 to counter R2.
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** דוגמה 2: הוספת תוכן מונה אחד למונה אחר — body labels "הוסף 1 ל-R2" (for `ADD (R2)`) and "הורד 1 מ-R1" (for `SUB (R1)`); whole-loop label "הוספת תוכנו של המונה R1 למונה R2".
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit (uses the loop form from slide 5 / photo 52 and ADD/SUB from slide 3 / photo 53)
- **Lecturer's solution method / emphasis:** the "interpretation table" method with nesting — the loop body is boxed inside the WHILE … ENDW frame, each body line gets a short label, and the outer right cell names what the whole loop does. "דוגמה 2" is bold and underlined; the example's name is bold.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - A faint grey dot is visible to the left of the last title word "אחר" (after a small gap; seen at 14x zoom). It is much lighter than the bold text and does not look like a typed full stop; it was not transcribed.
