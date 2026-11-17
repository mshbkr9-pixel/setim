# photo-28

- **PDF page:** 50
- **Document / deck title (as seen):** Google Slides deck (URL `docs.google.com/presentation/d/1REh3suL53O7hRhDUbc5BCxLcW_CbjH_Bs9ZERloaaRQ/edit?slide=id.g291a2b49466_0_19#slide=id.g291a2b49466…`); active browser tab title is cut off: "א.3 (3) פ…". Slide header bar: "א. רקע" + "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים".
- **Kind:** slide
- **Page / slide number visible:** 14 (bottom-left of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** single shot of slide 14 ("דוגמה 6"). Previous slide in the deck is photo-29 (slide 13, "דוגמה 5", `@ TEN (A)`); next slide is photo-27/photo-26 (slide 15, "דוגמה 7", `@ MOVE(A,B)`). No overlap of content with the neighbours, but this slide uses the procedures `ZERO` and `TEN` defined on earlier slides.

## Transcription

### Header bar (green strip across the top of the slide)
- Right end of the strip (darker green block, large white text): **א. רקע**
- Rest of the strip (olive green, white text): **א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים**

### Label at top-right of the slide body
**דוגמה 6** (bold, slanted, underlined)

### Procedure heading (top-left of the slide body, above the table, underlined)
```
@HUN (A)
```
(no space between `@` and `HUN`; the heading starts a little to the left of the table's left edge)

### The code, read top to bottom from the left column of the table
(line numbers 1–10 are **added here for reference only** — they are not on the slide)
```
 1  ZERO (A)
 2  TEN (B)
 3  WHILE(B)
 4      TEN (T)
 5      WHILE (T)
 6        SUB(T)
 7        ADD(A)
 8      ENDW
 9      SUB (B)
10  ENDW
```
Spelling/spacing exactly as seen: `WHILE(B)`, `SUB(T)`, `ADD(A)` have no space before the parenthesis; `ZERO (A)`, `TEN (B)`, `TEN (T)`, `WHILE (T)`, `SUB (B)` have a space. Lines 4–9 are inside an indented inner box; lines 6–7 are indented slightly further than lines 5 and 8.

### The Hebrew explanation cells and exactly which code lines each one spans

| Hebrew label (as written) | Spans code lines | Code covered |
|---|---|---|
| הכנס 100 למונה A | 1–10 (whole table height) | the entire procedure body |
| אפס את המונה A | 1 | `ZERO (A)` |
| הוסף 100 למונה A | 2–10 | `TEN (B)` + the whole `WHILE(B)` … `ENDW` loop |
| הכנס 10 למונה B | 2 | `TEN (B)` |
| כל עוד B אינו ריק | 3–10 (text is level with line 3; the cell encloses the inner box and the empty strip beside line 10) | `WHILE(B)` … `ENDW` |
| הוסף 10 למונה A | 4–8 | `TEN (T)` + `WHILE (T)` / `SUB(T)` / `ADD(A)` / `ENDW` |
| הכנס 10 ל-T | 4 | `TEN (T)` |
| העבר תוכן T ל-A | 5–8 | `WHILE (T)` / `SUB(T)` / `ADD(A)` / `ENDW` |
| חסר 1 מהמונה B | 9 | `SUB (B)` |
| — (no label; empty space) | 10 | final `ENDW` |

Line breaks inside label cells as on the slide: "הכנס 100 / למונה A"; "הוסף 100 / למונה A"; "הוסף 10 / למונה A"; "העבר תוכן / T ל-A" (second line is displayed as `A-ל T`); the other labels are on one line ("הכנס 10 ל-T" is displayed as `T-ל 10 הכנס`).

### Same table flattened to a grid
No header row. Column order on the slide **from right to left**: (1) outermost label column → (2) → (3) → (4) innermost label column → (5) code column (leftmost). In the markdown grid below the columns are listed in that right-to-left order, i.e. the first markdown column is the slide's rightmost column. "↑" = same cell continues from the row above (vertical span); "←" = this cell is merged with the cell in the next column listed (horizontal span); "—" = empty.

| (1) rightmost | (2) | (3) | (4) | (5) code — leftmost |
|---|---|---|---|---|
| הכנס 100 למונה A | אפס את המונה A | ← | ← | `ZERO (A)` |
| ↑ | הוסף 100 למונה A | הכנס 10 למונה B | ← | `TEN (B)` |
| ↑ | ↑ | כל עוד B אינו ריק | ← | `WHILE(B)` |
| ↑ | ↑ | הוסף 10 למונה A | הכנס 10 ל-T | `TEN (T)` |
| ↑ | ↑ | ↑ | העבר תוכן T ל-A | `WHILE (T)` / `SUB(T)` / `ADD(A)` / `ENDW` (four lines in one cell) |
| ↑ | ↑ | חסר 1 מהמונה B | ← | `SUB (B)` |
| ↑ | ↑ | — (empty; bottom of the "כל עוד B אינו ריק" cell) | ← | `ENDW` |

### Footer
Slide number at bottom-left: 14

No other text on the slide.

## Visuals

**Nested table ("box diagram") for procedure `@HUN (A)`** — occupies the upper ~55 % of the slide body, from near the left edge to about 4/5 of the slide width; the label "דוגמה 6" sits to its upper right.

Geometry (redraw recipe):
- One outer rectangle with a **thick** black border, wider than tall (about 1.9 : 1).
- A **thick** vertical line at about 1/3 of the width (from the left) splits it into the **code column** (left third) and the **explanation area** (right two-thirds). All other lines are thin. Cell fill is white/very light grey; text black; code in a bold serif font with small-caps-like letters, Hebrew in a regular serif font.
- **Code column**, top to bottom:
  1. cell `ZERO (A)` (full column width), thin line below;
  2. cell `TEN (B)` (full column width), thin line below;
  3. one tall cell (rest of the height) with `WHILE(B)` at its top-left and `ENDW` at its bottom-left; between them an **inner box** indented from the left by roughly 1/3 of the column width, whose right edge is the thick divider. The inner box is divided by thin horizontal lines into three cells: `TEN (T)`; then `WHILE (T)` / `SUB(T)` / `ADD(A)` / `ENDW` (four text lines, the tallest cell); then `SUB (B)` (short cell).
- **Explanation area**, nested from the outside in (outermost is on the right):
  1. A narrow column along the **right edge**, full height of the table: "הכנס 100 / למונה A" (vertically centred).
  2. Left of it, the top row (same height as the `ZERO (A)` row) is one wide cell: "אפס את המונה A". Under that row, a narrow column next to column 1, running from the `TEN (B)` row down to the bottom border: "הוסף 100 / למונה A" (vertically centred, slightly lower than the text of column 1).
  3. Left of that column (between the thick divider and column 2): a row level with `TEN (B)`: "הכנס 10 למונה B"; under it a tall cell running to the bottom border, with "כל עוד B אינו ריק" at its top (level with `WHILE(B)`).
  4. Inside that tall cell, the right-hand continuation of the **inner box** (it starts at the thick divider and stops short of the "הוסף 100" column, leaving a narrow empty margin on its right; below it an empty strip level with the final `ENDW`). Its rows line up with the three cells of the inner code box:
     - right part: one cell spanning the `TEN (T)` row and the `WHILE (T)…ENDW` row: "הוסף 10 / למונה A";
     - left part (next to the divider): upper cell "הכנס 10 ל-T" (level with `TEN (T)`), lower cell "העבר תוכן / T ל-A" (level with `WHILE (T)` … `ENDW`);
     - bottom row, full width of the inner box: "חסר 1 מהמונה B" (level with `SUB (B)`).
- Layout sketch (tags stand for the Hebrew labels listed below; `‖` is the thick divider):

```
@HUN (A)
+----------------------------‖--------------------------------+---------+---------+
| ZERO (A)                   ‖              [E1]              .         |         |
+----------------------------‖--------------------------+-----+---------+         |
| TEN (B)                    ‖          [E2]            |               |         |
+----------------------------‖--------------------------+               |         |
| WHILE(B)                   ‖          [E3]            |               |         |
|         +------------------‖-----------+---------+    |     [D]       |   [C]   |
|         | TEN (T)          ‖   [G1]    |         |    |               |         |
|         +------------------‖-----------+   [F]   |    |               |         |
|         | WHILE (T)        ‖           |         |    |               |         |
|         |   SUB(T)         ‖   [G2]    |         |    |               |         |
|         |   ADD(A)         ‖           |         |    |               |         |
|         | ENDW             ‖           |         |    |               |         |
|         +------------------‖-----------+---------+    |               |         |
|         | SUB (B)          ‖        [G3]         |    |               |         |
|         +------------------‖---------------------+    |               |         |
| ENDW                       ‖                          |               |         |
+----------------------------‖--------------------------+---------------+---------+
```
  (In the first row, [E1] is one cell reaching from the thick divider to column [C]; the dot only marks where column [D] begins underneath it.)
  - [C] = הכנס 100 למונה A
  - [D] = הוסף 100 למונה A
  - [E1] = אפס את המונה A
  - [E2] = הכנס 10 למונה B
  - [E3] = כל עוד B אינו ריק
  - [F] = הוסף 10 למונה A
  - [G1] = הכנס 10 ל-T
  - [G2] = העבר תוכן T ל-A
  - [G3] = חסר 1 מהמונה B
- What it illustrates: a top-down decomposition of the procedure — each Hebrew cell names what the group of code lines level with it does, and wider groupings are placed further to the right.

Other visuals: the green header strip (as on the other slides of this deck); slide number 14 at the bottom-left; no pictures, arrows or coloured marks. (Grey smudges in the photo are reflections/dirt on the laptop screen; the photo is slightly rotated, so the right side of the table sits a little lower than the left.)

## Structured inventory
- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים"; "דוגמה 6".
- **Definitions / concepts:** none stated as a definition; the table pairs code groups with their meaning: "אפס את המונה A", "הכנס 10 למונה B", "כל עוד B אינו ריק", "הכנס 10 ל-T", "העבר תוכן T ל-A", "הוסף 10 למונה A", "חסר 1 מהמונה B", "הוסף 100 למונה A", "הכנס 100 למונה A".
- **Commands / instructions introduced:** procedure `@HUN (A)`; it calls the procedures `ZERO` and `TEN` (`TEN (B)`, `TEN (T)`) and uses `WHILE`/`ENDW`, `SUB`, `ADD`. Counters used: A (parameter), B, T.
- **Algorithms / code blocks:**
  - `photo-28-code-1` — procedure `@HUN (A)`: `ZERO (A)`; `TEN (B)`; `WHILE(B)` { `TEN (T)`; `WHILE (T)` { `SUB(T)`; `ADD(A)` } `ENDW`; `SUB (B)` } `ENDW` — annotated as "הכנס 100 למונה A".
- **Trace tables:** none (the table is an annotation/decomposition table, not a trace table).
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** "דוגמה 6" — `@HUN (A)` explained by nested grouping: whole procedure = "הכנס 100 למונה A"; = "אפס את המונה A" (line 1) + "הוסף 100 למונה A" (lines 2–10); the latter = "הכנס 10 למונה B" (line 2) + "כל עוד B אינו ריק" (lines 3–10): "הוסף 10 למונה A" (lines 4–8 = "הכנס 10 ל-T" line 4 + "העבר תוכן T ל-A" lines 5–8) and "חסר 1 מהמונה B" (line 9).
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** uses `ZERO` (photo-32/photo-25) and `TEN` (photo-29, "דוגמה 5").
- **Lecturer's solution method / emphasis:** reading a procedure by nested blocks, labelling each block with what it does, from single lines up to the whole procedure.

## Legibility
- **Overall confidence:** high
- **Uncertain items:**
  - Whether "כל עוד B אינו ריק" is meant as a label for line 3 only or for the whole loop: geometrically it is written at the top of one cell that runs from line 3 down to the bottom border (it encloses the inner box and the empty strip beside the final `ENDW`); recorded as such.
  - Browser tab title is truncated ("א.3 (3) פ…").
