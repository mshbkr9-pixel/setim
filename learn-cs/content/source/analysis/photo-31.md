# photo-31

- **PDF page:** 53
- **Document / deck title (as seen):** Google Slides deck (URL `docs.google.com/presentation/d/1REh3suL53O7hRhDUbc5BCxLcW_CbjH_Bs9ZERloaaRQ/edit?slide=id.g291a2b49466_0_1#slide=id.g291a2b494…`, slide id `…_0_1` confirmed at zoom); active browser tab title is cut off: "א.3 (3) פ…" (neighbouring tabs confirmed at zoom: "א.3 (2) טבלא…", "א.6 רקע למו…"). Slide header bar: "א. רקע" + "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים".
- **Kind:** slide
- **Page / slide number visible:** 6 (bottom-left of the slide)
- **Parts in this photo:** one slide (complete)
- **Continuity:** single shot of slide 6 ("דוגמה 2"). Photos are in reverse order, so the next slide in the deck is photo-30 (slide 7, "דוגמה 3 + 4", `@ TWO (A)` / `@ FIVE (C)`); photo-32 (higher number) should be an earlier slide — not examined in this run. No content overlap with photo-30. The URL slide ids run in the same order as the printed slide numbers: `…_0_1` here (slide 6), `…_0_7` in photo-30 (slide 7), `…_0_13` in photo-29, `…_0_19` in photo-28, `…_0_25` in photo-26/27.

## Transcription

### Header bar (green strip across the top of the slide)
- Right end of the strip (darker green block, large white text): **א. רקע**
- Rest of the strip (olive green, white text): **א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים**

### Label at top-right of the slide body
**דוגמה 2** (bold, underlined)

### Two code boxes in the upper left part of the slide body (grey background), with a double arrow between them

Left box:
```
@ ONE (B)
   WHILE (B)
      SUB (B)
   ENDW
   ADD (B)
```

Between the boxes: a double-headed arrow **↔** (no text).

Right box:
```
@ ONE (B)
   ZERO (B)
   ADD (B)
```

Notes on the code as it appears (checked at ~4× and 7× zoom):
- **Both** boxes have the same heading, `@ ONE (B)`, underlined. The right box's heading is `@ ONE (B)` too; `ZERO (B)` is its first body line (a call), not its heading.
- Each heading has a space after `@` and a space between the name and the parenthesis; every body line has a space before the parenthesis: `WHILE (B)`, `SUB (B)`, `ADD (B)`, `ZERO (B)`.
- Left box indentation: `WHILE (B)`, `ENDW` and `ADD (B)` share one indent level under the heading; `SUB (B)` is one level deeper (inside the loop). 5 lines in total (heading + 4 body lines); exactly one `ADD (B)`, after `ENDW`.
- Right box indentation: `ZERO (B)` and `ADD (B)` share one indent level under the heading. 3 lines in total (heading + 2 body lines).
- Only counter `B` appears on this slide.

### Footer
Slide number at bottom-left: 6

The rest of the slide body (below and to the right of the boxes) is empty; no other text.

## Visuals

1. **Header strip:** full-width green bar at the top of the slide; the rightmost part is a darker green block with "א. רקע" in large white letters; the rest is olive green with the sub-title in smaller white letters (the left end looks almost black in the photo because of a shadow/reflection).
2. **Left code box:** rectangle with light-grey fill and no visible border, near the left edge of the slide body just below the header bar (its left edge about 4 % of the slide width from the slide's left edge); about 1/7 of the slide width wide and about 1/6 of the slide height tall. Five lines of code in a black bold serif font with small-caps-like letters; heading underlined.
3. **Right code box:** same style and same width, top-aligned with the left box, placed one box-width further right (the gap between the boxes is about as wide as a box; the box spans roughly 31 %–45 % of the slide width from the left). It is shorter — about 2/3 of the left box's height — with three lines of code; heading underlined.
4. **Double arrow:** a thin horizontal double-headed arrow (↔) with open V-shaped heads at both ends, olive/yellow-green (the same hue as the header strip; the code text is black), centred horizontally in the gap between the boxes; its length is about 1/3 of the gap. Vertically it sits low: about level with the last line (`ADD (B)`) of the left box, slightly below the bottom edge of the right box. It connects (points at) both boxes; no label.
5. **Label "דוגמה 2"** at the top-right of the slide body, level with the box headings, bold and underlined.
6. Slide number "6" at the bottom-left corner of the slide.
7. Nothing else: no pictures, no other colour marks. A tiny dark speck in the empty area between the right box and the label, and grey smudges, are dirt/reflections on the laptop screen, not slide content.

## Structured inventory
- **Headings / topics:** "א. רקע"; "א.3 היכרות עם שפת אלגולם / פרוצדורות ומשתנים"; "דוגמה 2".
- **Definitions / concepts:** none stated in text (the slide shows two versions of the procedure `ONE` joined by a double arrow).
- **Commands / instructions introduced:** procedure definition header `@ ONE (B)` (twice); the left version uses `WHILE`/`ENDW`, `SUB`, `ADD`; the right version calls the procedure `ZERO` (`ZERO (B)`) and uses `ADD`.
- **Algorithms / code blocks:**
  - `photo-31-code-1` — procedure `@ ONE (B)`, left box: loop `WHILE (B)`: `SUB (B)`; `ENDW`; then `ADD (B)`.
  - `photo-31-code-2` — procedure `@ ONE (B)`, right box: `ZERO (B)`; then `ADD (B)`.
- **Trace tables:** none
- **Formulas:** none
- **Worked examples (with the lecturer's solution steps):** "דוגמה 2" — two codings of `@ ONE (B)` with "↔" between them; no explanatory text on the slide.
- **Questions / exercises (verbatim, with numbers):** none
- **References to earlier material:** none written on the slide. The right box calls the procedure `ZERO`; a definition `@ ZERO (A)` (body `WHILE (A)` / `SUB (A)` / `ENDW`) is transcribed in photo-25 (slide 16), according to that reference.
- **Lecturer's solution method / emphasis:** shown only graphically — the double arrow ↔ placed between the two versions of `@ ONE (B)`; no words explain it.

## Legibility
- **Overall confidence:** high
- **Uncertain items:**
  - none in the code: every line of both boxes was read at ~4× and again at 7× zoom (names, the counter B, spacing, line count).
  - Note: the right box is headed `@ ONE (B)`, not `@ ZERO (B)`; `ZERO (B)` is the first line of its body (clear at 7× zoom).
  - Arrow colour: judged from pixel sampling of the photo (arrow pixels have a yellow-green tint like the header strip, unlike the neutral black/grey code text); the exact colour on the original slide may differ.
  - Browser tab title is truncated ("א.3 (3) פ…").
