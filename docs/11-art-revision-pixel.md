# THE LAST CLAIM IN CONSOLATION
## Art Direction Revision — Authentic 1990 Pixel Art

*Supersedes the art direction in Bible v2, the presentation section of the Technical Spec, and the entire Background Art Prompts document. Changes nothing in the writing.*

---

# PART ONE — THE TARGET

## Resolution & palette

| Spec | Value |
|---|---|
| Native resolution | **320 × 200** |
| Play area | **320 × 144** (bottom 56px is the verb panel, as SCUMM) |
| Palette | **256 colours, VGA-style**, from a single locked palette used across all 41 rooms |
| Working palette per room | 32–48 colours drawn from the locked 256 |
| Character height | **~40 px** (Guybrush was in this range) |
| Display | Integer upscale — 320×200 → 1280×800 (4×) or 1600×1000 (5×) |
| Filtering | **Nearest-neighbour. No smoothing, no anti-aliasing, ever.** |

**Why 256-colour VGA rather than 16-colour EGA:** the version most people remember and feel nostalgic about is the VGA release. EGA is more authentic to 1990 and considerably harsher — a defensible choice, but it makes the town read as harsh rather than warm, and this game needs warmth to carry the comedy.

## Style reference

The Secret of Monkey Island (VGA), Loom, Indiana Jones and the Fate of Atlantis, Day of the Tentacle. Hand-placed pixels, limited palette, deliberate dithering for gradients, hard edges, clear silhouettes. Backgrounds are flat and readable; the eye finds hotspots instantly because there is nowhere to hide detail.

---

# PART TWO — THE GENERATION PROBLEM

**Image models cannot produce authentic pixel art.** They produce pixel-*ish* images. The failure signatures:

- Pixels that aren't on a consistent grid — some "pixels" 4px wide, some 7px
- Anti-aliased and soft edges where there must be hard ones
- Thousands of colours where there should be forty
- Dithering that imitates the look of dithering without being ordered dithering
- Resolution far above 320×200, so the pixels are decorative rather than structural

For a game whose entire appeal is authenticity, this is disqualifying. A player who wants this game will detect it in the first screen.

## What actually works

### Backgrounds — generate, then reduce

The painted backgrounds already produced are legitimate source material. Pipeline:

1. **Generate at high resolution** using the existing painterly prompts. *(The third attempt — the coloured, lively, lower-detail street — is the best candidate; the fourth over-corrected into monochrome.)*
2. **Downsample to 320×144** with area averaging.
3. **Quantise to the locked palette.** Ordered (Bayer) dithering, not error-diffusion — error diffusion produces noise that reads as JPEG artefacting rather than as period dithering.
4. **Hand-clean.** Non-negotiable. Straighten architectural lines, rebuild silhouettes that mushed, remove orphan pixels, sharpen hotspot edges. This is 30–90 minutes per room and it is the difference between real and counterfeit.

Claude Code can build steps 2–3 as a Python script with a preview harness. Step 4 needs a person and a pixel editor.

**Realistic assessment:** this gets backgrounds to genuinely good. It will not match a skilled pixel artist working from scratch, but it is close enough that only pixel artists will know, and it is achievable at 41 rooms.

### Character sprites — do not generate

Thad at 40px tall is roughly 1,200 pixels. Every one of them matters, and downsampling a painted figure to 40px produces mush. This is where the counterfeit shows worst.

**Commission this.** One character turnaround (front, side, back), a walk cycle in each, an idle with breathing, a talk cycle with two or three mouth states, and a reach/pickup pose. It is a small, precisely-specified job — the kind pixel artists take routinely — and it is the single highest-leverage expenditure in the project. Seven or eight characters need this treatment; the ambient eighteen can be simpler and partly recoloured variants.

---

# PART THREE — WHAT CHANGES

## Technical Spec amendments

- **Render target 320×200**, integer-scaled. Phaser: `pixelArt: true`, `roundPixels: true`, `antialias: false`.
- **Verb panel occupies the bottom 56px** natively, SCUMM-style, rather than floating over the art.
- **Frame-by-frame sprite animation replaces the cutout rig.** At 40px, hand-drawn frames are both feasible and correct; a jointed puppet reads wrong at this scale. This reverses my earlier recommendation, and the reversal is a consequence of the resolution change.
- **Asset weight collapses.** 41 backgrounds at 320×144 in an indexed palette is a few megabytes total. The whole game will load instantly and run at 60fps on a Chromebook without effort.
- **Audio is unaffected.** The −35 cent detune and the tuning arc are unchanged.

## Bible v2 amendments

Replace the art direction section. The palette intent survives — mud, ochre, dust, pine, with peeling optimistic colour on the false fronts only — but it is now expressed as a locked indexed palette rather than as painterly description.

## Art Prompts document

**Superseded as a final-art spec, retained as a source-generation spec.** The master style block and the 41 subject blocks are still how you produce the high-resolution inputs to the downsampling pipeline. Two amendments to the style block:

- Add: *"Simplified shapes, minimal fine texture, strong clear silhouettes, flat areas of color."* Detail that will not survive downsampling is wasted effort and actively harms the reduction.
- Drop the palette-discipline paragraph that produced the monochrome result. Colour is re-imposed at the quantisation step against the locked palette, which is a far more reliable control than asking a model to restrain itself.

## What does not change

**All 3,850 written lines.** Dialogue, the Liar's Assay, the examine layer, the ambient barks, the letters home. Every design document except the art direction stands exactly as written.

The puzzle graph, the flag system, the verb set including LISTEN TO, the reputation broadcast, the three load-bearing LISTEN lines, the coffin's missing verb panel, and the ending are all unaffected.

---

# PART FOUR — REVISED SEQUENCE

1. **Lock the 256-colour palette.** One afternoon. Everything downstream depends on it and it cannot be changed later without redoing every asset.
2. **Commission Thad.** Turnaround plus walk cycles. Nothing else can be evaluated until he exists.
3. **Build the downsampling pipeline** — Claude Code, Python, with a side-by-side preview.
4. **Produce Main Street** through the full pipeline, hand-cleaned, and drop Thad onto the boardwalk. **This single screenshot is the go/no-go for the entire art direction.**
5. Only then: the remaining 40 rooms, and Phase 1 of the build.

**Step 4 is the decision point.** One background, one character, one screenshot. If it looks like a game you want to play, everything after it is execution. If it doesn't, you have spent days rather than months, and the fix is still cheap.
