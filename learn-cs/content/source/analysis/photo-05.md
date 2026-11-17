# photo-05

- **PDF page:** 27
- **Document / deck title (as seen):** not visible in this photo (no title/header on the visible part of the page). The file is shown in a Google-Drive PDF viewer; URL bar: `drive.google.com/file/d/1GeLI4N1qjNHKxQC0tAsKV…` (cut off), with an "External" badge under it. Browser tabs visible (right to left): `ב.0 מבו…` (cut), `א.4 (2)`, `א.3 (3)`, `א.3 (2)`, `א.6 רקע`, `א.5 יסוד`, `א.3 (1)`, `א.2 (א)`, `א.2 …` (cut). None of the readable tab titles is the title of this document.
- **Kind:** reading page
- **Page / slide number visible:** not visible
- **Parts in this photo:** top part of one page — the page starts (directly under the viewer's dark background) with the heading "דוגמה 6" and is cut off by the bottom of the screen right after the line ".B=0".
- **Continuity:** PROVISIONAL (updated at the end of the file set) — this is the beginning of "דוגמה 6". The text is cut after "ערכו של B … B=0"; the continuation (value of C and the final label) must be in a neighbouring photo with a lower number.

## Transcription

### Page top — "דוגמה 6"

**דוגמה 6** (מודגש, קו תחתון; מיושר לימין)

הפעם נפרש את האלגוריתם הנתון מבלי לתכנן מראש את מבנה השלד:

*(The page is laid out in two visual columns: explanatory Hebrew text on the right, and to its left a table that grows from step to step. Each text block below stands to the right of the table that follows it.)*

**(text to the right of table 1)**

נתחיל את הפירוש משמאל, בפירוש של שורות בודדות.
נרשה לעצמנו לאחד מספר פעולות פשוטות לתווית אחת:

**Table 1** — 2 columns. Column order as it appears from right to left: (1) labels column, (2) code column. I.e. the code is the LEFT column. No header row. The table below is written left-to-right (code first). "░ shaded" = the cell is filled grey and contains no text.

| code (left column) | label (right column) |
|---|---|
| `WHILE (A)` | ░ shaded grey, empty |
| `ADD(B)`<br>`SUB(A)` (two code lines in one cell, indented) | `A=A-1`<br>`B=B+1` (one cell, two lines; spans exactly the two code lines `ADD(B)`, `SUB(A)`) |
| `ENDW` | ░ shaded grey, empty |
| `ONE (C)` | `C=1` (spans the single line `ONE (C)`) |
| `WHILE (B)` | ░ shaded grey, empty |
| `ADD(C)`<br>`SUB(B)` (two code lines in one cell, indented) | `B=B-1`<br>`C=C+1` (one cell, two lines; spans exactly the two code lines `ADD(C)`, `SUB(B)`) |
| `ENDW` | ░ shaded grey, empty |

The code column of the table, as plain code (identical in all three tables of this photo):

```
WHILE (A)
    ADD(B)
    SUB(A)
ENDW
ONE (C)
WHILE (B)
    ADD(C)
    SUB(B)
ENDW
```

**(text to the right of table 2)**

כעת נבחין כי כתבנו תוויות של גוף לולאה
עבור שתי לולאות (נפרדות) שמופיעות באלגוריתם.

נפרש לכל אחת מהלולאות את תוצאת הלולאה:

**Table 2** — 3 columns. Column order from right to left: (1) loop-result labels (new), (2) single-line / loop-body labels, (3) code. Written left-to-right below. The new (right-most) column has no closing vertical border on its right side (its horizontal lines just run out to the right).

| code (left) | label, level 1 (middle) | label, level 2 (right, new) |
|---|---|---|
| `WHILE (A)` | ░ shaded grey, empty | `A=0`<br>`B=B+A` — ONE merged cell spanning the three code rows `WHILE (A)`, `ADD(B)`/`SUB(A)`, `ENDW` (the whole first loop) |
| `ADD(B)`<br>`SUB(A)` | `A=A-1`<br>`B=B+1` | (same merged cell as above) |
| `ENDW` | ░ shaded grey, empty | (same merged cell as above) |
| `ONE (C)` | `C=1` — this cell is merged across the middle and the right column (no vertical divider between them in this row) | (merged with the cell to its left — no separate content) |
| `WHILE (B)` | ░ shaded grey, empty | `B=0`<br>`C=C+B` — ONE merged cell spanning the three code rows `WHILE (B)`, `ADD(C)`/`SUB(B)`, `ENDW` (the whole second loop) |
| `ADD(C)`<br>`SUB(B)` | `B=B-1`<br>`C=C+1` | (same merged cell as above) |
| `ENDW` | ░ shaded grey, empty | (same merged cell as above) |

**(text to the right of table 3)**

כעת נרצה לשרשר את 3 התוויות המסומנות
ולקבל את התווית הראשית:

נפרט את חישוב הערכים לתווית זו, נזכיר כי
התוויות המשורשרות נבחנות מלמטה
למעלה, בסדר זה: (ג) ואז (ב) ואז (א).

**Table 3** — 4 columns, closed by a frame on all sides. Column order from right to left: (1) main label ("התווית הראשית", still to be filled), (2) the three marked labels (א)/(ב)/(ג), filled with a light orange/beige colour, (3) single-line / loop-body labels, (4) code. Written left-to-right below.

| code (left) | label, level 1 | label, level 2 — highlighted orange/beige, marked (א) (ב) (ג) | main label (right-most) |
|---|---|---|---|
| `WHILE (A)` | ░ shaded grey, empty | `A=0`<br>`B=B+A` with the mark **(א)** at the right edge of the cell — ONE merged orange cell spanning `WHILE (A)`, `ADD(B)`/`SUB(A)`, `ENDW` | ONE tall white cell spanning all seven code rows; it contains three lines, placed at about mid-height (level with `ENDW`/`ONE (C)`/`WHILE (B)`): `A =` , `B =` , `C =` — nothing is written after the "=" signs |
| `ADD(B)`<br>`SUB(A)` | `A=A-1`<br>`B=B+1` | (same merged cell (א)) | (same tall cell) |
| `ENDW` | ░ shaded grey, empty | (same merged cell (א)) | (same tall cell) |
| `ONE (C)` | `C=1` — orange; merged across "level 1" and "level 2" columns, with the mark **(ב)** at the right edge of the merged cell | (merged with the cell to its left) | (same tall cell) |
| `WHILE (B)` | ░ shaded grey, empty | `B=0`<br>`C=C+B` with the mark **(ג)** at the right edge of the cell — ONE merged orange cell spanning `WHILE (B)`, `ADD(C)`/`SUB(B)`, `ENDW` | (same tall cell) |
| `ADD(C)`<br>`SUB(B)` | `B=B-1`<br>`C=C+1` | (same merged cell (ג)) | (same tall cell) |
| `ENDW` | ░ shaded grey, empty | (same merged cell (ג)) | (same tall cell) |

**(full-width text under table 3)**

<u>ערכו של A:</u> ל-A אין ערך חדש בתווית (ג), ולכן נעבור לתווית (ב). גם בתווית (ב) אין ל-A ערך חדש, ולכן
נעבור לתווית (א). בתווית (א) A מקבל את הערך 0 – ולכן נוכל לכתוב בתווית הראשית:

**A=0.** (מודגש, ממורכז בשורה נפרדת)

<u>ערכו של B:</u> ל-B יש ערך בתווית (ג), והוא B=0. ערך זה איננו תלוי בערכים קודמים מתוויות (ב) או (א)
בתרשים, הוא לא "שולח" אותנו לחפש ערך קודם של A או של B או של C – זהו ערכו:

**B=0.** (מודגש, ממורכז בשורה נפרדת)

*(cut off here by the bottom edge of the screen — the page continues below)*

## Visuals

- Three tables stacked vertically on the left half of the page, each one the previous table plus one more column on its right ("label tree" growing from left to right):
  - Table 1: 2 columns (code | label). Thick black outer frame on the left/top/bottom of the code column and a thick vertical line between code and label columns. Label cells next to `WHILE (..)` and `ENDW` lines are filled mid-grey (no text); label cells next to the body lines and next to `ONE (C)` are white with text.
  - Table 2: same as table 1 plus a third, white column: one tall cell (`A=0` / `B=B+A`) beside the first loop (3 code rows), then the `C=1` row running through (merged over columns 2–3), then one tall cell (`B=0` / `C=C+B`) beside the second loop. No right-hand border on the third column.
  - Table 3: same as table 2, but the three level-2 cells are filled light orange/beige and carry the Hebrew marks (א) top, (ב) middle (the `C=1` strip), (ג) bottom, each mark placed at the right end of its cell; plus a fourth white column (one tall cell) containing `A =`, `B =`, `C =` one under the other, vertically centred; the whole table is closed with a frame.
- Code font: serif (Times-like), upper-case; body lines of each loop are indented relative to `WHILE`/`ENDW`.
- Colours: grey fill = "no label for this line" cells; orange/beige fill = the three labels that are about to be chained (שרשור). No red marks, ticks or arrows in this photo.
- The headings "ערכו של A:" and "ערכו של B:" are underlined; the results "A=0." and "B=0." are bold and centred on their own lines.

## Structured inventory

- **Headings / topics:** "דוגמה 6" — interpreting (פירוש) a given algorithm with labels (תוויות) without planning the skeleton structure (מבנה השלד) in advance; chaining (שרשור) of three labels into the main label (התווית הראשית).
- **Definitions / concepts:** תווית (label) for single lines; uniting several simple operations into one label; תווית של גוף לולאה (loop-body label); תוצאת הלולאה (loop result label); שרשור תוויות (chaining labels) — "התוויות המשורשרות נבחנות מלמטה למעלה, בסדר זה: (ג) ואז (ב) ואז (א)"; התווית הראשית (main label); מבנה השלד (skeleton structure).
- **Commands / instructions introduced:** none introduced; used: `WHILE (X)` … `ENDW`, `ADD(X)`, `SUB(X)`, `ONE (C)`.
- **Algorithms / code blocks:** `photo-05-code-1` — the given algorithm of example 6: `WHILE (A)` / `ADD(B)` / `SUB(A)` / `ENDW` / `ONE (C)` / `WHILE (B)` / `ADD(C)` / `SUB(B)` / `ENDW` (shown three times, once per table).
- **Trace tables:** none (the three tables are label/interpretation tables, not trace tables).
- **Formulas:** labels `A=A-1`, `B=B+1`; `C=1`; `B=B-1`, `C=C+1`; loop results `A=0`, `B=B+A` (א); `C=1` (ב); `B=0`, `C=C+B` (ג); main-label results so far: `A=0`, `B=0` (the `A =`, `B =`, `C =` slots in the table are still empty).
- **Worked examples (with the lecturer's solution steps):** Example 6, steps shown here: (1) start interpreting from the left, single lines, allowing several simple operations in one label → table 1; (2) notice these are loop-body labels of two separate loops; interpret each loop's result → table 2; (3) chain the 3 marked labels to get the main label → table 3; chained labels are examined bottom-up: (ג), then (ב), then (א); (4) value of A: no new value in (ג) → go to (ב); none in (ב) → go to (א); in (א) A gets 0 → `A=0`; (5) value of B: has a value in (ג), `B=0`, which does not depend on earlier values from (ב) or (א) → `B=0`. (Continuation — value of C — is not in this photo.)
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit ("הפעם … מבלי לתכנן מראש את מבנה השלד" implies earlier examples planned the skeleton first).
- **Lecturer's solution method / emphasis:** interpret from the left (innermost/single lines) outward; merge simple operations into one label; then loop results; then chain labels bottom-up, tracing for each counter the last label that gives it a value and whether that value depends on earlier values.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - none in the text and tables (all cells re-read at 4x zoom).
  - Spacing inside code tokens is as seen: `WHILE (A)`, `WHILE (B)`, `ONE (C)` with a space before the parenthesis; `ADD(B)`, `SUB(A)`, `ADD(C)`, `SUB(B)` without. The exact width of the indentation of body lines cannot be measured (rendered here as 4 spaces).
