# photo-18

- **PDF page:** 40
- **Document / deck title (as seen):** Slide header reads "א. רקע" (right side of the green header bar) and "א.4 שגיאות / חוסר משמעות באלגולם" (left-centre of the header bar). Browser: Google Slides in edit mode (a "Slideshow" button is visible above the slide); active tab title is truncated to "א.4 (2)…" with a Slides icon; URL bar shows `docs.google.com/presentation/d/13z__tQVgj3IaheEjnTjRDEwvg7OBbSBB9Mq0b53XCz8/edit?slide=id.g291beebf344_0_33#slide=id.g291beebf34…` (URL characters copied as read; not critical).
- **Kind:** slide
- **Page / slide number visible:** 18 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (whole slide visible)
- **Continuity:** Same deck as photo-19 (slide 16, "דוגמה 4") — same header, same layout; photo-19 is the earlier slide. Slide 17 is not in my group. This slide ("דוגמה 5") has the same structure as photo-19 but a different procedure and the two conditions the other way round. Photo-17 (previous photo number) is a different document ("ב.0 … – משימה").

## Transcription

**Header bar (green, white text):**
- right: א. רקע
- left-centre: א.4 שגיאות / חוסר משמעות באלגולם

**דוגמה 5** (top-right under the header; מודגש ומסומן בקו תחתון)

Code box (grey, top-left under the header):

```
@HE(A,B)
1.    WHILE (A)
2.        WHILE (A)
3.            SUB (B)
4.        ENDW
5.    ENDW
```

(In the header line the procedure name `HE` is underlined. Line numbers `1.`–`5.` are shown at the left edge of the box. Indentation as seen: line 1 and line 5 at the same level; line 2 and line 4 one level deeper; line 3 one level deeper still.)

Text (right side, two lines, right-aligned, bold):

A ≠ 0 – יבוצע חיסור ממונה ריק, לפרוצדורה אין משמעות.
A = 0 – לפרוצדורה יש משמעות.

(Each line begins at the right with the formula — `A ≠ 0` on the first line, `A = 0` on the second — followed by a dash and then the Hebrew text.)

Bottom-left: 18 (slide number)

## Visuals

- **Slide layout:** a white slide (roughly 4:3) with a solid olive/grass-green horizontal bar across the full width at the top (about 11% of the slide height). In the bar, white sans-serif text: "א. רקע" in a larger size flush right, and "א.4 שגיאות / חוסר משמעות באלגולם" in a smaller size positioned left of centre (centred at roughly 30% of the slide width from the left).
- **Code box:** a light-grey filled rectangle (no visible border) at the far left directly under the header bar, about 18% of the slide width and 18% of the slide height. Inside, black bold serif (Times-like) Latin text: the header line `@HE(A,B)` with "HE" underlined, then five numbered lines; the numbers "1." … "5." are aligned in a column at the left edge of the box, the code is indented in steps to show nesting (outer WHILE/ENDW, inner WHILE/ENDW, SUB innermost).
- **Text block:** at the right, the label "דוגמה 5" (bold, underlined) on its own line, then a gap, then two bold right-aligned lines in a dark (black/navy) serif font.
- **Slide number** "18" in small bold sans-serif at the bottom-left.
- The rest of the slide (about the lower three quarters) is empty. No pictures, arrows or coloured text. (Darker blotches in the photo are reflections/smudges on the screen, not slide content.)

## Structured inventory
- **Headings / topics:** "א. רקע"; "א.4 שגיאות / חוסר משמעות באלגולם"; "דוגמה 5".
- **Definitions / concepts:** (as stated on the slide, no formal definition) a procedure "has meaning" / "has no meaning" ("לפרוצדורה יש משמעות" / "לפרוצדורה אין משמעות") depending on the input; "חיסור ממונה ריק" (subtraction from an empty counter) is the stated reason for no meaning.
- **Commands / instructions introduced:** none new; uses `WHILE (A)` … `ENDW` (nested) and `SUB (B)`.
- **Algorithms / code blocks:** `photo-18-code-1` — Algolem procedure `@HE(A,B)`: an outer `WHILE (A)` loop (lines 1–5) containing an inner `WHILE (A)` loop (lines 2–4) whose body is `SUB (B)` (line 3).
- **Trace tables:** none
- **Formulas:** `A ≠ 0`, `A = 0`
- **Worked examples (with the lecturer's solution steps):** דוגמה 5 — procedure `@HE(A,B)`; the slide's analysis, verbatim: "A ≠ 0 – יבוצע חיסור ממונה ריק, לפרוצדורה אין משמעות." / "A = 0 – לפרוצדורה יש משמעות." (no further steps shown)
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none explicit (numbered "דוגמה 5", following "דוגמה 4" on slide 16 = photo-19)
- **Lecturer's solution method / emphasis:** case split on the input value of counter A (A ≠ 0 versus A = 0), stating for each case whether the procedure has meaning; the reason given for "no meaning" is that a subtraction from an empty counter will be performed.

## Legibility
- **Overall confidence:** high
- **Uncertain items:**
  - Procedure name in the code header: read as `HE` (letters H, E; underlined). The second letter is small; `E` was preferred over `B` after zooming (three horizontal strokes, no bowls, same shape as the E in WHILE/ENDW). Photo-19's procedure is named `DALET` (example 4), which fits `HE` as the name for example 5, but that pattern is only supporting evidence.
  - Separator between `A` and `B` in `@HE(A,B)`: read as a comma (it is a tiny mark at the baseline; a period cannot be excluded visually).
  - Exact number of spaces / indent width in the code cannot be measured from the photo; relative nesting levels are as transcribed.
  - Browser tab title is truncated ("א.4 (2)…"); the long URL string may contain misread characters.
