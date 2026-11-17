# photo-69

- **PDF page:** 91
- **Document / deck title (as seen):** Google Slides deck; active browser tab title "א.2 (2) פרוצדורות לוגו - מצגת - …" (cut). Slide header strip: right side "א. רקע", left side "א.2 היכרות עם שפת לוגו / פרוצדורות ומשתנים". URL bar: `docs.google.com/presentation/d/1JC4f1y-XvBSLN2FFNgOl_tTv13y1_qibBeVnS02gH1I/edit?slide=id.g291ad1391b2_0_6#slide=id.g291ad1391b2_0_6`.
- **Kind:** slide
- **Page / slide number visible:** 10 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (complete; the lower ~55% of the slide is empty)
- **Continuity:** Later slide than photo-70 (photo-70 = slide 7, this = slide 10; slides 8–9 are not among the photos of this group). The first three boxes, both arrows with their captions ("מתן שם", "הכללה"), the labels "שם" / "משתנה" and the captions "פרוצדורה ללא משתנים" / "פרוצדורה בעלת משתנה" are **identical** to the upper row of photo-70. **New here:** a third arrow captioned "הכללה נוספת" and a fourth box `TO POLYGONS :SIDES :SIZE … END` with the caption "פרוצדורה בעלת משתנים". **Not present here** (unlike photo-70): the lower-row box `REPEAT 4 [ SQUARE 10 RT 90 ]` and the four-squares drawing. Followed in the deck by photo-68 ("דוגמה 2", the TOOTH / TEETH example).

## Transcription

**Header strip (dark green band, white text):**

- Right side (large): א. רקע
- Left side (smaller): א.2 היכרות עם שפת לוגו / פרוצדורות ומשתנים

**One row — a chain of four grey code boxes joined by three arrows (described left → right, the direction of the arrows):**

Box 1 (leftmost; no caption above or below):

```
REPEAT 4 [
      FD 10
      RT 90
]
```

Arrow 1 (box 1 → box 2), caption under the arrow: **מתן שם**

Label above box 2: **שם** — with a small arrow pointing down from the label to the word `SQUARE` in the first line of box 2.

Box 2:

```
TO SQUARE
   REPEAT 4 [
      FD 10
      RT 90
   ]
END
```

(`SQUARE` is bold and underlined. The number `10` in `FD 10` is set in a visibly larger font than the rest of the box.)

Caption under box 2: **פרוצדורה ללא משתנים**

Arrow 2 (box 2 → box 3), caption under the arrow: **הכללה**

Label above box 3: **משתנה** — with a small arrow pointing down from the label to `:SIZE` at the end of the first line of box 3.

Box 3:

```
TO SQUARE :SIZE
   REPEAT 4 [
      FD :SIZE
      RT 90
   ]
END
```

(`SQUARE` is bold and underlined.)

Caption under box 3: **פרוצדורה בעלת משתנה**

Arrow 3 (box 3 → box 4), caption under the arrow, on two lines: **הכללה** / **נוספת** (i.e. "הכללה נוספת")

Box 4 (rightmost, the widest box; nothing is written above it):

```
TO POLYGONS :SIDES :SIZE
   REPEAT :SIDES [
      FD :SIZE
      RT 360/:SIDES
   ]
END
```

(`POLYGONS` is bold and underlined.)

Caption under box 4: **פרוצדורה בעלת משתנים**

**Bottom-left of the slide:** `10` (slide number)

## Visuals

One diagram: a horizontal chain across almost the full slide width, in the upper part of the slide body (the rest of the slide below it is blank white).

- **Boxes:** four flat light-grey filled rectangles without outline; code in a bold black serif font (Times-like), upper-case. Approximate widths as a share of the slide width: box 1 ≈ 11%, box 2 ≈ 14%, box 3 ≈ 16%, box 4 ≈ 22%. Box 1 is shorter (≈ 12% of the slide-body height) and vertically centred on the row; boxes 2–4 are taller (≈ 17–18%) with aligned bottoms.
- **Arrows between boxes:** three horizontal arrows, each with a **double-line shaft** (two thin parallel black lines) and a solid black triangular head pointing right; each runs from the right edge of one box to the left edge of the next, at about the height of the second code line. Under each shaft, centred, its Hebrew caption (black sans-serif): "מתן שם", "הכללה", "הכללה נוספת" (the last one broken into two lines).
- **Pointer labels:** above box 2 the word "שם" with a short thin vertical arrow pointing down onto `SQUARE`; above box 3 the word "משתנה" with a short thin vertical arrow pointing down onto `:SIZE` of the header line. There is no pointer label above box 1 or box 4.
- **Captions under boxes:** centred under boxes 2, 3 and 4 (none under box 1).

Arrow list (from → to, caption):
- box 1 (`REPEAT 4 [ FD 10 RT 90 ]`) → box 2 (`TO SQUARE … END`): "מתן שם"
- box 2 (`TO SQUARE … END`) → box 3 (`TO SQUARE :SIZE … END`): "הכללה"
- box 3 (`TO SQUARE :SIZE … END`) → box 4 (`TO POLYGONS :SIDES :SIZE … END`): "הכללה נוספת"
- label "שם" ↓ `SQUARE` in box 2
- label "משתנה" ↓ `:SIZE` in the header line of box 3

Colours: header band dark green with white text; everything else black on white / light grey.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.2 היכרות עם שפת לוגו / פרוצדורות ומשתנים". (No slide-specific title.) Topic shown: the progression commands → named procedure → procedure with one variable → procedure with several variables.
- **Definitions / concepts:** (as labelled on the slide, no definitions in sentences) "מתן שם"; "שם" (→ `SQUARE`); "פרוצדורה ללא משתנים"; "הכללה"; "משתנה" (→ `:SIZE`); "פרוצדורה בעלת משתנה"; "הכללה נוספת"; "פרוצדורה בעלת משתנים".
- **Commands / instructions introduced:** `REPEAT 4 [ … ]`, `FD 10`, `RT 90`, `TO SQUARE … END`, `TO SQUARE :SIZE … END`, `FD :SIZE`; new on this slide: `TO POLYGONS :SIDES :SIZE … END`, `REPEAT :SIDES [ … ]`, `RT 360/:SIDES` (an arithmetic expression with `/` as the argument of `RT`).
- **Algorithms / code blocks:**
  - `photo-69-code-1` — bare command sequence `REPEAT 4 [ FD 10 RT 90 ]` (same as `photo-70-code-1`).
  - `photo-69-code-2` — procedure without variables `TO SQUARE / REPEAT 4 [ / FD 10 / RT 90 / ] / END` (same as `photo-70-code-2`).
  - `photo-69-code-3` — procedure with one variable `TO SQUARE :SIZE / REPEAT 4 [ / FD :SIZE / RT 90 / ] / END` (same as `photo-70-code-3`).
  - `photo-69-code-4` — procedure with two variables `TO POLYGONS :SIDES :SIZE / REPEAT :SIDES [ / FD :SIZE / RT 360/:SIDES / ] / END` (regular polygon with `:SIDES` sides of length `:SIZE`).
- **Trace tables:** none
- **Formulas:** `360/:SIDES` (the turning angle, inside the code).
- **Worked examples (with the lecturer's solution steps):** the chain itself: (1) `REPEAT 4 [ FD 10 RT 90 ]` → "מתן שם" → (2) `TO SQUARE … END` ("פרוצדורה ללא משתנים") → "הכללה" → (3) `TO SQUARE :SIZE … END` ("פרוצדורה בעלת משתנה") → "הכללה נוספת" → (4) `TO POLYGONS :SIDES :SIZE … END` ("פרוצדורה בעלת משתנים"), where the fixed `4` becomes `:SIDES` and the fixed `90` becomes `360/:SIDES`.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** repeats the three-box chain of slide 7 (photo-70) and extends it.
- **Lecturer's solution method / emphasis:** the procedure names (`SQUARE`, `SQUARE`, `POLYGONS`) are bold + underlined; the `10` of `FD 10` in box 2 is enlarged (the value that is replaced by `:SIZE` in box 3); each generalisation step is named on its arrow ("הכללה", "הכללה נוספת").

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Whether the parameters after the procedure name (`:SIZE`; `:SIDES :SIZE`) are underlined as well: a clear separate underline is seen only under `SQUARE` / `POLYGONS`; the parameters appear not underlined (only the line formed by the letters' bottom serifs) — low importance.
  - Exact indentation widths are approximated; nesting is clear (`TO`/`END` at the margin, `REPEAT`/`]` one level in, `FD`/`RT` two levels in; in box 1 `REPEAT` and `]` are at the margin and `FD 10` / `RT 90` are indented deeply).
  - Spacing inside `RT 360/:SIDES`: read as no spaces around the `/` (i.e. `360/:SIDES`).
