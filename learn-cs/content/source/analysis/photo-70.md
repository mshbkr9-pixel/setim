# photo-70

- **PDF page:** 92
- **Document / deck title (as seen):** Google Slides deck; active browser tab title "א.2 (2) פרוצדורות לוגו - מצגת - …" (cut). Slide header strip: right side "א. רקע", left side "א.2 היכרות עם שפת לוגו / פרוצדורות ומשתנים". URL bar: `docs.google.com/presentation/d/1JC4f1y-XvBSLN2FFNgOl_tTv13y1_qibBeVnS02gH1I/edit?slide=id.g291ad1391b2_0_1#slide=id.g291ad1391b2_0_1`.
- **Kind:** slide
- **Page / slide number visible:** 7 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** Comes after photo-71 in the deck (photo-71 = slide 4; this is slide 7 — slides 5 and 6 are not among the photos of this group). The middle box here (`TO SQUARE … END`, FD 10) is the same procedure that photo-71 shows typed in the Editor window in lower case. The chain shown here ("REPEAT … → TO SQUARE → TO SQUARE :SIZE") is continued/extended in photo-69 (a later slide with a longer chain of code boxes). New on this slide: the labels "מתן שם" / "הכללה", the terms "פרוצדורה ללא משתנים" / "פרוצדורה בעלת משתנה", the parameter `:SIZE`, and the use `SQUARE 10` inside a `REPEAT` with its drawing.

## Transcription

**Header strip (dark green band, white text):**

- Right side (large): א. רקע
- Left side (smaller): א.2 היכרות עם שפת לוגו / פרוצדורות ומשתנים

**Upper row — a chain of three grey code boxes joined by two arrows (described left → right, the direction of the arrows):**

Box 1 (leftmost; no caption above or below):

```
REPEAT 4 [
      FD 10
      RT 90
]
```

Arrow 1 (box 1 → box 2), caption written under the arrow: **מתן שם**

Label above box 2: **שם** — with a small arrow pointing down from the label to the word `SQUARE` in the first line of box 2.

Box 2 (middle):

```
TO SQUARE
   REPEAT 4 [
      FD 10
      RT 90
   ]
END
```

(In the first line the word `SQUARE` is bold and underlined. The number `10` in `FD 10` is set in a visibly larger font than the rest of the box.)

Caption under box 2: **פרוצדורה ללא משתנים**

Arrow 2 (box 2 → box 3), caption written under the arrow: **הכללה**

Label above box 3: **משתנה** — with a small arrow pointing down from the label to `:SIZE` at the end of the first line of box 3.

Box 3 (rightmost):

```
TO SQUARE :SIZE
   REPEAT 4 [
      FD :SIZE
      RT 90
   ]
END
```

(In the first line the word `SQUARE` is bold and underlined; `:SIZE` follows it on the same line.)

Caption under box 3: **פרוצדורה בעלת משתנה**

**Lower row (below the chain, towards the left of the slide):**

Box 4 (grey code box):

```
REPEAT 4 [
   SQUARE 10
   RT 90
]
```

To the right of box 4: a small turtle drawing (a square divided into four squares, turtle at the centre — see Visuals). There is no arrow and no caption between box 4 and the drawing.

**Bottom-left of the slide:** `7` (slide number)

## Visuals

All code boxes are flat light-grey filled rectangles without outline; code is in a bold black serif font (Times-like), upper-case. Hebrew labels are black, sans-serif. Slide background white; header band dark green.

1. **Chain of three boxes (upper row)**, occupying roughly the left 2/3 of the slide width, the right third of the slide is empty:
   - Box 1: small rectangle (about 11% of slide width, ~13% of slide-body height), vertically centred on the row.
   - Arrow 1: horizontal arrow from the right edge of box 1 to the left edge of box 2; the shaft is a **double line** (two thin parallel lines) ending in a solid black triangular head pointing right. Caption "מתן שם" centred below the shaft.
   - Box 2: taller rectangle (about 13% of slide width, ~18% of body height). Above its top edge, horizontally over the word SQUARE: the word "שם" and under it a short thin vertical arrow pointing down onto SQUARE. Below the box, centred: "פרוצדורה ללא משתנים".
   - Arrow 2: same double-line arrow, from the right edge of box 2 to the left edge of box 3. Caption "הכללה" centred below the shaft.
   - Box 3: rectangle (about 16% of slide width, ~18% of body height). Above its top edge, over the `:SIZE` at the right end of the first line: the word "משתנה" and a short thin vertical arrow pointing down onto `:SIZE`. Below the box, centred: "פרוצדורה בעלת משתנה".
2. **Box 4 (lower row)**: grey rectangle (about 17% of slide width, ~13% of body height) placed under the gap between box 1 and box 2 (its left edge is to the right of box 1's left edge).
3. **Turtle drawing** (to the right of box 4, under box 2/arrow 2): a square drawn with black lines, divided by one vertical and one horizontal line through its centre into **four equal smaller squares (a 2×2 grid)** — i.e. 4 squares that all share the centre point as a corner. At the centre point sits the **turtle marker: a small narrow isosceles triangle pointing straight up**, its base centred on the centre point (lying on the horizontal middle line) and its tip on the vertical middle line; the triangle's height is roughly half the side of a small square. This is the result of the code in box 4 (four squares of side 10, turning right 90° between them, the turtle ending where it started, facing up).

Arrow list (from → to, caption):
- box 1 (`REPEAT 4 [ FD 10 RT 90 ]`) → box 2 (`TO SQUARE … END`): "מתן שם"
- box 2 (`TO SQUARE … END`) → box 3 (`TO SQUARE :SIZE … END`): "הכללה"
- label "שם" ↓ the word `SQUARE` in box 2
- label "משתנה" ↓ `:SIZE` in the first line of box 3

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.2 היכרות עם שפת לוגו / פרוצדורות ומשתנים". (No slide-specific title.) Topic shown: from a sequence of commands, to a named procedure, to a procedure with a variable (parameter).
- **Definitions / concepts:** (as labelled on the slide, no definitions in sentences) "מתן שם" — the step from a bare `REPEAT` block to `TO SQUARE … END`; "שם" — points at `SQUARE`; "פרוצדורה ללא משתנים" — caption of `TO SQUARE … END`; "הכללה" — the step from `TO SQUARE` to `TO SQUARE :SIZE`; "משתנה" — points at `:SIZE`; "פרוצדורה בעלת משתנה" — caption of `TO SQUARE :SIZE … END`.
- **Commands / instructions introduced:** `REPEAT 4 [ … ]`, `FD 10`, `RT 90`, `TO SQUARE … END`, `TO SQUARE :SIZE … END`, `FD :SIZE`, procedure call with an argument `SQUARE 10`.
- **Algorithms / code blocks:**
  - `photo-70-code-1` — bare command sequence: `REPEAT 4 [ FD 10 RT 90 ]` (a square of side 10).
  - `photo-70-code-2` — the same wrapped as a procedure without variables: `TO SQUARE / REPEAT 4 [ / FD 10 / RT 90 / ] / END`.
  - `photo-70-code-3` — generalised procedure with one variable: `TO SQUARE :SIZE / REPEAT 4 [ / FD :SIZE / RT 90 / ] / END`.
  - `photo-70-code-4` — use of the procedure: `REPEAT 4 [ SQUARE 10 RT 90 ]`, shown next to its drawing (four squares around a common corner).
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** the chain itself: (1) commands `REPEAT 4 [ FD 10 RT 90 ]` → (2) "מתן שם": `TO SQUARE … END` ("פרוצדורה ללא משתנים") → (3) "הכללה": `TO SQUARE :SIZE … END` with `FD :SIZE` ("פרוצדורה בעלת משתנה"); then the call `REPEAT 4 [ SQUARE 10 RT 90 ]` with the resulting picture.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** the procedure `SQUARE` is the one shown in the Editor window on slide 4 (photo-71).
- **Lecturer's solution method / emphasis:** `SQUARE` is bold + underlined in both procedure headers and singled out by the label "שם"; `:SIZE` is singled out by the label "משתנה"; in box 2 the `10` of `FD 10` is enlarged (the value that becomes `:SIZE` in box 3).

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Whether `:SIZE` (in the first and third lines of box 3) is also underlined: a pixel-level check shows a separate thick underline only under `SQUARE`; under `:SIZE` there is only the line formed by the bottom serifs of the letters, so I read it as **not underlined** — low importance.
  - Exact indentation widths in the code boxes are approximated (the nesting levels are clear: in box 1 and box 4 `REPEAT` and `]` are at the left margin; in boxes 2 and 3 `TO`/`END` are at the margin, `REPEAT`/`]` one level in, `FD`/`RT` two levels in). In box 1 the `FD 10` / `RT 90` lines are indented deeply (they start under the letters "AT" of REPEAT).
  - The turtle marker in the drawing is tiny; it is read as an upward-pointing triangle (base on the centre point). Its exact inner shading (it looks filled at the base and lighter towards the tip) cannot be resolved.
