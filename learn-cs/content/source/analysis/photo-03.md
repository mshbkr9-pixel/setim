# photo-03

- **PDF page:** 25
- **Document / deck title (as seen):** not visible in this photo (no header or footer on the visible part of the page). Google-Drive PDF viewer, address `drive.google.com/file/d/1GeLI4N1qjNHKxQC0tAsKW…` (cut off), "External" badge under it; same browser tabs as photo-04/05 (right to left: `ב.0 מבו…` (cut), `א.4 (2)`, `א.3 (3)`, `א.3 (2)`, `א.6 רקע`, `א.5 יסוד`, `א.3 (1)`, `א.2 (א)`, `א.2` (cut)), none of which names this document. By continuity with photo-04 (the page above this one has the footer "ב.1 אמצעים לניתוח אלגוריתמים – קריאה" / "עמוד 6 מתוך 8") this is the next page of "ב.1 אמצעים לניתוח אלגוריתמים – קריאה".
- **Kind:** reading page
- **Page / slide number visible:** not visible (by continuity with photo-04: page 7 of 8)
- **Parts in this photo:** the upper part of one page (page 7). The page's top edge is visible directly under the dark viewer background (the edge runs slightly slanted in the photo). Visible: the empty top margin, the heading "דוגמה 7", the opening line, "@ MOVE (A,B)", the whole table, and the three-line paragraph under it; below that the page is empty white down to the bottom edge of the screen, where the page is cut off (its lower part is not visible).
- **Continuity:** Overlaps photo-04: the lower half of photo-04 shows the top of this same page, from "דוגמה 7" down to the third table row (cut at `WHILE (A)` / `ADD (B)` and "הוסף את A / ל-B ול-C"). New here (not in photo-04): the rest of table row 3 (`ADD (C)`, `SUB (A)`, `ENDW`, "תוך איפוס A"), the whole of row 4, the bottom of the table and the paragraph under it. The next page (page 8, beginning "לסיכום:") is in photo-02 (reference); photo-02 begins with only a blank strip of the bottom of the previous page, so no text is shared between photo-03 and photo-02, and the part of page 7 below the visible area of this photo is not shown here.

## Transcription

### Page 7 – upper part (the bottom of the page is cut off)

(empty top margin)

**דוגמה 7** (מודגש, קו תחתון; מיושר לימין)

בפרק הקודם הגדרנו את המילה MOVE ופירשנו את האלגוריתם:

(The word "MOVE" is in Latin capitals in a serif typeface, smaller than the Hebrew text.)

**@ <u>MOVE</u> (A,B)** (serif, bold; only the word "MOVE" is underlined; printed above the left-hand (code) column of the table, left-aligned)

**Table** – 4 columns, 4 rows, no header row. Column order as it appears from right to left: (1) the label of the whole algorithm, (2) a second-level label, (3) third-level labels, (4) the code. I.e. the code is the LEFT-most column. Written left-to-right below (code first). Merged cells are stated in the cells.

| code (left-most column) | label, level 3 (2nd column from the left) | label, level 2 (3rd column from the left) | label, level 1 (right-most column) |
|---|---|---|---|
| `WHILE (B)`<br>`SUB (B)`<br>`ENDW` | אפס את B — ONE cell merged across this column and the level-2 column (no vertical divider in this row) | (merged with the cell to its left) | העתק את<br>A ל-B<br>תוך איפוס C — ONE tall cell spanning all four rows (the text sits in its upper part, about level with the bottom of row 1) |
| `WHILE (C)`<br>`SUB (C)`<br>`ENDW` | אפס את C | הוסף את A ל-B<br>תוך איפוס C<br>(ללא שינוי ב-A) — ONE cell spanning rows 2–4 (the text sits in its upper part, about level with the border between rows 2 and 3) | (same tall cell) |
| `WHILE (A)`<br>`ADD (B)`<br>`ADD (C)`<br>`SUB (A)`<br>`ENDW` | הוסף את A<br>ל-B ול-C<br>תוך איפוס A | (same merged cell) | (same tall cell) |
| `WHILE (C)`<br>`ADD (A)`<br>`SUB (C)`<br>`ENDW` | הוסף את C ל-A<br>תוך איפוס C | (same merged cell) | (same tall cell) |

(Each `<br>` is a printed line break inside the cell. In the code cells the lines between `WHILE` and `ENDW` are indented.)

The code as plain text (header line above the table + the code column of the four rows, top to bottom; no line numbers are printed):

```
@ MOVE (A,B)
WHILE (B)
    SUB (B)
ENDW
WHILE (C)
    SUB (C)
ENDW
WHILE (A)
    ADD (B)
    ADD (C)
    SUB (A)
ENDW
WHILE (C)
    ADD (A)
    SUB (C)
ENDW
```

(paragraph under the table, full text width)

הפירוש כאן אינו נוח ולעתים אינו חד-משמעי בשל הניסוחים המילוליים.
כדאי להתנסות בפירוש מחדש של התרשים הזה, לפי שלד העבודה הנתון – הפעם בתויות יופיעו הפירושים של ערכי הפלט ביחס לערכי הפלט, כפי שלמדנו בסעיף זה. (המשפט השני – שורות 2–3 – נראה מודגש [?])

(Line breaks as printed – each item is one printed line:)
1. הפירוש כאן אינו נוח ולעתים אינו חד-משמעי בשל הניסוחים המילוליים.
2. כדאי להתנסות בפירוש מחדש של התרשים הזה, לפי שלד העבודה הנתון – הפעם בתויות יופיעו הפירושים
3. של ערכי הפלט ביחס לערכי הפלט, כפי שלמדנו בסעיף זה.

(then empty white page down to the bottom edge of the screen – page cut off)

## Visuals

- **Page layout:** dark viewer background at the top; the white page starts with a visible top edge; empty top margin; the heading "דוגמה 7" (bold, underlined) at the right margin; one line of text; then the table block on the LEFT part of the page; then a full-width paragraph; then empty page.
- **The table ("התרשים"), for redrawing:**
  - Placed under the line "@ MOVE (A,B)", starting at the left text margin and occupying about the left 3/4 of the text width (the area to the right of the table, under the heading, is empty).
  - Thick black outer frame; thinner black inner lines.
  - Approximate column widths, left to right: code ≈ 31 % of the table width, level 3 ≈ 24 %, level 2 ≈ 26 %, level 1 (right-most) ≈ 19 %.
  - Approximate row heights, top to bottom: row 1 ≈ 22 %, row 2 ≈ 19 %, row 3 ≈ 33 %, row 4 ≈ 26 % of the table height (each row is as tall as its code block: 3, 3, 5 and 4 code lines).
  - Lines: the vertical line between the code column and the label columns runs the full height; the vertical line between the level-1 column and the rest runs the full height; the vertical line between level 3 and level 2 runs only from the top of row 2 to the bottom (it is absent in row 1). The horizontal line between rows 1 and 2 runs from the left frame to the level-1 column (it does not cross the level-1 column); the horizontal lines between rows 2/3 and 3/4 run only across the code column and the level-3 column (they do not cross the level-2 or level-1 cells).
  - Resulting cells: right-most column = one tall cell (whole algorithm); row 1 = code cell + one wide label cell spanning levels 3 and 2 ("אפס את B"); rows 2–4 = code cell + level-3 cell each, plus one level-2 cell spanning rows 2–4.
  - Text: Hebrew labels in a sans-serif typeface, regular weight, centred horizontally in their cells; counter letters A, B, C in the labels in Latin capitals; label lines broken as shown in the table. Code in a serif (Times-like) typeface, upper case, left-aligned in its cell, loop-body lines indented. No colours, shading, arrows or marks.
- Grey blotches visible on the page are smudges/reflections on the laptop screen, not document content.

## Structured inventory

- **Headings / topics:** "דוגמה 7" — interpreting the procedure MOVE (defined in the previous chapter) with a diagram (תרשים) of nested verbal labels.
- **Definitions / concepts:** none newly defined; terms used: "פירוש" (of an algorithm), "התרשים", "שלד העבודה", "תויות" (labels), "ערכי הפלט", "ניסוחים מילוליים".
- **Commands / instructions introduced:** none introduced; used: procedure header `@ MOVE (A,B)`, `WHILE (X)` … `ENDW`, `SUB (X)`, `ADD (X)`.
- **Algorithms / code blocks:** `photo-03-code-1` — the procedure `@ MOVE (A,B)`: four loops — `WHILE (B)`/`SUB (B)`; `WHILE (C)`/`SUB (C)`; `WHILE (A)`/`ADD (B)`/`ADD (C)`/`SUB (A)`; `WHILE (C)`/`ADD (A)`/`SUB (C)` — each closed by `ENDW`, shown in the left column of the table.
- **Trace tables:** none (the table is an interpretation diagram with verbal labels, not a trace table).
- **Formulas:** none (all labels are verbal).
- **Worked examples (with the lecturer's solution steps):** Example 7 — the MOVE algorithm with its verbal interpretation as nested labels: whole algorithm = "העתק את A ל-B תוך איפוס C"; it splits into "אפס את B" (loop 1) and "הוסף את A ל-B תוך איפוס C (ללא שינוי ב-A)" (loops 2–4); the latter splits into "אפס את C" (loop 2), "הוסף את A ל-B ול-C תוך איפוס A" (loop 3), "הוסף את C ל-A תוך איפוס C" (loop 4).
- **Questions / exercises (verbatim, with numbers):** no numbered exercise; a suggested activity: "כדאי להתנסות בפירוש מחדש של התרשים הזה, לפי שלד העבודה הנתון – הפעם בתויות יופיעו הפירושים של ערכי הפלט ביחס לערכי הפלט, כפי שלמדנו בסעיף זה."
- **References to earlier material:** "בפרק הקודם הגדרנו את המילה MOVE ופירשנו את האלגוריתם"; "כפי שלמדנו בסעיף זה".
- **Lecturer's solution method / emphasis:** "הפירוש כאן אינו נוח ולעתים אינו חד-משמעי בשל הניסוחים המילוליים" — the verbal labels are presented as inconvenient and sometimes ambiguous; the reader is advised to redo the interpretation on the given skeleton with labels that state output values, as learned in this section.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Bold in the paragraph under the table: printed lines 2–3 (the sentence "כדאי להתנסות…") look heavier than line 1 in the 3.2× zoom, but sharpness varies across the photo; marked "נראה מודגש [?]". Alternative: the whole paragraph is in one weight.
  - "בתויות" — read at 3.2× zoom with a single ו after the ת (elsewhere the document spells "תווית"); transcribed as printed.
  - "של ערכי הפלט ביחס לערכי הפלט" — both occurrences read at 3.2× zoom as "הפלט" (no descender of ק in either); transcribed as printed, not corrected.
  - Indentation width of the loop-body code lines cannot be measured; rendered as 4 spaces.
  - No disagreement with the reference photo-02 (no shared text). Browser address only: I read "…tAsKW…" (as the photo-02 reference does; the photo-05 reference has "…tAsKV…"); cut off, not document content.
