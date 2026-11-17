# photo-09

- **PDF page:** 31
- **Document / deck title (as seen):** not visible in this photo (no page header/footer on screen). The browser address bar shows a Google Drive file viewer: `drive.google.com/file/d/1GeLl4N1qjNHKxQC0tAs…` (cut off), with an "External" badge in the viewer's dark toolbar. The bookmarks bar shows items "א.2 (3)", "א.2 (א)", "א.3 (1)", "א.5 יסוד", "א.6 רקע", "א.3 (2)", "א.3 (3)", "א.4 (2)", "ב.0 מלג…" (these are bookmarks, not the document name). (Title is known only from neighbouring photos 10–12 — see Continuity.)
- **Kind:** reading page
- **Page / slide number visible:** not visible
- **Parts in this photo:** one continuous stretch of a single page: from the heading "דוגמה 4" (directly under the viewer's dark toolbar) down to a line that is cut horizontally by the bottom edge of the screen / Windows taskbar.
- **Continuity:** (see end-of-file note under Legibility for how this was established) This is "דוגמה 4", which follows "דוגמה 3" shown in photos 10–11 (photos are in reverse order, so photo 10 shows the page part just *before* this one). The text here should continue in photo 08 (the cut-off "✓" line at the bottom is the first of a list that continues below the screen).

## Transcription

### (single page part — starts at "דוגמה 4", bottom cut off)

**דוגמה 4** (מודגש, עם קו תחתון)

נרצה לפרש את האלגוריתם הבא:

(to the left of these two lines, in a grey box — the algorithm:)

```
WHILE (A)
    ADD (B)
    ADD (B)
    SUB (A)
ENDW
```

(א) באלגוריתם ישנה לולאה, ולכן מבנה הפירוש יכלול תווית לגוף הלולאה ותווית לתוצאת הלולאה:

(to the left of paragraph (א) — table 1; column order as it appears from LEFT to right: code | body-label column | result-label column. From right to left: result-label column | body-label column | code. No header row.)

| קוד (עמודה שמאלית) | עמודה אמצעית (תווית לגוף הלולאה) | עמודה ימנית (תווית לתוצאת הלולאה; תא אחד ממוזג לכל גובה הטבלה) |
|---|---|---|
| `WHILE (A)` | — (תא אפור, ריק) | — (ריק) |
| `ADD (B)`<br>`ADD (B)`<br>`SUB (A)` | — (תא לבן, ריק) | (אותו תא ממוזג) |
| `ENDW` | — (תא אפור, ריק) | (אותו תא ממוזג) |

(ב) בגוף הלולאה מופיעות 3 שורות. אמנם ניתן לפרש כל אחת מהן בנפרד ולשרשר ביניהן, אבל במקרה זה הן פשוטות מאוד ואין כל צורך בפירוק הזה, ולכן ניתן להציג אותן מייד כתווית אחת:

(to the left of paragraph (ב) — table 2, same structure:)

| קוד (עמודה שמאלית) | עמודה אמצעית (תווית לגוף הלולאה) | עמודה ימנית (תווית לתוצאת הלולאה; תא ממוזג) |
|---|---|---|
| `WHILE (A)` | — (תא אפור, ריק) | — (ריק) |
| `ADD (B)`<br>`ADD (B)`<br>`SUB (A)` | `A = A-1`<br>`B = B+2` | (אותו תא ממוזג) |
| `ENDW` | — (תא אפור, ריק) | (אותו תא ממוזג) |

(ג) כעת נתאר את תוצאת הלולאה.
הלולאה תקיים A סיבובים עד לעצירתה תוך איפוס A.
בכל אחד מ-A הסיבובים הללו B גדל ב-2.
וכך יתקבלו הערכים:

(to the left of paragraph (ג) — table 3, same structure:)

| קוד (עמודה שמאלית) | עמודה אמצעית (תווית לגוף הלולאה) | עמודה ימנית (תווית לתוצאת הלולאה; תא ממוזג) |
|---|---|---|
| `WHILE (A)` | — (תא אפור, ריק) | `A = 0`<br>`B = B + 2A` |
| `ADD (B)`<br>`ADD (B)`<br>`SUB (A)` | `A = A-1`<br>`B = B+2` | (אותו תא ממוזג) |
| `ENDW` | — (תא אפור, ריק) | (אותו תא ממוזג) |

**כדאי להיזכר כאן שוב:** (מודגש)

(red ✖ in the right margin next to the following two lines)

הנטייה הטבעית שלנו למול צמד הביטויים:   `A=0`   `B=B+2A`   היא להציב אותם זה בזה, וכך
לקבל `B=B+2·0`   ולכן   `B=B`   (ונכריז: נכון לכל B!)

ההצבה הזו איננה קשורה לענייננו כלל. את הביטויים `A=0`   `B=B+2A`   שבתווית הראשית נוכל לקרוא כך:

"*A החדש שווה ל-0*" (ייתכן ש-A המקורי היה 732, למשל – אבל החדש הוא 0).
(the quoted sentence is in italics; the word "החדש" is underlined)

"*B החדש שווה ל-B המקורי ועוד פעמיים A המקורי*" (לא הוספנו ל-B פעמיים 0, אלא הוספנו לו פעמיים 732).
(the quoted sentence is in italics; the last word "המקורי" — the one after "פעמיים A" — is underlined)

**אלו מבין הקוראים שהתובנה הזו עדיין לא מיושבת אצלם, מתבקשים:** (מודגש)

✓ לשחק באלגוריתם הזה עם מספרי קלט[?] בולטים[?] כמו 666, 42 וכדומה, ולחוש את השפעת[?] המספרים [לא קריא] …
(this last line is cut horizontally by the bottom of the screen — only the upper half of the letters is visible; the list continues below the visible area)

## Visuals

- **Code box (top left):** a light-grey rectangle without border containing the 5-line algorithm in a serif font; `WHILE (A)` and `ENDW` are flush left, the three middle lines are indented. (The orange tint on the text is a reflection/glare in the photo, not a colour of the document.)
- **Three "interpretation tables" (left side, one beside each of paragraphs א, ב, ג):** each is a rectangle with a thick dark border divided into 3 columns.
  - Left column (≈ 1/3 of the width): three stacked cells — a short top cell with `WHILE (A)`, a tall middle cell with the three body lines `ADD (B)`, `ADD (B)`, `SUB (A)` (indented), a short bottom cell with `ENDW`.
  - Middle column (≈ 1/3): three stacked cells aligned with the left ones — top cell filled grey (next to WHILE), tall white middle cell (next to the loop body; this is where the body label goes), bottom cell filled grey (next to ENDW).
  - Right column (≈ 1/3): one single white cell spanning the full height of the table (this is where the loop-result label goes).
  - Table 1: both label cells empty. Table 2: middle white cell contains `A = A-1` / `B = B+2` (two lines, left-aligned, vertically centred); right cell empty. Table 3: middle cell as in table 2; right cell contains `A = 0` / `B = B + 2A` (two lines, left-aligned, vertically centred).
- **Red X mark:** a bold red "✖" in the right margin, to the right of the two-line passage "הנטייה הטבעית … (ונכריז: נכון לכל B!)", marking that the described substitution is wrong.
- **Check mark:** a small "✓" bullet at the right of the last (cut-off) line.

## Structured inventory

- **Headings / topics:** "דוגמה 4" — interpreting (פירוש) an algorithm that contains a loop, using a label for the loop body and a label for the loop result.
- **Definitions / concepts:** מבנה הפירוש of a loop = "תווית לגוף הלולאה" + "תווית לתוצאת הלולאה"; "התווית הראשית" (the result label); reading a label as "new value in terms of original values" ("A החדש", "A המקורי", "B המקורי").
- **Commands / instructions introduced:** none new (uses `WHILE (X) … ENDW`, `ADD (X)`, `SUB (X)`).
- **Algorithms / code blocks:**
  - `photo-09-code-1` — the algorithm of Example 4: `WHILE (A)` / `ADD (B)` / `ADD (B)` / `SUB (A)` / `ENDW`.
- **Trace tables:** none (the three tables are label/"interpretation" tables, not trace tables): table 1 empty labels; table 2 body label `A = A-1`, `B = B+2`; table 3 body label + result label `A = 0`, `B = B + 2A`.
- **Formulas:** `A = A-1`; `B = B+2`; `A = 0`; `B = B + 2A`; the wrong substitution `B=B+2·0` hence `B=B`.
- **Worked examples (with the lecturer's solution steps):** Example 4 — (א) the algorithm has a loop, so the interpretation structure has a label for the loop body and a label for the loop result; (ב) the body has 3 simple lines, so instead of interpreting each separately and chaining them, give them one label at once: `A = A-1`, `B = B+2`; (ג) describe the loop result: the loop performs A iterations until it stops, zeroing A; in each of the A iterations B grows by 2; so the values are `A = 0`, `B = B + 2A`.
- **Questions / exercises (verbatim, with numbers):** none numbered; a request to readers: "אלו מבין הקוראים שהתובנה הזו עדיין לא מיושבת אצלם, מתבקשים:" followed by a ✓ list whose first item is cut off ("לשחק באלגוריתם הזה עם מספרי … כמו 666, 42 וכדומה, ולחוש את … המספרים …").
- **References to earlier material:** "כדאי להיזכר כאן שוב" — a reminder of a point made earlier in the document (the same point about not substituting the label expressions into each other).
- **Lecturer's solution method / emphasis:** Do not substitute the two expressions of a label into each other (`A=0` into `B=B+2A` → `B=B`) — marked with a red ✖ as wrong. The right-hand sides of a label refer to the *original* values: "A החדש שווה ל-0", "B החדש שווה ל-B המקורי ועוד פעמיים A המקורי" (e.g. original A = 732: we did not add twice 0 to B, we added twice 732).

## Legibility

- **Overall confidence:** high (for everything except the cut-off last line)
- **Uncertain items:**
  - Last visible line (bottom of screen, after "✓"): only the upper half of the letters is visible because the taskbar cuts the line. Confident: "✓ לשחק באלגוריתם הזה עם מספרי … כמו 666, 42 וכדומה, ולחוש את … המספרים …". Uncertain words: the two words after "מספרי" (best reading "קלט בולטים"; the second could also be "כולנים"/"גדולים"), the word after "ולחוש את" (best reading "השפעת"), and the final word(s) of the line (could be "בכלל" / "בפלט" / other). Should be verified against photo 08, which presumably shows this line in full.
  - Document title and page number are not visible in this photo.
