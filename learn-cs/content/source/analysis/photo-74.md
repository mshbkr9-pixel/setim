# photo-74

- **PDF page:** 96
- **Document / deck title (as seen):** Google Slides deck (URL `docs.google.com/presentation/d/1G6n8nxmMdKXi6rGOtt6x7m4C3lG7CFAYiiCiQA6NQh0/edit?slide=id.g291bf10e91d_0_6#slide=id.g291bf10e91d_0_6`). Browser tab title (truncated): "א.2 (3) דיון במשתנים ומחסניות ז…". Deck name field at the top-left of the editor: only "…) א.2" visible (cut by the photo edge). Slide header bar: "א. רקע" (right) and "א.2 היכרות עם שפת לוגו / מחסניות זיכרון" (left-centre). Neighbouring tabs (other documents): "א.2 (2) פרוצדורות לוגו - מצגת -", "א.6 רקע למושג פונקציה - …", "שיעורים ומשאבים 2027 - Sheets".
- **Kind:** slide
- **Page / slide number visible:** 11 (bottom-left of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** Third of the four "מקרה (N)" slides. Earlier slides of the series: photo-76 (slide 6, "מקרה (1)"), photo-75 (slide 8, "מקרה (2)"); later: photo-73 (slide 13, "מקרה (4)"), photo-72 (slide 14, summary). Slides 9, 10 and 12 are not among my photos. Same layout, same turtle drawing, same command line and same TOOTH code as photo-75. What is new compared with photo-75: in the TEETH procedure the first parameter is now named `:MOO` instead of `:TIMES` (in the `TO` line and in the `REPEAT` line), so the name `:MOO` is used in both procedures; in the stack drawings the TEETH cell that held `times 3` is now `moo 3`; and there is a third stack drawing on the right (TEETH alone again).

## Transcription

### Header bar (green, white text)

- Right side, large: **א. רקע**
- Left-centre, smaller: **א.2 היכרות עם שפת לוגו / מחסניות זיכרון**

### Sub-title (top right of the slide body, bold, dark)

דיון במשתנים ומחסניות זיכרון

### Case caption (centre, bold, dark, small), with a large green digit "3" immediately to its left

מקרה (3):

(large green numeral to the left of the caption:) **3**

### Code box A (grey box, far left) — the word `TEETH` in the first line is underlined

```
TO TEETH :MOO :SIZE
   REPEAT :MOO [
      TOOTH  :SIZE
   ]
END
```

(The gap between `TOOTH` and `:SIZE` in line 3 is slightly wider than a normal space, as in photo-75.)

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

### Memory-stack drawings (lower part of the slide; three drawings side by side, left → right)

Drawing 1 (left) — one open-topped box labelled `TEETH`:

| cell name | value |
|---|---|
| size | 20 |
| moo | 3 |

Drawing 2 (middle) — one taller open-topped box divided by a horizontal line into two floors:

| floor (label) | cell name | value |
|---|---|---|
| upper floor: `TOOTH` | moo | 20 |
| lower floor: `TEETH` | size | 20 |
| lower floor: `TEETH` | moo | 3 |

Drawing 3 (right) — one open-topped box labelled `TEETH`:

| cell name | value |
|---|---|
| size | 20 |
| moo | 3 |

(all cells listed from top to bottom)

### Slide number (bottom-left)

11

## Visuals

**Overall layout.** Same as photo-76 / photo-75: green header bar; right column with the bold sub-title and the turtle drawing below it; in the centre the small bold caption "מקרה (3):" with the big green "3" at its left; at the left the two grey code boxes side by side (TEETH box at the far left, TOOTH box to its right, taller); under them the command input line with the Execute button; in the lower half three stack drawings in a row spanning most of the slide width; slide number "11" at the bottom-left.

**Turtle drawing (under the sub-title, right side).** Same as in photo-76: two separate square-wave ("teeth") lines, one above the other, thin dark line, only horizontal and vertical segments, all segments of one line equal in length.
- Upper line: 5 small teeth. From left to right: bottom horizontal segment (free left end), up, top, down, bottom, up, top, down, … ending at the right with a vertical segment down to the baseline (20 segments).
- Lower line: 3 teeth, segments about twice as long: bottom horizontal segment (free left end), up, top, down, bottom, up, top, down, bottom, up, top, down (12 segments), ending with a vertical segment at the right.
- Right ends of the two lines are aligned; the lower line extends further left.

**Code boxes.** Two light-grey rectangles, bold serif dark text. `TEETH` and `TOOTH` are underlined in their `TO` lines. The name `:MOO` (both occurrences in box A, all five occurrences in box B) is set in a visibly heavier/bolder face than the surrounding code, as if typed over the original name; `:SIZE` in box A (lines 1 and 3) also has a heavier colon than in photo-76. Nothing is struck through or coloured.

**Command line.** White framed input field containing `TEETH 3 20` (bold monospace), grey "Execute" button on its right.

**Stack drawing 1 (left).** Open-topped rectangular container (left wall, bottom, right wall). Label `TEETH` (bold monospace capitals) outside, left of the left wall, at the height of the lower cell. Inside, two rows, each a lower-case monospace name followed on the right by a small square box with the value:
- top row: `size` [20]
- bottom row: `moo` [3]

**Stack drawing 2 (middle; bottom at the same level as drawing 1, taller).** Open-topped container divided by one horizontal line into two floors:
- upper floor — label `TOOTH` outside on the left; one row: `moo` [20]
- (horizontal dividing line)
- lower floor — label `TEETH` outside on the left; two rows: `size` [20] on top, `moo` [3] below.
The TOOTH floor sits on top of the TEETH floor.

**Stack drawing 3 (right, under the turtle drawing; bottom at about the same level as the others, same height as drawing 1).** Open-topped container, label `TEETH` outside on the left at the height of the lower cell; two rows: `size` [20] on top, `moo` [3] below. Identical in content to drawing 1 (the TOOTH floor is gone).

Left-to-right order of the three drawings: TEETH alone → TOOTH on top of TEETH → TEETH alone.

Colours: header olive-green with white/cream text; big "3" in the same green; the rest black/dark on white; code boxes light grey.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.2 היכרות עם שפת לוגו / מחסניות זיכרון"; "דיון במשתנים ומחסניות זיכרון"; "מקרה (3):"
- **Definitions / concepts:** none stated in words; shown graphically: two different procedures each have a parameter with the same name (`moo`), kept in separate floors of the stack with different values (TEETH: moo = 3; TOOTH: moo = 20).
- **Commands / instructions introduced:** none new.
- **Algorithms / code blocks:**
  - `photo-74-code-1` — procedure `TEETH :MOO :SIZE` (`REPEAT :MOO [ TOOTH :SIZE ]`; first parameter renamed from `:TIMES` to `:MOO`).
  - `photo-74-code-2` — procedure `TOOTH :MOO` (as in photo-75: `FD :MOO` four times, with `LT 90`, `LT 90`, `RT 90`, `RT 90`).
  - `photo-74-code-3` — command line `TEETH 3 20`.
- **Trace tables:** none (stack drawings: TEETH {size 20, moo 3}; TOOTH {moo 20} on top of TEETH {size 20, moo 3}; TEETH {size 20, moo 3}).
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** Case 3 — `TEETH 3 20` where the name `:MOO` is used both as TEETH's first parameter (the repeat count) and as TOOTH's parameter (the tooth size). Stage 1: TEETH floor with size=20, moo=3. Stage 2: TOOTH floor with moo=20 on top of the TEETH floor (size=20, moo=3). Stage 3: only the TEETH floor again, unchanged (size=20, moo=3).
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** same procedures and command line as cases 1–2 (photo-76, photo-75).
- **Lecturer's solution method / emphasis:** the renamed parameter is highlighted by heavier type; the three stack stages show that TOOTH's `moo` (20) lives in its own floor and does not change TEETH's `moo` (3), which is still 3 after TOOTH's floor is removed.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Browser tab title is truncated ("…ומחסניות ז"); only the visible part transcribed.
  - Exact number of spaces in `TOOTH  :SIZE` (code box A, line 3) cannot be determined; only a wider gap is visible.
  - The "heavier type" of `:MOO` / `:SIZE` is a visual impression from the photo (stroke weight), not a certain formatting fact.
