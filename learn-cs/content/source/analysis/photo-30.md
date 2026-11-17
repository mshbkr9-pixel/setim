# photo-30

- **PDF page:** 52
- **Document / deck title (as seen):** Google Slides deck (URL `docs.google.com/presentation/d/1REh3suL53O7hRhDUbc5BCxLcW_CbjH_Bs9ZERloaaRQ/edit?slide=id.g291a2b49466_0_7#slide=id.g291a2b49466_0…`, slide id `…_0_7` confirmed at zoom); active browser tab title is cut off: "א.3 (3) פ…" (neighbouring tabs confirmed at zoom: "א.3 (2) טבלא…", "א.6 רקע למו…"; further tabs to the left, read only from the unzoomed photo: "א.5 …", "א.3 (1) אלגו…", "א.2 (א) היכרו…", "א.2 (3) …"). Slide header bar: "א. רקע" + "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים".
- **Kind:** slide
- **Page / slide number visible:** 7 (bottom-left of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** single shot of slide 7 ("דוגמה 3 + 4"). Photos are in reverse order, so the next slide in the deck that was photographed is photo-29 ("דוגמה 5", `@TEN(A)`, printed slide number 10 according to the photo-29 reference), and the previous one is photo-31 (slide 6, "דוגמה 2", two versions of `@ ONE (B)` joined by ↔). No content overlap with either neighbour. URL slide ids run in the same order: `…_0_1` (photo-31) → `…_0_7` (here) → `…_0_13` (photo-29). The procedure `FIVE` defined here is the one called twice by `@TEN(A)` in photo-29 (`FIVE(A)`, `FIVE(B)`). Printed slide numbers jump from 7 (here) to 10 (photo-29), so slides 8–9 were not photographed (or are not in this photo set).

## Transcription

### Header bar (green strip across the top of the slide)
- Right end of the strip (darker green block, large white text): **א. רקע**
- Rest of the strip (olive green, white text): **א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים**

### Label at top-right of the slide body
**דוגמה 3 + 4** (bold, underlined; the sign between the numbers is a plus "+")

### Two code boxes, side by side, in the upper middle of the slide body (grey background)

Left box:
```
@ TWO (A)
   WHILE (A)
      SUB (A)
   ENDW
   ADD (A)
   ADD (A)
```

Right box (the one nearer the label):
```
@ FIVE (C)
   TWO (C)
   ADD (C)
   ADD (C)
   ADD (C)
```

Notes on the code as it appears (checked at 4× and 7× zoom):
- Both heading lines (`@ TWO (A)`, `@ FIVE (C)`) are underlined. Each has a space after `@` and a space between the procedure name and the parenthesis.
- Every body line has a space before the parenthesis: `WHILE (A)`, `SUB (A)`, `ADD (A)`, `TWO (C)`, `ADD (C)`.
- Left box indentation: `WHILE (A)`, `ENDW` and both `ADD (A)` lines share one indent level under the heading; `SUB (A)` is one level deeper (inside the loop). 6 lines in total (heading + 5 body lines); there are exactly two `ADD (A)` lines, after `ENDW`.
- Right box indentation: `TWO (C)` and the three `ADD (C)` lines share one indent level under the heading. 5 lines in total (heading + 4 body lines); there are exactly three `ADD (C)` lines. `TWO (C)` is a call of the procedure `TWO` from the left box, with counter `C`.
- The slide does not say which box is "דוגמה 3" and which is "דוגמה 4".

### Footer
Slide number at bottom-left: 7

The rest of the slide body (below the code boxes) is empty; no other text.

## Visuals

1. **Header strip:** full-width green bar at the top of the slide; the rightmost part is a darker green block with "א. רקע" in large white letters; the rest is olive green with the sub-title in smaller white letters (the left end of the bar looks almost black in the photo because of a shadow/reflection).
2. **Two code boxes:** two rectangles with light-grey fill and no visible border, placed next to each other with a narrow gap (about 1/70 of the slide width) between them, top-aligned, just below the header bar, roughly in the horizontal middle of the slide (the pair starts about 37 % of the slide width from the left edge and ends about 65 %). Each box is about 1/7 of the slide width wide and about 1/5 of the slide height tall; both are the same height. Code is in a black bold serif font with small-caps-like letters; text sits in the left ~2/3 of each box; the heading line of each box is underlined. The right box has an empty strip at its bottom (it has one line fewer than the left box).
3. **Label "דוגמה 3 + 4"** at the top-right of the slide body, level with the box headings, bold and underlined.
4. Slide number "7" at the bottom-left corner of the slide.
5. Nothing else: no arrows, no pictures, no colour marks. A tiny dark speck to the right of `@ FIVE (C)` inside the right box, and grey smudges (one over the lower right part of the right box), are dirt/reflections on the laptop screen, not slide content.

## Structured inventory
- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים"; "דוגמה 3 + 4".
- **Definitions / concepts:** none stated in text (the slide shows only the two example procedures).
- **Commands / instructions introduced:** procedure definitions `@ TWO (A)` and `@ FIVE (C)`; `FIVE` calls the procedure `TWO` (`TWO (C)`); `TWO` uses `WHILE`/`ENDW`, `SUB`, `ADD`; `FIVE` uses `ADD`.
- **Algorithms / code blocks:**
  - `photo-30-code-1` — procedure `@ TWO (A)` (left box): loop `WHILE (A)`: `SUB (A)`; `ENDW`; then `ADD (A)`, `ADD (A)`.
  - `photo-30-code-2` — procedure `@ FIVE (C)` (right box): `TWO (C)`; then `ADD (C)`, `ADD (C)`, `ADD (C)`.
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** "דוגמה 3 + 4" — the code of `@ TWO (A)` and `@ FIVE (C)` only; no explanatory text on the slide.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none written on the slide. (Within the slide, `FIVE` calls `TWO` from the neighbouring box; later, `FIVE` is called by `@TEN(A)` in photo-29.)
- **Lecturer's solution method / emphasis:** none written on the slide (building a procedure from a previously defined procedure is shown by the code itself).

## Legibility
- **Overall confidence:** high
- **Uncertain items:**
  - none in the code: every line of both boxes was read at 4× and again at 7× zoom (names, parameters, counters A/C, number of `ADD` lines, spacing).
  - Note: the label reads "דוגמה 3 + 4" with a plus sign (displayed left-to-right as "4 + 3 דוגמה"); checked at 4× zoom — it is not a dash.
  - Browser tab title is truncated ("א.3 (3) פ…").
  - (Between references, not about this photo:) photo-28's reference calls the photo-29 slide "slide 13", while photo-29's own reference reads its printed number as 10; the continuity note above follows photo-29's reference.
