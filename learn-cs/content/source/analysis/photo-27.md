# photo-27

- **PDF page:** 49
- **Document / deck title (as seen):** Google Slides deck (URL `docs.google.com/presentation/d/1REh3suL53O7hRhDUbc5BCxLcW_CbjH_Bs9ZERloaaRQ/edit?slide=id.g291a2b49466_0_25#slide=id.g291a2b49466_…`); active browser tab title is cut off: "א.3 (3) פ…". Slide header bar: "א. רקע" + "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים".
- **Kind:** slide
- **Page / slide number visible:** 15 (bottom-left of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** duplicate shot of the slide in photo-26 (same slide number 15, same slide id `…_0_25` in the URL; every line of the code box was compared and is identical; the photo is only framed slightly differently). Nothing new relative to photo-26. Previous slide in the deck is photo-28 (slide 14); next slide is photo-25 (slide 16).

## Transcription

### Header bar (green strip across the top of the slide)
- Right end of the strip (darker green block, large white text): **א. רקע**
- Rest of the strip (olive green, white text): **א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים**

### Label at top-right of the slide body
**דוגמה 7** (bold, slanted, underlined)

### Code box at top-left of the slide body (grey background)
```
@ MOVE(A,B)
   ZERO (B)
   ZERO (C)
   WHILE (A)
       ADD(B)
       ADD (C)
       SUB (A)
   ENDW
   WHILE (C)
       ADD(A)
       SUB (C)
   ENDW
```
Notes on the code as it appears:
- The first line `@ MOVE(A,B)` is underlined; no space between `MOVE` and `(`.
- `ADD(B)` and `ADD(A)` are written without a space before the parenthesis; `ADD (C)`, `SUB (A)`, `SUB (C)`, `ZERO (B)`, `ZERO (C)`, `WHILE (A)`, `WHILE (C)` with a space.
- Indentation: `ZERO`/`WHILE`/`ENDW` lines share one indent level under the heading (the first `ENDW` sits a hair further right than its `WHILE`); `ADD`/`SUB` lines inside each loop are one level deeper.
- 12 lines in total (heading + 11 body lines). Counter `C` is used in the body although it is not in the parameter list `(A,B)`.

### Footer
Slide number at bottom-left: 15

The rest of the slide body is empty (no other text).

## Visuals

1. **Header strip:** full-width green bar; rightmost ~quarter is a darker green block with "א. רקע" in large white letters; the rest is olive green with the sub-title in smaller white letters.
2. **Code box:** one tall narrow rectangle with light-grey fill and no visible border, at the top-left of the slide body; code in a black bold serif font; heading line underlined.
3. **Label "דוגמה 7"** at the top-right of the slide body, level with the top of the code box.
4. Nothing else: no arrows, no pictures, no colour marks. (Grey smudges in the photo are reflections/dirt on the laptop screen.)

## Structured inventory
- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים"; "דוגמה 7".
- **Definitions / concepts:** none stated in text.
- **Commands / instructions introduced:** procedure `@ MOVE(A,B)`; it calls the procedure `ZERO` and uses `WHILE`/`ENDW`, `ADD`, `SUB`.
- **Algorithms / code blocks:**
  - `photo-27-code-1` — procedure `@ MOVE(A,B)` (identical to `photo-26-code-1`): `ZERO (B)`, `ZERO (C)`; loop `WHILE (A)`: `ADD(B)`, `ADD (C)`, `SUB (A)`; then loop `WHILE (C)`: `ADD(A)`, `SUB (C)`.
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** "דוגמה 7" — the code of `@ MOVE(A,B)` only; no explanatory text on the slide.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** uses the procedure `ZERO` (defined as `@ ZERO (A)` on the slide in photo-25/photo-32).
- **Lecturer's solution method / emphasis:** none written on the slide.

## Legibility
- **Overall confidence:** high
- **Uncertain items:**
  - The separator between `A` and `B` in the heading `@ MOVE(A,B)` is a tiny baseline mark; read as a comma (in this shot it shows a small tail, supporting the comma reading).
  - Browser tab title is truncated ("א.3 (3) פ…").
