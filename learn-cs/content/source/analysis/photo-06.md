# photo-06

- **PDF page:** 28
- **Document / deck title (as seen):** "ב.1 אמצעים לניתוח אלגוריתמים – קריאה" (from the page footer). Shown in a Google-Drive PDF viewer; URL bar: `drive.google.com/file/d/1GeLI4N1qjNHKxQC0tAs…` (cut off), "External" badge. Browser tabs visible (right to left, partly cut by the top edge of the photo): `ב.0 מבו…`, `א.4 (2)`, `א.3 (3)`, `א.3 (2)`, `א.6 רקע` (barely visible).
- **Kind:** reading page
- **Page / slide number visible:** "עמוד 5 מתוך 8"
- **Parts in this photo:** lower part of page 5 (from the line "נמשיך בחישוב ערכו של B…" down to the footer; everything above that line is scrolled out of view) + the empty top margin of page 6 (a white strip with no text) under the page gap.
- **Continuity:** PROVISIONAL (updated at the end of the file set) — end of "דוגמה 5" (the heading itself is not in this photo). The next page (page 6) starts with "דוגמה 6", which is photo-05.

## Transcription

### Page 5 — lower part (end of example 5; the top of the page is scrolled out of view)

נמשיך בחישוב ערכו של B. בתווית (ב) מופיע B=B+2A. קראנו זאת כך:
*"B החדש שווה ל-B המקורי ועוד פעמיים A המקורי".* (שורה זו בכתב נטוי)

כעת נדייק ונאמר:
*"B החדש שווה ל-B <u>הקודם</u> ועוד פעמיים A <u>הקודם</u>".* (שורה זו בכתב נטוי; שתי המילים "הקודם" מודגשות ועם קו תחתון)

אם כך, כדי לחשב את B החדש נחקור בתווית הקודמת (א) ונחפש שם את "A הקודם" ואת "B הקודם".
את "A הקודם" נמצא בתווית (א): A=6 - ונוכל להציב אותו.
את "B הקודם" לא נמצא בתווית (א). המשתנה B לא עבר שינוי בתווית הקודמת, ולכן "B הקודם" הוא למעשה
"B המקורי".
ולכן ערכו של B בתווית הראשית יהיה: B=B+2·6, כלומר B=B+12.

**Table** (stands at the left side of the page, under the paragraph) — 4 columns, closed frame. Column order as it appears from right to left: (1) main label, (2) labels marked (א)/(ב), (3) single-line / loop-body labels, (4) code. I.e. the code is the LEFT-most column. No header row. Written left-to-right below. "░ shaded" = cell filled grey, no text.

| code (left-most) | label, level 1 | label, level 2 — marked (א), (ב) | main label (right-most) |
|---|---|---|---|
| `FIVE (A)` | `A=5` (spans the single line `FIVE (A)`) | `A=6` with the mark **(א)** at the right side of the cell — ONE merged cell spanning the two code rows `FIVE (A)` and `ADD (A)` | `A=0`<br>`B = B + 12` — ONE tall cell spanning all the code rows (`FIVE (A)` … `ENDW`); the two lines are written at about mid-height |
| `ADD (A)` | `A=A+1` (spans the single line `ADD (A)`) | (same merged cell (א)) | (same tall cell) |
| `WHILE (A)` | ░ shaded grey, empty | `A = 0`<br>`B = B + 2A` with the mark **(ב)** at the right side of the cell (the mark is placed a little above the two lines) — ONE merged cell spanning the code rows `WHILE (A)`, `ADD (B)`/`ADD (B)`/`SUB (A)`, `ENDW` (the whole loop) | (same tall cell) |
| `ADD (B)`<br>`ADD (B)`<br>`SUB (A)` (three code lines in ONE cell, indented) | `A = A-1`<br>`B = B+2` (one cell, two lines; spans exactly the three body lines `ADD (B)`, `ADD (B)`, `SUB (A)`) | (same merged cell (ב)) | (same tall cell) |
| `ENDW` | ░ shaded grey, empty | (same merged cell (ב)) | (same tall cell) |

The code column as plain code:

```
FIVE (A)
ADD (A)
WHILE (A)
    ADD (B)
    ADD (B)
    SUB (A)
ENDW
```

הבהרה נוספת: אם האלגוריתם הופעל כאשר ב-B הערך הוא 42 – התווית הראשית מלמדת אותנו כי הערך
42 יהיה חלק מערכו של B החדש, ונקבל בתווית הראשית B=42+12=54.
אם האלגוריתם הופעל כאשר ב-A הערך הוא 75 – התווית הראשית מלמדת אותנו כי ערך זה לא משפיע על
ערכי הפלט של A או של B.

*(empty space down to the footer)*

**Footer of page 5** (under a thin horizontal rule): on the right — "ב.1 אמצעים לניתוח אלגוריתמים – קריאה"; on the left — "עמוד 5 מתוך 8".

### Page 6 — top edge only

Only the blank white top margin of the next page is visible (no text) before the Windows taskbar.

## Visuals

- One table (described above): thick black outer frame; thick vertical line between the code column and the label columns; in the "level 1" column the cells beside `WHILE (A)` and `ENDW` are filled mid-grey; all other cells are white. Unlike photo-05, no cell here is coloured orange. The mark (א) sits at the right end of the `A=6` cell; the mark (ב) sits at the right end of the loop-result cell, slightly above its two text lines. The right-most cell (`A=0` / `B = B + 12`) is as tall as the whole table.
- Typography: the two quoted sentences are in italics; in the second one the words "הקודם" (twice) are bold + underlined. Code and formulas are in a serif (Times-like) font.
- Page footer: thin horizontal line, document title at right, page number at left. Below it the dark gap between PDF pages and the white top of page 6.
- No red marks, ticks or arrows.

## Structured inventory

- **Headings / topics:** end of example 5 (heading not visible here) — computing the value of B in the main label by chaining label (ב) onto label (א); "הבהרה נוספת" (additional clarification) about what the main label tells us for concrete input values.
- **Definitions / concepts:** "B החדש" / "B המקורי" / "B הקודם", "A הקודם" — in a chained label, the variables on the right-hand side refer to the PREVIOUS values (from the previous label), not necessarily to the original ones; if a variable was not changed in the previous label, its "previous" value is in fact its "original" value; התווית הראשית (main label); הצבה (substitution of the value found in the previous label); ערכי הפלט (output values).
- **Commands / instructions introduced:** none introduced; used: `FIVE (A)`, `ADD (A)`, `WHILE (A)` … `ENDW`, `ADD (B)`, `SUB (A)`.
- **Algorithms / code blocks:** `photo-06-code-1` — the algorithm of example 5: `FIVE (A)` / `ADD (A)` / `WHILE (A)` / `ADD (B)` / `ADD (B)` / `SUB (A)` / `ENDW`.
- **Trace tables:** none (the table is a label/interpretation table).
- **Formulas:** `B=B+2A` (label (ב)); `A=6` (label (א)); `B=B+2·6`, i.e. `B=B+12`; table labels: `A=5`, `A=A+1`, `A = A-1`, `B = B+2`, `A = 0`, `B = B + 2A`, `A=6`, main label `A=0`, `B = B + 12`; clarification: `B=42+12=54`.
- **Worked examples (with the lecturer's solution steps):** Example 5 (end): (1) label (ב) says `B=B+2A`, first read as "the new B equals the original B plus twice the original A"; (2) more precisely: "the new B equals the PREVIOUS B plus twice the PREVIOUS A"; (3) so look in the previous label (א) for "previous A" and "previous B"; (4) "previous A" is found in (א): `A=6` → substitute; (5) "previous B" is not in (א) — B was not changed there, so "previous B" is in fact "original B"; (6) hence in the main label `B=B+2·6`, i.e. `B=B+12`. Clarification: if run with B=42, the main label gives `B=42+12=54`; if run with A=75, that value does not affect the output values of A or B.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** "קראנו זאת כך: …" refers back to how `B=B+2A` was read earlier (in the part of the page/earlier pages not visible here); "נמשיך בחישוב ערכו של B" continues a computation started above (the value of A, not visible in this photo).
- **Lecturer's solution method / emphasis:** emphasis (bold+underline) on "הקודם" — when chaining labels, right-hand-side variables mean the previous values; search the previous label for each of them; substitute if found, otherwise the variable keeps its original value.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - none in the text and the table (all cells re-read at 4–5x zoom).
  - Minor typographic detail only: in the table, spacing around "=" and "+" varies as printed (`A=5`, `A=A+1`, `A=6`, `A=0` without spaces; `A = A-1`, `B = B+2`, `A = 0`, `B = B + 2A`, `B = B + 12` with spaces) — reproduced as seen; the spaces carry no meaning.
  - The multiplication sign in `B=B+2·6` is a small raised dot.
