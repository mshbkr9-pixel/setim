# photo-73

- **PDF page:** 95
- **Document / deck title (as seen):** Google Slides deck, shown in the editor ("Slideshow" / "Share" buttons visible). Active browser tab: "א.2 (3) דיון במשתנים ומחסניות …" (truncated). Other tabs (same set as in photo-72): "א.6 רקע למושג פונק…" (cut by the photo edge), "א.2 (2) פרוצדורות לוגו - מצגת", "שיעורים ומשאבים 2027 - Sheets", "… 2027 - Classroom". URL: `docs.google.com/presentation/d/1G6n8nxmMdKXi6rGOtt6x7m4C3lG7CFAYiiCiQA6NQh0/edit?slide=id.g291bf10e91d_0_11#slide=id.g291bf10e91d_0_11` (read from the full photo only, not zoomed). Slide header band: right side "א. רקע", left side "א.2 היכרות עם שפת לוגו / מחסניות זיכרון".
- **Kind:** slide
- **Page / slide number visible:** 13 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** Fourth and last of the "מקרה (N)" slides: photo-76 = slide 6 "מקרה (1)", photo-75 = slide 8 "מקרה (2)", photo-74 = slide 11 "מקרה (3)", this photo = slide 13 "מקרה (4)"; the next slide (14) is photo-72 ("נקודות ודגשים"). Slide 12 is not among the photos. Same layout, same sub-title, same turtle drawing and same command line `TEETH 3 20` as photos 74–76.
  - **New compared with case 3 (photo-74):** TEETH's first parameter is `:TIMES` again (case 3: `:MOO`), in the `TO` line and in the `REPEAT` line; TOOTH's code uses `:SIZE` again (case 3: `:MOO` everywhere); **the parameter `:SIZE` in TOOTH's header line `TO TOOTH :SIZE` and the argument `:SIZE` in the call `TOOTH :SIZE` inside TEETH are struck through** (nothing is struck through in cases 1–3 according to their reference files); in the stack drawings the TEETH cells are `size 20` / `times 3` (case 3: `size 20` / `moo 3`), and the TOOTH floor contains only a question mark "?" and no cell (case 3: `moo 20`); there are only **two** stack drawings (case 3 had three: TEETH alone was repeated on the right).
  - **Compared with case 1 (photo-76):** code text identical (`:TIMES` / `:SIZE` in both procedures) except for the two struck-through `:SIZE`; left stack identical (`size 20`, `times 3`); in the right stack TOOTH's floor shows "?" instead of the cell `size 20`.
  - **Caption form:** "מקרה (4):" as in cases 2 and 3 (case 1 is "מקרה (1) – המילים שכתבנו:"); there is no text after the colon here.

## Transcription

**Header band (green band, white text):**

- Right side (larger): א. רקע
- Left side (smaller): א.2 היכרות עם שפת לוגו / מחסניות זיכרון

**Sub-title (top right of the slide body, bold, dark):**

דיון במשתנים ומחסניות זיכרון

**Case caption (centre-left of the body, small, bold, dark), with a large green digit "4" immediately to its left:**

מקרה (4):

(large green numeral:) **4**

**Code box A (grey box, far left) — `TEETH` in the first line is underlined:**

```
TO TEETH :TIMES :SIZE
   REPEAT :TIMES [
      TOOTH :SIZE
   ]
END
```

Struck through in box A: the `:SIZE` of line 3 only — rendered: TOOTH ~~:SIZE~~. (The `:SIZE` and `:TIMES` of line 1 and the `:TIMES` of line 2 are **not** struck through.)

**Code box B (grey box, to the right of box A, taller) — `TOOTH` in the first line is underlined:**

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

Struck through in box B: the `:SIZE` of line 1 only — rendered: TO TOOTH ~~:SIZE~~. (The four `FD :SIZE` lines are **not** struck through.)

Parameter names, line by line: box A line 1 `:TIMES` `:SIZE`; line 2 `:TIMES`; line 3 `:SIZE` (struck). Box B line 1 `:SIZE` (struck); lines 2, 4, 6, 8 `FD :SIZE`; lines 3, 5 `LT 90`; lines 7, 9 `RT 90`. No `:MOO` anywhere on this slide.

**Command line (input field with a button to its right):**

```
TEETH 3 20
```

Button label: `Execute`

**Memory-stack drawings (lower half of the slide, two drawings side by side, cells listed top to bottom):**

Left drawing — one open-topped container, label `TEETH` outside on its left:

| floor (label) | cell name | value |
|---|---|---|
| `TEETH` | size | 20 |
| `TEETH` | times | 3 |

Right drawing — one taller open-topped container divided by a horizontal line into two floors:

| floor (label) | cell name | value |
|---|---|---|
| upper floor: `TOOTH` | — (no cell; only a "?" is written in this floor) | — |
| lower floor: `TEETH` | size | 20 |
| lower floor: `TEETH` | times | 3 |

**Bottom-left of the slide:** `13` (slide number)

## Visuals

**Overall layout.** Green header band across the top. Right column: the bold sub-title "דיון במשתנים ומחסניות זיכרון" with the turtle drawing under it. Left half, top: code box A (TEETH, far left) and code box B (TOOTH, to its right, about twice as tall: 10 lines against 5); immediately right of box B the big green "4" and, right of it, the small caption "מקרה (4):" (its baseline at about the lower half of the "4"). Under the code boxes, at the left: the command input line with the Execute button. Lower half: the two stack drawings, the left one under box A, the right one under box B; their bottoms are at the same level. The lower-right quarter of the slide (under the turtle drawing) is empty. Slide number "13" at the bottom-left.

**Turtle drawing (right column, under the sub-title).** Two separate square-wave ("teeth") lines, one above the other, thin dark line, only horizontal and vertical segments, all segments of one line equal in length.
- Upper line: 5 small teeth. Left to right: a bottom horizontal segment (free left end), then up, top, down, bottom, … — 5 top segments, 5 bottom segments (1 leading + 4 between teeth), 10 vertical strokes; ends at the right with a vertical stroke down to the baseline (free end at the bottom-right).
- Lower line: 3 teeth with segments about twice as long: bottom segment (free left end), up, top, down, bottom, up, top, down, bottom, up, top, down — ends with a vertical stroke at the right.
- The right ends of the two lines are vertically aligned; the lower line extends further to the left. No labels, no turtle markers. (Same drawing as in photos 74–76 and as drawings (א)/(ב) of photo-68.)

**Code boxes.** Two light-grey filled rectangles without outline; bold serif (Times-like) dark text, upper case. `TEETH` and `TOOTH` are underlined in their `TO` lines. The two struck-through `:SIZE` (box A line 3, box B line 1) have a horizontal line through the middle of the letters along the whole word, and look darker/heavier than the other `:SIZE` tokens. No colour inside the boxes.

**Big numeral.** A large bold "4" in olive green (same green as the header band), about two code lines tall, right of box B, level with box B's first lines.

**Command line.** A long white input field with a dark frame containing `TEETH 3 20` (bold monospace), followed on the right by a grey button "Execute"; a thin line runs under both (like a screenshot of a LOGO interpreter's command line).

**Stack drawing 1 (left).** Open-topped rectangular container (left wall, bottom line, right wall; no top line), thin black lines; wider than tall (about 1.3 : 1). Label `TEETH` (bold monospace capitals) outside, left of the left wall, level with the lower row. Inside, two rows; each row is a lower-case monospace name followed on its right by a small square-ish box holding the value:
- top row: `size` [20]
- bottom row: `times` [3]
A small empty margin above the top row (the walls rise a little above the `size` box).

**Stack drawing 2 (right; its bottom at the same level as drawing 1, its walls rise higher — total height about 1.3 × drawing 1).** Same kind of open-topped container, divided by one horizontal line (wall to wall) into two floors:
- upper floor (about 1/3 of the height) — label `TOOTH` outside on the left; inside **no cell and no box**, only a question mark "?" centred horizontally, in the upper part of the floor;
- (horizontal dividing line)
- lower floor (about 2/3 of the height) — label `TEETH` outside on the left (between its two rows, nearer the lower one); two rows: `size` [20] on top, `times` [3] below. The lower floor is identical in content to drawing 1.
In both drawings the value boxes form a column near the right wall (with a small gap to the wall), and each name is written right-aligned just left of its box.

Left-to-right order of the two drawings: TEETH alone → TOOTH ("?") on top of TEETH.

Colours: header band green with white text; big "4" green; everything else black/dark on white; code boxes light grey.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.2 היכרות עם שפת לוגו / מחסניות זיכרון"; "דיון במשתנים ומחסניות זיכרון"; "מקרה (4):"
- **Definitions / concepts:** none stated in words; shown graphically: a TOOTH floor with no cell, marked "?", stacked on the TEETH floor (size 20, times 3), while TOOTH's own parameter and the argument passed to it are struck out.
- **Commands / instructions introduced:** none new.
- **Algorithms / code blocks:**
  - `photo-73-code-1` — procedure `TO TEETH :TIMES :SIZE` / `REPEAT :TIMES [` / `TOOTH :SIZE` (with `:SIZE` struck through) / `]` / `END`.
  - `photo-73-code-2` — procedure `TO TOOTH :SIZE` (with `:SIZE` struck through) / `FD :SIZE` / `LT 90` / `FD :SIZE` / `LT 90` / `FD :SIZE` / `RT 90` / `FD :SIZE` / `RT 90` / `END`.
  - `photo-73-code-3` — command line `TEETH 3 20`.
- **Trace tables:** none (stack drawings: TEETH {size 20, times 3}; TOOTH {?} on top of TEETH {size 20, times 3}).
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** Case 4 — `TEETH 3 20` with TOOTH's parameter struck out (header `TO TOOTH ~~:SIZE~~`, call `TOOTH ~~:SIZE~~`) while TOOTH's body still uses `FD :SIZE`. Stage 1 (left drawing): TEETH floor with size = 20, times = 3. Stage 2 (right drawing): a TOOTH floor with no cell, only "?", on top of the TEETH floor (size = 20, times = 3). No answer to the "?" is written on this slide.
- **Questions / exercises (verbatim, with numbers):** none written as a sentence; the open question is the "?" in TOOTH's floor of the right stack drawing.
- **References to earlier material:** same procedures, command line and turtle drawing as cases 1–3 (photos 76, 75, 74); the TOOTH / TEETH procedures were introduced in "דוגמה 2" (photo-68, other deck).
- **Lecturer's solution method / emphasis:** the change from the earlier cases is marked by strikethrough on TOOTH's parameter and on the argument of the call; the case number is emphasised by the large green digit; the stack drawings are shown in stages from left to right.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Whether the strikethrough also covers the colon of the struck `:SIZE` tokens (the line clearly crosses the letters S-I-Z-E; at the colon it is not distinguishable). The strikethrough itself is certain in both places, and it is absent from all other tokens.
  - URL slide id (`…_0_11`) and the tab titles were read from the full photo only (not zoomed); the tab set is the same one I zoomed in photo-72.
  - Exact indentation widths in the code boxes are approximated (nesting is clear).
  - Note for the caller: the caption is only "מקרה (4):" — there is no "– …" text after it (checked in a 4× zoom). In case 4 the parameter names are `:TIMES` / `:SIZE` only; `:MOO` does not occur, and the stack cells are `size 20`, `times 3` (no `moo` cell); TOOTH's floor holds only "?".
