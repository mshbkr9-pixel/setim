# photo-68

- **PDF page:** 90
- **Document / deck title (as seen):** Google Slides deck, shown in the editor (buttons "Slideshow" / "Share" visible). Browser tab strip, left to right as far as legible from the full photo: "א.6 רקע למושג פונקציה" (Drive icon), "א.2 (2) פרוצדורות לוגו - מצגת" (Slides icon, the same tab title as in photo-69), "א.2 (3) דיון במשתנים ומחסניות", "שיעורים ומשאבים 2027 - Sheets", "… - Classroom" (tab titles read at low resolution, not zoomed in this photo; they are the same tabs I zoomed in photo-72). URL: `docs.google.com/presentation/d/1JC4f1y-XvBSLN2FFNgOl_tTv13y1_qibBeVnS02gH1I/edit?slide=id.g291ad1391b2_0_11#slide=id.g291ad1391b2_0_11` (read from the full photo only). Slide header band: right side "א. רקע", left side "א.2 היכרות עם שפת לוגו / פרוצדורות ומשתנים".
- **Kind:** slide
- **Page / slide number visible:** 15 (bottom-left corner of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** Same deck and same header band as photo-69, but photo-69 is slide 10 and this photo is slide 15, so slides 11–14 lie between them and are not in photo-69/photo-68. Nothing on this slide overlaps with photo-69 (photo-69 shows the SQUARE → SQUARE :SIZE → POLYGONS chain; this slide is a new example, "דוגמה 2", with TOOTH / TEETH). The procedures TOOTH and TEETH shown here are the ones whose parameter names are varied in the "case 1–4" slides (photos 73–76, deck "א.2 דיון במשתנים ומחסניות"). The reference file photo-69.md says photo-69 is "followed in the deck by photo-68"; that is true in photo order, but by slide number the two slides are not adjacent (10 vs 15).

## Transcription

**Header band (green band, white text):**

- Right side (larger): א. רקע
- Left side (smaller): א.2 היכרות עם שפת לוגו / פרוצדורות ומשתנים

**Slide body (right-aligned Hebrew text at the top):**

**דוגמה 2** (bold, underlined)

פרוצדורה בשם TEETH, שבעזרתה נוכל לקבל צורות כאלו, ודומות להן :

(`TEETH` is set in small capitals inside the Hebrew sentence; the sentence ends with a space and a colon.)

**Two drawings, one above the other, each with a label on its left:**

- (א) — upper drawing (small square wave, 5 teeth)
- (ב) — lower drawing (large square wave, 3 teeth)

(The drawings themselves are described in "Visuals".)

**Left framed box (TOOTH), code on its left half, a drawing on its right half:**

```
TO TOOTH :SIZE
      FD :SIZE
      LT 90
      FD :SIZE
      LT 90
      FD :SIZE
      RT 90
      FD :SIZE
      RT 90
END
```

(`TOOTH` in the first line is underlined. Label in the drawing half: `:SIZE`, written above the top segment of the drawn tooth.)

**Right framed box (TEETH), code on its left part, a drawing on its right part:**

```
TO TEETH :TIMES :SIZE
   REPEAT :TIMES [
      TOOTH :SIZE
   ]
END
```

(`TEETH` in the first line is underlined.)

**Table (under the TEETH box).** Header = the first row (bold). Columns as they appear from right to left: "שם המשתנה" | "תפקידו" | "צורה א" | "צורה ב". Reproduced here in the same right-to-left order (first markdown column = rightmost column on the slide):

| שם המשתנה | תפקידו | צורה א | צורה ב |
|---|---|---|---|
| :times | מספר השיניים בציור | 5 | 3 |
| :size | גודל כל שן | 10 | 20 |

(In the table the variable names are written in lower case, `:times` and `:size`, with the colon before the word, while the code boxes use upper case `:TIMES` / `:SIZE`.)

**Bottom-left of the slide:** `15` (slide number)

## Visuals

Layout (positions within the slide): green header band across the top. Under it, at the right: "דוגמה 2" and the one-line sentence. Under the sentence, at about the horizontal centre of the slide body (slightly left of centre): the two square-wave drawings (א) above (ב), their labels "(א)" and "(ב)" to the left of each drawing. Lower half of the slide: two framed boxes side by side with aligned tops — the **TOOTH box on the left** (narrower, taller: about 1/3 of the slide width, holding 11 code lines) and the **TEETH box on the right** (wider, about 45% of the slide width, but only about half the height of the TOOTH box). Under the TEETH box: the 4-column table (thin grey grid lines). Slide number "15" at the bottom-left.

Both boxes have a thick black outline. Inside each, the left part (the code) has a grey background; the right part (the drawing) is white/light. Code font: bold black serif (Times-like), upper case.

**Drawing (א) — upper square wave, 5 teeth, small.** Black line drawing read left → right: a short horizontal segment along the bottom level; then 5 times "up, across the top, down", with a bottom segment between consecutive teeth. Sequence: bottom → up → top → down → bottom → up → top → down → bottom → up → top → down → bottom → up → top → down → bottom → up → top → down. It **starts at the left with a bottom horizontal segment** and **ends at the right with a vertical down-stroke** reaching the bottom level (no trailing horizontal segment). Segments: 5 top segments, 5 bottom segments (1 leading + 4 between teeth), 10 vertical strokes. All segments (horizontal and vertical) have about the same length, i.e. each tooth is a square bump. Total width = 10 segment lengths. No turtle markers.

**Drawing (ב) — lower square wave, 3 teeth, large.** Same pattern with 3 teeth: bottom → up → top → down → bottom → up → top → down → bottom → up → top → down. Starts at the left with a bottom horizontal segment, ends at the right with a vertical down-stroke to the bottom level. 3 top segments, 3 bottom segments, 6 vertical strokes, all about equal in length; the segment length is about twice that of drawing (א) (tooth height ≈ 2 × the tooth height of (א)). Total width = 6 segment lengths, so drawing (ב) is about 1.2 × as wide as (א). The **right ends of (א) and (ב) are vertically aligned**; (ב) extends further to the left. No turtle markers.

**Drawing in the TOOTH box (one tooth).** From left to right: a small **filled black triangle** (apex up, base on the bottom level) at the left end; a horizontal bottom segment going right; a vertical segment going up; a horizontal top segment going right, with the label `:SIZE` centred above it; a vertical segment going down on the right; at the bottom of this right vertical a small **hollow (outlined) triangle**, apex up, base on the bottom level (the vertical line meets its apex). The four segments are about equal in length (a square bump preceded by a bottom segment of the same length).

**Drawing in the TEETH box (three teeth).** A small triangle at the left end (filled, apex up); then bottom segment → up → top → down, repeated 3 times (bottom, up, top, down, bottom, up, top, down, bottom, up, top, down); the last down-stroke ends at a small triangle at the right end (apex up; it looks dark/filled at the available resolution — see Legibility). All segments about equal in length.

Transcriber's check of the reading (not on the slide): executing `TOOTH` from the hollow triangle (bottom right) with the turtle heading up — FD up, LT 90, FD left along the top, LT 90, FD down, RT 90, FD left along the bottom, RT 90 — reproduces the drawn tooth and ends at the filled triangle facing up; this agrees with the LT/LT/RT/RT order read in the code. The slide itself does not label which triangle is the start and which is the end.

Colours: header band green with white text; all text, code, frames and drawings black; code areas light grey.

## Structured inventory

- **Headings / topics:** "א. רקע"; "א.2 היכרות עם שפת לוגו / פרוצדורות ומשתנים"; "דוגמה 2" — a procedure TEETH with two variables that draws square-wave "teeth" shapes, built on a one-variable procedure TOOTH.
- **Definitions / concepts:** variables of a procedure and their role ("שם המשתנה", "תפקידו"): `:times` = "מספר השיניים בציור", `:size` = "גודל כל שן"; one procedure calling another with its parameter (`TOOTH :SIZE` inside `TEETH`).
- **Commands / instructions introduced:** `TO TOOTH :SIZE … END`, `TO TEETH :TIMES :SIZE … END`, `REPEAT :TIMES [ … ]` (a variable as the repeat count), `FD :SIZE`, `LT 90`, `RT 90`, procedure call with an argument `TOOTH :SIZE`.
- **Algorithms / code blocks:**
  - `photo-68-code-1` — `TO TOOTH :SIZE` / `FD :SIZE` / `LT 90` / `FD :SIZE` / `LT 90` / `FD :SIZE` / `RT 90` / `FD :SIZE` / `RT 90` / `END` — draws one tooth of side `:SIZE`.
  - `photo-68-code-2` — `TO TEETH :TIMES :SIZE` / `REPEAT :TIMES [` / `TOOTH :SIZE` / `]` / `END` — draws `:TIMES` teeth of size `:SIZE` by calling TOOTH.
- **Trace tables:** none (the variables table is not a trace table: it lists each variable, its role, and its value for shape א and shape ב).
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** "דוגמה 2": target shapes (א) and (ב) → procedure TOOTH (one tooth, drawn beside its code) → procedure TEETH (repeats TOOTH, drawn beside its code) → table of the variables with the values that give each shape: shape א = `:times` 5, `:size` 10; shape ב = `:times` 3, `:size` 20 (the drawings show 5 small teeth and 3 large teeth accordingly).
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** "דוגמה 2" implies an earlier "דוגמה 1" (not in this photo).
- **Lecturer's solution method / emphasis:** procedure names underlined in the `TO` lines; each code box is paired with a drawing of what it produces; the variables are summarised in a table with their role and their values for each target shape.

## Legibility

- **Overall confidence:** high
- **Uncertain items:**
  - Turtle marker at the right end of the TEETH-box drawing: looks filled/dark at the available resolution; it may be a hollow triangle with a thick outline like the right-hand marker in the TOOTH-box drawing (which is clearly hollow). The left marker in both drawings is clearly filled.
  - Browser tab titles and the URL (slide id `…_0_11`) were read from the full photo only, not zoomed; the tab title "א.2 (2) פרוצדורות לוגו - מצגת" agrees with the reference photo-69.md.
  - Exact indentation widths in both code boxes are approximated (nesting is clear).
  - Note for the caller: the table's column headers are "שם המשתנה" / "תפקידו" / "צורה א" / "צורה ב" (not "שם המילה" / "הסבר" / "משתנה 1" / "משתנה 2" as anticipated in the task note); read with confidence.
