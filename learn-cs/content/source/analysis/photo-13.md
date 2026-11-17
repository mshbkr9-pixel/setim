# photo-13

- **PDF page:** 35
- **Document / deck title (as seen):** not visible in this photo. (The same document's footer, visible in the neighbouring photos 14 and 12, reads "ב.1 אמצעים לניתוח אלגוריתמים – קריאה".) The file is shown in a Google Drive PDF viewer in a browser (address bar: `drive.google.com/file/d/1GeLI4N1qjNHKxQC0tAsKW…`, cut off). The browser tab labels that can be read ("א.6 רקו…", "א.3 (2)", "א.3 (3)", "א.4 (2)", "ב.0 …") belong to other documents and do not name this one.
- **Kind:** reading page
- **Page / slide number visible:** not visible in this photo (photo 12 shows the lower part of the same page with the footer "עמוד 2 מתוך 8", so this is page 2 of 8).
- **Parts in this photo:** one page part — the upper part of page 2, from the heading "דוגמה 2" (the first thing visible under the viewer's dark top bar; page 1 ends with the end of דוגמה 1 in photo 14, so this is evidently the start of page 2, but the page's top edge itself is hidden by the bar) down to the paragraph "מעתה נקפיד … Input/Output המסורבלים." The rest of the page below that paragraph (and the footer) is cut off by the bottom of the screen.
- **Continuity:** continues from photo 14 (bottom of page 1, "דוגמה 1"; this photo quotes the result of דוגמה 1). Overlaps with photo 12, which shows the lower part of the same page: photo 12 repeats everything from "השימוש בסימוני ה- Input/Output מסרבל את הכתיבה." to "…Input/Output המסורבלים." and then continues with a "הערה:" paragraph (Java) and the page footer. New in this photo (not in 12 or 14): the whole of "דוגמה 2" (text, code, trace table, result) and the opening of "נדון לרגע בצורת הכתיבה" with the two result lines that carry the I/O superscripts.

## Transcription

**דוגמה 2** (מודגש, עם קו תחתון)

נתון אלגוריתם.

נניח שערכו של A^I הוא *a* וערכו של B^I הוא *b*.

נחפש מהם ערכי הפלט A^O ו-B^O עבור האלגוריתם הנתון.

(The algorithm appears in a grey box at the top-left of the page, to the left of the three lines above:)

```
 TEN (B)
 WHILE (B)
      ADD (A)
      SUB (B)
ENDW
```

(Indentation as seen: `TEN (B)` and `WHILE (B)` start at the same column; `ADD (A)` and `SUB (B)` are indented further to the right; `ENDW` starts very slightly to the left of `WHILE`.)

נשים לב שכאן, באלגוריתם הנתון, מופיעה פקודה אחת לביצוע לפני הלולאה.

Trace table (7 columns, header row + 2 data rows; the header row is shaded light grey and bold). Columns are listed here in the order they appear **from right to left** on the page (the rightmost column, "משתנה", is first):

| משתנה | קלט | לאחר שורה ראשונה | לאחר סיבוב 1 | לאחר סיבוב 2 | לאחר סיבוב n | לאחר הלולאה n=10 (פלט) |
|---|---|---|---|---|---|---|
| A | a | a | a+1 | a+2 | a+n | a+10 |
| B | b | 10 | 9 | 8 | 10-n | 0 |

(Header cell texts are stacked on several lines inside each cell: "לאחר / שורה / ראשונה", "לאחר סיבוב / 1", "לאחר סיבוב / 2", "לאחר סיבוב / n", "לאחר / הלולאה / n=10 / (פלט)".)

מטבלת המעקב עולה כי ערכי הפלט של האלגוריתם הם:    A^O = A^I + 10      B^O = 0

**נדון לרגע בצורת הכתיבה** (מודגש, נטוי, עם קו תחתון)

המסקנות שלנו לערכי הפלט בשתי הדוגמאות האחרונות היו:

בדוגמה 1:   A^O = 0      B^O = B^I + 2 · A^I          ובדוגמה 2:   A^O = A^I + 10      B^O = 0

השימוש בסימוני ה- Input/Output מסרבל את הכתיבה.

מה יתקבל אם נמחק אותם?

בדוגמה 1:   A = 0      B = B + 2 · A          ובדוגמה 2:   A = A + 10      B = 0

אנו רגילים מעולם המתמטיקה שכל שוויון שכזה הוא משוואה, וכל צמד ביטויים שכזה הוא מערכת משוואות, ולכן עשויים להתפתות לבצע מהלכים כגון להציב ערכי משוואה אחת במשוואה השניה, להעביר אגפים, לחפש פתרון או להכריז: "אין פתרון" / "קיימים אינסוף פתרונות", אולם הביטויים הללו אינם משוואות. ✗ (סימן X אדום בסוף המשפט)

צורת הכתיבה הזו מתארת פלט (שמופיע משמאל) כתוצאה של חישוב כלשהו על ערכי הקלט (שמופיע מימין).

מעתה נקפיד על כתיבת הביטויים לערכי הפלט תוך שמירה על הכיוונים הללו, וכך נוכל לוותר על סימוני ה- Input/Output המסורבלים.

(The photo ends here; the page continues below — see photo 12.)

## Visuals

- **Code box:** a light-grey filled rectangle (no visible border) in the top-left corner of the page, level with the heading "דוגמה 2" and the three sentences under it (which are right-aligned on the right side of the page). It contains the five code lines in a dark serif (Times-like) typeface, left-aligned with the indentation shown above.
- **Trace table:** one bordered table spanning almost the full text width, 7 columns × 3 rows. Header row is tall (up to four stacked text lines), light-grey fill, bold sans-serif Hebrew. The two data rows are short, white, with centred values in a serif typeface (a, a+1, 10-n …). Rightmost column = variable name (A, B); leftmost column = "לאחר הלולאה n=10 (פלט)".
- **Formula lines:** the result formulas are set in a serif typeface, left of the Hebrew text on the same line. In the two "בדוגמה 1: … ובדוגמה 2: …" lines the order from right to left is: "בדוגמה 1:", the A-expression, the B-expression, then "ובדוגמה 2:", the A-expression, the B-expression. The superscripts I and O are small raised capital letters.
- **Red X:** a thick, bright-red cross mark (✗), roughly the height of a text line, placed immediately after (to the left of) the final full stop of the sentence "…אולם הביטויים הללו אינם משוואות." at the end of the three-line paragraph. It is the only coloured element in the page area.
- No diagrams or pictures.

## Structured inventory

- **Headings / topics:** "דוגמה 2"; "נדון לרגע בצורת הכתיבה".
- **Definitions / concepts:** A^I, B^I = input values of counters A, B (denoted a, b); A^O, B^O = output values; "סימוני ה- Input/Output" (the I/O superscripts) make the writing cumbersome; a line such as `B = B + 2 · A` is **not an equation** — it describes the output (written on the left) as the result of a computation on the input values (written on the right); from now on the expressions for output values are written keeping these directions, so the I/O marks can be dropped.
- **Commands / instructions introduced:** `TEN (B)` is used as the first line of the algorithm ("פקודה אחת לביצוע לפני הלולאה"); it is not defined on this page — the trace table shows B = 10 "לאחר שורה ראשונה". Also used: `WHILE (B) … ENDW`, `ADD (A)`, `SUB (B)`.
- **Algorithms / code blocks:** `photo-13-code-1` — the algorithm of דוגמה 2: `TEN (B)`, then a `WHILE (B)` loop containing `ADD (A)` and `SUB (B)`, closed by `ENDW`.
- **Trace tables:** one general trace table for דוגמה 2 — columns (right to left) משתנה / קלט / לאחר שורה ראשונה / לאחר סיבוב 1 / לאחר סיבוב 2 / לאחר סיבוב n / לאחר הלולאה n=10 (פלט); row A: a, a, a+1, a+2, a+n, a+10; row B: b, 10, 9, 8, 10-n, 0.
- **Formulas:** `A^O = A^I + 10`, `B^O = 0` (דוגמה 2); `A^O = 0`, `B^O = B^I + 2 · A^I` (דוגמה 1, quoted); without the I/O marks: `A = 0`, `B = B + 2 · A` (דוגמה 1) and `A = A + 10`, `B = 0` (דוגמה 2).
- **Worked examples (with the lecturer's solution steps):** דוגמה 2 — (1) assume A^I = a, B^I = b and look for A^O, B^O; (2) notice that one command is executed before the loop, so the table gets an extra column "לאחר שורה ראשונה" (A stays a, B becomes 10); (3) follow rounds 1 and 2 (A: a+1, a+2; B: 9, 8); (4) generalise to round n (A: a+n; B: 10-n); (5) the loop ends at n=10, giving the output column (A: a+10; B: 0); (6) conclusion: A^O = A^I + 10, B^O = 0.
- **Questions / exercises (verbatim, with numbers):** no numbered exercises. One question posed in the running text: "מה יתקבל אם נמחק אותם?" (about deleting the Input/Output marks).
- **References to earlier material:** "המסקנות שלנו לערכי הפלט בשתי הדוגמאות האחרונות" — refers to דוגמה 1 (photo 14) and דוגמה 2; "מעולם המתמטיקה" — the habit of treating equalities as equations / systems of equations.
- **Lecturer's solution method / emphasis:** general trace table with symbolic input values and a general "round n" column, then substituting the n at which the loop stops; the red ✗ stresses that the output expressions are not equations (do not substitute one into the other, move terms between sides, look for a solution, or declare "אין פתרון" / "קיימים אינסוף פתרונות"); output on the left, computation on input values on the right.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - none in the page content (all text, code lines, table cells and superscripts were re-read at higher zoom).
  - Minor layout note only: in the code box `ENDW` starts very slightly left of `TEN`/`WHILE`; whether this is a real one-space outdent in the source or photo perspective cannot be decided — the wording of the code is certain.
  - Browser chrome: the tab labels are too blurred/cut to say which tab is active; they are not part of the page content.
