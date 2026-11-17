# photo-76

- **PDF page:** 98
- **Document / deck title (as seen):** Google Slides deck (URL `docs.google.com/presentation/d/1G6n8nxmMdKXi6rGOtt6x7m4C3lG7CFAYiiCiQA6NQh0/edit?slide=id.p#…`). Browser tab title (truncated by the tab width): "א.2 (3) דיון במשתנים ומחסניות זי…". The deck name field at the top-left of the editor shows only "א.2 (3)" (rest cut off by the photo edge). Slide header bar: "א. רקע" (right) and "א.2 היכרות עם שפת לוגו / מחסניות זיכרון" (left-centre). Neighbouring browser tabs (not this document): "א.2 (2) פרוצדורות לוגו - מצגת -", "א.6 רקע למושג פונקציה - קר…", "שיעורים ומשאבים 2027 - Sheets".
- **Kind:** slide
- **Page / slide number visible:** 6 (bottom-left of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** First ("case 1") of a series of four "מקרה (N)" slides with the same layout. The next photographed slides are photo-75 (slide 8, "מקרה (2)"), photo-74 (slide 11, "מקרה (3)"), photo-73 (slide 13, "מקרה (4)") and photo-72 (slide 14, summary "נקודות ודגשים"). Slide 7 (between this slide and photo-75) is not among my photos. Compared with photo-75: here both procedures use the parameter name `:SIZE`; in photo-75 TOOTH's parameter is renamed `:MOO`.

## Transcription

### Header bar (green, white text)

- Right side, large: **א. רקע**
- Left-centre, smaller: **א.2 היכרות עם שפת לוגו / מחסניות זיכרון**

### Sub-title (top right of the slide body, bold, dark)

דיון במשתנים ומחסניות זיכרון

### Case caption (centre, bold, dark), with a large green digit "1" immediately to its left

מקרה (1) – המילים שכתבנו:

(large green numeral to the left of the caption:) **1**

### Code box A (grey box, far left) — the word `TEETH` in the first line is underlined

```
TO TEETH :TIMES :SIZE
   REPEAT :TIMES [
      TOOTH :SIZE
   ]
END
```

### Code box B (grey box, to the right of box A) — the word `TOOTH` in the first line is underlined

```
TO TOOTH :SIZE
      FD :SIZE
      LT 90
      FD :SIZE
      LT 90
      FD :SIZE
      RT 90
      FD :SIZE
      RT 90
END
```

### Command line (below the code boxes: a text input field with an "Execute" button to its right)

```
TEETH 3 20
```

Button label: `Execute`

### Memory-stack drawings (lower part of the slide; two drawings side by side)

Left drawing — one open-topped box labelled `TEETH`:

| cell name | value |
|---|---|
| size | 20 |
| times | 3 |

(cells listed from top to bottom)

Right drawing — one taller open-topped box divided by a horizontal line into two floors:

| floor (label) | cell name | value |
|---|---|---|
| upper floor: `TOOTH` | size | 20 |
| lower floor: `TEETH` | size | 20 |
| lower floor: `TEETH` | times | 3 |

(listed from top to bottom)

### Slide number (bottom-left)

6

## Visuals

**Overall layout.** White slide with a green header bar across the top. Body, from right to left: (right column) the bold sub-title with the turtle drawing under it; (centre) the caption "מקרה (1) – המילים שכתבנו:" with the big green "1" at its left end; (left) the two grey code boxes side by side — TEETH box at the far left, TOOTH box to its right (the TOOTH box is taller: 10 lines against 5). Under the code boxes, at the left, the command input line with the Execute button. In the lower half, the two stack drawings. Slide number "6" at the bottom-left.

**Turtle drawing (under the sub-title, right side).** Two separate square-wave ("teeth") lines, one above the other, drawn with a thin dark-blue/black line, no fill. All segments are horizontal or vertical and, within one line, all of equal length (each tooth is as wide as it is high and the gap between teeth equals the tooth width).
- Upper line: 5 teeth, small. Read from left to right: a bottom horizontal segment (free left end), then up, right along the top, down, right along the bottom, up, top, down, bottom, up, top, down, bottom, up, top, down — ending at the right with a vertical segment going down to the baseline level (free end at the bottom-right). 20 segments in total (5 × [bottom, up, top, down]).
- Lower line: 3 teeth, each segment about twice as long as in the upper line (so the teeth are twice as wide and twice as high). Same pattern: bottom horizontal segment with free left end, up, top, down, bottom, up, top, down, bottom, up, top, down — 12 segments, ending with a vertical segment on the right.
- The right ends of the two lines are aligned vertically; the lower line extends further to the left (total width ≈ 12 small units against ≈ 10 small units for the upper line).
- (Observation, not written on the slide: the shapes match the TOOTH code if the turtle starts at the bottom-right end facing up and advances leftwards — FD up, LT 90, FD left, LT 90, FD down, RT 90, FD left, RT 90 per tooth. The lower line has 3 teeth, like `TEETH 3 20`.)

**Code boxes.** Two light-grey filled rectangles; text in a bold serif font, dark (black/navy). In each box the procedure name in the `TO` line (`TEETH`, `TOOTH`) is underlined. Nothing is struck through or coloured on this slide.

**Command line.** A long white input field with a dark frame containing `TEETH 3 20` in a bold monospace font, followed on the right by a grey button labelled "Execute" — it looks like a screenshot of a LOGO interpreter's command line.

**Stack drawing 1 (left).** An open-topped rectangular container (left wall, bottom, right wall; no top line), thin black lines. Outside, to the left of the left wall, at the height of the lower cell, the label `TEETH` (bold monospace capitals). Inside, two rows; each row is a lower-case monospace name followed on its right by a small square box holding the value:
- top row: `size` [20]
- bottom row: `times` [3]

**Stack drawing 2 (right of drawing 1, its bottom at the same level, but taller).** The same kind of open-topped container, divided by one horizontal line into two floors:
- upper floor — label `TOOTH` outside on the left; inside one row: `size` [20]
- (horizontal dividing line)
- lower floor — label `TEETH` outside on the left; inside two rows: `size` [20] on top, `times` [3] below.
The TOOTH floor is stacked on top of the TEETH floor. The lower floor is identical to drawing 1. (So drawing 1 = the stack while only TEETH is active; drawing 2 = the stack after TOOTH was called from TEETH.)

Colours: header bar olive-green with white/cream text; big "1" in the same green; everything else black/dark on white, code boxes light grey.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.2 היכרות עם שפת לוגו / מחסניות זיכרון"; "דיון במשתנים ומחסניות זיכרון"; "מקרה (1) – המילים שכתבנו:"
- **Definitions / concepts:** none stated in words; shown graphically: a memory stack with one floor per active procedure (TEETH below, TOOTH above), each floor holding the procedure's parameters with their values.
- **Commands / instructions introduced:** none new (uses `TO … END`, `REPEAT … [ … ]`, `FD`, `LT`, `RT`, parameters `:TIMES`, `:SIZE`).
- **Algorithms / code blocks:**
  - `photo-76-code-1` — procedure `TEETH :TIMES :SIZE` (repeats `TOOTH :SIZE` `:TIMES` times).
  - `photo-76-code-2` — procedure `TOOTH :SIZE` (one tooth: FD/LT/FD/LT/FD/RT/FD/RT, all with `:SIZE` and 90).
  - `photo-76-code-3` — command line `TEETH 3 20`.
- **Trace tables:** none (stack drawings instead: TEETH {size 20, times 3}; then TOOTH {size 20} on top of TEETH {size 20, times 3}).
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** Case 1 — running `TEETH 3 20` with the procedures as originally written (same name `:SIZE` in both procedures). Stage 1 stack: TEETH with size=20, times=3. Stage 2 stack: TOOTH floor with size=20 on top of the TEETH floor (size=20, times=3).
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** the caption "המילים שכתבנו" refers to the TEETH / TOOTH procedures written earlier (the neighbouring tab "א.2 (2) פרוצדורות לוגו" is the previous deck).
- **Lecturer's solution method / emphasis:** each procedure call gets its own floor in the stack with its own copy of the parameters, even when the names are identical (`size` appears once in the TEETH floor and once in the TOOTH floor).

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - The browser tab title is truncated ("…ומחסניות זי"); the full title is presumably the same as the slide sub-title but only the visible part was transcribed.
  - The long dash in the caption "מקרה (1) – המילים שכתבנו:" touches the following word (no visible space after it); read as an en/em dash.
