# photo-54

- **PDF page:** 76
- **Document / deck title (as seen):** title printed at the top of the page: "א.2 היכרות עם שפת לוגו (א) פעולות אלמנטריות – משימה". Active browser tab (Google-Drive icon): "א.2 (א) היכרות עם לוגו - מש…" (cut). Address bar: `drive.google.com/file/d/1sscCs76yijdeV6s0spsTX7xFjY2RUhYl/view` (Google Drive file viewer, i.e. a PDF preview; the id is copied as read, not checked letter by letter). Other tabs in the tab strip, left → right as on screen: one cut off at the left edge, "א.2 (2) פרוצדורות לוגו - מ…", "א.2 (3) דיון במשתנים ומחס…", [the active tab], "שיעורים ומשאבים 2027 - …" (green Sheets-type icon), and one more cut off at the right edge (not legible). A "Share" button is at the top right of the viewer.
- **Kind:** task sheet
- **Page / slide number visible:** not visible
- **Parts in this photo:** the upper part of one page: the page's top margin, the red note box and the title, all of question 2 (its two instruction lines and the nested table), and the heading plus two instruction lines of question 3. The page goes on below the Windows taskbar, so the algorithms of question 3 are not visible.
- **Continuity:** no overlap with the neighbouring photos. Photo-53 is slide 3 of the Algolem deck "א.3 (1) אלגולם בסיסי" and photo-55 is the last page of the reading "א.6 רקע למושג פונקציה". Both are different documents, so this is the only photo of this task sheet among the neighbours. Photo-53's file already names photo 54 as this task sheet, which matches my reading. The LOGO references photo-69 and photo-70 are slides of a different document (the deck "א.2 (2) פרוצדורות לוגו"), so they share no content with this page. Their notation (upper-case commands; `REPEAT n [` with `]` on its own line; nested lines indented) matches this page, and I found no disagreement with them. Note: this photo has no heading "שאלה 1". The question headings visible are "שאלה 2" and "שאלה 3".

## Transcription

### Top of the page

**Note box** (top-left corner of the page, framed; every word is red and bold; three centred lines):

חשוב! יש לבצע את משימת

ההיכרות עם תוכנת לוגו

לפני התירגול שבעמוד זה!

(The word "לפני" is underlined. "התירגול" is spelled with a yod.)

**Title** (right side of the page, level with the middle of the note box; bold):

א.2 היכרות עם שפת לוגו (א) פעולות אלמנטריות – משימה

(The final word "משימה", after the dash, looks regular weight; the rest of the title is bold.)

### שאלה 2

**שאלה 2** (מודגש, קו תחתון)

נתון אלגוריתם ושלד של תרשים. פרשו את האלגוריתם במילוי שיטתי של תוויות התרשים.

(הערה : הפירוש לא במילים אלא בשרטוטים)

#### The table ("שלד של תרשים")

This is one framed table, but not a regular grid. The **leftmost column** holds the LOGO code, which is left-to-right text. To the right of the code column are **nested rectangular boxes and empty fill-in cells** whose heights follow the blocks of the code. There is no header row and no header column. **Every fill-in cell is empty** in this photo: nothing is written or drawn in them.

**Code in the left column** (read top to bottom). The indentation shows the nesting as printed: each indented group sits inside its own drawn box. The original has no line numbers.

```
REPEAT 4 [
    FD 100
    RT 90
]
PU
LT 90
FD 50
RT 90
PD
REPEAT 4 [
    REPEAT 3 [
        FD 100
        LT 120
    ]
    PU
    FD 150
    RT 90
    FD 50
    PD
]
```

**Layout sketch.** I redrew this with approximate proportions. The ids in parentheses are mine; they are not in the original. `#` and `=` mark the thick lines, `|` `-` `+` the thin lines.

```
#=================#=========================================================#
# REPEAT 4 [      #                       |              |                  #
#    +------------#---------------------+ |              |                  #
#    | FD 100     #        (1-A)        | |    (1-B)     |                  #
#    | RT 90      #                     | |              |                  #
#    +------------#---------------------+ |              |                  #
# ]               #                       |              |                  #
#-----------------#-----------------------+--------------+                  #
# PU              #                                      |                  #
# LT 90           #                                      |                  #
# FD 50           #                (2-B)                 |                  #
# RT 90           #                                      |                  #
# PD              #                                      |                  #
#-----------------#------------------------------+-------+                  #
# REPEAT 4 [      #                              |       |                  #
#    +------------#-------------+------+-------+ |       |      (T-R)       #
#    | REPEAT 3 [ #             |      |       | |       |                  #
#    |    +-------#-----------+ |      |       | |       |                  #
#    |    | FD 100#   (3-E)   | |(3-D1 |       | |       |                  #
#    |    | LT 120#           | | lbl) |       | |       |                  #
#    |    +-------#-----------+ |      |       | |       |                  #
#    | ]          #             |      |(3-C   | | (3-B) |                  #
#    +------------#-------------+------+ lbl)  | |       |                  #
#    | PU         #                    |       | |       |                  #
#    | FD 150     #                    |       | |       |                  #
#    | RT 90      #       (3-D2)       |       | |       |                  #
#    | FD 50      #                    |       | |       |                  #
#    | PD         #                    |       | |       |                  #
#    +------------#--------------------+-------+ |       |                  #
# ]               #                              |       |                  #
#=================#=========================================================#
```

**Every cell, with the code lines it spans.** Line numbers are mine (1–20, in the order of the code block above). Positions are measured from the table's left frame (as % of the table width) and from its top frame (as % of the table height). They are approximate: the photo is a little skewed.

| Cell (my id) | What it is | Horizontal extent (% width) | Vertical extent (% height) | Code lines spanned | Content in the photo |
|---|---|---|---|---|---|
| 1-K | code area, block 1 | 0–24 (code column) | 0–23 | 1–4 | `REPEAT 4 [` (line 1), box 1-A (lines 2–3), `]` (line 4) |
| 1-A | inner box (code part + fill-in part) | 7–52 (crosses the thick code-column line at 24) | 8–18 | 2–3 | code part (7–24): `FD 100`, `RT 90`; fill-in part (24–52): — |
| 1-B | fill-in cell | 53–75 | 0–23 | 1–4 | — |
| 2-K | code area, block 2 | 0–24 | 23–47 | 5–9 | `PU`, `LT 90`, `FD 50`, `RT 90`, `PD` |
| 2-B | fill-in cell (one wide cell) | 24–75 | 23–47 | 5–9 | — |
| 3-K | code area, block 3 | 0–24 | 47–100 | 10–20 | `REPEAT 4 [` (line 10), box 3-C (lines 11–19), `]` (line 20) |
| 3-C | box: the body of the second `REPEAT 4`; holds 3-D1, 3-D2 and the cell 3-C lbl | 7–62 | 52–94 | 11–19 | see its sub-cells |
| 3-D1 | upper part of 3-C; holds box 3-E and the cell 3-D1 lbl | 7–51 | 52–71 | 11–14 | code part: `REPEAT 3 [` (line 11), box 3-E, `]` (line 14) |
| 3-E | innermost box (code part + fill-in part) | 13–40 | 56–66 | 12–13 | code part (13–24): `FD 100`, `LT 120`; fill-in part (24–40): — |
| 3-D1 lbl | fill-in cell | 40.5–51 | 52–71 | 11–14 | — |
| 3-D2 | lower part of 3-C (code part + fill-in part) | 7–51 | 71–94 | 15–19 | code part (7–24): `PU`, `FD 150`, `RT 90`, `FD 50`, `PD`; fill-in part (24–51): — |
| 3-C lbl | fill-in cell | 51–62 | 52–94 | 11–19 | — |
| 3-B | fill-in cell | 63–75 | 47–100 | 10–20 | — |
| T-R | fill-in cell, the rightmost column, full table height | 75–100 | 0–100 | 1–20 | — |

Leftover strips that are **not** separate cells:
- **Block 1:** between the code column and the line at 53%, there is a strip above box 1-A (beside line 1) and another below it (beside line 4). There is also a hair-thin gap between box 1-A's right edge (52%) and that line.
- **Block 3:** between the code column and the line at 63%, there is a strip above box 3-C (beside line 10) and another below it (beside line 20). There is also a narrow gap between box 3-C's right edge (62%) and the line at 63%.
- **Inside 3-D1:** right of the code column, there is a strip above box 3-E (beside line 11) and another below it (beside line 14). There is also a hair-thin gap between box 3-E's right edge (40%) and the line at 40.5%.

**Column order, right → left** (as the table appears): T-R (lines 1–20) | then, per block:
- block 1: 1-B (lines 1–4) | 1-A fill-in part (lines 2–3) | code;
- block 2: 2-B (lines 5–9) | code;
- block 3: 3-B (lines 10–20) | 3-C lbl (lines 11–19) | 3-D1 lbl (lines 11–14) above the 3-D2 fill-in part (lines 15–19) | 3-E fill-in part (lines 12–13) | code.

**Per code line: the boxes around it and the fill-in cells that span it** (innermost → outermost):

| # (mine) | Code line | Indent level | Inside drawn box(es) | Fill-in cells spanning this line |
|---|---|---|---|---|
| 1 | `REPEAT 4 [` | 0 | — | 1-B, T-R |
| 2 | `FD 100` | 1 | 1-A | 1-A (fill-in part), 1-B, T-R |
| 3 | `RT 90` | 1 | 1-A | 1-A (fill-in part), 1-B, T-R |
| 4 | `]` | 0 | — | 1-B, T-R |
| 5 | `PU` | 0 | — | 2-B, T-R |
| 6 | `LT 90` | 0 | — | 2-B, T-R |
| 7 | `FD 50` | 0 | — | 2-B, T-R |
| 8 | `RT 90` | 0 | — | 2-B, T-R |
| 9 | `PD` | 0 | — | 2-B, T-R |
| 10 | `REPEAT 4 [` | 0 | — | 3-B, T-R |
| 11 | `REPEAT 3 [` | 1 | 3-C, 3-D1 | 3-D1 lbl, 3-C lbl, 3-B, T-R |
| 12 | `FD 100` | 2 | 3-C, 3-D1, 3-E | 3-E (fill-in part), 3-D1 lbl, 3-C lbl, 3-B, T-R |
| 13 | `LT 120` | 2 | 3-C, 3-D1, 3-E | 3-E (fill-in part), 3-D1 lbl, 3-C lbl, 3-B, T-R |
| 14 | `]` | 1 | 3-C, 3-D1 | 3-D1 lbl, 3-C lbl, 3-B, T-R |
| 15 | `PU` | 1 | 3-C, 3-D2 | 3-D2 (fill-in part), 3-C lbl, 3-B, T-R |
| 16 | `FD 150` | 1 | 3-C, 3-D2 | 3-D2 (fill-in part), 3-C lbl, 3-B, T-R |
| 17 | `RT 90` | 1 | 3-C, 3-D2 | 3-D2 (fill-in part), 3-C lbl, 3-B, T-R |
| 18 | `FD 50` | 1 | 3-C, 3-D2 | 3-D2 (fill-in part), 3-C lbl, 3-B, T-R |
| 19 | `PD` | 1 | 3-C, 3-D2 | 3-D2 (fill-in part), 3-C lbl, 3-B, T-R |
| 20 | `]` | 0 | — | 3-B, T-R |

### שאלה 3 (only the beginning is visible)

**שאלה 3** (מודגש, קו תחתון)

לכל אחד מהאלגוריתמים הבאים, שרטטו על נייר את התוצאה שאתם משערים שתתקבל מהפעלתם (ללא פירוק הדרגתי, עם נקודות התחלה וסיום). בדקו את תשובותיכם בהרצה (אין צורך להציג תמונת מסך של ההרצה).

(On the page, the first line ends after "(ללא פירוק" and the second line starts with "הדרגתי,". The second line sits right at the top edge of the taskbar. Nothing of the page below it is visible, so the algorithms of question 3 are cut off.)

## Visuals

1. **Screen and page.** A photo of an HP laptop screen showing the Google Drive file viewer: browser tab strip and address bar at the top, Windows taskbar at the bottom (search box "חפש"). One white portrait page fills the middle of the screen. Its top margin is visible above the note box.
2. **Red note box.** A rectangle in the top-left corner of the page, about 29% of the page width (from about 7% to about 35% from the page's left edge) and three text lines high. It has a thin dark-grey/black border and a white fill. Inside are three centred lines of bold red sans-serif text; the word "לפני" in the third line is underlined in red.
3. **Title and headings.** The title is bold black sans-serif, right-aligned, at the height of the note box's middle line. "שאלה 2" and "שאלה 3" are bold, underlined and right-aligned. The instruction text is regular black sans-serif, right-aligned.
4. **The table of question 2** (full geometry in the Transcription):
   - **Position:** it sits below the question 2 text, from about 19% to about 85% of the page width.
   - **Thick lines:** the outer frame, and one vertical line at about 24% of the table width that runs the full height and closes the code column.
   - **Thin lines:** everything else.
   - **Code column:** the code is upper-case, regular weight, in a black serif font that looks like Times. The column is split by two thin full-width lines (at about 23% and 47% of the height, both running from the left frame to the vertical line at 75%) into three blocks: lines 1–4, 5–9 and 10–20.
   - **Code boxes:** each nested code group has its own thin rectangle. The rectangle's left edge is inside the code column, indented under the opening `REPEAT … [` line. Its right edge reaches past the thick code-column line into the fill-in area, so the part right of the thick line is the box's own empty fill-in part.
   - **Full-height line at 75%:** a thin vertical line at about 75% of the width runs the full height. It separates the tall rightmost cell T-R from everything else.
   - **Fill-in cells:** all are empty and white.
5. **Screen marks.** Grey shadowy smudges on the screen above the upper middle of the table, around the column of box 1-A and cell 1-B. They are reflections or dirt, not part of the document.
6. There are no turtle drawings, pictures or coloured marks other than the red note box.

## Structured inventory

- **Headings / topics:** "א.2 היכרות עם שפת לוגו (א) פעולות אלמנטריות – משימה"; "שאלה 2"; "שאלה 3".
- **Definitions / concepts:** none defined. Terms used: "אלגוריתם", "שלד של תרשים", "תוויות התרשים", "פרשו … במילוי שיטתי", "הפירוש … בשרטוטים", "פירוק הדרגתי", "נקודות התחלה וסיום", "הרצה", "תוכנת לוגו".
- **Commands / instructions introduced:** none new. Used in the code: `REPEAT n [ … ]`, `FD`, `RT`, `LT`, `PU`, `PD`.
- **Algorithms / code blocks:**
  - `photo-54-code-1`: the 20-line LOGO algorithm of question 2. It has two top-level `REPEAT 4 [ … ]` blocks with the sequence `PU` / `LT 90` / `FD 50` / `RT 90` / `PD` between them. The second `REPEAT 4` contains a nested `REPEAT 3 [ FD 100 LT 120 ]` followed by `PU` / `FD 150` / `RT 90` / `FD 50` / `PD`.
- **Trace tables:** none.
- **Formulas:** none.
- **Worked examples (with the lecturer's solution steps):** none. The chart skeleton is blank.
- **Questions / exercises (verbatim, with numbers):**
  - שאלה 2: "נתון אלגוריתם ושלד של תרשים. פרשו את האלגוריתם במילוי שיטתי של תוויות התרשים. (הערה : הפירוש לא במילים אלא בשרטוטים)". The question includes the code `photo-54-code-1` and the nested chart skeleton described above, with all fill-in cells empty.
  - שאלה 3 (beginning only): "לכל אחד מהאלגוריתמים הבאים, שרטטו על נייר את התוצאה שאתם משערים שתתקבל מהפעלתם (ללא פירוק הדרגתי, עם נקודות התחלה וסיום). בדקו את תשובותיכם בהרצה (אין צורך להציג תמונת מסך של ההרצה)." The algorithms themselves are below the visible area.
- **References to earlier material:** the note box: "חשוב! יש לבצע את משימת ההיכרות עם תוכנת לוגו לפני התירגול שבעמוד זה!". The questions on this page start at "שאלה 2"; no "שאלה 1" is visible in this photo.
- **Lecturer's solution method / emphasis:**
  - The red bold note box, with "לפני" underlined.
  - The chart skeleton mirrors the nesting of the code: one box per code group, and fill-in cells whose heights match the code lines they cover, up to the rightmost cell, which spans all 20 lines.
  - The interpretation is to be drawn, not written ("הפירוש לא במילים אלא בשרטוטים").
  - In question 3, students should guess the result first and only then check it by running the code.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - **Code:** every command, number and bracket was read with confidence at a 3.4× zoom. `LT 120` (line 13) was checked specifically: the L and its foot are visible, so it is not RT. One small point: the gap between each command and its number (e.g. `FD 100`, `REPEAT 4 [`) looks wider than a normal space, possibly two spaces or a tab. I transcribed it with one space. Low importance.
  - **Title weight:** "משימה" at the end of the title looks regular weight, against a bold rest of the title. Seen in two tiles. Low importance.
  - **"(הערה : הפירוש":** there seems to be a space before the colon. Copied as seen. Low importance.
  - **Table geometry:** all the percentages are approximate (±1–2%) because of the photo's perspective. The structure itself (which line ends where, which box holds which lines) is clear.
  - **Browser chrome:** the Drive file id in the address bar was not checked character by character (l/I, 0/O). The tab at the right edge of the tab strip is cut off and not legible.
