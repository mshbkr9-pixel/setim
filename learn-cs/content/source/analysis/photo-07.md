# photo-07

- **PDF page:** 29
- **Document / deck title (as seen):** no page footer/title in this photo. By continuity it is "ב.1 אמצעים לניתוח אלגוריתמים – קריאה" (footer seen in photo-06 under the same page, and in photo-08). Shown in a Google-Drive PDF viewer; URL bar: `drive.google.com/file/d/1GeLI4N1qjNHKxQC0tAsKW…` (cut off at the right edge); "…ernal" (External) badge at the left edge. Browser tabs partly cut by the top edge of the photo (e.g. `א.4 (2)`, `א.3 (3)`, `א.3 (2)`, `א.6 רקע`, `א.5 יסוד`, `א.3 (1)`; the right-most tab, `ב.0 מ…`, is barely visible).
- **Kind:** reading page
- **Page / slide number visible:** not visible (it is page 5 of 8: photo-06 shows the footer "עמוד 5 מתוך 8" under the same text, and photo-08 shows the end of page 4 just before it)
- **Parts in this photo:** upper part of page 5, from the page's top edge (a grey viewer background above it, then a blank top margin) down to the first three rows of the second table. The rest of the page (the rest of that table, the "הבהרה נוספת" paragraph, the footer) is cut off by the Windows taskbar.
- **Continuity:** overlaps photo-06 (lower part of the same page 5). Both photos show the text from "נמשיך בחישוב ערכו של B. בתווית (ב) מופיע B=B+2A…" down to "…כלומר B=B+12." and the top rows (`FIVE (A)`, `ADD (A)`, `WHILE (A)`) of the second table. New in this photo: the heading "דוגמה 5", the code box, the two introductory paragraphs, the first table (the main-label column is still empty), and the paragraph that computes A ("כעת, נחשב…" to "…האלגוריתם כולו."). The page before (end of page 4) is photo-08. No disagreement with photo-06 in the shared text: I checked it line by line against my own tiles.

## Transcription

### Page 5 — upper part (start of example 5; the page continues below the bottom edge of the photo)

**<u>דוגמה 5</u>** (heading, bold and underlined)

נרצה לפרש את האלגוריתם הבא:

Code box (at the left side of the page, level with the heading; light-grey background; bold serif font; the three loop-body lines are indented):

```
FIVE(A)
ADD(A)
WHILE (A)
    ADD (B)
    ADD (B)
    SUB (A)
ENDW
```

(spelling as printed: `FIVE(A)` and `ADD(A)` have no space before the parenthesis; `WHILE (A)`, `ADD (B)`, `SUB (A)` have one)

האלגוריתם הזה הוא שירשור של שני האלגוריתמים הקודמים (דוגמאות 3 ו-4).

The next two paragraphs are a narrow column on the right; table 1 stands to their left.

בהתאם לכך, המבנה של התרשים
לאלגוריתם זה יכלול בתוכו את תת-
התרשימים הקודמים שהצגנו:

(הקו המודגש שבין שני האלגוריתמים
שורטט לצורך נוחות האבחנה בין השניים)

**Table 1** (left of the two paragraphs above). It has 4 columns, a closed frame and no header row. Column order as it appears from right to left: (1) main label, empty here; (2) labels marked (א)/(ב); (3) level-1 labels; (4) code. So the code is the LEFT-most column. The table is written left-to-right below. "░ shaded" means the cell is filled grey and has no text.

| code (left-most) | label, level 1 | label, level 2 — marked (א), (ב) | main label (right-most) |
|---|---|---|---|
| `FIVE (A)` | `A=5` | `A=6` with the mark **(א)** at the right side of the cell. ONE merged cell spanning the two code rows `FIVE (A)` and `ADD (A)` | — (EMPTY: ONE tall cell spanning all the code rows, `FIVE (A)` … `ENDW`, with no text) |
| `ADD (A)` | `A=A+1` | (same merged cell (א)) | (same empty tall cell) |
| `WHILE (A)` | ░ shaded grey, empty | the mark **(ב)** at the upper right of the cell, and below it, a little lower: `A = 0`<br>`B = B + 2A`. ONE merged cell spanning `WHILE (A)`, the three body lines and `ENDW` | (same empty tall cell) |
| `ADD (B)`<br>`ADD (B)`<br>`SUB (A)` (three indented code lines in ONE cell) | `A = A-1`<br>`B = B+2` (one cell, two lines, beside the three body lines) | (same merged cell (ב)) | (same empty tall cell) |
| `ENDW` | ░ shaded grey, empty | (same merged cell (ב)) | (same empty tall cell) |

The code column of the table as plain code:

```
FIVE (A)
ADD (A)
WHILE (A)
    ADD (B)
    ADD (B)
    SUB (A)
ENDW
```

כעת, נחשב את ערכי התווית הראשית כשרשור של שתי התוויות (א) ו-(ב) שנמצאות לשמאלה.
נתחיל <u>מלמטה למעלה</u>, מהתווית המסומנת (ב), ונחפש בה את ערכי המשתנים A ו-B. ("מלמטה למעלה" underlined)
ניתן להתחיל ב-A או ב-B לבחירתנו.
נתחיל למשל בחישוב ערכו של A. בתווית (ב) מופיע A=0. מכאן, שבסיום האלגוריתם כולו A מתאפס. ערכו
הקודם (שמופיע בתווית (א)) הוא ערך פנימי, זמני, שלא בא לידי ביטוי בתווית הראשית המתארת את פעולת
האלגוריתם כולו.
נמשיך בחישוב ערכו של B. בתווית (ב) מופיע B=B+2A. קראנו זאת כך:
*"B החדש שווה ל-B המקורי ועוד פעמיים A המקורי".* (this line is in italics)
כעת נדייק ונאמר:
*"B החדש שווה ל-B <u>הקודם</u> ועוד פעמיים A <u>הקודם</u>".* (this line is in italics; both words "הקודם" are underlined and look bolder)

אם כך, כדי לחשב את B החדש נחקור בתווית הקודמת (א) ונחפש שם את "A הקודם" ואת "B הקודם".
את "A הקודם" נמצא בתווית (א): A=6 - ונוכל להציב אותו.
את "B הקודם" לא נמצא בתווית (א). המשתנה B לא עבר שינוי בתווית הקודמת, ולכן "B הקודם" הוא למעשה
"B המקורי".
ולכן ערכו של B בתווית הראשית יהיה: B=B+2·6, כלומר B=B+12.

(the multiplication sign in `B=B+2·6` is a small raised dot)

**Table 2** (at the left side of the page; only its top three rows are visible, then it is cut off by the bottom edge of the screen). Same layout and column order as table 1 (code column left-most):

| code (left-most) | label, level 1 | label, level 2 — marked (א), (ב) | main label (right-most) |
|---|---|---|---|
| `FIVE (A)` | `A=5` | `A=6` with the mark **(א)**. Merged cell spanning `FIVE (A)` and `ADD (A)` | tall merged cell; its visible top part has no text |
| `ADD (A)` | `A=A+1` | (same merged cell (א)) | (same tall cell) |
| `WHILE (A)` | ░ shaded grey, empty | top of the next merged cell; no text visible yet | (same tall cell) |
| *(cut off)* | | | |

(The complete second table, whose main label reads `A=0` / `B = B + 12`, is visible in photo-06.)

## Visuals

- **Code box** (top-left of the page, level with the heading "דוגמה 5" and the line "נרצה לפרש…"): a light-grey filled rectangle, no visible border, with the 7 code lines in a bold serif (Times-like) font, left-aligned; lines 4–6 (`ADD (B)`, `ADD (B)`, `SUB (A)`) are indented.
- **Table 1** (the interpretation diagram of example 5, before the main label is computed):
  - thick black outer frame, and a thick vertical line between the code column and the label columns;
  - the code column is divided into 5 cells: `FIVE (A)` | `ADD (A)` | `WHILE (A)` | (`ADD (B)`, `ADD (B)`, `SUB (A)` in one taller cell) | `ENDW`;
  - level-1 column: `A=5`, `A=A+1`, a grey-filled cell (beside `WHILE (A)`), a two-line cell `A = A-1` / `B = B+2`, and a grey-filled cell (beside `ENDW`);
  - level-2 column: two merged cells. The upper one (beside the first two code rows) holds `A=6` with "(א)" at its right end. The lower one (beside `WHILE (A)` … `ENDW`) holds "(ב)" near its upper right corner and the two lines `A = 0`, `B = B + 2A` lower down;
  - right-most column: ONE tall cell over the full table height, completely empty;
  - the horizontal border between the `ADD (A)` row and the `WHILE (A)` row runs across the code, level-1 and level-2 columns (in the level-2 column it is the border between (א) and (ב)). The text calls it "הקו המודגש" drawn to separate the two algorithms. In the photo it is at most slightly thicker than the other inner lines.
- **Table 2** (bottom of the photo, cut off after its third row): same frame and cells as table 1 (grey cell beside `WHILE (A)`, `A=6 (א)` merged cell, tall right-most cell with no text in its visible top part).
- Typography: the heading "דוגמה 5" is bold and underlined; "מלמטה למעלה" is underlined; the two quoted sentences are italic; in the second one both words "הקודם" are underlined and look bolder. Code and formulas are in a serif font.
- No red marks, ticks, arrows or pictures.

## Structured inventory

- **Headings / topics:** "דוגמה 5": interpreting an algorithm that is the concatenation (שירשור) of the algorithms of examples 3 and 4; computing the main label (התווית הראשית) by chaining labels (א) and (ב).
- **Definitions / concepts:** שירשור of algorithms; תרשים / תת-תרשימים (the diagram of the concatenated algorithm contains the previous sub-diagrams); תווית / התווית הראשית; computing chained labels "מלמטה למעלה" (starting from label (ב)); an intermediate value (A=6 in (א)) is "ערך פנימי, זמני" that does not show in the main label; "B החדש" / "B המקורי" / "B הקודם" / "A הקודם" (right-hand-side variables refer to the previous values; a variable not changed in the previous label keeps its original value); הצבה (substituting the previous value).
- **Commands / instructions introduced:** none introduced; used: `FIVE(A)` / `FIVE (A)`, `ADD (A)`, `ADD (B)`, `SUB (A)`, `WHILE (A)` … `ENDW`.
- **Algorithms / code blocks:**
  - `photo-07-code-1`: the algorithm of example 5 (code box): `FIVE(A)` / `ADD(A)` / `WHILE (A)` / `ADD (B)` / `ADD (B)` / `SUB (A)` / `ENDW`.
  - `photo-07-code-2`: the same algorithm as the code column of table 1 (written `FIVE (A)`, `ADD (A)` with spaces); the same column appears again (cut off) in table 2.
- **Trace tables:** none (the tables are label/interpretation diagrams, not trace tables).
- **Formulas:** table labels `A=5`, `A=A+1`, `A = A-1`, `B = B+2`, `A=6` (א), `A = 0`, `B = B + 2A` (ב); text: `A=0`, `B=B+2A`, `A=6`, `B=B+2·6`, `B=B+12`.
- **Worked examples (with the lecturer's solution steps):** Example 5: (1) the algorithm concatenates the algorithms of examples 3 and 4, so its diagram contains their sub-diagrams (label (א): `A=6`; label (ב): `A = 0`, `B = B + 2A`), separated by a bold line; (2) the main label is computed as the concatenation of labels (א) and (ב), working bottom-up from (ב), starting with A or B as we like; (3) A: (ב) gives `A=0`, so at the end of the whole algorithm A is zero; its previous value (in (א)) is internal and temporary and does not appear in the main label; (4) B: (ב) gives `B=B+2A`, read before as "new B = original B + twice original A", stated more precisely as "new B = PREVIOUS B + twice PREVIOUS A"; (5) look in the previous label (א): "previous A" is there (`A=6`), so substitute it; "previous B" is not there (B did not change), so "previous B" is in fact "original B"; (6) result in the main label: `B=B+2·6`, i.e. `B=B+12`.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** "שני האלגוריתמים הקודמים (דוגמאות 3 ו-4)"; "תת-התרשימים הקודמים שהצגנו"; "קראנו זאת כך:" (the earlier reading of `B=B+2A`, in example 4).
- **Lecturer's solution method / emphasis:** compute a chained label bottom-up ("מלמטה למעלה", underlined); right-hand-side variables mean the PREVIOUS values ("הקודם", underlined twice); search the previous label for each one: substitute if found, otherwise the variable keeps its original value; intermediate values are not part of the main label.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - The last word of the line "נתחיל למשל בחישוב ערכו של A… מתאפס. ערכו" ("ערכו") and the last word of the next line ("פעולת") look heavier than their neighbours, even at 3x zoom. They sit at the extreme left edge of the screen, where the photo makes all text larger and darker (perspective). Photo-08 shows the same effect on several line-end words at the far left ("הללו", "בלמידה", "משימות", the footer page number), which points to a photographic artifact rather than bold type. Transcribed without emphasis.
  - The bold separator line ("הקו המודגש") between the two algorithms in table 1 is only slightly, if at all, thicker than the other inner lines in the photo. Its position (between the `ADD (A)` and `WHILE (A)` rows) is inferred from the table structure and the text.
  - Spacing as printed: `A=5`, `A=A+1`, `A=6` have no spaces; `A = A-1`, `B = B+2`, `A = 0`, `B = B + 2A` have spaces. Reproduced as seen; the spaces carry no meaning.
  - Browser tab titles and the URL are partly cut off; they are not document content.
