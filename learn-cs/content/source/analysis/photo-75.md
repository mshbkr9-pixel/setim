# photo-75

- **PDF page:** 97
- **Document / deck title (as seen):** Google Slides deck (URL `docs.google.com/presentation/d/1G6n8nxmMdKXi6rGOtt6x7m4C3lG7CFAYiiCiQA6NQh0/edit?slide=id.g291bf10e91d_0_1#slide=id.g291bf10e91d_0_1`). Browser tab title (truncated): "א.2 (3) דיון במשתנים ומחסניות ז…". Deck name field at the top-left of the editor: "א.2 (3) ד…" (cut by the photo edge). Slide header bar: "א. רקע" (right) and "א.2 היכרות עם שפת לוגו / מחסניות זיכרון" (left-centre). Neighbouring tabs (other documents): "א.2 (2) פרוצדורות לוגו - מצגת -", "א.6 רקע למושג פונקציה - קר…", "שיעורים ומשאבים 2027 - Sheets".
- **Kind:** slide
- **Page / slide number visible:** 8 (bottom-left of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** Second of the four "מקרה (N)" slides. Earlier slide of the series: photo-76 (slide 6, "מקרה (1)"); later: photo-74 (slide 11, "מקרה (3)"), photo-73 (slide 13, "מקרה (4)"), photo-72 (slide 14, summary). Slides 7, 9 and 10 are not among my photos. Same layout, same turtle drawing, same command line and same TEETH code as photo-76. What is new compared with photo-76: in the TOOTH procedure the parameter is named `:MOO` instead of `:SIZE` (header line and all four FD lines), and in the right-hand stack drawing the cell of the TOOTH floor is named `moo` instead of `size`.

## Transcription

### Header bar (green, white text)

- Right side, large: **א. רקע**
- Left-centre, smaller: **א.2 היכרות עם שפת לוגו / מחסניות זיכרון**

### Sub-title (top right of the slide body, bold, dark)

דיון במשתנים ומחסניות זיכרון

### Case caption (centre, bold, dark, small), with a large green digit "2" immediately to its left

מקרה (2):

(large green numeral to the left of the caption:) **2**

### Code box A (grey box, far left) — the word `TEETH` in the first line is underlined

```
TO TEETH :TIMES :SIZE
   REPEAT :TIMES [
      TOOTH  :SIZE
   ]
END
```

(In the third line there is a slightly wider gap between `TOOTH` and `:SIZE` than on the slide of photo-76; the text is otherwise identical.)

### Code box B (grey box, to the right of box A) — the word `TOOTH` in the first line is underlined

```
TO TOOTH :MOO
      FD :MOO
      LT 90
      FD :MOO
      LT 90
      FD :MOO
      RT 90
      FD :MOO
      RT 90
END
```

### Command line (text input field with an "Execute" button to its right)

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
| upper floor: `TOOTH` | moo | 20 |
| lower floor: `TEETH` | size | 20 |
| lower floor: `TEETH` | times | 3 |

(listed from top to bottom)

### Slide number (bottom-left)

8

## Visuals

**Overall layout.** Identical to photo-76: green header bar; right column with the bold sub-title and the turtle drawing below it; in the centre the small bold caption "מקרה (2):" with the big green "2" at its left; at the left the two grey code boxes side by side (TEETH box at the far left, TOOTH box to its right, taller); under them the command input line with the Execute button; in the lower half two stack drawings; slide number "8" at the bottom-left.

**Turtle drawing (under the sub-title, right side).** Same as in photo-76: two separate square-wave ("teeth") lines, one above the other, thin dark line, only horizontal and vertical segments, all segments of one line equal in length.
- Upper line: 5 small teeth. From left to right: bottom horizontal segment (free left end), up, top, down, bottom, up, top, down, … ending at the right with a vertical segment down to the baseline (20 segments).
- Lower line: 3 teeth, segments about twice as long as in the upper line: bottom horizontal segment (free left end), up, top, down, bottom, up, top, down, bottom, up, top, down (12 segments), ending with a vertical segment at the right.
- Right ends of the two lines are aligned; the lower line extends further left.

**Code boxes.** Two light-grey rectangles, bold serif dark text. `TEETH` and `TOOTH` are underlined in their `TO` lines. Nothing struck through or coloured.

**Command line.** White framed input field containing `TEETH 3 20` (bold monospace), grey "Execute" button on its right.

**Stack drawing 1 (left).** Open-topped rectangular container (left wall, bottom, right wall). Label `TEETH` (bold monospace capitals) outside, left of the left wall, at the height of the lower cell. Inside, two rows, each a lower-case monospace name followed on the right by a small square box with the value:
- top row: `size` [20]
- bottom row: `times` [3]

**Stack drawing 2 (to the right of drawing 1, bottoms at the same level, taller).** Open-topped container divided by one horizontal line into two floors:
- upper floor — label `TOOTH` outside on the left; one row: `moo` [20]
- (horizontal dividing line)
- lower floor — label `TEETH` outside on the left; two rows: `size` [20] on top, `times` [3] below.
The TOOTH floor sits on top of the TEETH floor; the lower floor is identical to drawing 1.

Colours: header olive-green with white/cream text; big "2" in the same green; the rest black/dark on white; code boxes light grey.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.2 היכרות עם שפת לוגו / מחסניות זיכרון"; "דיון במשתנים ומחסניות זיכרון"; "מקרה (2):"
- **Definitions / concepts:** none stated in words; shown graphically: the called procedure's floor holds its own parameter under its own name (`moo`), with the value passed from the caller (20).
- **Commands / instructions introduced:** none new.
- **Algorithms / code blocks:**
  - `photo-75-code-1` — procedure `TEETH :TIMES :SIZE` (unchanged: `REPEAT :TIMES [ TOOTH :SIZE ]`).
  - `photo-75-code-2` — procedure `TOOTH :MOO` (parameter renamed to `:MOO`; body uses `FD :MOO` four times, with `LT 90`, `LT 90`, `RT 90`, `RT 90`).
  - `photo-75-code-3` — command line `TEETH 3 20`.
- **Trace tables:** none (stack drawings: TEETH {size 20, times 3}; then TOOTH {moo 20} on top of TEETH {size 20, times 3}).
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** Case 2 — `TEETH 3 20` where TOOTH's parameter is called `:MOO`. Stage 1 stack: TEETH with size=20, times=3. Stage 2 stack: TOOTH floor with moo=20 above the TEETH floor (size=20, times=3).
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** same TEETH/TOOTH procedures and command line as case 1 (photo-76).
- **Lecturer's solution method / emphasis:** only the parameter name inside TOOTH changes (`:SIZE` → `:MOO`); the value 20 still arrives in TOOTH's floor, now in a cell named `moo`, while TEETH keeps `size` and `times`.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Browser tab title is truncated ("…ומחסניות ז"); only the visible part transcribed.
  - Whether the wider gap in `TOOTH  :SIZE` (code box A, line 3) is one or two spaces cannot be decided from the photo; no other character is there.
