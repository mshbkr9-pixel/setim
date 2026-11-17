# photo-45

- **PDF page:** 67
- **Document / deck title (as seen):** Google Slides deck in the editor (edit mode). The active browser tab is "א.3 (1) אלגולם בסיסי" (the end may be cut off). Other tabs: "א.2 (2) פרוצדורות לו…", "א.2 (3) דיון במשתנים", "א.2 (א) היכרות עם לו…", "שיעורים ומשאבים 27…", plus cut-off tabs at both edges. URL type: `docs.google.com/presentation/d/…/edit?slide=id.g291881a02ee_0_43#slide=id.g291881a02ee_0…` (end cut off). Green header of the slide: "א. רקע" (right) and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" (left).
- **Kind:** slide
- **Page / slide number visible:** 17 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (the whole slide is visible, in the Google Slides editor view)
- **Continuity:** **Same slide as photo 44.** Both show slide number 17 and slide id `g291881a02ee_0_43` in the URL, with the same title ("דוגמה 7") and table. I checked every cell and every code line against analysis/photo-44.md and they are identical. Nothing on the slide is new or missing compared with photo 44. The slide is shown in the editor, where animations do not apply, so there is no separate animation step. In deck order it comes after photo 46 (slide 11, "דוגמה 6", slide id `…_0_37`). Slides 12–16 are not in photos 44–46. The block `WHILE (R2)` / `SUB (R2)` / `ENDW` labelled "אפס את R2" also appears in photo 47 (slide 10, "דוגמה 5"). Differences from the reference photo-44.md are minor and do not touch the text or the table structure: (a) the reference says the table reaches "about two thirds of the slide height", but I measure its bottom edge at about three quarters (≈77%); (b) the reference indents the code with 5 spaces and I use 4. Both mean one indent level, since no exact character count is visible. (c) The reference does not mention that the text in the label cells is flush-left, which I describe below.

## Transcription

### Slide header (green bar across the top of the slide, white text)

- Right side of the bar (larger font): **א. רקע**
- Left side of the bar: **א.3 היכרות עם שפת אלגולם / פעולות ראשונות**

### Title line (under the header, at the right, bold)

**דוגמה 7** (מודגש, עם קו תחתון)    **העתקת תוכן מונה אחד למונה אחר** (מודגש)

(The two parts sit on one line with a wide gap between them. There is no colon after "דוגמה 7". A faint small grey dot follows "אחר" at the left end; see Legibility.)

### Nested table (left two-thirds of the slide body)

The slide has no header row. The physical grid is 4 columns × 4 rows with merged cells. Each row is one code block. Column order as it appears **from right to left**:

- **Column 1 (rightmost, narrowest):** one cell merged over all 4 rows, holding the overall description.
- **Column 2:** in row 1, merged with column 3 into one wide cell. In rows 2–4, one cell merged over those three rows, holding the mid-level description.
- **Column 3:** a description of each block, one cell per row in rows 2–4. In row 1 it is part of the wide merged cell.
- **Column 4 (leftmost, widest):** the code, one code block per row.

Table reproduced with the **first markdown column = the rightmost column on the slide**. "↑" means the cell is part of the merged cell above it.

| עמודה 1 (ימנית) — תיאור כולל | עמודה 2 — תיאור ביניים | עמודה 3 — תיאור הבלוק | עמודה 4 (שמאלית) — קוד |
|---|---|---|---|
| העתק את R1 ל-R2 תוך איפוס R3 (תא אחד ממוזג על פני שורות 1–4) | אפס את R2 (תא אחד ממוזג על פני עמודות 2+3 בשורה 1) | (חלק מהתא הממוזג "אפס את R2") | `WHILE (R2)` / `SUB (R2)` / `ENDW` |
| ↑ | הוסף את R1 ל-R2 תוך איפוס R3 (ללא שינוי ב-R1) (תא אחד ממוזג על פני שורות 2–4) | אפס את R3 | `WHILE (R3)` / `SUB (R3)` / `ENDW` |
| ↑ | ↑ | הוסף את R1 ל-R2 ול-R3 תוך איפוס R1 | `WHILE (R1)` / `ADD (R2)` / `ADD (R3)` / `SUB (R1)` / `ENDW` |
| ↑ | ↑ | הוסף את R3 ל-R1 תוך איפוס R3 | `WHILE (R3)` / `ADD (R1)` / `SUB (R3)` / `ENDW` |

The code column, read top to bottom, is one continuous 15-line program. The slide shows no line numbers; the numbers below are added only to refer to lines. Each body line is indented one level and `ENDW` lines up with its `WHILE`:

```
WHILE (R2)
    SUB (R2)
ENDW
WHILE (R3)
    SUB (R3)
ENDW
WHILE (R1)
    ADD (R2)
    ADD (R3)
    SUB (R1)
ENDW
WHILE (R3)
    ADD (R1)
    SUB (R3)
ENDW
```

Line numbering used below: 1 `WHILE (R2)`, 2 `SUB (R2)`, 3 `ENDW`, 4 `WHILE (R3)`, 5 `SUB (R3)`, 6 `ENDW`, 7 `WHILE (R1)`, 8 `ADD (R2)`, 9 `ADD (R3)`, 10 `SUB (R1)`, 11 `ENDW`, 12 `WHILE (R3)`, 13 `ADD (R1)`, 14 `SUB (R3)`, 15 `ENDW`.

**Exactly which code lines each label cell spans** (with the line breaks inside each cell as seen):

1. **"אפס את R2"**: code lines **1–3** (`WHILE (R2)` / `SUB (R2)` / `ENDW`). This is a wide cell covering columns 2+3 in row 1. The text is on one line, level with code line 2, in the left-centre part of the cell.
2. **"אפס את R3"**: code lines **4–6** (`WHILE (R3)` / `SUB (R3)` / `ENDW`). One line, in the upper part of the cell, level with code line 5 (slightly above it).
3. **"הוסף את R1 ל-R2 ול-R3 תוך איפוס R1"**: code lines **7–11** (`WHILE (R1)` / `ADD (R2)` / `ADD (R3)` / `SUB (R1)` / `ENDW`). Written on 3 lines: "הוסף את R1" / "ל-R2 ול-R3" / "תוך איפוס R1", roughly level with code lines 7–9.
4. **"הוסף את R3 ל-R1 תוך איפוס R3"**: code lines **12–15** (`WHILE (R3)` / `ADD (R1)` / `SUB (R3)` / `ENDW`). Written on 3 lines: "הוסף את R3" / "ל-R1" / "תוך איפוס R3", roughly level with code lines 13–15.
5. **"הוסף את R1 ל-R2 תוך איפוס R3 (ללא שינוי ב-R1)"**: code lines **4–15**, the three blocks of items 2, 3 and 4 together (column 2, rows 2–4). Written on 3 lines: "הוסף את R1 ל-R2" / "תוך איפוס R3" / "(ללא שינוי ב-R1)". The text sits in the upper part of the tall cell, level with code lines 6–7, around the row 2/row 3 boundary. The rest of the cell is empty.
6. **"העתק את R1 ל-R2 תוך איפוס R3"**: **all code lines 1–15** (column 1, rows 1–4). Written on 4 lines: "העתק את" / "R1 ל-R2" / "תוך איפוס" / "R3". The text is at the top of the cell, running from code line 2 down to just above code line 4. The rest of the cell is empty.

Writing as seen: counters are `R1`, `R2`, `R3` with full-size digits. In the Hebrew cells, ל is joined to the counter with a hyphen and no space ("ל-R2", "ול-R3", "ל-R1", "ב-R1").

### Slide number (bottom-left)

17

## Visuals

- **Context:** a white slide in the Google Slides editor (the "Slideshow" button is at the top right of the window), photographed at a slight angle. The slide's top edge is a little wider than its bottom edge. No filmstrip is visible. A short grey line under the slide is the speaker-notes handle.
- **Green header bar:** a rectangle across the full slide width near the top (about 4%–13% of the slide height). In the photo it is dark olive at the left end and brighter green toward the right; this may be a gradient or the viewing angle. White text: "א. רקע" in a larger font at the right end and "א.3 היכרות עם שפת אלגולם / פעולות ראשונות" at the left.
- **Title line:** right-aligned, just below the header (about 19% of the slide height). Dark bold text; "דוגמה 7" is underlined.
- **Nested table:** a rectangle about 1.6 times as wide as it is tall. Its left edge is at about 6% of the slide width and its right edge at about 70%. Its top is at about 22% of the slide height and its bottom at about 77%. The outer border is dark (navy-black) and thicker than the thin inner lines.
  - Column widths from left to right: code ≈ 32% of the table width, column 3 ≈ 25%, column 2 ≈ 25%, column 1 (rightmost) ≈ 18%.
  - Row heights from top to bottom: ≈ 23%, 20%, 33%, 24% of the table height, roughly proportional to the 3, 3, 5 and 4 code lines.
  - Horizontal lines: the line under row 1 runs across columns 4, 3 and 2 and stops at column 1. The lines under rows 2 and 3 run only across columns 4 and 3. Column 1 has no internal line at all.
  - Vertical lines: the line between columns 2 and 3 exists only in rows 2–4, because row 1 is merged there. The lines between columns 4 and 3 and between columns 2 and 1 run the full height.
  - Text: the code is in a serif (Times-like) capital font, dark navy, with the body lines of each WHILE block indented. The Hebrew labels are in a regular-weight serif Hebrew font, dark navy, with R1/R2/R3 in Latin letters. Label text is flush-left inside its cell (each line starts at the cell's left edge; the right ends are ragged) and sits toward the top of the cell. The exception is "אפס את R2", which sits in the left-centre of its wide cell.
- **Slide number** "17" in small bold black digits at the bottom-left of the slide.
- No pictures, arrows or coloured marks. The slide area to the right of the table and below it is empty. A faint purplish-grey blur above the right part of the table is a reflection on the screen, not slide content.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פעולות ראשונות"; "דוגמה 7 — העתקת תוכן מונה אחד למונה אחר" (the dash is mine; on the slide the two parts are separated by a gap).
- **Definitions / concepts:** copying the content of one counter (R1) to another (R2) using an auxiliary counter (R3); zeroing a counter ("אפס"); adding one counter to others while zeroing it ("הוסף … תוך איפוס …"); "ללא שינוי ב-R1"; describing a program at several nested levels.
- **Commands / instructions introduced:** none new (uses `WHILE` / `ADD` / `SUB` / `ENDW`).
- **Algorithms / code blocks:** `photo-45-code-1`: the 15-line program for example 7, "העתק את R1 ל-R2 תוך איפוס R3". It zeroes R2 (lines 1–3), zeroes R3 (lines 4–6), moves R1 into both R2 and R3 while zeroing R1 (lines 7–11), and moves R3 back into R1 while zeroing R3 (lines 12–15). Identical to `photo-44-code-1`.
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** דוגמה 7: העתקת תוכן מונה אחד למונה אחר. The steps are those named in the table cells: (1) אפס את R2 [lines 1–3]; (2) הוסף את R1 ל-R2 תוך איפוס R3 (ללא שינוי ב-R1) [lines 4–15], made up of (2a) אפס את R3 [4–6], (2b) הוסף את R1 ל-R2 ול-R3 תוך איפוס R1 [7–11] and (2c) הוסף את R3 ל-R1 תוך איפוס R3 [12–15]. The whole program is labelled העתק את R1 ל-R2 תוך איפוס R3 [1–15].
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit on the slide.
- **Lecturer's solution method / emphasis:** the nested description table. Code blocks sit in the left column, each block has its own label, neighbouring blocks are grouped under a wider label, and the rightmost cell names what the whole program does. "דוגמה 7" is bold and underlined; the example's name is bold.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Title line: a faint small grey dot sits to the left of the last word "אחר" (seen at 4× zoom). It is much lighter than the bold text. It may be punctuation, a speck or an editor artifact, and it was not transcribed as text. Photo-44.md and photo-50.md report the same kind of dot after "אחר".
  - The third line of the column-2 cell, "(ללא שינוי ב-R1)": the visual order is a parenthesis, "R1-", the Hebrew words, then a second parenthesis glyph at the right end. At 6× zoom I could not tell which way the right-hand glyph curves. I also considered "וללא שינוי ב-R1)", with a ו in place of the opening parenthesis, and rejected it because the right-hand glyph is as tall as the left parenthesis and extends below the baseline, which a ו would not. Reading kept: "(ללא שינוי ב-R1)", the same as photo-44.md.
  - Browser chrome only, not slide content: the tab titles are cut off ("פרוצדורות לו…", "היכרות עם לו…", "שיעורים ומשאבים 27…"), and the end of the URL is cut off.
