# photo-44

- **PDF page:** 66
- **Document / deck title (as seen):** Google Slides deck; active browser tab title (truncated): "א.3 (1) אלגולם בסיסי…"; the slide header reads "א.3 היכרות עם שפת אלגולם / פעולות ראשונות". URL type: `docs.google.com/presentation/d/…/edit?slide=id.g291881a02ee_0_43#slide=id.g291881a02ee_0_…` (Google Slides, edit mode).
- **Kind:** slide
- **Page / slide number visible:** 17 (printed at the bottom-left of the slide)
- **Parts in this photo:** one slide (whole slide visible)
- **Continuity:** (to be completed after reading photo 45/46) Deck "פעולות ראשונות"; photos were taken in reverse order, so the neighbouring photo 45 is an earlier slide/animation state of the same deck.

## Transcription

### Slide header (green bar across the top of the slide, white text)

- Right side of the bar (large): **א. רקע**
- Left side of the bar: **א.3 היכרות עם שפת אלגולם / פעולות ראשונות**

### Title line (right-aligned, bold)

**דוגמה 7** (מודגש, עם קו תחתון)   **העתקת תוכן מונה אחד למונה אחר**

### Nested table (left-centre of the slide)

The table has a thick dark outer border. Physical layout: 4 columns and 4 rows, with merged cells. Column order as it appears **from right to left**:

- **Column 1 (rightmost, narrow):** one cell merged over all 4 rows — the overall description.
- **Column 2:** in row 1 it is merged with column 3; in rows 2-4 it is one cell merged over those three rows — the mid-level description.
- **Column 3:** per-block description (one cell per row; in row 1 merged with column 2).
- **Column 4 (leftmost, widest):** the code, one code block per row.

Reproduced with the first markdown column = rightmost column on the slide ("↑" = cell continues the merged cell above; "→ merged" = merged with the neighbouring cell as stated):

| עמודה 1 (ימנית) — תיאור כולל | עמודה 2 — תיאור ביניים | עמודה 3 — תיאור הבלוק | עמודה 4 (שמאלית) — קוד |
|---|---|---|---|
| העתק את R1 ל-R2 תוך איפוס R3 (תא אחד לכל 4 השורות) | אפס את R2 (תא ממוזג על פני עמודות 2+3) | (ממוזג עם עמודה 2) | `WHILE (R2)` / `SUB (R2)` / `ENDW` |
| ↑ | הוסף את R1 ל-R2 תוך איפוס R3 (ללא שינוי ב-R1) (תא אחד לשורות 2–4) | אפס את R3 | `WHILE (R3)` / `SUB (R3)` / `ENDW` |
| ↑ | ↑ | הוסף את R1 ל-R2 ול-R3 תוך איפוס R1 | `WHILE (R1)` / `ADD (R2)` / `ADD (R3)` / `SUB (R1)` / `ENDW` |
| ↑ | ↑ | הוסף את R3 ל-R1 תוך איפוס R3 | `WHILE (R3)` / `ADD (R1)` / `SUB (R3)` / `ENDW` |

The code column, read top to bottom, is one continuous program of 15 lines (no line numbers are shown on the slide):

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

Exactly which code lines each label cell spans:

1. **"אפס את R2"** — spans code lines 1-3 (`WHILE (R2)` / `SUB (R2)` / `ENDW`). This cell is wide: it occupies columns 2+3 together.
2. **"אפס את R3"** — spans code lines 4-6 (`WHILE (R3)` / `SUB (R3)` / `ENDW`).
3. **"הוסף את R1 ל-R2 ול-R3 תוך איפוס R1"** — spans code lines 7-11 (`WHILE (R1)` / `ADD (R2)` / `ADD (R3)` / `SUB (R1)` / `ENDW`). Line breaks in the cell: "הוסף את R1" / "ל-R2 ול-R3" / "תוך איפוס R1".
4. **"הוסף את R3 ל-R1 תוך איפוס R3"** — spans code lines 12-15 (`WHILE (R3)` / `ADD (R1)` / `SUB (R3)` / `ENDW`). Line breaks in the cell: "הוסף את R3" / "ל-R1" / "תוך איפוס R3".
5. **"הוסף את R1 ל-R2 תוך איפוס R3 (ללא שינוי ב-R1)"** — mid-level cell spanning code lines 4-15 (the three blocks 2, 3, 4 above). Line breaks in the cell: "הוסף את R1 ל-R2" / "תוך איפוס R3" / "(ללא שינוי ב-R1)"; the text is placed at the upper-middle of the cell.
6. **"העתק את R1 ל-R2 תוך איפוס R3"** — rightmost cell spanning all code lines 1-15. Line breaks in the cell: "העתק את" / "R1 ל-R2" / "תוך איפוס" / "R3"; the text is at the top of the cell.

### Slide number

17

## Visuals

- **Green header bar:** full-width olive/green rectangle with white text ("א. רקע" large at the right, section title at the left).
- **Nested table:** rectangle with a thick (~3 px) dark outer border and thinner inner lines, occupying roughly the left two thirds of the slide width, from just under the title line down to about two thirds of the slide height. Inner structure (left to right on screen): code column (≈ 33% of the table width); column 3 (≈ 24%); column 2 (≈ 25%); column 1 (≈ 18%). Horizontal lines: under code block 1 the line runs across columns 4, 3 and 2 (stopping at column 1); the lines under code blocks 2 and 3 run only across columns 4 and 3. The vertical line between columns 3 and 2 exists only in rows 2-4 (row 1 is merged). Row heights are proportional to the number of code lines (3, 3, 5, 4 lines).
- Code is in a serif (Times-like) font, dark navy; inner lines of each WHILE block are indented. Hebrew labels are in a serif Hebrew font, regular weight, with the counter names R1/R2/R3 in Latin letters.
- No pictures, arrows or coloured marks. The slide area to the right of the table and below it is empty.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פעולות ראשונות"; "דוגמה 7 — העתקת תוכן מונה אחד למונה אחר".
- **Definitions / concepts:** copying the contents of one counter to another (העתקת תוכן מונה) using an auxiliary counter R3; zeroing a counter (איפוס מונה); adding one counter to others while zeroing it; hierarchical decomposition of a program into sub-operations.
- **Commands / instructions introduced:** none new (uses WHILE / ADD / SUB / ENDW).
- **Algorithms / code blocks:** `photo-44-code-1` — 15-line program "copy R1 to R2 while zeroing R3": zero R2; zero R3; move R1 into both R2 and R3 (zeroing R1); move R3 back into R1 (zeroing R3).
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** Example 7 — decomposition: (1) אפס את R2; (2) הוסף את R1 ל-R2 תוך איפוס R3 (ללא שינוי ב-R1), which itself consists of: (2a) אפס את R3, (2b) הוסף את R1 ל-R2 ול-R3 תוך איפוס R1, (2c) הוסף את R3 ל-R1 תוך איפוס R3; all together: העתק את R1 ל-R2 תוך איפוס R3.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit on the slide.
- **Lecturer's solution method / emphasis:** annotate code blocks with what they do at increasing levels of abstraction (block → combined operation → whole program), shown as nested table cells beside the code.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - After the last word of the title line ("אחר") there is a faint small grey dot at the left end; it may be a full stop / punctuation mark or just a speck on the screen.
  - Browser tab title is cut off after "א.3 (1) אלגולם בסיסי" (not part of the slide).
