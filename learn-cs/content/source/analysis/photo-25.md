# photo-25

- **PDF page:** 47
- **Document / deck title (as seen):** Google Slides deck (URL `…cs.google.com/presentation/d/1REh3suL53O7hRhDUbc5BCxLcW_CbjH_Bs9ZERloaaRQ/edit?slide=id.g291a2b49466_0_31#slide=id.g291a2b49466_0_…`); active browser tab title is cut off: "א.3 (3) פ…". Slide header bar: "א. רקע" + "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים".
- **Kind:** slide
- **Page / slide number visible:** 16 (bottom-left of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** (to be confirmed against neighbours) same three-box diagram family as photo-32; this slide adds the "נקודות ודגשים" bullet and the cartoon picture.

## Transcription

### Header bar (green strip across the top of the slide)
- Right end of the strip (darker green block, large white text): **א. רקע**
- Rest of the strip (olive green, white text): **א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים**

### Diagram row (three grey code boxes, left → right, joined by arrows)

Left box (no label above, no caption below):
```
WHILE (R1)
    SUB (R1)
ENDW
```

Under the arrow that goes from the left box to the middle box: **הכללה**

Middle box — label above it: **משתנה** (with a thin arrow pointing down to the `(A)` of the WHILE line):
```
WHILE (A)
    SUB (A)
ENDW
```
Caption under the middle box (bold): **אלגוריתם בעל משתנה**

Under the arrow that goes from the middle box to the right box: **מתן שם**

Right box — label above it: **שם** (with a thin arrow pointing down to the heading line `@ ZERO (A)`):
```
@ ZERO (A)
   WHILE (A)
       SUB (A)
   ENDW
```
(the first line `@ ZERO (A)` is underlined)

Caption under the right box (bold): **פרוצדורה בעלת משתנה**

### Text block under the diagram
**נקודות ודגשים** (heading: bold, italic-looking, underlined, right-aligned)

- הסימן @ מציין הגדרת מילה חדשה. לאחר מכן ייכתב שמה, ולאחר מכן המשתנים הדרושים לה בתוך סוגריים, מופרדים בפסיקים.

(one bullet only; it wraps onto a second line that contains just "מופרדים בפסיקים.")

### Footer
Slide number at bottom-left: 16

## Visuals

1. **Header strip:** full-width green bar; the rightmost ~quarter is a darker green block holding "א. רקע" in large white letters; the remaining olive-green part holds the sub-title in smaller white letters.
2. **Three-box "generalisation → naming" diagram** (occupies the upper-left/centre of the slide, the right third of that row is empty):
   - Three small rectangles with light-grey fill, no visible border, code in a black bold serif font, arranged in one horizontal row.
   - Box 1 (left): `WHILE (R1)` / `SUB (R1)` (indented) / `ENDW`.
   - A horizontal **double-line arrow** with a solid black arrowhead points from box 1 to box 2 (left → right). Text "הכללה" sits just below this arrow.
   - Box 2 (middle): `WHILE (A)` / `SUB (A)` (indented) / `ENDW`. Above the box the word "משתנה"; a thin vertical arrow goes from that word down to the top of the box, landing at the `(A)` of `WHILE (A)`. Below the box, bold caption "אלגוריתם בעל משתנה".
   - A second horizontal double-line arrow with solid arrowhead points from box 2 to box 3 (left → right). Text "מתן שם" sits just below this arrow.
   - Box 3 (right): heading line `@ ZERO (A)` underlined, then `WHILE (A)` / `SUB (A)` (indented) / `ENDW`. Above the box the word "שם"; a thin vertical arrow goes from that word down to the heading line, landing at the `@ ZERO` part. Below the box, bold caption "פרוצדורה בעלת משתנה".
   - Meaning shown: a concrete algorithm on counter R1 → (generalisation) → the same algorithm with a variable A → (giving a name) → a named procedure `@ ZERO (A)`.
3. **Cartoon picture** (bottom-left of the slide, just above the slide number, roughly a quarter of the slide width): a frame from "The Simpsons" — the family sitting on their brown/orange couch against a pink wall with a framed sailboat picture behind them; from left to right Homer (white shirt, blue trousers), Marge (tall blue hair, green dress), Lisa (red dress), Bart (red shirt, shown upside-down/doubled over at the right end), with Maggie squeezed between Marge and Lisa; each of them is pulling/stretching their own face with both hands, eyes bulging. At the far left a purple lamp and a telephone on a purple side table. Decorative only; no text in the picture.
4. No other marks or colours.

## Structured inventory
- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים"; "נקודות ודגשים".
- **Definitions / concepts:** "הכללה" (generalisation: replacing the concrete counter R1 by a variable A); "משתנה" (variable); "מתן שם" (giving a name); "שם" (name); "אלגוריתם בעל משתנה"; "פרוצדורה בעלת משתנה"; the sign `@` marks the definition of a new word, followed by its name and then the variables it needs in parentheses, separated by commas.
- **Commands / instructions introduced:** `@ NAME (variables)` procedure-definition header (here `@ ZERO (A)`); uses `WHILE (X)`, `SUB (X)`, `ENDW`.
- **Algorithms / code blocks:**
  - `photo-25-code-1` — `WHILE (R1) / SUB (R1) / ENDW` (empties counter R1).
  - `photo-25-code-2` — `WHILE (A) / SUB (A) / ENDW` (same algorithm with variable A).
  - `photo-25-code-3` — procedure `@ ZERO (A)` with body `WHILE (A) / SUB (A) / ENDW`.
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** the three-step derivation R1-algorithm → (הכללה) → algorithm with variable A → (מתן שם) → procedure `@ ZERO (A)`.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit (the R1 loop is the starting point of the diagram).
- **Lecturer's solution method / emphasis:** heading "נקודות ודגשים" with the single point about the `@` sign, the name, and the comma-separated variables in parentheses.

## Legibility
- **Overall confidence:** high
- **Uncertain items:**
  - Browser tab title is truncated by the tab width ("א.3 (3) פ…"); the rest of the title is not visible.
  - Exact landing point of the thin arrow from "שם": it ends at the heading line near `@ ZERO`; whether it is meant to point at the `@` or at the word `ZERO` cannot be decided from the photo.
