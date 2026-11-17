# photo-11

- **PDF page:** 33
- **Document / deck title (as seen):** No document title is visible in this photo (the page footer is below the screen edge). By continuity with photo 10, whose footer belongs to the same page, the document is "ב.1 אמצעים לניתוח אלגוריתמים – קריאה". It is open in the Google Drive file viewer (`drive.google.com/file/d/1GeLl4N1qjNHKxQC0tA…`, with an "External" badge). The bookmarks-bar items ("א.2", "א.2 (א)", "א.3 (1)", "א.5 יסוד", "א.6 רקע", "א.3 (2)", "א.3 (3)", "א.4 (2)", "ב.0 מלג…") are not the document name.
- **Kind:** reading page
- **Page / slide number visible:** not visible. By continuity this is page 3 of 8: photo 10 shows the bottom of this same page with the footer "עמוד 3 מתוך 8".
- **Parts in this photo:** one page (page 3). The photo shows it from its top edge: the viewer's grey background is visible above the page, and the heading "אמצעי ניתוח שני" is the first line. It continues down to the line "…שמתרחש בפקודה ADD לבדה.", and the rest of the page (including the footer) is cut off by the bottom of the screen.
- **Continuity:** The lower third of this photo, from the second bullet ("בכל אחת מהתוויות…") with the red-✖ table through "…שמתרחש בפקודה ADD לבדה.", is the same content as the top of photo 10. Photo 10 then continues with "לעומת זאת, התווית הראשית…", the next bullet with the green-arrow table, the page-3 footer and the start of page 4 ("דוגמה 4"). Everything above that is new compared with photo 10: the section heading, the introduction, the three steps (א)–(ג) of "דוגמה 3", "עד כה תיארנו…" and the first bullet with the `A^O`/`A^I` table. Checked against reference photo-10.md: no disagreements in the overlapping text or the red-✖ table. The page that comes before this one is in photo 12, which shows the bottom of page 2 with the footer "עמוד 2 מתוך 8" and then the blank top margin of this page 3.

## Transcription

### Page 3 (top of the page down to just above the end; bottom cut off)

**אמצעי ניתוח שני: תרשים (של פירוק הדרגתי)** (bold, underlined)

הכרנו כבר את התרשים כאמצעי לפירוש אלגוריתמים, החל מפירוש של תת-משימות קצרות, באופן הדרגתי תוך הכללת לולאות וביצוע שירשורים – עד לתווית הראשית המתארת את האלגוריתם כולו. נכיר כעת צורת רישום בתוויות התרשים, שתהפוך את העבודה עם התרשים באלגולם למילולית פחות ולברורה יותר.

**דוגמה 3** (bold, underlined)

נרצה לפרש את האלגוריתם הבא:

(at the far left, level with "דוגמה 3", in a light-grey box:)

```
FIVE (A)
ADD (A)
```

(א) המבנה של התרשים יהיה פירוש לכל תת-משימה, ושירשור שלהן לתווית ראשית:

(to the left: a table with 3 columns and 2 rows and no header row. From LEFT to right the columns are code | a label for each line (split into 2 rows) | one cell merged over both rows. Read right to left: merged cell | per-line labels | code.)

| קוד (עמודה שמאלית) | תווית לכל שורה (עמודה אמצעית) | תווית ראשית (עמודה ימנית, תא ממוזג) |
|---|---|---|
| `FIVE (A)` | — | — |
| `ADD (A)` | — | (אותו תא ממוזג) |

(ב) נתחיל לפרש משמאל לימין, נתחיל מפירוש תת-המשימות:

(to the left: the same 3-column table layout)

| קוד (עמודה שמאלית) | תווית לכל שורה (עמודה אמצעית) | תווית ראשית (עמודה ימנית, תא ממוזג) |
|---|---|---|
| `FIVE (A)` | `A=5` | — |
| `ADD (A)` | `A=A+1` | (אותו תא ממוזג) |

(ג) נשרשר בין שתי התוויות לתווית ראשית:

(to the left: the same 3-column table layout)

| קוד (עמודה שמאלית) | תווית לכל שורה (עמודה אמצעית) | תווית ראשית (עמודה ימנית, תא ממוזג) |
|---|---|---|
| `FIVE (A)` | `A=5` | `A=6` |
| `ADD (A)` | `A=A+1` | (אותו תא ממוזג) |

עד כה תיארנו את התהליך בדגש על סדר הפעולות שמתבצעות, ולא העמקנו במתרחש. נתעמק במספר היבטים חשובים בהערות הבאות:

• בכל תווית מתוארים ערכי הפלט ביחס לערכי הקלט, בהתאם למוסכמה מעמוד קודם. אילו נרצה להרחיב את הרישום, לצורך ההסברים וההבנה, ולצרף סימוני קלט ופלט, הדבר ייראה כך:

(to the left: the same 3-column table layout, now with input/output superscripts. The superscripts are a raised capital "O" (output) and a raised capital "I" (input). There is no arrow on this table.)

| קוד (עמודה שמאלית) | תווית לכל שורה (עמודה אמצעית) | תווית ראשית (עמודה ימנית, תא ממוזג) |
|---|---|---|
| `FIVE (A)` | `A^O=5` | `A^O=6` |
| `ADD (A)` | `A^O=A^I+1` | (אותו תא ממוזג) |

(to the right of this table, indented under the bullet text:)
ניתן להשתמש בסימונים אלה בתחילת הדרך, אולם נשתדל להתרגל להיגמל מהם בהקדם.

• בכל אחת מהתוויות יתואר הקשר בין ערכי הקלט לערכי הפלט באלגוריתם התואם לתווית, בהתעלם מן הערך שקיבלו המשתנים בתוויות אחרות בתרשים.
שגיאה נפוצה במילוי התוויות בטבלה היא זו:

(to the left of the last two lines: the same 3-column table layout, crossed out with a big red ✖)

| קוד (עמודה שמאלית) | תווית לכל שורה (עמודה אמצעית) | עמודה ימנית (תא ממוזג) |
|---|---|---|
| `FIVE (A)` | `A=5` | — (appears empty; the red ✖ covers the boundary between the middle and right columns) |
| `ADD (A)` | `A=6` | (אותו תא ממוזג) |

(mark: a large red ✖ over the table, meaning it is wrong)

נשים לב, שהתיאור השגוי A=6 הוא בדיוק האופן בו היינו מפרשים את האלגוריתם הזה בטבלת מעקב!
נסביר זאת: זה אכן נכון שהפקודה ADD מביאה לתוצאה 6 במשתנה A, אך בתרשים (בשונה מטבלת מעקב) התווית שלצד הפקודה ADD לא אמורה לשקלל את הערך הקודם של A, אלא לתאר את מה שמתרחש בפקודה ADD לבדה.

(The photo ends here. The rest of the page is below the screen edge; photo 10 shows it.)

## Visuals

- **Layout:** the Hebrew text runs along the right of the page. Every table and the grey code box sit at the left margin, level with the text they belong to. The body text is set in a uniformly heavy, bold-looking Hebrew font. Only the two headings are underlined.
- **Grey code box (level with "דוגמה 3", far left):** a small light-grey filled rectangle with no border. It holds two lines in a serif font, `FIVE (A)` over `ADD (A)`, left-aligned.
- **Five label tables (all the same shape):** each is a wide, flat rectangle with a thick dark outline, about 360 px wide and two short rows high in the photo. It has 3 columns of roughly equal width:
  - left column: `FIVE (A)` (top row) and `ADD (A)` (bottom row), divided by a horizontal line;
  - middle column: one label per code line, divided by a horizontal line;
  - right column: a single cell merged over both rows, with its text vertically centred.

  The contents are:
  1. after (א): the middle and right columns are empty;
  2. after (ב): middle `A=5` / `A=A+1`, right cell empty;
  3. after (ג): middle `A=5` / `A=A+1`, right `A=6`;
  4. in the first bullet: middle `A^O=5` / `A^O=A^I+1`, right `A^O=6`;
  5. in the second bullet: middle `A=5` / `A=6`, right cell empty, crossed out with the red ✖.
- **Red ✖ (on table 5):** a large solid red "✖" made of two thick crossing strokes, slightly taller than the table. It sits at roughly 60% of the table's width, over the vertical line between the middle column and the merged right cell, and marks the table as a wrong way of filling in the labels.
- **No green arrow** in this photo. The green-arrow version of the `A^O`/`A^I` table is lower on the page and appears only in photo 10.

## Structured inventory

- **Headings / topics:** "אמצעי ניתוח שני: תרשים (של פירוק הדרגתי)"; "דוגמה 3".
- **Definitions / concepts:**
  - the diagram ("תרשים") as a way to interpret algorithms, from short sub-tasks ("תת-משימות"), gradually including loops and chaining ("שירשורים"), up to the main label ("התווית הראשית") that describes the whole algorithm;
  - a new way of writing the diagram's labels ("צורת רישום בתוויות התרשים") that makes working with the diagram in אלגולם less verbal and clearer;
  - each label describes the output values relative to the input values ("בהתאם למוסכמה מעמוד קודם");
  - input/output marks: superscript I for input and O for output (`A^I`, `A^O`);
  - each label describes the input→output relation of its own part of the algorithm, ignoring the values the variables got in other labels;
  - the contrast between a diagram and a trace table ("טבלת מעקב").
- **Commands / instructions introduced:** none new. Uses `FIVE (A)` and `ADD (A)`.
- **Algorithms / code blocks:**
  - `photo-11-code-1`: the two-line algorithm of Example 3, `FIVE (A)` / `ADD (A)` (grey box; repeated as the left column of each table).
- **Trace tables:** none. The tables are diagram-label tables. The text says the wrong labelling `A=6` is exactly how the algorithm would be interpreted in a trace table.
- **Formulas:**
  - step labels `A=5`, `A=A+1`, main label `A=6`;
  - with I/O marks: `A^O=5`, `A^O=A^I+1`, main label `A^O=6`;
  - wrong labels (red ✖): `A=5`, `A=6`.
- **Worked examples (with the lecturer's solution steps):** Example 3, interpreting `FIVE (A)` / `ADD (A)` with a diagram:
  - (א) the structure: one interpretation per sub-task, chained into a main label (empty table);
  - (ב) work from left to right, starting with the sub-tasks: `FIVE (A)` → `A=5`, `ADD (A)` → `A=A+1`;
  - (ג) chain the two labels into the main label `A=6`;
  - the same table again with I/O marks: `A^O=5`, `A^O=A^I+1`, `A^O=6`;
  - the common mistake (red ✖): writing `A=6` next to `ADD (A)`.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:**
  - "הכרנו כבר את התרשים…" (the diagram was introduced earlier, with chaining and loops);
  - "בהתאם למוסכמה מעמוד קודם" (a convention from the previous page, presumably page 2, shown in photo 12);
  - "טבלת מעקב" (trace tables, the first analysis tool).
- **Lecturer's solution method / emphasis:**
  - interpret from left to right: sub-task labels first, then chain them into the main label;
  - the I/O superscripts may be used at the start, but we should try to wean ourselves off them soon;
  - a label next to a command describes only what that command itself does ("לא אמורה לשקלל את הערך הקודם של A"), not the accumulated value as in a trace table;
  - the common error is shown explicitly and crossed out with a red ✖.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Red-✖ table: whether the merged right cell is truly empty. The ✖ covers the column boundary and possibly the left edge of that cell, and no text is visible in the uncovered part. Photo 10 agrees.
  - Grey code box: the gap between `ADD` and `(A)` looks slightly wider than in `FIVE (A)`, so it may be a double space. This cannot be decided in a proportional serif font, so it is transcribed with a single space.
  - The thumbnail impression gave the heading as "(של פירוק מודולרי)". After zooming, the heading clearly reads "(של פירוק הדרגתי)".
