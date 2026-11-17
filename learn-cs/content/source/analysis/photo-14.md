# photo-14

- **PDF page:** 36
- **Document / deck title (as seen):** "ב.1 אמצעים לניתוח אלגוריתמים – קריאה" (as printed in the page footer). The file is shown in a Google Drive PDF viewer in a browser (address bar: `drive.google.com/file/d/1GeLI4N1qjNH…`, cut off); the readable browser tab labels belong to other documents.
- **Kind:** reading page
- **Page / slide number visible:** "עמוד 1 מתוך 8" (footer, bottom-left)
- **Parts in this photo:** one page part — the lower part of page 1, from the heading "דוגמה 1" down to the page footer. The upper part of page 1 (document title and introduction, see photo 15) is scrolled out of view above the viewer's dark top bar.
- **Continuity:** continues from photo 15 (top of the same page 1: title, introduction of the general trace table). Continues in photo 13 (page 2: "דוגמה 2", which also quotes this example's result `A^O = 0`, `B^O = B^I + 2 · A^I`). See the note at the end of the Transcription about what is shared with photo 15.

## Transcription

**דוגמה 1** (מודגש, עם קו תחתון)

נתון אלגוריתם.

נניח שערכו של A^I הוא *a* וערכו של B^I הוא *b*.

נחפש מהם ערכי הפלט A^O ו-B^O עבור האלגוריתם הנתון.

(The algorithm appears in a grey box at the top-left of the visible page area, to the left of the lines above:)

```
WHILE (A)
      ADD  (B)
       ADD  (B)
       SUB (A)
ENDW
```

(Indentation as seen: `WHILE (A)` and `ENDW` start at the same column; the three inner lines are indented; the first `ADD  (B)` starts about one character to the left of the second `ADD  (B)` and of `SUB (A)`. The gap between `ADD` and `(B)` is visibly wider than the gap between `SUB` and `(A)`.)

**נבחין בין שני מקרים:** (מודגש)

**מקרה א:** *a* = 0. ("מקרה א:" מודגש)

במקרה זה לא יתבצע אף סיבוב של הלולאה ולכן ערכי הפלט יהיו שווים לערכי הקלט:    A^o = *a* = 0      B^o = *b*

(In this one line the superscript is a small lowercase "o" — `A^o`, `B^o` — unlike the capital `O` used in the rest of the page.)

**מקרה ב:** *a* ≠ 0. ("מקרה ב:" מודגש)

במקרה זה הלולאה תתבצע לפחות פעם אחת. נתאר זאת בעזרת טבלת מעקב:

Trace table (6 columns, header row + 2 data rows; the header row is shaded light grey and bold). Columns are listed here in the order they appear **from right to left** on the page (the rightmost column, "משתנה", is first):

| משתנה | קלט | לאחר סיבוב 1 | לאחר סיבוב 2 | לאחר סיבוב n | לאחר הלולאה n=a (פלט) |
|---|---|---|---|---|---|
| A | a | a – 1 | a - 2 | a - n | 0 |
| B | b | b + 2 | b + 4 | b + 2n | b+2a |

(Header cell texts are stacked on several lines inside each cell: "לאחר / סיבוב 1", "לאחר / סיבוב 2", "לאחר / סיבוב n", "לאחר / הלולאה / n=a / (פלט)".)

נבחין כי המסקנות אליהן הגענו במקרה (ב), מתאימות גם למקרה (א):

בשני המקרים (א)  ו(ב) מתקבל כי A^O=0.

הערך שהתקבל עבור B במקרה (ב) הוא B^O=*b*+2*a* . כאשר נציב בביטוי זה *a* = 0 יתקבל B^O = *b*  - בדיוק כפי שקיבלנו במקרה (א).

ולכן נוכל לסכם ללא הפרדה למקרים, ולומר כי ערכי הפלט של האלגוריתם הנתון בסעיף זה הם:

A^O = 0      B^O = B^I + 2 · A^I

(horizontal rule across the page, then the footer:)

ב.1 אמצעים לניתוח אלגוריתמים – קריאה (footer, right, bold)                    עמוד 1 מתוך 8 (footer, left, bold)

## Visuals

- **Code box:** a light-grey filled rectangle (no visible border) at the top-left of the visible page area, level with the heading "דוגמה 1" and the three sentences under it (which are right-aligned on the right side of the page). It contains the five code lines in a dark serif (Times-like) typeface, left-aligned with the indentation shown above.
- **Trace table:** one bordered table, 6 columns × 3 rows, placed directly under the sentence "במקרה זה הלולאה תתבצע לפחות פעם אחת. נתאר זאת בעזרת טבלת מעקב:"; it does not reach the right text margin (its right edge is indented from the right margin, its left edge is near the left margin). Header row tall, light-grey fill, bold sans-serif Hebrew; data rows short, white, centred values in a serif typeface. Rightmost column = variable name (A, B); leftmost column = "לאחר הלולאה n=a (פלט)".
- **Formulas:** set in a serif typeface, bold; the variables *a*, *b* in the running text are italic. In the "מקרה א" line the two results stand at the left end of the line, in the order (right to left) `A^o = a = 0`, then `B^o = b`. The final result line is a separate line, roughly centred-left under the sentence "ולכן נוכל לסכם…", in the order (right to left) `A^O = 0`, then `B^O = B^I + 2 · A^I`.
- **Footer:** a thin black horizontal rule across the text width; under it, at the right, the document name and, at the left, the page number.
- No diagrams, pictures or coloured marks.

## Structured inventory

- **Headings / topics:** "דוגמה 1"; "נבחין בין שני מקרים:"; "מקרה א: a = 0"; "מקרה ב: a ≠ 0"; footer "ב.1 אמצעים לניתוח אלגוריתמים – קריאה".
- **Definitions / concepts:** A^I, B^I = input values of counters A, B (denoted a, b); A^O, B^O = output values; "סיבוב" (loop round); "טבלת מעקב" with symbolic values and a general round n; case analysis on whether the loop runs at all (a = 0 / a ≠ 0) and merging the cases when the general expression also fits the special case.
- **Commands / instructions introduced:** none newly defined; used: `WHILE (A) … ENDW`, `ADD (B)`, `SUB (A)`.
- **Algorithms / code blocks:** `photo-14-code-1` — the algorithm of דוגמה 1: a `WHILE (A)` loop containing `ADD (B)`, `ADD (B)`, `SUB (A)`, closed by `ENDW`.
- **Trace tables:** one general trace table for דוגמה 1, case ב — columns (right to left) משתנה / קלט / לאחר סיבוב 1 / לאחר סיבוב 2 / לאחר סיבוב n / לאחר הלולאה n=a (פלט); row A: a, a – 1, a - 2, a - n, 0; row B: b, b + 2, b + 4, b + 2n, b+2a.
- **Formulas:** case א: `A^o = a = 0`, `B^o = b`; case ב: `A^O=0`, `B^O=b+2a`; substituting `a = 0` gives `B^O = b`; summary without case split: `A^O = 0`, `B^O = B^I + 2 · A^I`.
- **Worked examples (with the lecturer's solution steps):** דוגמה 1 — (1) assume A^I = a, B^I = b and look for A^O, B^O; (2) distinguish two cases; (3) case א, a = 0: no round of the loop is executed, so outputs equal inputs: A^o = a = 0, B^o = b; (4) case ב, a ≠ 0: the loop runs at least once — trace table with rounds 1, 2, general round n (A: a - n, B: b + 2n) and the column after the loop where n=a (A: 0, B: b+2a); (5) observe that the conclusions of case ב also fit case א (A^O=0 in both; putting a = 0 into B^O=b+2a gives B^O = b); (6) therefore summarise without separating cases: A^O = 0, B^O = B^I + 2 · A^I.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit on this part of the page (the tool "טבלת מעקב" is introduced on the upper part of the same page — see photo 15).
- **Lecturer's solution method / emphasis:** split into cases by whether the loop body executes; describe the non-trivial case with a general trace table (symbolic input, columns for round 1, round 2, round n, and after the loop with the stopping value of n); then check whether the general result also covers the special case so the answer can be stated once, in terms of the input values A^I, B^I.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - none in the wording, code, table cells or formulas (all re-read at higher zoom).
  - Typographic detail only: in the "מקרה א" line the superscript on A and B is a small lowercase-looking "o" (`A^o`, `B^o`), while elsewhere on the page it is a capital `O`; transcribed as seen.
  - Minus signs in the table: the cell `a – 1` shows a longer dash than `a - 2` and `a - n`; all are subtraction.
  - Layout detail only: the first `ADD  (B)` line is indented about one character less than the second `ADD  (B)` and `SUB (A)`; the code wording is certain.
