# What this run produced, split into Room 1 and everything else

Room 1 was the excuse. The question is which of it lifts the other forty-one
rooms, and which of it is one night exterior's art.

Everything below is either in the branch or is a proposal, and it is marked.

---

## 1. ROOM 1 ONLY

Art, and geometry that describes art. None of it transfers.

- `tools/pixelart/room01/` — the nine region modules plus `terrain`,
  `lightpass` and `foreground`. Drawing.
- `layout.py`'s anchors, rects, crest profiles, rut fan, pool centre. Every
  number is a measurement of this frame.
- `reference/room-01/` — the two reference images and the ten measured specs.
- The puddle band moving from `sky` 7–9 to `accent_indigo` 2–4, and the room's
  base sky fill moving off index 240. Both are declarations about this room.

One caveat on `layout.py`: the FILE is Room 1 only, the SHAPE of it is not.
See §2.6.

---

## 2. GENERALISES — tooling the other rooms can use as-is

### 2.1 The blind A/B harness — `room01_ab.py`

Takes a reference and a compositor, cuts both into matching crops at matching
magnification, and alternates which filename holds which so no critic can learn
the pattern. Nothing in it is about Room 1 except the region table.

**To promote:** move the region table into the room's own module and take the
room id as an argument. Two hours.

### 2.2 The seam checks — `room01_seams.py`

The two defects a per-region critic structurally cannot see:

- **Unwritten pixels.** Compose twice over two different initial fills and
  diff. Needs no bookkeeping in the drawing code and cannot drift. Found a hole
  on its first run that a targeted fix had reported clean.
- **The lattice test.** How well position in a small grid predicts a pixel's
  colour, thresholded against *the reference's own worst tile* rather than a
  number somebody picked.

Both are room-agnostic. The second needs a reference image, which only rooms
built this way have — but the self-calibrating idea ("no more ordered than the
thing we are matching") works against any target, including another room.

**To promote:** parameterise on the room module and its reference. Half a day.

### 2.3 The transcription and glyph guards — `check-room-01-drawn.mjs`

Two rules, both of which a visual critic cannot enforce because the violation
is the thing it would score highest:

- No pixel arrays, base64, compressed blobs, or reading `reference/` at compose
  time. The room is drawn, not copied.
- **No glyphs.** Signage is blank geometry; the engine renders sign text in the
  game font at runtime. `buildings.py::signboard` has said so since long before
  this run and Room 1 broke it for four rounds under critic pressure.

**The glyph rule is already project-wide and the check is not.** It scans
`tools/pixelart/room01/` only.

**To promote:** widen the walk to all of `tools/pixelart/`. One hour, and it
would have caught this run's regression on any room.

### 2.4 The iteration gallery — `room01_progress.py`

Native-resolution frames embedded per round, hold-to-compare against the
target. Room-agnostic apart from its paths.

### 2.5 Tolerant compose mode

`ROOM01_TOLERANT=1` wraps each region's draw in try/except so one author's
half-finished module cannot block eight other people's renders, and is off
everywhere that matters. Any room with more than one author needs this.

### 2.6 The shape of `layout.py`

Not the numbers — the *idea* that every cross-region fact lives in exactly one
file, with each number citing the measurement it came from, and that the file
audits itself at import. The material table's warm/cold classification caught a
real bug within a minute of first running, and would have caught it silently
three passes later otherwise.

**This is the single most transferable structural thing in the run.** A room
drawn by more than one person needs a contract, and a contract that audits
itself is the only kind that stays true.

### 2.7 A reproducibility bug that was never Room 1's

`Ctx.stream()` seeded a named generator from Python's `hash()`, and CPython
salts string hashing per interpreter run. Every render put the stars, the
windows and the stones somewhere different, so `npm run renders` could never be
idempotent and every pass was a whole-frame diff.

**Any module in this project that seeds from `hash()` has the same bug.**
Worth a grep and worth a check.

---

## 3. GENERALISES — the art model

These are rulings, not code. §3.2 and §3.3 are proposed; §3.1 has landed.

### 3.1 Errata 41 — luminance parity is not parity when the hue differs

On main. Every luminance check gains a saturation companion; area is the lever
when chroma is fixed; cycling bands are chosen for colour rather than for which
entries were free.

### 3.2 PROPOSED — a mass needs a mid-tone, or its highlights read as marks

Room 1's town measured **quieter than the reference on every instrument this
project has**: mean luminance within 1.4, saturation 0.29 against 0.53,
roughness 6.5 against 8.9, fewer warm pixels, per-row distribution within a few
pixels, run anisotropy nearer isotropic than the bar's. Three blind critics in
three separate rounds called it "windows with no buildings" anyway.

The defect is the **shape** of the histogram, which no summary statistic holds:

|            | <18   | 18–26 | 26–34 | 34–45 | 45+   |
|------------|-------|-------|-------|-------|-------|
| ours       | 11.1% | 46.1% | 6.7%  | 18.9% | 17.1% |
| reference  | 12.8% | 28.8% | 16.6% | 20.4% | 21.4% |

It was **bimodal**: near-black with bright marks on it and almost nothing
between, so the windows had nothing to be holes *in*. The reference punches its
windows into a wall you can already see.

**Proposed rule: any drawn mass — a town, a crowd, a stack, a tree line —
reports its histogram in bands, not its mean. A mass whose mid-band is less
than half the reference's is a field of marks, however well its summary
statistics agree.**

This is errata 41's general form for the third time: *the instrument was
correct and it was not measuring the thing that was wrong.*

### 3.3 PROPOSED — light belongs to its source, not to its subject

Room 1's lantern pool is centred on the lamp at (86, 107), **fifteen pixels
left of the man carrying it**. Every instinct puts the light under the subject;
doing so turns a man carrying a light into a man who is glowing, and destroys
the lit wedge between his legs that is the only thing planting him on the
ground. Applies to every lamp, stove, window and doorway in the game.

Related, same region: **a foreground plane must not optimise silhouette
contrast.** Room 1's near post was placed where it won 39 luminance of
silhouette — the best available — and read as a black bar standing in the road.
A near plane's job is to sit in front of things without being looked at.

### 3.4 PROPOSED — seams are a defect class, and reviews are blind to them

Three of this run's most expensive defects were between regions and none would
ever appear in a region's own crop: a one-row hole across the valley that no
module owned, a mid-ground authored warm where the reference is cold, and a
50% ordered screen crossing every object in front of it. Two of the three were
found by critics looking at something else; one was found by a check written
after the fact.

**Any room composed by more than one author gets an integration pass whose
whole job is the seams, plus §2.2's mechanical checks. A per-region review is
necessary and is not sufficient.**

---

## 4. WHAT DOES NOT GENERALISE AND SHOULD BE SAID PLAINLY

The palette cannot reach two things in this reference and no amount of drawing
closes them:

- **The sky.** Only two blue-dominant entries exist below luminance 40, with
  nothing between. Mean quantisation error in the sky band is 15.6 RGB against
  8.9 for the whole frame. Reaching L 9 needs a 53% void checker that kills the
  hue; it was tested and it reads as a fault.
- **The near range.** `grey` 0 at L 16.0 and blueness 0 where the bar is L 12.8
  at blueness +20. Nothing in the locked 256 sits at that value and that hue,
  and the nearest candidate merges the near range into the far one.

Both are places where a locked palette and a reference generated without one
genuinely disagree. Neither is a drawing error. Any future room built against a
generated reference will meet the same wall, and the answer is to chase the
*relationship* — Room 1's sky holds the nine-luminance gap to the ground that
the composition actually depends on — rather than the absolute.
