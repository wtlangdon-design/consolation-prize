# 51 · THE FONT DECISION SHEET

*A record and a request, not a ruling. Errata 54 voided the 5×7 face and
forbids anyone but Tyler choosing what replaces it. **Nothing in this document
chooses.** Doc 36 Q16 is the open question; this is the evidence it has been
waiting for.*

---

# WHAT IS BEING ASKED

Errata 54, in one line: *"The 5 × 7 font is unusable at 1920 × 1080 and has no
replacement specified."*

It has blocked more than it looks. `check-item-names` measures every inventory
label against a **248px sentence line** derived as `320 − 2 × panel.sentence.x`
— a 320-wide frame the game has not had since errata 54 — in a face that is
void. The panel layout is provisional twice over (Q26, Q35). And every one of
the ~890 examine lines and ~3,850 written lines is set in a face nobody
intends to ship.

---

# WHAT TO LOOK AT

Four sheets, in `renders/font-candidates/`. Every frame is the **live game**,
full frame, verb panel included — not a specimen, not a mockup, not a crop.

| File | |
|---|---|
| `play-cap.webp` | **Start here.** The sentence line, the verb grid, the inventory, at cap-matched size |
| `dialogue-cap.webp` | A prompt, four options and a spoken line over the art, at cap-matched size |
| `play-budget.webp` | The same play frame at the bitmap's line budget |
| `dialogue-budget.webp` | The same dialogue frame at the bitmap's line budget |
| `candidates.json` | The measurements, the licences and the sizes used |

Regenerate any of them with `node tools/font/compare.mjs`.

## Why there are two sizes and not one

**They are not the same question, and only one of them can be right.**

The 5×7 packs capitals, x-height and descenders into seven rows. A real
typeface spends about a third of its em below the baseline, so:

- At the **line budget** — 42px in the play area, 28 in the panel, exactly what
  the bitmap occupies now — every candidate reads visibly *smaller* than the
  control. Nothing is wrong with any of them; they are simply being given a
  box sized for a face with no descenders.
- At **cap-matched** — 60–66px play, 40–44 panel, each face sized so its
  capitals are as tall as the bitmap's — they read as the same size as the
  control, which is what the eye actually compares.

The cap sizes are what the panel then has to survive. **Q35 measured the
bitmap at 210 of the panel's 216 rows**, so this is the constraint that decides
whether a face fits at all. In the captures it does — the five rows sit
comfortably at cap-matched sizes — but that is a thing to check by looking
rather than to take from this paragraph.

---

# THE CANDIDATES

All four are **SIL Open Font Licence 1.1**, which permits embedding and
redistribution in a commercial game. All four are drawn for screen reading.
**None is a pixel face** — Tyler's brief rules out a novelty 8-bit font, and it
is right twice over: errata 54 replaced the whole 320×200 presentation, and a
bitmap face at 1920×1080 either scales into blocks or sits too small to read,
which is the exact defect that voided the 5×7.

| | Face | Cap-matched size | What it is |
|---|---|---|---|
| **1** | **IBM Plex Sans 500** | 60 / 40 | **Humanist sans, drawn for screens.** The most neutral of the four: open apertures, unambiguous I/l/1, a weight that holds up outlined over artwork. It brings no period of its own — which is either the safest choice or the dullest one |
| **2** | **Alegreya Sans 500** | 66 / 44 | **Humanist sans with a writing hand in it.** Warmer than Plex, slightly calligraphic, drawn as a literary companion face — so it reads as a book rather than an operating system. The narrowest of the four, which buys room in the panel |
| **3** | **Bitter 400** | 60 / 40 | **A screen slab.** Slab serifs are 19th-century American wood type, which is the register of a gold-rush town and of every handbill in it — and this one was drawn for screen reading rather than for posters. The most of-the-place of the four, and the most opinionated |
| **4** | **Vollkorn 400** | 62 / 41 | **A warm text serif.** The examine layer is ~890 lines of prose a player reads rather than scans, and prose is set in a serif. Softer and less mechanical than Bitter |

**The control** is the 5×7 bitmap, drawn at GLYPH_SCALE 6 and
PANEL_GLYPH_SCALE 4 — 42 and 28 units — which is what the game does today.

---

# WHAT IS ALREADY SETTLED, AND IS NOT THE DECISION

## Glyph coverage: all four pass

`tools/font/check-candidates.mjs` reads each face's `cmap` table directly and
runs in `npm run validate`. All four cover the **78 distinct characters** the
current content draws, including the seven CLAUDE.md names:

```
‘  ’  “  ”  —  –  …
```

**Asked of the font file, never of a canvas.** A browser substitutes a missing
glyph from another face silently — `fillText` always draws *something* — so a
coverage question asked through a canvas always answers yes, and the answer is
a different typeface's em dash sitting in the middle of a sentence looking
almost right. That is precisely what CLAUDE.md's typography rule exists to
prevent: *"straight-quoting a comedy script flattens it, and Thad's voice
depends on the dashes."*

## The engine can already draw a candidate

`engine/render/PreviewFont.ts` implements the same surface the bitmap face does
— `height`, `measure`, `wrap`, `draw`, `drawOutlined` — so wrapping, the panel's
line heights and the dialogue block all behave as the game's, not as a
preview's. `?font=IBM+Plex+Sans&fontPx=60&panelPx=40` in a dev build swaps it
in; **with no `?font=` the build is bit-identical to one without the file.**

When a ruling lands, this stops being a preview and becomes the text path. The
ruling is the only thing that has to change.

## The comparison caught itself being wrong twice

Worth recording, because both faults produce a *plausible picture*:

1. The first run rendered all four candidates in the **same fallback face** —
   an init script appended a `<style>` to a `document.documentElement` that did
   not exist yet, died silently, and produced four identical frames and one
   identical measured cap height of 28px across all of them.
2. The engine's CSS was `42px IBM Plex Sans`, unquoted. A family name with
   spaces is **invalid CSS**, the browser drops the whole declaration, and the
   fallback draws.

Both are the same shape as the thing the coverage check exists for: a
substitution that looks like a result. The comparison now asserts
`document.fonts.check()` for every weight and size before it captures anything,
and refuses rather than shooting.

---

# WHAT IS NOT SETTLED, AND IS TYLER'S

**Which face.** No tool here votes, ranks or scores. Doc 46 part one names art
quality as the thing that cannot be automated and doc 44's first honesty makes
it permanent; a typeface is the same kind of question.

**And two that come with it:**

- **The size.** Cap-matched or line-budget, and if cap-matched, whether 60/40
  leaves the panel enough air. The sheets show both.
- **The weight.** Each candidate is captured at one weight (500 for the two
  sans, 400 for the slab and the serif) and both weights are on disk.

**Nothing downstream moves until it is ruled.** `check-item-names`'s 248px
measure stays as it is — widening it to 1920 would make it pass on every
conceivable label, which is a vacuous assertion bought with a one-line edit.

---

# WHERE THE FILES ARE

```
art/ui/fonts/candidates/          the four faces, two weights each, SIL OFL 1.1
tools/font/check-candidates.mjs   cmap coverage, in npm run validate
tools/font/compare.mjs            drives the live game and writes the sheets
engine/render/PreviewFont.ts      the candidate draw path, dev-only, off by default
renders/font-candidates/          the sheets
```

*Nothing in this document overrides anything. It records, and it asks.*
