# photo-15

- **PDF page:** 37
- **Document / deck title (as seen):** "ב.1 אמצעים לניתוח אלגוריתמים – קריאה" (the page heading at the top of the page). The file is open in a Google Drive viewer in a browser; address bar `drive.google.com/file/d/1GeLI4N1qjNHKxQC0tAsKW…` (cut off at the right edge of the photo; read from the full photo only, not zoomed). The browser tab labels at the top show short codes of other course files (e.g. "א.3", "א.4", "א.6", "ב.0 …"); they were not zoomed and are not transcribed.
- **Kind:** reading page
- **Page / slide number visible:** not visible (the footer is below the visible area; photo 14 shows the footer of this same page: "עמוד 1 מתוך 8")
- **Parts in this photo:** one page part — the upper part of page 1: the top edge of the page, the document title, the introduction and notation, the heading "אמצעי ניתוח ראשון: טבלת מעקב כללית" with its paragraph, and the beginning of "דוגמה 1" down to the line of "מקרה א". The page continues below; the bottom of the screen (Windows taskbar) cuts it off after the "מקרה א" line.
- **Continuity:** first photo of this document's page 1 (photos are in reverse order, so this is the earliest view). Continues in photo 14 (lower part of the same page 1, from "דוגמה 1" to the footer). Overlap with photo 14: from the heading "דוגמה 1" down to the line "במקרה זה לא יתבצע אף סיבוב של הלולאה …: A^o = a = 0  B^o = b" (example sentences, code box, "נבחין בין שני מקרים:", "מקרה א"). New in this photo: the title, the introduction, the notation A^I / B^I / A^O / B^O with the red X remark, and the section "אמצעי ניתוח ראשון: טבלת מעקב כללית". Checked against analysis/photo-14.md line by line for the overlapping part: no disagreement (code wording, indentation detail, the wider gap in `ADD  (B)`, and the small lowercase-looking superscript "o" in the מקרה א line all agree).

## Transcription

**ב.1 אמצעים לניתוח אלגוריתמים** – קריאה
(title, larger font; "ב.1 אמצעים לניתוח אלגוריתמים" is bold, "– קריאה" is in regular weight)

הידע מסעיף זה הכרחי לניתוחים שנבצע בסעיפים הבאים בפרק.

במהלך פרק א דיברנו על משמעות של אלגוריתמים. באלגולם המשמעות של האלגוריתם היא הפעולה
שהאלגוריתם מבצע על המונים.
בסעיף זה נתמקצע בשני כלים שיאפשרו לנו למצוא את המשמעות הזו באלגולם.

(On the photo the words "היא הפעולה" at the left end of the line look heavier than the rest of the line — possibly bold [?]; see Legibility.)

נפתח במספר **סימונים** (מודגש ועם קו תחתון), המתאימים לפרוצדורה P בה מופיעים המשתנים A ו-B.

- לפני ביצוע האלגוריתם מכיל כל אחד משני המונים **ערך קלט** (מודגש) (Input) מסוים.
  נסמן את ערכי הקלט ב-A^I וב-B^I.
- לאחר ביצוע האלגוריתם מכיל כל אחד משני המונים **ערך פלט** (מודגש) (Output) מסוים.
  נסמן את ערכי הפלט ב-A^O וב-B^O.

  שימו לב, כי הסימונים הללו אינם סימונים של חזקה. ✗ (red X mark at the end of the line)

**אמצעי ניתוח ראשון: טבלת מעקב כללית** (מודגש ועם קו תחתון)

אנו מכירים כבר את טבלת המעקב כאמצעי למציאת ערך פלט של אלגוריתם עבור ערכי קלט מסוימים. כעת
נרצה להכליל את טבלאות המעקב: בטבלת מעקב כללית לא נבחר ערכי קלט מסוימים אלא נסמן את הערכים
ההתחלתיים באותיות כלליות, וננתח את האפשרויות השונות.

**דוגמה 1** (מודגש ועם קו תחתון)

נתון אלגוריתם.

נניח שערכו של A^I הוא *a* וערכו של B^I הוא *b*.

נחפש מהם ערכי הפלט A^O ו-B^O עבור האלגוריתם הנתון.

(The algorithm is in a grey box at the left side of the page, level with "דוגמה 1" and the three sentences under it:)

```
WHILE (A)
      ADD  (B)
       ADD  (B)
       SUB (A)
ENDW
```

(Indentation as seen: `WHILE (A)` and `ENDW` start at the same column; the three inner lines are indented; the first `ADD  (B)` starts slightly (about one character) to the left of the second `ADD  (B)` and of `SUB (A)`. The gap between `ADD` and `(B)` is visibly wider than the gap between `SUB` and `(A)`.)

**נבחין בין שני מקרים:** (מודגש)

**מקרה א:** *a* = 0. ("מקרה א:" מודגש)

במקרה זה לא יתבצע אף סיבוב של הלולאה ולכן ערכי הפלט יהיו שווים לערכי הקלט:    A^o = *a* = 0      B^o = *b*

(In this line the formulas are bold serif, *a* and *b* italic, and the superscript on A and B is a small lowercase-looking "o", unlike the capital `O` in "A^O", "B^O" higher on the page. Order on the page, right to left: first `A^o = a = 0`, then `B^o = b` at the far left.)

(The page is cut off here by the bottom of the screen; the continuation — "מקרה ב" and the trace table — is in photo 14.)

## Visuals

- **Page layout:** a white PDF page on a grey viewer background; the top edge of the page is visible above the title. Hebrew text is right-aligned; the bulleted list (two round bullets "•" at the right margin) and the "שימו לב…" line are indented slightly from the right margin.
- **Red X:** a bold red "X" (cross / ✗) mark, roughly one text line high, placed immediately to the left of the sentence "שימו לב, כי הסימונים הללו אינם סימונים של חזקה." — i.e. at the end of that sentence in reading order. It marks that A^I, A^O etc. are not powers.
- **Code box:** a light-grey filled rectangle without a visible border, at the left side of the page (left margin), vertically level with "דוגמה 1" and the three sentences under it, which stand at the right side. Five code lines in a dark serif (Times-like) typeface, left-aligned with the indentation described in the transcription.
- **Formulas:** `A^o = a = 0` and `B^o = b` stand at the left end of the "במקרה זה לא יתבצע…" line, bold serif with italic *a*, *b*. Superscripts I / O in the running text are small capitals after A and B.
- **Photo artifacts (not content):** a darker shadow over the left part of the page, and one or two dark round smudges/reflections on the screen below the code box and at the bottom-left near `B^o`; they partly darken `B^o` but it remains readable. The Windows taskbar covers the bottom of the screen.
- No diagrams or pictures.

## Structured inventory

- **Headings / topics:** document title "ב.1 אמצעים לניתוח אלגוריתמים – קריאה"; "אמצעי ניתוח ראשון: טבלת מעקב כללית"; "דוגמה 1"; "נבחין בין שני מקרים:"; "מקרה א: a = 0".
- **Definitions / concepts:** in אלגולם the meaning ("משמעות") of an algorithm is the action ("הפעולה") the algorithm performs on the counters; this section gives two tools for finding that meaning. Notation ("סימונים") for a procedure P with variables A and B: input value ("ערך קלט", Input) before execution, written A^I, B^I; output value ("ערך פלט", Output) after execution, written A^O, B^O; these superscripts are not powers. General trace table ("טבלת מעקב כללית"): instead of choosing specific input values, the initial values are denoted by general letters and the different possibilities are analysed.
- **Commands / instructions introduced:** none newly defined; used in the code: `WHILE (A) … ENDW`, `ADD (B)`, `SUB (A)`.
- **Algorithms / code blocks:** `photo-15-code-1` — the algorithm of דוגמה 1: `WHILE (A)` loop containing `ADD (B)`, `ADD (B)`, `SUB (A)`, closed by `ENDW` (same code as `photo-14-code-1`).
- **Trace tables:** none in this photo (the general trace table of דוגמה 1 is in photo 14).
- **Formulas:** notation A^I, B^I, A^O, B^O; input assumption A^I = *a*, B^I = *b* (stated in words); case א: *a* = 0, giving `A^o = a = 0`, `B^o = b`.
- **Worked examples (with the lecturer's solution steps):** דוגמה 1 (beginning only) — (1) an algorithm is given; (2) assume the value of A^I is *a* and of B^I is *b*; (3) look for the output values A^O and B^O; (4) distinguish two cases; (5) case א, *a* = 0: no round of the loop is executed, so the output values equal the input values: A^o = a = 0, B^o = b. (Case ב and the summary continue in photo 14.)
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** "במהלך פרק א דיברנו על משמעות של אלגוריתמים"; "אנו מכירים כבר את טבלת המעקב כאמצעי למציאת ערך פלט של אלגוריתם עבור ערכי קלט מסוימים"; "הידע מסעיף זה הכרחי לניתוחים שנבצע בסעיפים הבאים בפרק" (forward reference).
- **Lecturer's solution method / emphasis:** emphasis on the new notation (bold/underlined "סימונים", bold "ערך קלט" / "ערך פלט") and the red-X warning that A^I, A^O are not powers; the first analysis tool generalises the trace table by using letters for the initial values and analysing cases (here: whether the loop runs at all).

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Possible bold on "היא הפעולה" (end of the line "במהלך פרק א … באלגולם המשמעות של האלגוריתם היא הפעולה"): in the photo these two words look heavier than the rest of the line, but they lie in the darker, less sharp left edge of the page, where other words ("כעת", "את הערכים" at the ends of the lines of the "טבלת מעקב כללית" paragraph) look similarly heavy. Alternatives: real bold emphasis vs. a lighting/focus artifact. Not marked as bold in the transcription; flagged here.
  - Superscript in the "מקרה א" line: a small lowercase-looking "o" (`A^o`, `B^o`), while elsewhere on the page it is a capital `O`; transcribed as seen (agrees with photo-14.md). `B^o` is partly darkened by a screen smudge but readable.
  - Layout detail only: the first `ADD  (B)` is indented about one character less than the second `ADD  (B)` and `SUB (A)`; the code wording is certain.
  - Browser URL and tab labels were read from the full photo only (not zoomed); they are not course content.
