# photo-10

- **PDF page:** 32
- **Document / deck title (as seen):** "ב.1 אמצעים לניתוח אלגוריתמים – קריאה" (as printed in the page footer). Viewed in the Google Drive file viewer (`drive.google.com/file/d/1GeLl4N1qjNHKxQC0tA…`, "External" badge); the bookmarks bar items ("א.2 (3)", "א.2 (א)", "א.3 (1)", "א.5 יסוד", "א.6 רקע", "א.3 (2)", "א.3 (3)", "א.4 (2)", "ב.0 מלג…") are not the document name.
- **Kind:** reading page
- **Page / slide number visible:** "עמוד 3 מתוך 8" (footer of the upper page part). The lower part is the top of the next page (page 4; its own footer is not visible).
- **Parts in this photo:** bottom of page 3 (two bullet paragraphs, two small tables, footer) + top of page 4 (heading "דוגמה 4", one sentence and the first 3 lines of a code box, cut off by the bottom of the screen).
- **Continuity:** The page-3 part is the end of "דוגמה 3" and overlaps with photo 11 (same page 3, scrolled further up — photo 11 shows the text that precedes the first bullet here, and also this part). The page-4 part ("דוגמה 4 / נרצה לפרש את האלגוריתם הבא:" + start of the code box) is the same content as the top of photo 09, which shows the rest of Example 4.

## Transcription

### Part 1 — bottom of page 3 (top of this part is cut off: the photo starts in the middle of a bulleted discussion)

• בכל אחת מהתוויות יתואר הקשר בין ערכי הקלט לערכי הפלט באלגוריתם התואם לתווית, בהתעלם מן הערך שקיבלו המשתנים בתוויות אחרות בתרשים.
שגיאה נפוצה במילוי התוויות בטבלה היא זו:

(to the left of the last two lines — a small table crossed with a big red ✖. Column order from LEFT to right: code | label of each line | right cell (merged over both rows). From right to left: merged right cell | per-line label | code. No header row.)

| קוד (עמודה שמאלית) | תווית לצד כל שורה (עמודה אמצעית) | עמודה ימנית (תא אחד ממוזג לשתי השורות) |
|---|---|---|
| `FIVE (A)` | `A=5` | — (ריק, ככל שנראה; ה-✖ האדום מכסה את הגבול בין העמודה האמצעית לימנית) |
| `ADD (A)` | `A=6` | (אותו תא ממוזג) |

(סימון: ✖ אדום גדול על הטבלה — הטבלה שגויה)

נשים לב, שהתיאור השגוי `A=6` הוא בדיוק האופן בו היינו מפרשים את האלגוריתם הזה בטבלת מעקב!
נסביר זאת: זה אכן נכון שהפקודה ADD מביאה לתוצאה 6 במשתנה A, אך בתרשים (בשונה מטבלת מעקב) התווית שלצד הפקודה ADD לא אמורה לשקלל את הערך הקודם של A, אלא לתאר את מה שמתרחש בפקודה ADD לבדה.
לעומת זאת, התווית הראשית אמורה לתאר את המתרחש מביצוע שתי השורות יחד, ולכן התיאור `A=6` מופיע בה.

• נסביר את האופן בו נוצרה התווית הראשית משירשור שתי תת-המשימות: אנחנו מציבים את `A^O` של התווית העליונה כ-`A^I` בתווית התחתונה.
הסיבה לכך היא, שמבחינת השורה התחתונה, הקלט שלה הוא הפלט של השורה שלפניה.

(below the second bullet, at the left — the correct table. Column order from LEFT to right: code | label of each line | main label (merged over both rows). No header row.)

| קוד (עמודה שמאלית) | תווית לצד כל שורה (עמודה אמצעית) | התווית הראשית (עמודה ימנית, תא ממוזג לשתי השורות) |
|---|---|---|
| `FIVE (A)` | `A^O=5` | `A^O=6` |
| `ADD (A)` | `A^O=A^I+1` | (אותו תא ממוזג) |

(a green arrow goes from the `A^O` of the upper label `A^O=5` diagonally down-right to the `A^I` inside the lower label `A^O=A^I+1`)

Footer of page 3 (under a horizontal rule):
- right side: ב.1 אמצעים לניתוח אלגוריתמים – קריאה
- left side: עמוד 3 מתוך 8

### Part 2 — top of page 4 (bottom cut off by the screen edge)

**דוגמה 4** (מודגש, עם קו תחתון)

נרצה לפרש את האלגוריתם הבא:

(to the left, in a grey box — only the first three lines are visible, the rest is below the screen edge:)

```
WHILE (A)
    ADD (B)
    ADD (B)
```

## Visuals

- **Wrong table (page 3, left of the first bullet's last lines):** a thin-bordered rectangle, about 360 px wide in the photo and two short rows high. Left column (≈ 1/3 width): `FIVE (A)` over `ADD (A)`. Next column: `A=5` over `A=6`, separated by a horizontal line. The right part of the table is one empty merged cell. A large solid red "✖" (as tall as the whole table, even sticking out slightly above and below) is drawn over the table at roughly 60% of its width, covering the boundary between the label column and the right cell — it marks the table as an error.
- **Correct table (page 3, below the second bullet, left side):** a rectangle with a thick dark border, 3 columns of about equal width, 2 rows. Left column: `FIVE (A)` (top), `ADD (A)` (bottom), small serif font. Middle column: `A^O=5` (top), `A^O=A^I+1` (bottom), larger serif font; the superscripts are a raised capital "O" and a raised capital "I". Right column: one merged cell spanning both rows containing `A^O=6`, vertically centred. A short thick **green arrow** starts just under the `A^O` of the top middle cell (`A^O=5`) and points diagonally down and to the right, its head landing on the `A^I` in the bottom middle cell — illustrating that the output A of the upper label is substituted as the input A of the lower label.
- **Page break:** below the page-3 footer there is a dark horizontal band (the viewer's gap between pages), then the white top of page 4.
- **Code box (page 4, left):** light-grey rectangle with the code in serif font; `WHILE (A)` flush left, `ADD (B)` lines indented; cut by the bottom of the screen after the third line.

## Structured inventory

- **Headings / topics:** end of the discussion of "דוגמה 3" (labels in the diagram/table for `FIVE (A)` + `ADD (A)`); start of "דוגמה 4".
- **Definitions / concepts:** each label (תווית) describes the relation between the input values and the output values of the algorithm part that matches that label, ignoring values the variables received in other labels of the diagram; "התווית הראשית" (main label) describes what happens from executing both lines together; chaining (שירשור) of two sub-tasks (תת-משימות): the `A^O` of the upper label is substituted as the `A^I` of the lower label, because from the lower line's point of view its input is the output of the line before it; contrast between a diagram ("תרשים") and a trace table ("טבלת מעקב").
- **Commands / instructions introduced:** none new (uses `FIVE (A)`, `ADD (A)`; `WHILE (A)`, `ADD (B)`).
- **Algorithms / code blocks:**
  - `photo-10-code-1` — the two-line algorithm of Example 3 as it appears in the tables: `FIVE (A)` / `ADD (A)`.
  - `photo-10-code-2` — beginning of the Example 4 algorithm (cut off): `WHILE (A)` / `ADD (B)` / `ADD (B)` …
- **Trace tables:** none (the two tables are label tables; the wrong one, `A=5` / `A=6`, is said to be exactly how the algorithm would be interpreted in a trace table).
- **Formulas:** wrong labels: `A=5`, `A=6`; correct labels: `A^O=5`, `A^O=A^I+1`, main label `A^O=6`.
- **Worked examples (with the lecturer's solution steps):** Example 3 (end): the common mistake is to write `A=5` next to `FIVE (A)` and `A=6` next to `ADD (A)` (red ✖). Correct: `FIVE (A)` → `A^O=5`; `ADD (A)` → `A^O=A^I+1` (describes only what ADD does by itself); main label for both lines together → `A^O=6`, obtained by substituting the upper label's `A^O` as the lower label's `A^I`.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** "טבלת מעקב" (trace table) — the wrong description `A=6` is exactly how the algorithm would be interpreted in a trace table.
- **Lecturer's solution method / emphasis:** A label next to a command describes only that command's own input→output relation, not the accumulated value ("לא אמורה לשקלל את הערך הקודם של A"); only the main label describes the combined effect of the lines. Common error explicitly marked with a red ✖.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Wrong table (red ✖): whether the right merged cell is truly empty — the ✖ covers the column boundary and possibly a small part of the cell; no text is visible in the uncovered part. (Cross-checked against photo 11, where the same table appears.)
  - The end of the first bullet's first line ("לתווית, בהתעלם מן") is washed out by glare in this photo but still readable; confirmed by the same line in photo 11.
