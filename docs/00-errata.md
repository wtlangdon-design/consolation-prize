# CONSOLATION PRIZE
## Errata & Reconciliation — v1

**Precedence: this document overrides all others on every point it addresses.** Where a numbered document contradicts a ruling here, this document wins and the other document is wrong.

Raised by a Claude Code review of the full document set. All catches confirmed as genuine authoring errors.

---

# HARD CONTRADICTIONS — RESOLVED

## 1 · Act II document structure — **Doc 02 wins**

Bible 01 (Part Five) is **wrong**. It states Document C requires A and B, and that "Document B can only be issued to a deceased person."

**Canonical:** Document C (Certificate of Contiguity) requires **A, B and D**.

- **A** — Affidavit of Original Sale (Vessel's signature) — Trial One
- **B** — Assay of Record (Winnie) — Trial Two
- **D** — Proof of Continuous Occupancy (Pratt's perjury) — Trial Three

The deceased-person mechanic belongs to **Act III archive access (E2)**, not to Document B. Bible 01's Act II paragraph is void; use doc 02.

## 2 · Dead-end audit arithmetic — **doc 02's proof was false**

Doc 02 states: *"B6 requires 14 pairs, and 14 are obtainable from Trials Two and Three alone."* This is wrong. Winnie yields 5 and Pratt 6 — 11, not 14.

**Corrected statement — this replaces the audit line:**

> B6 requires 14 pairs. Available before B6: **B5 grants 4 automatically** (Duel One is unwinnable by design and the four counters are acquired on the mandatory loss), **Winnie grants 5**, **Pratt grants 6** — **15 without any optional collection**. Tier 4 (5 pairs) and Hob (1) raise the ceiling to 21. B6 is therefore unblockable, and the traversal script must count B5's four as guaranteed rather than optional.

## 3 · Winnie's pair count — **five**

Doc 02 (C6) says four. **Doc 03 wins**: Winnie yields **5**, and the 24-pair distribution depends on it. Doc 02 C6 is wrong.

## 4 · Duel numbering — **three duels, two sparrings**

There is no Duel Three. Everything claiming "4 duels" is wrong. Canonical:

| Label | Who | Outcome |
|---|---|---|
| **Duel One** | Vessel (B5) | Unwinnable by design. Yields 4 pairs. |
| **Sparring** | Winnie (C6) | Not a duel. Yields 5 pairs. |
| **Sparring** | Pratt (D5) | Not a duel. Yields 6 pairs. |
| **Duel Two** | Vessel rematch (B6) | Winnable. Requires 14. |
| **Duel Three** | Fanshawe (F4) | Public, final. Was labelled "Duel Four." |

Doc 02's "the three losing duels and the final one" is wrong — **one losing duel and two sparrings**. Doc 03's "Duel Four" is renamed **Duel Three**.

## 5 · Puzzle count — **45**

43 is wrong everywhere it appears, including CLAUDE.md and doc 06.

Enumerated: A1–A10 (10) · B1–B6 (6) · C1–C6 (6) · D1–D6 (6) · E0, E0b (2) · E1–E10 (10) · F1–F5 (5) = **45**.

E1 is a puzzle beat that is deliberately blocked and resolves to E2; it counts. **The traversal script uses this list of 45.**

## 6 · Room count — **36 rooms, 42 screens, 41 backgrounds**

Bible 01's "35 screens" is wrong. It counted "Sheng's laundry & the high ridge" as one screen; doc 05 correctly splits them into Rooms 28 and 29.

**Canonical:** 36 numbered rooms + 6 ancillary interiors = **42 screens**. Room 32 (inside the coffin) is not painted — it is a black frame produced in post. Therefore **41 backgrounds to produce**, which is why that number appears in docs 06 and 11 and is correct for art, though wrong as a screen count.

**Doc 05's numbering is canonical.** The coffin is Room 32. The art-prompt document's numbering (coffin as 31) is superseded.

## 7 · Reputation state order — **doc 07 wins**

Doc 06 orders `R_BORDERS_MOTT` before `R_SURVEYED`. Wrong. Puzzle order is A7 (survey) before A9 (borders Mott).

**Canonical order:**

`R_NOBODY` → `R_SWINDLED` → `R_RACCOON` → `R_SURVEYED` → `R_BORDERS_MOTT` → `R_LOST_DUEL` → `R_WON_DUEL` → `R_DEAD` → `R_TRUTH`

## 8 · Phase 1 scope — **validation tooling is in Phase 1**

Doc 06 puts it in Phase 3. Wrong. CLAUDE.md and the build brief agree and win.

**Phase 1 acceptance:** test room with three hotspots, all nine verbs, a two-node dialogue tree with gates and state changes, save surviving refresh, zero content strings in `.ts`, **and the validation scripts existing and running**.

---

# CONTINUITY — RESOLVED

## 9 · The misspelling gag — **the payoff moves to the grave marker**

Doc 04 says the obituary (E5) is the first and only correct spelling. Doc 10's funeral marker (Room 31, at E7 — later) is misspelled. Both cannot be the last.

**Ruling — and this is better than what was written:** the obituary carries one more wrong spelling. **The grave marker is correct.** Thaddeus Grubb's name is spelled right exactly once, on his headstone, for a man who is not in the grave.

**Canonical run — nine renderings, matching `MISSPELLINGS_SEEN` 0–9:**

| Event | Rendering |
|---|---|
| A3 · the swindle | GRUBBS |
| A5 · the raccoon | GRUB |
| A7 · the survey | GRABB |
| B5 · first duel | "a Mr. Grubbe of the East" |
| B6 · Vessel rematch | T. GRUB |
| C5 · the padded log | GRUBBE |
| E3 · funeral notice | "the Piano Man" |
| E5 · the obituary | THADEUS GRUBBE |
| **E7 · the grave marker** | **THADDEUS GRUBB** |

Doc 10's Room 31 marker line changes to: *"THADDEUS GRUBB. Frame supplied the spelling and got it right, once, for a grave I am not going to be in."*

Bible 01's "Grubb of the East" is superseded by doc 04's "Grubbe of the East."

## 10 · The in-world year — **the present is 1858; Mott filed in 1846**

Three documents implied three different presents. Fixed:

| Fact | Canonical | Was |
|---|---|---|
| **The present** | **1858** | unstated |
| Mott's filing | **1846** (twelve years ago) | — |
| Boston subscription (doc 10, Room 35) | **1846** | 1847 |
| Winnie's second ledger begun | 1849, kept nine years | ✓ unchanged |
| Stock portraits purchased (doc 10, Room 35) | 1851, printed as Mott **seven** years | eleven years |
| The one-strike man's find | 1849 | ✓ unchanged |

Fanshawe's "Chapultepec, '47" is unaffected — it was always a lie.

## 11 · Line counts — **~3,850 total; ~890 examine**

Doc 05's header says ~1,040 examine lines; its own accounting says ~890. **890 is canonical.** Project total **~3,850**, per docs 10 and 11.

## 12 · Display resolution — **1280×800**

Doc 06's 1920×1080 is not an integer multiple of 320×200 (6× horizontal, 5.4× vertical) and is **void**. Doc 11 wins: **1280×800 (4×)** or 1600×1000 (5×), nearest-neighbour.

## 13 · The missing art document

Doc 11 references a Background Art Prompts document that was not in `/docs`. Now added as **`docs/12-art-prompts.md`**.

**Its status:** superseded as a final-art spec by doc 11, retained as the **source-generation spec** — the master style block and 41 subject blocks used to produce the high-resolution inputs to the downsampling pipeline. Its room numbering is superseded by doc 05 (see ruling 6). Not needed for Phase 1.

---

# DOCUMENTS REQUIRING EDIT

For whoever does the reconciliation pass. Until then, this errata governs.

| Doc | Fix |
|---|---|
| 01 Bible | Act II document structure (1); room count 36 (6); "Grubb of the East" (9) |
| 02 Puzzle graph | Dead-end audit line (2); Winnie = 5 (3); "three losing duels" (4); count 45 (5) |
| 03 Liar's Assay | Duel Four → Duel Three (4) |
| 04 Dialogue trees | Misspelling table — nine entries, marker correct (9) |
| 05 Examine layer | Header line count 890 (11) |
| 06 Technical spec | Reputation order (7); validation in Phase 1 (8); resolution void (12); count 45 (5) |
| 10 Examine batch 3 | Room 31 marker (9); Room 35 dates (10) |
| CLAUDE.md | Puzzle count 45; room/screen counts; duel count |

**Do not begin the reconciliation pass without being asked.** Phase 1 does not require it — only rulings 5, 7 and 8 touch Phase 1 work, and all three are stated here.

---

# 14 · ART PIPELINE — **procedural composition supersedes generate-and-downsample**

Doc 11 Part Two specifies: generate at high resolution → downsample to 320×144 → quantise → hand-clean. **That pipeline is superseded.**

**Canonical:** backgrounds are composed procedurally from an indexed-canvas component library (`tools/pixelart/`), drawing palette indices directly against `art/palette/consolation-256.json`.

**Rationale, since this reverses a documented decision:**

1. **Off-palette colour is unrepresentable, not merely discouraged.** The canvas stores indices; colour resolves only at export.
2. **Deterministic per seed.** Backgrounds are reproducible, diffable, and version-controlled as source rather than as binary art.
3. **Cross-room consistency is structural.** Every building in Consolation is assembled from the same components at the same palette. It cannot drift — which was the single largest risk in the original art plan and the reason doc 11 mandated an anchor-image method.
4. **Room 36 (Main Street, dawn) becomes trivially safe.** It is the same composition with a different palette ramp, so identical framing is guaranteed rather than hoped for. This was the riskiest single item in the art plan and the pipeline change removes the risk entirely.
5. **No hand-clean step.** Doc 11 estimated 30–90 minutes per room across 41 rooms.
6. **Revision is a code change.** "The boardwalk reads flat" is a parameter, not a repaint.

**Doc 11 Part Two is retained as the fallback** if a room proves too organic for procedural composition — likely candidates are Room 29 (high ridge) and Room 26 (creek). Falling back is a per-room decision, not a reversal of this ruling.

**Doc 12 (art prompts) is now dormant.** It remains valid only if the fallback is invoked.

**Character sprites are not covered by this ruling.** Doc 11's assessment stands: Thad at ~40px is expressive posing rather than geometry, and remains a commission candidate. Procedural composition earning backgrounds does not automatically earn characters — that is a separate test with a separate go/no-go.

---

# 15 · DEPTH SCALING — **discrete steps, not continuous**

Not specified in any prior document. The background art is already drawn against this assumption (door heights in Room 2 are sized for a boardwalk actor at ~26px against ~40px in the foreground mud), so it is now load-bearing and is ruled here.

**Canonical: the game uses SCUMM-style depth scaling. Actors shrink with distance.**

Without it, a 56px walkable band with a fixed-size character reads as a flat strip rather than as ground, and every door in every exterior is wrong.

**But scaling is stepped, never interpolated.** Continuously rescaling pixel art destroys it — edges smear, dithering moires, and the 1-bit discipline that the whole art direction rests on is lost at any non-integer ratio.

**Three drawn sizes per character, snapped by walkable-area depth zone:**

| Zone | Height | Where |
|---|---|---|
| Near | **40px** | Front of the walkable band |
| Mid | **32px** | Middle |
| Far | **26px** | At the boardwalk / back edge |

- Each size is **drawn**, not derived. Three sets of frames per animation.
- The walkable-area mask carries a zone index per region. Crossing a boundary snaps the sprite; there is no tween.
- Zone boundaries are placed at points of natural occlusion or visual interruption wherever possible, so the snap is hidden.
- Interiors with shallow floors may use a single zone. The zone count is per room, declared in room JSON.

**Cost implication for character art:** three sizes multiplies the sprite job by three. This strengthens rather than weakens doc 11's assessment that character sprites are a commission candidate — but note that the far size (26px) can be derived by hand-cleaning a reduction of the near size rather than drawn from scratch.

**Validation:** every walkable region must declare a zone; a region without one fails the build.

---

# 16 · CHARACTER LEGIBILITY IS MEASURED, NOT CHOSEN

Established during the Thad sprite pass, and it overrides the character descriptions in Bible v2 and doc 11 wherever they conflict.

**The problem it fixes:** the design brief specifies Thad's coat as "dull bottle green." That measures ~57 mean luminance. Room 2's mud runs 44–58. Painted as specified, the protagonist is invisible in the surface he stands on for most of the game. No amount of looking at a character sheet on a neutral background reveals this.

**Canonical rules:**

1. **Every character's palette is validated by measurement against every room they appear in** — mean, 10th and 90th percentile luminance of each walkable surface and each surface they stand in front of. This is a build check, not a judgement call.
2. **Prose colour descriptions in the design documents are subordinate to the measurement.** "Dull bottle green" describes intent, not a palette index. If the measured value fails, the value changes and the prose stays.
3. **A character must carry legibility from at least two separate features against different backgrounds.** Thad is the pattern: pale face and shirt anchor him against dark mud; the dark coat anchors him against the pale boardwalk. Neither alone works on both.
4. **Minimum margin: the character's darkest large mass sits below the background's 10th percentile, or its lightest large mass above the 90th.** Preferably both.
5. **Every character sprite is inspected at 8×, not 4×.** Four separate defects in the Thad pass were invisible at 4× — a coat with no visible legs, trousers within one luminance step of the coat, a detached single-pixel artefact, and a chest that read as a necktie rather than an open coat.
6. **Downscales are produced by dropping uniform rows, never by ratio.** Ratio reduction lands on the eyes. Both raw and hand-corrected versions are retained on the sheet so the correction is reviewable.

**Applies to:** all 8 named characters, all 18 ambient characters, and any future sprite. Ambient characters may share a base sprite with palette swaps, but each swap is measured independently.

---

# 17 · INTERIORS — TEMPERATURE, MATERIAL IDENTITY, AND PER-SURFACE LEGIBILITY

Established composing Room 3 (the Bountiful Nugget), the first interior. Applies to all 25 interior screens.

## 17a · Temperature is set by family choice, not by lighting

The lighting pass steps a colour along its own ramp. It cannot change hue. **A candle cannot make grey wood warm — it can only make it lighter grey.**

Room 3 was first composed in `pine_weathered` (saturation 0.17, effectively grey) and read as cold and morgue-like despite visible candles, a lit stove and a chandelier.

**Rule: choose the material family for the temperature the room needs, before composing. Lighting cannot rescue a cold family.**

## 17b · Each interior needs a distinct material identity

Room 3 is monotone — nearly every surface sits in a warm brown family and the eye has nowhere to rest. Defensible once. Fatal repeated across twenty-five rooms.

**Rule: every interior declares a dominant material identity, and no two adjacent-in-play rooms share one.**

| Room | Identity |
|---|---|
| 3 · The Nugget | Warm timber, brass, lamplight |
| 5 · Assay Office | Grey, bone, glass, brass — cold precision |
| 7 · Claims Registrar | Paper, pale institutional wood, dust |
| 9 · The Clarion | Black iron, lead, newsprint white |
| 11 · Fanshawe's office | Deep leather, gilt, red — the only saturated interior in the game |
| 12 · Mercantile | Warm, but broken up by fabric, tin and printed labels |
| 13 · Undertaker's | Scrubbed bone-white and pine, near-monochrome, deliberately |
| 14 · Livery | Straw, leather, warm dark |
| 16 · Ozymandia's tent | Fabric — the most saturated and least architectural room |
| 20 · Watchman's shack | Cold grey, near-empty, the least material room in the game |
| 21 · Thad's room | Neutral, plain, cheap |

Remaining interiors assigned at composition time. Declared in room JSON.

## 17c · Per-surface luminance, not zone average

**Amends ruling 16.** Zone-average legibility checking is insufficient and will pass rooms that fail.

Room 3's zone table reported "ok — both" at all three zones while Thad's face was failing against the bar top (+5 over p90), the back wall (+21) and the doorway (−42). The average mixed a bright bar top with the dark front beneath it into a comfortable middle and hid all three.

**Rule: legibility is checked per surface, not per zone.** Every distinct surface a character can stand in front of is measured separately. A room passes only if every surface has at least one anchor clearing it.

**Corollary:** the anchor may differ per room. In Room 2 the face carried Thad and the coat was at risk. In Room 3 the coat carries him everywhere (+25 to +50) and the face has stopped working. Both pass. This is ruling 16's rule 3 functioning as designed, and it is why that rule exists.

**Any interior placing a 150+ luminance surface where a head falls must be checked before composition, not after.**

---

# 18 · TWO AMENDMENTS TO THE LEGIBILITY CHECK

Both discovered composing Room 1. Both amend rulings 16 and 17c.

## 18a · A pass on one anchor while the other fails badly is a weak pass

Room 1 **passed** 17c and was unplayable. Ground p10 measured 16–23 against Thad's coat at 34 — a seven-to-fourteen point margin — so his entire dark mass melted into the road and only his face read. The room passed on the face anchor alone.

Ruling 16 rule 3 requires two anchors against different backgrounds. It does not require both to be healthy in the same room, and it should.

**Amendment: the check reports a margin per anchor, not a pass/fail per surface.**

- **Strong pass** — both anchors clear by 25 or more
- **Weak pass** — one anchor clears by 25+, the other by less than 15. **Reported as a warning, and the room is reviewed before it ships.** This is the Room 1 case.
- **Fail** — no anchor clears

A weak pass is not a failure. A character legitimately carried by one anchor in a given room is normal — Room 3 is carried almost entirely by the coat. The requirement is that a weak pass be *visible* rather than silently indistinguishable from a strong one.

## 18b · Sample rectangles must exclude the light sources they sit near

**This has now cost two wrong readings.**

- Room 5: the "counter top" sample included the counter's own dark lip; the "floor" sample sat on the counter. Two apparent failures on surfaces that were fine.
- Room 1: the verge measured 203, apparently tying the lamp as the brightest object in the frame. The sample contained the lamp.

**A contaminated sample is indistinguishable from a real result.** It fails and passes with equal confidence, and both directions are dangerous — Room 5 lost time chasing failures that were not real, Room 1 nearly lost the lamp's status as the uniquely brightest object in the only night exterior in the game *(errata 64: no longer the only one — Main Street is night too)*.

**Rules:**

1. Sample rectangles exclude light sources, their glow falloff, and any adjacent surface at a different depth.
2. Any measurement that contradicts the intent of the composition is treated as a suspected contamination first and a finding second. Re-sample before acting.
3. Sample geometry is reviewable — the rectangles are part of the check, not incidental to it, and getting them right is the work.

---

# 19 · LINES MUST MATCH WHAT IS ON SCREEN

Two rules. Both were violated in Room 1 from the moment doc 17 v2 changed the beat structure and the hotspot lines were not updated with it.

## 19a · Objects whose state changes within a scene need per-state lines

Doc 17 v1 had the coach depart on a timer at beat 5. Doc 17 v2 has it stand there, driver unloading, until his exit line — but Room 1's coach lines still say "It is leaving," which is false for the first several minutes of the game.

**Rule: any object whose state changes during a scene carries a full line set per state.** Not one line with a caveat. A hotspot that does not exist yet is not a hotspot; a hotspot whose subject has left describes an absence.

**Room 1, canonical:**

**THE COACH — state A, present, driver unloading**
> LOOK 1 "A stagecoach, halted, with my case coming down off the back. It's come four hundred miles, and it looks it. So do I." · 2 "The near wheel's been mended twice, with two different woods. I rode the whole way on that wheel." · 3 "A great deal of dust on it, and none of it from here. I'm wearing the rest."
> LISTEN 1 "The team, shifting. The near axle's dry — it's been dry a long time." · 2 "Still dry. That axle is going to be heard from." · 3 "Somebody up top is rearranging the load and swearing at it. Mostly at my case."

**THE COACH — state B, departed** *(hotspot becomes THE ROAD WEST OUT)*
> LOOK 1 "Gone. It made very good time on the way out. Better than on the way in." · 2 "The next coach out is in four days. I've asked twice. The answer didn't improve." · 3 "The ruts are still filling in. That's my whole connection to the rest of the world, filling in."
> LISTEN 1 "The near axle, squealing away east. It'll fail on somebody else's stretch now. I wish them well. Mostly." · 2 "Faint now." · 3 "Nothing. It's a long way off, and getting longer."

**THE TEAM — state A only** *(new hotspot; see the wheel-pair art)*
> LOOK 1 "Two horses I can see, and I'm told four more I can't. Heads down. They've earned it." · 2 "Nobody's unhitched them. Nobody's stopping long. Nobody but me." · 3 "The near one has looked at me twice, which is twice more than the driver has."
> LISTEN 1 "Breathing, and harness. The most contented sound on this road, and none of it is mine." · 2 "Shifting. One of them is bored." · 3 "Quiet. They've gone to sleep standing up. I didn't know that was allowed. I'm going to try it later."

**THE WATCHMAN'S LAMP — does not exist before beat 8.** Not a hotspot until Hob enters frame.
> **Crossing:** LOOK 1 "A lamp, crossing the road, with a man behind it. He hasn't looked at me. I'm the newest thing on this road, and he hasn't looked." · 2 "Still crossing. He's in no hurry, and he isn't lost. I'm one of those." · 3 "The only lit thing on this road, and it's going the other way. Story of my evening."
> LISTEN 1 "Footsteps. Even ones. He is counting them." · 2 "Still even. You could set a watch by him." · 3 "He hasn't broken stride once. Not once, the whole length of the road. I broke stride getting off the coach."
> **Gone:** LOOK 1 "The lamp, away up the street. It has not once looked back at me." · 2 "Small now." · 3 "Gone round the corner and taken the only light with it."
> LISTEN 1 "Nothing. He has taken the sound with him too." · 2 "Nothing." · 3 "Nothing at all."

## 19b · LOOK may not describe the unseen. LISTEN may.

This falls out of the LOOK/LISTEN doctrine in doc 05 and should have been stated there.

**LOOK describes what is rendered.** If a LOOK line names people, activity, or objects, they must be visible — drawn into the background, or present as sprites. A LOOK line describing eleven men in an empty room is a contradiction the player can see.

**LISTEN may describe anything, seen or not.** Sound has no such requirement — a boundary argument through a window, someone pacing upstairs, a stage arriving two streets away. This is a large part of why LISTEN carries the game's texture.

**Audit required.** Written content contains many LOOK lines naming figures — the Nugget's patrons and the man on the landing, Room 22's men going out and coming back, the Registrar's two queues, the creek's man panning. Each needs one of:

1. The figures drawn into the background *(permitted for anonymous crowds and distant figures; the no-figures rule in doc 11 concerns characters the player can interact with)*
2. Ambient sprites supplying them
3. The line rewritten, or moved to LISTEN

**Report the list before rewriting anything. The choice between the three is a design decision per hotspot, not a mechanical fix.**

---

# 20 · SPRITE MOTION DENSITY — amends 19b and doc 18

**Raised by Tyler after watching gameplay footage, and it corrects me.** I wrote doc 18 from memory and described Monkey Island's screens as largely still, with motion supplied by a few palette-cycled background elements. That is true of the *backgrounds* and badly understates the sprite layer.

In play, almost every populated screen in Monkey Island is moving. The SCUMM Bar holds roughly twelve pirates and all of them animate. The stillness is in the painted background; the life is in the sprites, and there is far more of it than doc 18 implies.

## The conflict this creates

Ruling 19b and doc 19 resolve most crowds to **"draw into the background."** Against a reference where a comparable room has twelve animating figures, a painted crowd reads as a waxwork — and worse, in the Nugget the palette-cycled stove would be the only moving thing in a room full of people, pulling the eye to precisely the wrong place.

## Amendment

**A drawn crowd of four or more must include at least three animated members.**

- The rest stay painted into the background. **You animate three and the other eight get the credit** — the eye catches motion and infers it across the group.
- The animated members are **two-frame idles**, not walk cycles: raise a glass, shift weight, lean back, turn a page, scratch a mule's neck. Two frames at 40px is a small amount of art.
- **Phase-offset each one.** Three figures moving on the same beat is worse than none.
- Idle rates are slow and irregular — roughly 0.3–0.8 Hz, varied per figure. Nothing metronomic.

## Where it applies

Every crowd resolved to "draw in" by doc 19:

| Room | Crowd | Animated members |
|---|---|---|
| 3 · The Nugget | Eleven drinkers | **4** — two at the bar, one at a far table, the man by the stove |
| 3 · The Nugget | The man on the landing | **0 — he must not move.** His entire joke is that he never does. Explicit exception |
| 22 · Road to claims | Men going out | **3** — the morning screen is talking over each other |
| 22 · Road to claims | Men coming back | **1** — the evening screen is nearly silent, and one figure moving in an otherwise still column carries that |
| 26 · Creek | Men at the sluices | **3** |
| 31 · The funeral | Nine mourners | **1** — stillness is the point; one man shifting his weight is enough to stop it being a photograph |
| 12 · Mercantile | The man looking at boots | **1** — he is the only figure |
| 15 · Livery | Four mules | **2** |
| 7 · Registrar | The one other man | **1** |

**Room 29's single-pixel traffic already moves** and needs nothing further.

## The rule this replaces

19b's "crowds are background, individuals are sprites" stands as a rule about **who can be approached**. It is no longer a rule about what moves. A crowd is background *and* partly animated; an individual is a sprite; a figure who must be conspicuously motionless is drawn and stays drawn.

## Note on doc 18

Doc 18's palette-cycling list is unchanged and remains correct — nine elements, restraint is the design. But its framing implied cycling was the game's principal source of motion. **It is not. Sprites are.** Cycling is for fire, water and lamplight, and nothing else should be asked of it.

---

# 21 · THE FOREGROUND PLANE, AND SHADOW IN THE PALE FAMILIES

Two rulings from the compositional analysis against Monkey Island reference. The first is the highest-leverage change available to the art direction.

## 21a · Every room has a foreground plane

**Every composed room has exactly two planes: a background, and an actor standing on it.** Monkey Island's screens routinely have three — something near and dark that the actor passes behind, cropping a corner or a side.

**The evidence is already in the repository.** Room 29 is the only composed room with a foreground occluder. It has the widest value distribution of the six rooms (138 points), 13% of pixels below luminance 30, and reads as the most dimensional — despite being by far the emptiest composition. Less in it than Main Street, and more depth.

**Rule: every room carries a foreground plane. It is not optional and not decorative.**

**Why it fixes more than depth:**

1. **It supplies the missing bottom of the value range.** A near plane is out of the light by definition and may be drawn in `void` or a family floor at luminance 9. The 0–30 band arrives without touching a single lit surface and without re-running the legibility audit — which is the entire reason this ruling outranks widening the range directly.
2. **Its silhouette is almost never horizontal.** A ridge brow, a doorframe, a barrel, a wagon wheel, a table edge. The banding breaks as a side effect.
3. **It is a missing layer, not a dial set wrong.** Value and diagonals are per-room judgements. This is structural and applies everywhere.

**Implementation:**

- Draws over the actor. Walkable mask **unchanged** — the actor's position and depth zone are unaffected; only draw order changes.
- Excluded from the legibility check. It is not a surface anyone stands in front of.
- Should crop a corner, a side, or the bottom edge. It must not be a horizontal band across the frame — that reproduces the problem it exists to solve.
- **Interiors:** a table edge, a doorframe, the near end of a bar, a stack of crates, a hanging lamp cropping the top corner.
- **Exteriors:** a hitching rail, a wagon wheel, a boardwalk post, scrub, a ridge brow, a stack of lumber.

**Priority: Room 1 first.** It puts 80% of the first screen anyone plays into a 58-point band, a quarter of the range available. A dark near plane is the single largest improvement available to it.

## 21b · Four families cannot reach dark, and must swap rather than darken

`void` at index 0 is the only true black and is a single entry with no ramp — nothing can be darkened toward it, since the entire lighting pass steps within a family.

Family floors, lowest to highest: nine families reach near-black. **Four cannot approach it:**

| Family | Floor | Where it matters |
|---|---|---|
| `bone` | **90.0** | The Improvement Company's frontage · the assay office's identity material · the title screen's false fronts · **the handbill carrying the thesis of the game** |
| `sky` | 52.7 | Every daylight exterior |
| `dusk` | 49.8 | |
| `accent_gold` | 41.4 | Hob's lamp, the chandelier |

**The whitest material in Consolation cannot be in shadow.** A bone surface in deep shade is currently impossible to render, and every room built from here would be silently wrong in the same way.

**The fix already exists in the repository.** The dawn scheme built **luminance-matched family swapping** — swaps matched on measured luminance rather than ramp position, because position does not correspond across families.

**Rule: a surface in one of the four pale families, when it needs to go below its floor, swaps to a cooler family at matched luminance rather than darkening within its own.**

- `bone` in shadow → `grey` or `dust` at the target luminance
- `sky` in shadow → `accent_indigo` or `grey`
- `accent_gold` in shadow → `umber` or `ochre`

The swap is chosen by measured luminance, never by ramp index. Declared at composition time and checked, so a shadowed bone surface cannot silently sit at 90 while everything around it goes to 20.

**The palette is not reopened.** This is a lighting rule, not a palette change.

---

# 22 · COMPOSITION ORDER — graybox is a required gate

From the design dossier, and from having violated it three times.

**The order, for every remaining room:**

1. **Grayscale value block** — masses only, no colour, no texture
2. **Walkable band, entrances and exits** — where can a person stand and how do they arrive
3. **Object silhouettes** — hotspots as shapes, unrendered
4. **Character placement and reach** — the actor at every depth zone, at every staging mark
5. **Occlusion test** — the foreground plane, per ruling 21a
6. **Legibility check** — rulings 16, 17c, 18. **This is a gate. A room that fails here is re-blocked, not re-lit.**
7. Lighting and palette
8. Texture and dither
9. Ambient animation and cycling

**Steps 1–6 are graybox. No room proceeds past step 6 until it passes.**

`surface_plan.py` already audits intended surfaces before drawing. That is graybox in embryo and it becomes a required gate rather than an available tool.

**Why this is binding rather than advisory — we have already paid for it three times:**

- **Room 1** shipped unplayable. 80% of the first screen anyone plays inside a 58-point band, Thad's coat invisible against the road. Found after full composition.
- **Room 5** was a finished office before anyone asked where a bright counter put a character's face.
- **Room 2** was composed four times before the false fronts read as false.

The dossier states it plainly: *"Never let a beautifully finished background become the first time the team discovers that the character has nowhere good to stand."*

**Thirty-nine rooms remain. This costs nothing and applies thirty-nine more times.**

---

# 23 · PALETTE PROPORTION — completes ruling 17b

Ruling 17b assigns each interior a material *identity*. That is a hue decision and it has no proportion half, which is why Room 3 reads monotone despite having a correct identity.

**Every room declares a palette script alongside its identity:**

| Role | Target |
|---|---|
| Dominant field | 55–70% |
| Structural shadow family | 15–25% |
| Secondary local colour | 10–15% |
| Narrative accent / light | 3–8% |
| UI-safe highlight | reserved, unused by scenery |

**Measured against the composed rooms, this explains what we already observed:** Room 3 sits 60% inside a single 74-point band and reads monotone. Room 5 spreads across 101 points and reads composed. Same rule set, opposite outcomes, and nothing was checking.

**Implementation:** a check reporting actual proportions against declared targets. **A warning, not a build failure.** A deliberate near-monochrome room — the undertaker's, per doc 09, is scrubbed bone and pine on purpose — is a legitimate choice. The requirement is that it be visibly deliberate rather than accidental.

**Also add `actor_staging_marks` to the room spec.** The dossier lists it and we do not have it: the named positions a character is placed at for scripted beats, checked for legibility and reach at step 4 rather than discovered during a cutscene.

---

# 24 · SCALING — amends ruling 15. Two drawn sizes, not three.

Settled by measurement against ScummVM's source and a decimation test on Thad.

## What the evidence showed

**SCUMM scaled continuously and stayed crisp by decimating, not resampling.** `smallCostumeScaleTable` is an eight-bit reversal deciding which rows and columns to skip. Nothing blends.

**Ruling 15's smearing argument was about resampling and does not apply to this mechanism.** Reimplemented properly, decimation is perfectly crisp at every height.

| Height | Result |
|---|---|
| **32px decimated from 40** | Face survives. Two eyes. Near-interchangeable with the hand-corrected sprite at 16× |
| **26px decimated from 40** | Fails. Zero eyes — a blank tan block with a nose smudge |

**The failure mode is column decimation, not row.** A one-pixel eye cannot survive dropping 35% of columns and the distribution table does not know where the eyes are.

**It is not gradual.** Across Room 2's walkable band the height changes every 4.7 rows — invisible. But the eye count changes **exactly once**, 2 → 0, at one specific row. Thad's face switches off mid-stride and back on when he turns round.

## Canonical

**Two drawn sizes per character, not three.**

| Range | Source |
|---|---|
| Near, at full height | **Drawn** |
| Between full height and the eye-death row | **Decimated continuously** from the drawn near sprite |
| Below the eye-death row | **Drawn far sprite**, snapped |

- **Scaling is continuous above the threshold and snapped once at it.** One snap per character per room, not three.
- **The threshold is measured, not chosen.** It is the row at which decimation drops the character's eye count, found per character. It is not a fixed height — a character with a wider face survives further down.
- **Ruling 15's 40/32/26 zone table is void.** 32 is no longer a drawn size.

## The width correction, and it is mandatory

Decimation narrows proportionally: 20 → 16 → 13 pixels wide. The hand reduction drops rows only and stays 18 wide.

**Swapping between them would make the character 38% wider in a single step at the exact row where the snap happens** — a far more visible artefact than the one this ruling exists to avoid.

**The drawn far sprite must match the decimation curve's width at that height** — 13px for Thad's 26, not 18. Redraw it accordingly. Check the width curve, not just the height, at the snap row.

## Cost

**Thirty remaining characters go from three drawn sizes to two.** The largest single saving available in the remaining art budget, and it came from reading the original engine rather than reasoning about it.

---

# 25 · NO CHARACTER TOKENS ON THE MAP — closes doc 21 gap 2's tail

Thad's colour cue holds to 26px (+176 and +149 against the darkest and brightest composed rooms) and **fails at 8 and 4px**: the bright column decimates away and the brightest remaining mass is his face at 156. Same failure mode as the eyes, for the same reason.

**The requirement is withdrawn rather than solved.**

The dossier's "test at four-to-eight-pixel map-token scale" applies to games whose maps carry a character token. **Ours does not.** Doc 20 specifies the map as a plan of the district with location markers, clicked to travel, and states that travel is instant with no transition. There is no moving figure on it and no reason to add one.

I introduced the token requirement by quoting the dossier without checking it against doc 20. **Closed. No character needs a sprite below 26px.**

If a token is ever wanted, it needs its own drawn asset — the decimation curve cannot produce one, and that is now a measured fact rather than a suspicion.

---

# 26 · THE VERB PANEL AND INVENTORY — ~~text, not icons~~ **OVERTURNED, see 29**

The inventory's geometry appears in no document. Doc 06 specifies the array and the per-item lines and stops. Flagged during the vertical slice, with nine verbs already filling the panel width and forty items to place.

**Canonical, and it follows the 1990 original:**

- **Verbs occupy the left of the panel in three columns of four**, exactly as SCUMM laid them out.
- **Inventory occupies the right of the panel as a scrollable list of ITEM NAMES IN TEXT.** Not icons.
- Scroll arrows at the right edge. Roughly four to six items visible at once.
- The sentence line sits above both, full width.

**Text inventory is not a compromise, it is the period-correct answer.** *The Secret of Monkey Island* listed inventory as text — "meat with condiment", "rubber chicken" — and only later games in the series moved to icons. Reading a list of nouns is also funnier than looking at pictures of them, which matters for a game whose comedy lives in objects.

**Consequences:**

1. **~40 inventory item icons are struck from scope** (doc 15). Item art is not needed. Each item's LOOK and LISTEN lines are still required and are the whole of its presentation.
2. Item names must read at the game's 5×7 font in the panel width. Long names — "Form 12-C (Amended, Void)" — need a stated truncation rule, or shorter display names alongside their full LOOK text.
3. The held-item sentence templates added to `ui.json` during the slice are correct and stay.

**On item-on-target resolution:** the slice found that USE FORK ON MUD answers from the global pool rather than the mud's own USE override. That is correct and doc 13 says so — an override answers its verb-object pair, and a held item makes a different sentence. No change.

---

# 27 · THREE EXCEPTIONS TO DOC 22

`docs/22-scumm-deep-dive.md` is binding. It is a better technical specification of the SCUMM room model than this project had, and it is adopted substantially whole rather than paraphrased.

**Three exceptions, and nothing else.**

## 27a · Scaling — ruling 24 stands, doc 22 §4 does not

Doc 22 recommends keeping three hand-drawn sizes and calls stepped scaling "a Consolation-specific aesthetic compromise."

**It was written before the measurement.** Ruling 24 is empirical: 32px decimated from 40 is near-interchangeable with a hand-drawn 32 at 16×; 26px is not, and the eye-death row is **30**, measured by decimating one row at a time. Two drawn sizes, continuous decimation between, one snap at the measured threshold.

**Doc 22's advice inside that model is adopted:**

- **Place the snap at a visual interruption** — an occlusion edge, a surface break, a doorway. Room 2's snap currently lands at y106; confirm whether that coincides with the boardwalk/mud boundary, and move it if it does not.
- **Feet stay locked to the ground point through the transition.**
- **Never change size and facing on the same frame** unless deliberately hidden.
- The acceptance criterion is doc 22's, and it is better than a size count: *a player should perceive depth, not a sprite changing size.*

## 27b · Inventory — errata 26 stands

Doc 22's object model treats inventory items as objects with image states. **Item art is struck.** The 1990 original listed inventory as text; icons came later. Items carry a display name, a full LOOK and a LISTEN line, and no image.

The rest of doc 22's object model — walk-to point, required facing, ownership, verb-to-script table, runtime state — applies to inventory items unchanged.

## 27c · Camera — not applicable

Doc 22's sequence system includes a `camera` step. **This game has no camera.** Rooms are fixed single-screen views at 320×144. Omit it from the sequence step union rather than implementing a no-op.

---

## What doc 22 correctly identifies that this errata got wrong

Recorded so it is not restated as new later:

1. **Occlusion was documented, not implemented.** Ruling 21a specified a foreground plane; doc 21 then listed z-planes as "already in place." Both were wrong about the runtime. Doc 22's model is stronger than 21a's single overlay — **multiple planes, an actor carrying a clip level derived from its walk box** — and supersedes it.
2. **Walk geometry is rectangles and straight lines.** Rulings 15 and 24 refined *scaling* while the geometry underneath stayed a list of rectangles. Doc 22 §3 is right that this is why Main Street reads flat: walk boxes are what make a character follow the painted street rather than cross it.
3. **Objects have no staging.** The single largest gap for how the game *feels*. Doc 22 §6's sequence — resolve, walk to the object's staging point, wait, turn to required facing, wait, play chore, run script, respond — is the difference between an adventure game and clicking on things. Nothing in this errata anticipated it.
4. **There is no choreography runner.** The opening sequence, the funeral, the coffin and the final duel all need one, and doc 17 specified beats with no machine to run them.

---

# 28 · THE AGREED BUILD SEQUENCE, AND THE CLICK MODEL

## 28a · Sequence — approved as amended

Doc 22's critical list is ten items. The core is four, not three, and the correction is accepted: **`scaleMode` belongs on the walk box, built with it.** It is one field on a structure being authored anyway, and it is the only thing that can put Room 2's scaling snap at the boardwalk lip rather than in open mud. Building boxes without it means authoring them twice.

**The core, in order:**

1. **Walk boxes with routing, carrying `scaleMode` and `clipPlane`** — doc 22 items 1 and 5
2. **`walkTo: {x, y, facing}` on interactables** — item 3
3. **A sequence runner with exactly five step kinds** — `walk`, `waitForActor`, `face`, `chore`, `say` — item 8 minus `parallel`, `sound`, `musicTransition`, `setObjectState`, and `camera` (which errata 27c strikes entirely)
4. **The click model** — item 11, pulled forward from High

Everything else in §6's chain already exists: resolve object is `targetAt`, play chore is the clip system the recoil runs on, run script is `VerbSystem.resolve`, deliver response is the say line.

**Deferred, correctly:** occlusion masks and Y-sorting (4, 6) wait until there are multiple actors at multiple depths to sort. Object states (9) follow — the staged chain works against a stateless object. Item 10 is the acceptance test, not a prerequisite. Items 2 and 7 are already on main.

**On the critical path and easy to mistake for polish: Main Street's walk boxes must be authored as trapezoids that route around the water trough.** Four full-width rectangles cannot demonstrate routing because there is nothing to route around. Authoring, not engineering, and the proof of item 1.

## 28b · The click model — replaces double-click

Double-click-to-walk was specified in the Phase 1 brief and it was wrong. It is ambiguous, it is the one thing in the build today a player would call a bug, and it collides with the staged-interaction click path.

**Canonical:**

| Action | Result |
|---|---|
| **Left click on walkable ground** | Walk there. Always. No verb required and no verb consumed |
| **Left click on an object, verb selected** | Perform that verb on the object |
| **Left click on an object, no verb selected** | Perform the object's `defaultVerb` — LOOK AT unless the object declares otherwise |
| **Right click on an object** | Perform its `defaultVerb`, regardless of what is selected. Convenience only |
| **Double click** | **Nothing. Remove it entirely.** |

- **Every object declares a `defaultVerb`.** Most are LOOK AT. Doors and exits are OPEN or WALK TO. It is the verb a player would try first, and getting it right is a small authoring decision per object rather than an engine default.
- ~~A selected verb **persists** until another is chosen. It is not cleared by use.~~ **VOID — corrected below.**
- The game remains fully playable with left click alone. Right click is never the only route to anything, per the mouse-only requirement.

### 28b-i · CORRECTION — a verb CLEARS ON USE

**The struck sentence above is void. A selected verb is cleared the moment it is used, and the selection returns to nothing.**

**Why the original was wrong, and it is not a matter of taste.** Persisting made the table above self-defeating. `resetToDefault` runs only on a new game and no deselect exists, so **the no-verb state could be left exactly once per playthrough and never returned to** — and row 3, *"left click on an object, no verb selected → perform the object's `defaultVerb`"*, became unreachable the first time anybody touched the panel. One third of this table, dead after one click.

**And with it, every authoring decision the first bullet describes.** `defaultVerb` is *"the verb a player would try first"*, declared per object across the whole game and enforced by `check-default-verbs`. Under the struck rule each one was live for a single click per playthrough.

**The symptom that found it** was reported as *"Thad examines mud everywhere instead of walking"*. Room 1's `mud` spans the entire walkable band, so once LOOK AT was selected every click on the ground was an examine, permanently. The mud's own `defaultVerb` is WALK TO and was already correct; nothing could reach it.

**This also settles the row 1 / row 2 conflict without a further ruling.** The two rows disagreed for any object that *is* the ground — row 1 says walkable ground walks always, row 2 says a selected verb performs. With the selection cleared after every action, the next click on the mud carries no verb and walks. **The contradiction had a lifetime, not a logic: it required a selection that outlived its use.**

**What this does NOT change, so nobody has to re-derive it:**

| | |
|---|---|
| `defaultVerb` | still the **per-target fallback**, never the resting selection |
| the file-level `defaultVerb: LOOK_AT` | still the fallback's fallback, for an object declaring none |
| the resting selection | still **null**, and now reachable again after every action |
| `WALK_TO` | still outside the nine, still not a panel button |
| row 1's *"no verb consumed"* | **unchanged** — a bare walk clears nothing, because it uses nothing |
| the two-click USE sentence | **unchanged** — `carryVerbs` HOLDS an item rather than resolving it, so the verb survives to the second click and clears when the sentence finishes |

> **Changing the file-level default to WALK TO would have fixed nothing.** The floor already walked when nothing was selected. The fault was never which verb was the fallback; it was that a selection, once made, was permanent.

**One consequence worth stating, because it is a real cost.** Doc 13's repeat variants are reached by asking the same question repeatedly, and that now costs a re-selection each time. For most objects it is invisible — their `defaultVerb` is LOOK AT, so a second bare click gives the second variant anyway. It shows on the objects whose default is something else: the mud, the case, every exit. Four tests asserted the old behaviour by clicking three times after selecting once, and all four had to be rewritten to re-select — which is exactly what a player must now do.

---

# 30 · SIX RULINGS FOR ACT I

## 30a · The sequence runner gets a sixth step kind: `wait`

**Granted, with the restriction you proposed.**

Errata 28a excluded `wait` to stop "sleep 400ms and hope" becoming a substitute for `waitForActor` in ordinary interaction. That reasoning holds for interaction and does not hold for a cutscene, where **the duration is the content** — doc 17's beats state ~6s, ~3s and a ~60–70 second total, and without a timed wait the opening cannot run at all.

**`wait` is legal only inside a beat whose control is `none`.** Checkable, and checked. Anywhere else it fails the build.

## 30b · Doc 17's beat sheet is corrected — beats 4–6 are interactive

v3.1 restored the driver's tree without rewriting the table around it. **Beats 4, 5 and 6 are interactive**, because the tree that carries their lines is. `carriedBy: STAGE_DRIVER` is the right annotation and it stops being a contradiction.

**Beat 3 stays automatic.** Thad's declaration and "Course you have" are the exchange v3.1 models on the lookout, and that one is genuinely automatic.

## 30c · The map's first state — seeing counts, and the floor is two

Doc 20 rule 3 says a location appears when heard of. **Amended: a location Thad can see also appears.** Under v3.1 a player may take the EXIT option immediately and hear nothing, and an empty map on first opening is a broken screen.

**First state, minimum two, never zero:**

| Location | Because |
|---|---|
| **Main Street** | He is standing on it |
| **The road to the claims** | He can see it from the street |
| The undertaker's | Only if the driver named him |

Doc 20's "a player who has talked to nobody has two" is **restored as true** by this amendment rather than being void — the two are now Main Street and the road, not the hotel and the undertaker.

**Note: the six Main Street façades are not map entries.** They are directly enterable and the map is for what is not on the street.

## 30d · The hotel lobby's material identity — worn blue-grey plush and tarnished brass

Not declared in 17b, and adjacent-in-play to both Thad's room and Main Street.

**Cool, faded, genteel-pretending. The only cool interior in Act I.** Blue-grey plush gone shiny at the arms, tarnished brass, oil-lamp warmth fighting a cool field and losing. A framed engraving of an Italian bay, per doc 09.

It separates cleanly in three directions: the Nugget's warm timber, Thad's neutral room directly above it, and Main Street's mud and pine outside the door.

**Red is not available.** 17b reserves deep leather, gilt and red for Fanshawe's office as *the only saturated interior in the game*, and spending it on a hotel lobby would cost the game its one moment of real colour.

**Watch the coat.** Thad's is dark bottle green; a cool mid field should carry him on the shirt anchor, but this is the first interior where green sits near green. Measure at graybox, per errata 22 step 6.

## 30e · 17b's room numbers are stale — doc 20 governs

17b calls Thad's room 21 and the livery 14; doc 20 and doc 01 both say 19 and 15. **The identities are right and the numbers are stale labels.** Go by doc 20 everywhere. 17b's numbering is not authoritative for anything.

## 30f · The graybox gate, for eleven interiors — both amendments accepted

**Step 0, once, before any of the eleven.** Material identity is a constraint over a graph, not a per-room choice: solving it room by room means room nine finds both plausible identities taken by its neighbours. **Assign all eleven identities up front**, against doc 20's adjacency, before a single room is blocked out. 17b's declared identities are inputs to that pass, not a completed answer.

**A twelfth graybox, of a room that does not exist.** The shared component library is measured against Thad *before any room uses it*. A library surface that fails in room one fails in all eleven.

**The per-room gate does not relax.** 17c's corollary stands — the anchor differs per room, the face carrying Thad in Room 2 and the coat in Room 3 — and a shared library does not give a shared anchor. Eleven-at-once buys an early warning, not an exemption.

**And the foreground plane at step 5 is the one to watch.** The only plane proven in play is an exterior. Eleven interiors is where ruling 21a either becomes a habit or produces eleven rooms with a table in front of the camera. **The hotel lobby proves the interior case the way Main Street proved the exterior one.** If it does not, that is a re-block at step 5, before anything is lit.


---

# 29 · INVENTORY USES ICONS — overturns 26

*Restored 31 July. This ruling was lost when errata 30 was pushed from a stale local copy that predated it. The icons were built correctly; only the file was wrong. Recorded rather than quietly reinstated, because a ruling that can vanish and be restored without trace is worse than one that was never made.*

Ruling 26 made inventory text on the grounds that the 1990 original did so. **That was accuracy reasoning, not design reasoning.** *Monkey Island 2* introduced the icon panel and it is the better interface; this game targets the era's discipline, not its limitations.

**Canonical: inventory is a grid of icons.** Verbs three columns of four on the left, icons on the right, scroll arrows at the right edge, six to eight visible, sentence line full width above. Item art is in scope.

## Two conditions

**1. The item name appears in the sentence line on hover and on selection.** An icon must never be the only way an item is identified. The authored display names from ruling 26 stand — they are what the sentence line draws.

**2. Near-identical items must be visibly distinguishable — and escalation and differentiation are different problems.**

- **Escalation** is for items that are genuinely **the same object in successive states**. The three Form 12-Cs are one form acquiring damage and stamps: clean; torn corner and a second stamp; VOID across the face. The bureaucracy accumulating is the joke and it should be watchable. The *Clarion* editions are also escalation — the same newspaper, later.
- **Differentiation** is for items that merely **share a category**. The letter, the deed and the Company map are three unrelated documents. Drawing them as a series would spend the escalation trick early and imply a relationship that does not exist.
- **Ozymandia's two brass rods are deliberately identical** — that is the joke. Allowlist entry with a reason, not a failure.

**`check-item-names` extends rather than being replaced:** it fails on two items drawing the same row, and must also fail on two items rendering the same icon. Deliberate identity is an allowlist entry, exactly as duplicate examine lines are.


---

# 31 · THREE ACT I DECISIONS

## 31a · Room 6, the assay records room — keep the dark field, light the floor

**Do not lift the field.** A records room is dark and doc 09 calls its shelves *"beautiful, in the way that only a completed thing is beautiful"* — a beauty that needs a dark surround to read against.

**Light the walkable area instead.** Ruling 17c measures per surface, not per room, and a character is only ever measured against what he stands in front of. Doc 05 gives the room a high small window and Winnie's cot; add a lamp at the desk.

**The result: a dark room with a lit floor.** The shelves and the upper room stay at v0.30 and the coat vanishes into them, which is correct and unmeasured because nobody stands in front of a ceiling. The floor, the desk and the window wall carry him.

If the lit band still fails the gate, that is a re-block at step 5 — not a brightening pass.

## 31b · Boot Hill is gated on the undertaker, not on Pike being named

Doc 20's "once Pike is mentioned" is void. **Thad names Ezra Pike to the driver in the opening**, which would put Boot Hill on the map at the coach stop and break 30c's floor of two.

**Canonical: Boot Hill appears when the undertaker tells Thad that Pike is dead.** A graveyard appearing before the player knows anyone is buried is also strange on its own terms.

## 31c · The map's gates — visible from Main Street, or heard of

Doc 20's "the six ancillary interiors appear from Act I" is unworkable against 30c. **One rule, and it follows 30c's amendment that seeing counts:**

> **Everything visible from Main Street appears the first time Thad stands on Main Street.**

| Gate | Locations |
|---|---|
| **From the start** | Main Street · the road to the claims — 30c's floor of two |
| **The driver names him** | The undertaker's |
| **First arrival on Main Street** | The Registrar · the livery · Ozymandia's tent · the church · the back alley · the six ancillary interiors |
| **Heard of specifically** | Boot Hill (31b) · the diggings beyond the road junction · everything in Acts II–IV |

The map goes from two locations to roughly twelve at the moment the town opens, which is the moment it should feel like a town.

## 31d · The coach is an object state, not background art

After departure the hotspot correctly answers *"Gone. It made very good time on the way out"* while the coach is still painted into Room 1's background. **Ruling 19b in reverse: the art asserts something the room contradicts.**

**The coach and team are a state image on an object, not background.** This is what doc 22 item 9 was built for, and Room 1 is its first real use outside a proof.


---

# 32 · COMPOSITION — the density diagnosis was wrong, and here is what replaces it

I diagnosed the visual gap as object count. **Room 2 already carried twenty-four objects and still read thin.** The count was never the whole problem and in Room 2 it was not the problem at all.

**Five rules replace it. The first is free and it is the largest.**

## 32a · Objects must overlap

**Not one object in Room 1 partially occluded another.** Room 2's boardwalk goods sat in a row along one line. In the reference essentially every object overlaps something.

> **Overlap is what makes forty objects a place instead of forty stickers.**

It costs nothing — the same objects, moved. **No composed room may contain a row of objects sharing a baseline with clear air between them.** Objects sit in front of, behind, and against each other.

## 32b · Density belongs at the edges and in depth, never on the walkable plane

The reference's habit is the opposite of what "density" suggests: **the ship's hold is packed to the walls and its floor is nearly clear. The circus clearing is empty because it is a pool of light.**

Strewing the walkable plane produces litter, and it is a legibility problem with extra steps — 21a and 17c both fight it.

**Pack the edges, the back wall, the upper frame and the near plane. Keep the floor clear.**

## 32c · Detail is a hierarchy, not a level

In the SCUMM Bar the chandelier is fussy, the floor is plain, and every pirate is individual. **Ours is uniformly low everywhere, which reads as unfinished rather than composed.**

Two or three focal objects per room carry real detail. The field is plain on purpose. This is errata 23's palette proportion argument applied to line rather than colour.

**Named as the worst case in the project: the Nugget's eleven patrons.** Identical dark rounded rectangles with a head block — no arms, no hats, no pose variation. They are the room's focal population and they carry the least detail in it. Fix them before any further crowd is drawn anywhere.

## 32d · The foreground plane must be a nameable object, not a mass

**Amends 21a.** Every MI composition puts a large, recognisable object cropped by the frame edge in the near field — barrels bottom-centre in the hold, the tree trunk and roots in the circus, tables at bottom-left in the bar.

Ours obey 21a and are amorphous: a black scrub bank, a lumber pile.

**A cropped, nameable object at large scale does two things a texture mass cannot:** it establishes depth in a single read, and it gives the frame a scale anchor.

## 32e · Scale variety — everything we draw is 8 to 20 pixels

Nobody had named this and it is why the frames read flat even when full. **Every room needs objects at three scales:** something large and cropped in the near field (40px+), the ordinary 8–20px middle, and small detail at 3–4px in the far field.

32d supplies the large end for free.

---

# 33 · LIGHT SOURCES, AND ROOM 2'S BRIGHTNESS

## 33a · A source needs a dark collar, not a hotter core

Room 1's lamp core measures **205 — exactly accent_gold's ceiling**. I was about to rule a 21b-style swap to bone at 231.

**Do not.** The measurement says the core is the smaller half: core-to-surround is already 124. The problem is where the surround falls — **at 81, the ground around the lamp is one of the lighter parts of a frame whose median is 53.** In the reference the windows blaze at ~200 against a wall in the 40s, and the wall runs right up to the frame.

> **Ours has no frame. The lamp bleeds straight into mid-grey mud.**

**Darken the collar immediately around every light source.** Costs no palette change and no swap.

**And a source at this resolution is a core plus a shaped falloff, not a bright blob.** The lamp core is six pixels. This is a drawing job.

## 33b · Room 2 is too bright, and the Company façade breaks a rule we already have

Room 2's p90 is **156, with 17.75% of pixels over 140. Bright images flatten.**

**The bone Company façade is the brightest object in the frame — brighter than the sky.** `street_scene.py`'s own comment forbids this, and so does the atmospheric-perspective rule established when Main Street's sky was fixed: *no building or hill may be lighter than the sky.*

**It is a live violation of a stated rule that nothing checks. Add the check**, and bring the façade under the sky. It should read as the best-kept building on the street, not as the brightest object in the world.

---

# 34 · CAMERA — asymmetry, and one relationship per neighbourhood

Composed rooms use four relationships, and only one interior has perspective at all: **Room 5, symmetrical one-point with the vanishing point dead centre — the most static form available.** The hold and the SCUMM Bar are both asymmetric: VP off-centre, one wall much longer than the other.

**Two rules:**

1. **Perspective interiors are asymmetric.** Off-centre vanishing point, unequal walls. Room 5 is re-blocked to this at its next revision — not urgently, but before it becomes the model the other ten inherit.
2. **No two adjacent-in-play rooms share a camera relationship**, the same constraint as material identity in 17b, and assigned in the same step 0 pass.

**Act I's exteriors:**

| Room | Camera |
|---|---|
| 2 · Main Street | **Flat elevation — unchanged.** The false-front joke needs the flat view and the hub should be the stable one |
| 1 · Stage road | **Three-quarter.** It is the first screen and it currently shares Main Street's relationship |
| 22 · Road to the claims | Three-quarter or receding |
| 14 · Boot Hill | Elevated three-quarter, as Room 29 |

**The hotel lobby is a corner box with an off-centre vanishing point**, and it sets the pattern for the ten interiors after it.


---

# 35 · AMBIENT MOTION — the category the freeze does not cover

**The art-direction freeze is on composition. This is not composition.**

Tyler has now twice reported the game feeling stagnant against the reference, and both previous answers missed. Ruling 20 gave *crowds* two-frame idles. Doc 18 gave nine palette-cycled elements and explicitly restrained them. Neither covers the general case, and the result is Room 1: **nothing in it moves except a lamp getting brighter.** Thad stands perfectly still. Hob is a motionless silhouette. The horses were static.

In the reference, something is moving in almost every frame of almost every screen.

## 35a · Every room has at least one moving thing that is not palette cycling

Cycling is fire, water and lamplight. **It is not the game's motion.** Sprites are.

**A room with no animated sprite fails review.** Not a build check — a standing requirement at composition.

## 35b · The protagonist is never perfectly still

**Thad gets an idle: a slow breath, and a weight shift on a long irregular cycle.** Two frames each. He is on screen more than anything else in the game and he is currently a statue between clicks.

This is the highest-value animation in the project and it was never specified.

## 35c · Hob is lit by his own lamp

**He is not a silhouette, and making him one was wrong.**

He carries the only light in the only night exterior *(errata 64: Room 1 is no longer the only night exterior, but it is still the only one where the carried lamp is the sole source)*. A man holding a lantern has a lit face — and Hob's face is the single most important piece of art in Act I, because the whole Act III reveal depends on the player having walked past him and not looked twice.

**A black slab is not a man you walked past. It is a shape.** Light the face and the near side of the coat from the lamp; leave the far side dark. He should be *unremarkable*, which is a different thing from *invisible*.

**His lamp also swings as he walks**, and the light on him moves with it.

## 35d · Named ambient idles for the opening

| Subject | Motion |
|---|---|
| **The team** | Heads drop to graze, hold, come up, chew. Slow and irregular, 10–20 second cycle, the two horses out of phase |
| **Hob** | Lamp swings on the walk; lit face and near shoulder move with it |
| **Thad** | Breath and weight shift, always |
| **The driver** | Shifts a case, straightens, looks up the road — during the tree, so the scene is not two people standing still talking |

## 35e · Motion is not information

Ruling 18's constraint carries over unchanged: **nothing moves because it is important, and nothing stops because a puzzle state changed.** A player must never learn to read motion as a hint. Ambient life is texture.

---

# 36 · ROOM 1 BUGS

Reported from the deployed build.

1. **The barrel stack at frame left occludes the town's lights.** The distant lamps are the only lit thing on that horizon and a prop is standing in front of them. Move the stack.
2. **The stacked round forms at frame right read as cannonballs.** Whatever they are meant to be, they are not something a stage road has. Replace or remove.
3. **Barrel lid ellipses face the wrong way for their position** — the viewing angle should follow the object's height relative to the horizon.

**Not a bug:** the coach is absent because the driver departed. The coach and team leave together and the departed state is correct.


---

# 37 · EXHAUSTED DIALOGUE OPTIONS — **REVOKED, see the correction below**

From a player audit: Monkey Island removes an option once it has been asked, and ours grey out and remain. Both behaviours are right, for different options.

| Tag | Behaviour |
|---|---|
| `[PROGRESS]` | **Removed once used.** It has done its job. Leaving it clutters the list and invites a player to re-ask a question that has been answered |
| `[TOPIC]` | **Stays, greys, remains selectable.** Its repeat responses are written content |
| `[COMIC]` | **Stays, greys, remains selectable.** Same |
| `[EXIT]` | Always present |

**Why topic and comic must stay:** doc 04's Winnie tree turns on asking her about the raccoon five times until she cracks — "What's its name." — and that arc is one of the best things in the game. Removing exhausted options would delete it silently.

**REVOKED. Doc 04 rule 4 stands unamended: every used option greys and stays.**

## Why this ruling was wrong

**Its premise is a factual claim about Monkey Island, and the claim is backwards.** Errata 37 opens "Monkey Island removes an option once it has been asked." What Monkey Island actually did is remove an option **when the branch it led to was unimportant to the player's progress**. Flavour vanished; the things a player needed stayed.

So this ruling removed `[PROGRESS]` — the options that matter — and kept the jokes. That is the opposite of the game it cites.

## Why the fix is revocation and not inversion

**A rule where some options vanish cannot be learned, whichever ones they are.** The property deciding it — the tag — is invisible. Measured on the driver's tree, the first conversation any player has: four options, two rows vanish and a third greys, and nothing on screen says why.

**Removal reshuffles.** Six of nine nodes mix `PROGRESS` with other tags, so a used row disappears and everything below it jumps up. That is what reads as clunky, and it happens whichever tag is removed.

**Nothing in this game is long enough to need pruning.** The largest node is seven options; the distribution is 4, 4, 4, 4, 5, 5, 6, 6, 7. Monkey Island pruned because its trees ran long on a 200-pixel screen. That problem does not exist here.

**And it keeps the Winnie arc for free.** Doc 04's raccoon — asked five times until she cracks — needs the option present on the fifth ask. This ruling preserved it by special-casing `[COMIC]`; revocation preserves it by default.

## What survives

**The tags stay.** `[PROGRESS]`, `[TOPIC]`, `[COMIC]` and `[EXIT]` still mark what an option is for, which is useful to authors and to checks. They no longer control visibility.

*Recorded as Q31. The premise was checkable and nobody checked it — the same failure as the character height, where a number derived from Monkey Island's proportions was never held against the actual picture.*


---

# 38 · A SEVENTH STEP KIND: `move`

Errata 28a cut the sequence runner to five kinds and 30a added `wait` as a sixth. The coach's departure needs a seventh, and the reasoning that struck `setObjectState` and `parallel` does not apply to it.

**`move` translates a named object from one position to another over a duration.**

- **Legal only inside a beat whose control is `none`** — the same fence as `wait`, and for the same reason: in a cutscene the movement *is* the content, and in ordinary interaction `walkTo` and `waitForActor` already do this properly.
- It carries the object's own animation while it travels. The coach's wheels turn because the coach has an idle cycle, not because `move` knows about wheels.
- **`parallel` stays struck.** A departure is one object leaving; the sound going with it is that step's business, not a second track.

**Beat 6b, exactly:** the team walks, the wheels turn, the coach leaves frame right over about three seconds, and the sound recedes with it. **A coach that vanishes on a click is not a coach leaving**, and the player audit was right to call it.

---


---

# 55 · THE TITLE PLAYS OVER THE WALK. DOC 17 BEAT 1 IS VOID.

**Doc 17 beat 1 — "Title over the ridge at night. Consolation below as scattered lamps in a great deal of darkness. Longing, not comedy" — described a separate scene, and it was never built.** `beginOpening` has always filtered the menu segment out of the opening with a comment saying the title "is its own scene and has already happened by the time anyone is standing on a road". That scene does not exist. `main.ts` registers `BootScene` and `GameScene` and nothing else.

**It will not be built. The title appears IN THE MOUNTAINS, TOP RIGHT OF THE FRAME, while Thad walks away up the hill toward the town**, in an arrangement of the words made to fit that space rather than a centred card. Recorded here rather than deleted quietly, because a beat's description is content and this replaces it.

**IT ALSO SETTLES DOC 17'S OWN DEFERRED QUESTION, in a way doc 17 did not consider.** "The descent — optional, and flagged as a cost" proposes exactly this shot — *"one transitional composition, tiny Thad on the ridge road above the lamps"* — and defers it because *"it is one more screen and it contradicts doc 20's 'travel is instant, no transition screens'."* **This is not one more screen.** It is Room 1 continuing, so doc 20's rule is untouched and the cost the descent was deferred over does not arise.

**The 320×144 art stays superseded.** `art/backgrounds/title-screen.png` and `room-29-high-ridge.png` are both at the resolution errata 54 voided, and the title render has its lettering and its whole menu baked into the image. Both are on `tools/pixelart/superseded.py` so `npm run renders` refuses to rewrite them. Q59.

**WHAT THE LAUNCH SCREEN IS HAS NOT BEEN ASKED AND IS NOT ANSWERED HERE.** If the title plays over gameplay, a player opening the game currently goes straight into Room 1 and the opening starts: there is no menu, no title and no way to choose CONTINUE. `content/ui/menu.json`'s root is the PAUSE menu — Resume, Save, Load, Options, Fullscreen, Quit — reachable only from the verb panel, so a returning player must play the opening's first moments before they can load. NEW GAME / CONTINUE / OPTIONS / CREDITS exist nowhere but as painted pixels in the superseded title art. That is a separate ruling.

# 39 · NATIVE RESOLUTION STAYS 320×200 — the fix is fullscreen

The frame does not fill a browser window, and the analysis is correct: at 1920×1080 the canvas is 1600×1000, which is already the largest integer multiple. The binding dimension is the 200-row native height — 5× needs 1000px of usable viewport, and browser chrome plus the Chromebook shelf takes you under it.

**Two options were on the table. Ruling for the second.**

**Rejected: a 320×180 native frame.** It is 16:9 and would fill a modern screen at integer multiples. It is also not the shape of a 1990 adventure game, it costs 20 rows of play area, and it invalidates six composed rooms. The pixel art is what reads as period, but the frame is part of it.

**Adopted: a fullscreen toggle.** At true fullscreen on a 1080p display the chrome is gone and 5× fits inside 1080 with room to spare. It costs one control, changes no art, and it is the honest fix — Monkey Island letterboxes on a modern screen too.

- A fullscreen control in the menu overlay, and in the verb panel per the mouse-only requirement.
- The game remains correct windowed. Fullscreen is better, not required.
- **Never break the integer rule to fill a window.** A fractionally scaled frame is not this game.


---

# 41 · LUMINANCE PARITY IS NOT PARITY WHEN THE HUE DIFFERS

**Every automated check in this project measures luminance. This ruling exists because that is not sufficient, and a room passed every one of them while being visibly wrong.**

## The case

Room 1's moonlit ruts took over the lower half of the frame and outcompeted the town, which is the room's focal point. Measured against the reference:

| | pixels | median luminance |
|---|---|---|
| Ours | 1,272 | 44.4 |
| Reference | 1,144 | 49.8 |

**Fewer pixels than the bar, and darker than the bar.** Correct on both measured axes, and wrong on the screen.

**The difference was saturation.** The reference's water is a blue-grey at 0.46. Our reserved cycling band sits at 0.55–0.60 — chosen because three entries could be reserved there without colliding, not because it is the colour of water. About a fifth more chroma per pixel, and a thousand of them compounding across the lower half into blue corduroy.

## The rulings

1. **Every luminance check gains a saturation companion.** A surface that matches on luminance and exceeds on chroma is not a match. Report both.
2. **Where a family's saturation is fixed and cannot be lowered — a reserved cycling band, an accent family — the only control is HOW MANY PIXELS TAKE IT.** Area is the lever when chroma is not. That is the correct fix and it is what was applied here.
3. **Cycling bands are chosen for colour, not for convenience.** This band was reserved where three entries happened to be free. Any future reservation states what colour the thing is meant to be first.
4. **Every entry in a reserved band must be painted by something.** An entry nothing paints is an entry that cannot animate.

## The general form

**A measurement that agrees with you on every axis it measures is not a result. It is a result on those axes.**

This is the fourth time this project has been bitten by a measurement that looked like a finding — the keyline anchor, the contaminated samples, the control that was not a control, and now luminance parity across a hue difference. **The pattern is always the same: the instrument was correct and it was not measuring the thing that was wrong.**

---

# 42 · A SUMMARY STATISTIC CANNOT HOLD A SHAPE

**Ruling 41 found a missing axis. This is a missing SHAPE, and every axis agreed.**

## The case

Room 1's town read as a scatter of lights on a dark hillside for four rounds. Three blind critics, in three separate rounds, from three separate crops, described it in almost the same words: *windows with no host geometry*. They were right.

Every instrument this project owns said the region was fine, and several said it was *quieter* than the thing it was copying:

| | ours | reference |
|---|---|---|
| mean luminance | 27.8 | 29.2 |
| mean saturation | 0.29 | 0.53 |
| roughness (mean neighbour ΔL) | 6.5 | 8.9 |
| warm pixels | 345 | 402 |
| warm rows spanned | 44–69 | 44–69 |
| run anisotropy (H/V) | 1.51 | 1.28 |

Per-row warm distribution matched within a few pixels the whole way down the hill. Ruling 41's new saturation companion was in place and *passed* — ours is barely half the reference's chroma.

**The defect was the distribution's shape**, over the town core:

| | <18 | 18–26 | 26–34 | 34–45 | 45+ |
|---|---|---|---|---|---|
| ours | 11.1% | **46.1%** | **6.7%** | 18.9% | 17.1% |
| reference | 12.8% | **28.8%** | **16.6%** | 20.4% | 21.4% |

**Bimodal.** Near-black mass with bright marks on it and a hollow where the middle should be. The windows had nothing to be holes *in* — they were dots on the night. The reference punches its windows into a wall you can already see, and that is the whole difference between a town and a starfield.

A mean cannot see this. Two distributions with identical means, identical variances, identical extremes and identical per-row profiles can be a building and a scatter, and the number that separates them is not a number — it is a silhouette in the histogram.

## The rulings

1. **A drawn mass reports its histogram in bands, not its mean.** A town, a crowd, a stack of timber, a tree line, a rock face. Five bands is enough.
2. **A mass whose mid-band is less than half the reference's is a field of marks, whatever its summary statistics say.** That is the test, and it is the one that would have caught this in round one.
3. **Highlights need something to be highlights ON.** Before adding a bright mark to a mass, check the mass has a mid-tone the mark can sit in. A material two ramp steps above its background is a plane the eye can see; one two luminance points above it is a rounding error, and marks placed on a rounding error read as marks placed on nothing.

## The general form

**Ruling 41: a measurement that agrees with you on every axis it measures is not a result. Ruling 42: neither is one that agrees on every axis *and* every summary of those axes.**

This is the fifth time this project has been bitten by a measurement that looked like a finding — the keyline anchor, the contaminated samples, the control that was not a control, luminance parity across a hue difference, and now five agreeing statistics over a hollow distribution. **The instrument was correct every time. It was not measuring the thing that was wrong, every time.**

The practical consequence, for anybody adding a check: *state what shape of failure your check cannot see, in the check.* Every instrument in this project now carries that note, because the fifth instance was found by eye after three critics had already found it, and only then explained by a measurement nobody had thought to take.


---

# 43 · CONSOLATION GETS THREE STREET SCREENS, NOT ONE

Doc 20 gave the town **one** street. Everything not on it — the Registrar, the livery, the church, Ozymandia's tent, the undertaker's, the six ancillary interiors — was reached through the map screen.

**That was solving a problem that should not have existed.** The map was introduced because I had let the town outgrow its one street, and a menu is a weaker answer than walking. Monkey Island had four or five outdoor screens on Mêlée and you walked between them; that is a large part of why it feels like a place.

**Room 2's approved composition has also overtaken the decision** — it has a road running off toward the lower right and an alley you can see through. Both promise a town that continues.

## Canonical

**Three connected street screens. Consolation is walked, not selected.**

| # | Screen | Off it |
|---|---|---|
| **2** | **Main Street** — the hub, unchanged | The Nugget · the Clarion · the Improvement Company · the mercantile · the hotel · the assay office |
| **2b** | **Lower Street** — east end of Main Street, through the receding road | The Claims Registrar · the livery stable · the church & meeting hall · the back alley |
| **2c** | **The Lane** — off Main Street's alley, a narrower back street | The undertaker's · Ozymandia's tent · the photographer's · the barber's · the empty storefront |

**Walking order, west to east: Room 1 · Main Street · Lower Street.** The Lane runs off Main Street's alley, perpendicular, and connects through to Lower Street at its far end — so the three form a loop rather than a corridor, and a player can go round rather than back.

## What the map keeps

**Long-distance travel only, which is what MI's map was for:**

- The road to the claims and everything beyond it — Prosperity, Pratt's claim, the creek, the abandoned row, the ridge, Mott's site, Sheng's laundry
- Boot Hill
- The remaining ancillary interiors that sit on no street — the boarding house parlour, the bakehouse, the schoolhouse

**Everything in town is now walkable.** Doc 20's rule 3 still governs what appears on the map; it simply has far less to hold.

## Consequences

- **Room 2's east exit goes to Lower Street**, not to a map entry. It is the receding road at frame right in the approved composition.
- **Room 2's alley is a real exit**, to the Lane. It is already drawn as a slot you can see through.
- **Room 20, the back alley, moves** — it opens off Lower Street rather than Main Street's east end.
- **Errata 31c is amended.** "Everything visible from Main Street appears on the map the first time Thad stands on Main Street" now covers far fewer locations, because most of them are reachable on foot and need no map entry at all.
- **Two more composed screens**, both exteriors, both day. They inherit Room 2's palette script, camera relationship and material identity — they are the same street, further along. *(Amended by errata 64: "both day" is superseded — Main Street's base state is night, and the two screens inherit that.)*

## Why this is worth two rooms

A town you walk through has elsewhere in it. A town with a menu has a list. Forty-two screens becomes forty-four, and the two added are the cheapest kind — same time of day, same materials, same camera, and the component library already draws everything they need.


---

# 44 · DOC 29 IS BINDING — with two exceptions

`docs/29-movement.md` is adopted. It identifies a gap nothing in this errata named, and its section 12 is the finding:

> **Exits still end too early.** Thad walks to the exit, faces it, and the room changes. He never *crosses* anything, and at the destination he is placed rather than revealed.

Everything ruled here about geography — 20, 31c, 43 — concerned **where** rooms connect. Doc 29 is about **how**, and the missing egress and ingress beats are why a transition reads as swapping paintings under a stationary man rather than a man walking through a door.

**The four-point separation is the core of it and is adopted whole:** approach, threshold, egress and settle are four different coordinates and one cannot do all four jobs.

## The two exceptions

**44a · The map stays an instant menu with no actor token.** Doc 29 correctly frames this as a tradeoff rather than an error. Errata 43 has just reduced the map to long-distance travel only — the diggings, Boot Hill, and the few interiors on no street — because the town is now walked across three connected street screens. A four-pixel token needs paths, discovery gates, destination triggers and a travel speed, to compress a journey the player now makes on foot everywhere it matters.

**Doc 29's condition is accepted with it:** if the map stays instant, local street-to-street and door transitions must carry more continuity work. That is exactly what the rest of this ruling requires.

**44b · Section 13.2's note on the alley is superseded by errata 43.** Doc 29 says the alley "need not be an exit" and warns against a misleading hotspot. It **is** an exit — to Room 2c, the Lane — and it needs a real walk lane, a paired entrance and enough width for Thad's far-scale silhouette. Doc 29's requirements for a traversable alley apply in full.

## What this changes about Room 1

Doc 29 §13.1 is stronger than doc 17 on the arrival and doc 17 yields to it:

- Thad must be **visibly associated with the coach** — seated, descending, or standing beside it as the case comes down. Doc 17 v3 already asks for this and the current build does not do it.
- **The coach must not be deleted on the frame of the final dialogue click.** It moves far enough that departure is understood, then `T_COACH_DEPARTED` commits. Errata 38's `move` step exists for this.
- **The act card waits** until the arrival blocking has established place and character.
- **The exit to Main Street uses the road's real perspective lane** — Thad walks into depth, scales down, reaches an occluded bend, and Main Street receives him at its west entrance.

## Precedence

Doc 29 governs movement, transitions, entrances, exits and room-authoring data. Where it conflicts with an earlier errata ruling on those subjects, **doc 29 wins** unless named above.

Its authoring defaults — approach distances, egress endpoints, ingress walks, turn holds — are explicitly project starting points, not historical measurements. Tune them at native scale.


---

# 45 · DOC 30 IS BINDING — and it caught a data-model failure that would have deleted written content

`docs/30-dialogue-presentation.md` is adopted. It governs dialogue presentation, pacing, barks, comic timing and the sentence line.

## The finding, and it is serious

**`DialogueOption.repeat` is a single string. Doc 04's Winnie tree needs five.**

Ask her about the raccoon and she refuses. Ask again and she refuses differently. On the fifth she cracks — *"What's its name."* — and it is one of the best beats in the game, reachable only by a player being persistent. **The runtime can hold one repeat response and the other three are unrepresentable.**

Errata 37 ruled which options survive exhaustion. **Nobody checked whether their repeat responses could exist at all.** Boolean exhaustion becomes per-option selection counts, with repeat exchanges clamping at the last authored variant.

This would have shipped as content silently missing rather than as a failure. It is the sixth instance of an instrument being correct while not measuring the thing that was wrong — and this time the instrument was my own ruling.

## Three things it corrects that I had wrong

1. **Selecting an option must make Thad SAY it**, over his own head, before the reply. Ours sends the selection silently. The manual is literal: the player chooses what the protagonist says.
2. **Speech is anchored over the speaker in that speaker's colour**, following actor position and scale — not a top-centre subtitle band, which is what ours is.
3. **`DialogueTransaction`.** State writes are reserved on selection and committed only when the exchange drains. Without it the coach begins departing underneath *"Wasn't for you."* — a bug we would have shipped and blamed on timing.

## The one exception

**45a · Speaker name labels stay off by default**, as doc 30 already specifies, and the accessibility option that enables them must not become the default answer to a contrast problem. Doc 30 says this; it is restated because it is the rule most likely to be relaxed by someone trying to fix legibility quickly.

## Precedence

Doc 30 governs presentation and pacing. **It does not touch what characters say** — doc 04, doc 05 and the room content documents are unaffected, and doc 30 says so.

Where doc 30 conflicts with an earlier errata ruling on presentation or timing, doc 30 wins. Errata 37 is preserved intact and doc 30 implements it.

Its numeric defaults — the 0.45s + 0.055s/glyph hold, the 150ms input guard, the 240px speech width — are stated as Consolation starting values to tune at native resolution, not historical measurements.


---

# 46 · THE REFERENCE'S OWN FAMILY USE IS THE CHECK — and ruling 41 caused the defect it catches

## What happened

Room 1's night sky was painted with 1,089 pixels of `accent_teal` and all four critics independently called it **green speckle**.

**Ruling 41 asked for it.** I wrote "every luminance check gains a saturation companion." **Saturation is a magnitude and carries no hue.** An author closing a genuine chroma gap reached for the most saturated cold entry in the locked 256, the number moved the right way, and the sky went green. They even rendered both densities and looked — judging 0.20 invisible and 0.22 "plainly green," which is one notch past where an eye that has been staring at a trade-off can still see it.

**My instrument caused it. This is the sixth instance of the pattern and the first where the pattern was my own ruling.**

## The first fix was the same error one level up

A mean green-minus-magenta axis scored the sky **+9.0 with the teal in and +8.0 with it entirely removed** — a threshold nothing could reach, measuring a palette limit rather than the defect.

**Eleven hundred pixels cannot move a region mean by one unit while being plainly wrong to look at.** That is ruling 42 arriving from the other direction: a mean cannot see a localised wrong hue any more than it can see a bimodal distribution.

## The ruling — and it needs no threshold

> **Quantise the reference into our own locked palette and record which families it reaches for, per region. A region that paints in a family the reference never uses there fails.**

The re-quantised reference is the best this exact 256 can do with this exact picture. If it reaches for `accent_teal` in the sky **zero times out of 15,360 pixels**, neither may we.

- **No threshold, no axis, no tuned constant.** The bar answers the question.
- Foreign pixels at adoption: sky 1,089, range 792, town 79. Now zero.
- **The cost is recorded rather than hidden:** sky saturation 0.70 → 0.65, range 0.66 → 0.60. **A slightly dull blue sky is a smaller error than a green one.**
- **This generalises to every room with a reference**, and it is the first check in the project that needs no number chosen by a person.

## Ruling 41 is amended

Its rule 1 stands — saturation must be reported beside luminance. **But saturation may never be used as a target to close.** A chroma gap is closed by choosing the right family, and the reference's own family use decides which family that is.

---

# 47 · TWO PALETTE LIMITS, RECORDED SO THEY ARE NOT RE-LITIGATED

Surfaced by Room 1's sky work. **These are facts about the locked 256, not defects in the drawing, and no amount of composition fixes them.**

1. **The night sky's second luminance bucket stays hollow.** The only cold entry in that window carries no chroma at all, so the bucket can be filled with grey or left empty, and grey is worse.
2. **The near range wants luminance 13 with blue in it. The palette does not contain it.** `accent_indigo`'s floor is 21.7 and `sky`'s is 52.7.

**The palette is not reopened.** It is locked, six other rooms depend on it, and both gaps are narrow. They are recorded so that a future pass reads this instead of rediscovering them, and so that a room failing ruling 42's shape test in those specific buckets is understood as constrained rather than badly drawn.


---

# 48 · DOC 31 IS BINDING — the order of a successful action is inverted

`docs/31-puzzle-feel.md` is adopted. It governs puzzle advertisement, response gradients, success performance, near misses, Act II pacing, recoverability and tension.

## The two findings, neither of which any ruling here caught

**1. The visible order is backwards.** The build writes flags inside resolution and applies object state and inventory **before the line finishes**. A puzzle is therefore mechanically solved before it has been performed, and the player sees consequence before cause.

**Canonical order, binding:** stage · chore · sound · line · object state · flags · inventory · settle. The player sees the physical act, hears it, hears what Thad makes of it, and *then* the world changes.

**2. There are six outcome classes and we have two.** Ours are "authored response" and "pool." Doc 31 distinguishes `COMIC_NOOP`, `WRONG`, `PLAUSIBLE_WRONG`, `RIGHT_TOO_EARLY`, `NEAR_MISS` and `SUCCESS`.

**This is what makes doc 02's A5 work.** Bait, smoke and Pratt are not three refusals — they are three different kinds of wrong, and the current engine can only render them identically. A near miss confirms a hypothesis without naming the answer; a comic dead end rewards curiosity without implying progress; and nothing in the interface distinguishes them, which is the point.

## What it protects, correctly

Doc 31 opens by naming the two invariants I most feared an outside document would erode: **there is no hint system and never will be**, and **roughly forty percent of selectable options and many authored combinations do nothing on purpose and are the product.** It forbids labelling, highlighting, scoring or "fixing" either. It also upholds errata 35e — motion is never information — and doc 05's rule that the three load-bearing LISTEN lines carry no emphasis.

**Its audit verdict is accepted:** the content layer already values specific jokes and safe structure; the engine is the blocker, not the prose.

## Migration

Its section 14 order stands: resolver, schema, permission validator, transaction and trace first — then **A5 as the reference vertical slice**, then the five tagged combinations, then the 45-puzzle manifest.

**Do not populate the manifest before the resolver exists.** A graph that passes reachability while every success falls through a pool is the exact false pass doc 31 warns about, and the existing checker's honesty about being inert must survive.

## Precedence

Doc 31 governs what the player perceives when the puzzle systems run. **It does not change any puzzle solution or any written line** — docs 02, 13, 14, 24 and the room content documents are unaffected, and doc 31 says so. Where it conflicts with an earlier ruling on feedback or performance, doc 31 wins.


---

# 49 · AUDIO — RENDERED STEMS, LIVE SYNTHESIS WHERE IT MUST BE CONTINUOUS, THEMES COMMISSIONED AS MIDI

Doc 28 left the build method open. The feasibility proof settles it, and the recommendation is adopted whole.

## What the proof established, measured rather than asserted

**The tuning conceit is built, not bought.** One `ConstantSourceNode.offset`, exact, free, and linear in cents. Verified by autocorrelation on the rendered waveform: −35.47 cents on the piano and −35.16 on the fiddle from the same parameter; the C♯ rule at −100.52 stacking to −135.11 with the global offset while D moves 1.86 cents, so it is genuinely per-note-class; the ninety-second arc exact at every quartile, landing on 0.000.

**Two numbers decide the rest:**

| | cost |
|---|---|
| The theme alone, live, 14 notes/sec | **12.9% of one core** — and a Chromebook is 2–4× slower, so 25–50% for music before SFX or Phaser, against a 60fps budget |
| A decoded stem | **~1%** |

**And samples do not make the detune hard.** A global −35 cents is a 2.04% `playbackRate` change. All stems drift together so they stay in sync; 2% of tempo drift across ninety seconds is imperceptible; **a whole town's music running slightly slow is arguably more period-correct than a synth being flat.** Still one parameter, no pitch-shifter, no granular artefacts.

## Canonical

1. **Render stems offline at build time from the same synthesis path.** None of the proof's code is wasted — it becomes the renderer.
2. **Keep live synthesis only where audio must be continuous rather than a clip.** The F2 tap gradient above all: doc 28 makes tail length the puzzle's entire interface and it cannot be a fixed clip.
3. **Commission the themes as MIDI, not audio.** This engine plays them, the character stays ours, and the tuning arc stays one parameter. Six short themes on four instruments remains a small, well-specified job.

## The caveat, which is binding on me and not on the builder

**The agent that built and verified this cannot hear.** Every character claim in it is measured, not listened to, and it said so. **Tyler must audition the fiddle and the held final C♯ before any commission is placed** — the fiddle conclusion is the one the recommendation turns on, and neither the builder nor I can check it.

**Recorded as a general rule: an agent that cannot perceive the output must state so and name the specific human check its conclusion depends on.** This one did, unprompted, and it is the right shape for every judgment of this kind.

## One bug worth carrying forward

`connect(osc.detune)` holds a strong reference to every oscillator forever. Sixty seconds of music left **799 live note-graphs and climbing**; with explicit teardown, 27. Anyone building "one parameter threaded through every voice" hits this.


---

# 50 · DOC 32 IS BINDING — and it found three live bugs

`docs/32-animation.md` is adopted. It governs chores, arbitration, interruption, idles, direction and scale, talk, comic reaction and NPC performance.

**The gap it fills:** doc 22 says a chore plays during an interaction and doc 31 makes it step two of every successful action. **Nothing ever said what a chore is.** It is now a named authored timeline with frames, holds, anchoring, markers, an interrupt policy, a skip policy and a deterministic settle pose — not a clip name plus a guessed duration.

## Three live bugs on main

1. **Thad's idle may not be redrawing.** `Actor.update` reports no change for clock-derived idle turnover, so `GameScene` may not repaint him until some unrelated cycling or ambient event happens. **Errata 35b's breath is implemented and may be invisible**, depending on what else in the room happens to move. Fix before judging any idle art.
2. **`SequenceRunner.cancel()` does not cancel animation.** Clearing the runner leaves `Actor.special` owning the body until its timer expires, so a cancelled cutscene keeps performing.
3. **`ActorSprite` falls back to the first available clip when one is missing** — a broken build displays an unrelated front idle and looks plausible. Same family as the render nothing regenerated and the check that validated its own assumptions. **Missing required performance becomes a build error.**

## The rules that govern the remaining 26 characters

**"A room satisfies the motion rule with one or more calm, persistent, compositionally appropriate performances. It does not need every figure to loop, and adding more motion can weaken deadpan staging."**

That corrects the direction errata 35a could be read as pointing. 35a stands — every room has at least one animated sprite — but it is a floor, not a target.

**The foot-plant rule:** a transition from locomotion to acting may not freeze a splayed stride, slide the feet into pose, or rotate and change scale in one rendered frame. Reach a planted frame, then turn, then act.

**No runtime mirroring.** Frame-left lighting, costume asymmetry, props and comic eye direction make left-into-right visibly dishonest. Four authored facings.

**Deadpan:** *"Do not fill the reply pause with random flapping. Stillness is a performance state."*

## Precedence

Doc 32 governs animation and performance. It changes no written line, no puzzle solution and no room composition. It upholds errata 35e — motion is never information — and restates it as non-negotiable in its opening.

It also marks doc 15's "three sizes, three views" as stale: errata 24's four directions and two drawn sizes govern, and the current Thad data already follows that structure.


---

# 51 · DOC 33 IS BINDING — load is not atomic, and there is no title flow

`docs/33-save-shell.md` is adopted. It governs save, load, slots, title, pause, options, restart and return-to-title, and it coordinates docs 29–32 rather than replacing them.

**It exists because all four previous bibles introduced transactional state** — dialogue transactions, puzzle transactions, chore handles, committed-versus-cancellable transitions — and nothing specified what a save means during one.

## Two live bugs

1. **LOAD IS NOT ATOMIC.** The current implementation restores flags and dialogue **before** assigning the room and collections. An error partway leaves the running game half old and half loaded. **This is the corrupted-save class, and it is the one bug that permanently destroys trust in a game whose entire premise is that experimentation is safe.** Candidate construction off the live state, deep validation, then one swap.

2. **`BootScene` AUTO-LOADS THE AUTOSAVE AND STARTS `GameScene`.** There is no real title flow — the title screen we composed is decorative rather than the entry point. CONTINUE, NEW GAME, OPTIONS and CREDITS do not lead anywhere yet.

## The insight I had not reached

**Saving is a mouse-only problem.** MI1 asked the player to type a save name. Errata 39 and 28b make this game mouse-complete, so **the game must name saves for the player** — and the constraint produces something better than typing:

```
1  MAIN STREET
BY THE HOTEL  ·  1H 42M  ·  20M AGO
```

Composed from an authored room `saveLabel` and a stable `saveLandmark`, using **the place the player can already see** — never an act title, chapter name, objective, puzzle count, reputation reading or completion percentage.

**A save label is not a hint.** That is the same discipline doc 31 applies to puzzle feedback and doc 05 applies to the three load-bearing LISTEN lines, arriving in a third place independently.

**All 42 rooms must declare a `saveLabel`, and large or revisited rooms declare landmarks by anchor.** Validation rejects a reachable stable checkpoint carrying only an internal room id. That is authoring work and it lands on the room content documents.

## Three rules worth restating

- **`SaveCoordinator` is the only write gate.** No scene, dialogue runner, puzzle action, transition, chore, shortcut or menu writes storage directly. `enterRoom()` currently writes during a state change and must stop owning persistence.
- **No resumable mid-transaction save in the first release.** A queued request waits for the next declared checkpoint or final settle.
- **No HINTS, DIFFICULTY, PUZZLE ASSIST, OBJECT HIGHLIGHT, QUEST LOG, TIMER or completion setting** exists in options now or later without a new binding ruling.

## Precedence

Doc 33 governs persistence and the shell. It changes no written line, no puzzle, no room composition. Where it conflicts with an earlier ruling on saving or the shell, doc 33 wins; errata 39's integer-scaling and fullscreen rules and 28b's click model are upheld by it, not replaced.


---

# 52 · DOC 34 IS BINDING — the five guides do not compose, and the errata's precedence rule is broken

`docs/34-architecture-audit.md` is adopted **whole**, including its section 10 directive and its stop condition.

## The verdict, and it overrides my queue

**Do not implement docs 29–33 in sequence.** Each is correct in its own domain. Implemented one after another, the **order would decide semantics accidentally** — dialogue committing before puzzles, saving pausing the clock it is waiting on, loading cancelling work another guide calls irreversible. Five correct local systems owning the same moment independently.

**One cross-system `RuntimeCoordinator` comes first**, then one integrated vertical proof. Not five horizontal frameworks.

**And it corrects the question I asked.** A chore handle held by a dialogue transaction inside a room transition during an autosave **should not be supported as four nested owners. That shape is illegal.** One root operation, optional child presentation handles, and a save request observing the next stable checkpoint.

## Three findings I own

**1. This errata's precedence rule is broken.** It opens with "errata always wins," and then rulings 44, 45, 48, 50 and 51 adopt guides that win within their own domains. **Linear "latest wins" is unsafe, and the numbering skips 40**, so number order cannot serve as precedence. Doc 34's domain matrix governs, and a consolidation pass with a supersession index is now required rather than optional.

**2. The scope verdict, quoted because it is correct:** *"The project has enough specification to build the same two proof rooms several more times on paper. It does not yet have Act I."* Fifty-one rulings and thirty-four documents against two finished rooms. **From this point more global rules are more likely to create conflicts than quality.**

**3. The coffin is a requirements impossibility.** A three-minute no-interface scene cannot also be mouse-only accessible. Not an engine limitation — a contradiction between doc 05's staging and errata 39/28b's access rules, both of which I wrote. **Doc 34's reveal-on-intent overlay is adopted**, along with its four-minutes-sealed / three-minutes-black reconciliation of Hob's line.

## Amendments doc 34 makes, all adopted

- **Ruling 35e is narrowed.** "Motion is never information" governs **ambient and relevance** motion. **Direct action feedback is legal** — F2's ripple is the sound drawn, not a hint. **Room 33's puzzle-gated lamp stop is struck** (doc 18 and errata 35e's item 8). **Room 32 is exempt from the animated-sprite floor.**
- **The F2 tuning arc moves to the confirmed-void reveal.** Elapsed time would make waiting advance the dramatic state; proximity would turn the music into a hidden meter. Doc 28 is amended.
- **Errata 43's topology is adopted now:** 44 screens. Stale 42 and 41 literals are replaced everywhere.
- **Doc 03's "Duel Four" and its four-duels header** need one canonical migration to errata 4's three duels and two sparrings before implementation.

## The stop condition, and it binds me

> **No new global design ruling until the integrated proof action, the canonical street loop and a safe save/load/title flow are executable.** New findings enter a finite issue list unless they expose data loss, unwinnability, inaccessible control, or a direct canon contradiction.

I have written fifty-two rulings in two days. **This is the last one until that condition is met.**

## What doc 34 says is already right — and to stop refining

The title and premise; the no-death/no-hint covenant; the wasted-option doctrine; text-only speaker-aware dialogue; 320×200 with the locked palette and integer scaling; walk boxes, feet anchoring, decimation and clip planes; the procedural art pipeline; the validators' honesty; Main Street's spatial premise; Room 1's dramatic beats.

**Stop revisiting all of it.**


---

# 53 · TRACE, DO NOT COMPOSE — supersedes errata 14

*Permitted under errata 52's stop condition as a direct canon contradiction: errata 14 and docs 11 and 12 make procedural composition canonical, and it is now the wrong method. No other global ruling follows until doc 34's condition is met.*

## The ruling

**The remaining 40 rooms are TRACED from a quantised reference, not composed procedurally.**

A high-resolution composition brief is generated per room, downsampled to 320×144 and quantised into the locked 256. **That quantised image is a finished, legal, on-palette room** — 54 indices, zero unmapped pixels — and it is traced and hand-corrected at native scale rather than reconstructed region by region.

**Errata 14 is superseded.** Procedural composition was correct when the alternative was an anchor-image method that drifted; it is not correct now that the reference itself lands on-palette.

## Why, and it is not the obvious reason

**Reconstruction converges on tone and composition first — those are global and measurable — and runs out of budget on object interiors, which are local and are the actual craft.**

Room 1's final gaps were all objects correctly placed, correctly lit, at the right value, with less drawn inside them: a coach body that never terminates, four horses reading as one shape, a flat panel where a shack should have planks. **That is reconstruction's failure mode, and tracing starts where reconstruction ran out.**

The second argument is the metric problem. Every instrument in the Room 1 run existed to answer *is this close enough to the reference*. **If the source is the reference, that is a pixel diff** — and four rounds were spent arguing with instruments that were wrong three separate times.

## Three conditions, all binding

**1. A quantised image is not a legal asset until its reserved bands are corrected.** A quantiser optimises colour distance and knows nothing about which palette entries mean *this pixel animates*. Measured on Room 1's bar:

| Reserved band | Purpose | What the quantised bar contains |
|---|---|---|
| `accent_gold` 225–228 | The lantern flame, cycled at 0.6 Hz | **0 pixels** |
| `accent_indigo` 239–241 | The road puddles, cycled at 0.25 Hz | **486 px, bbox (15,8)–(318,143)** |

**The lantern would be dead and the sky would shimmer with the puddles.** Both failures are silent. **This is a build check before it is a workflow.**

**2. Movable objects come from companion generations, not from cutting.** Cutting a layer out of a trace leaves a hole with nothing behind it — Room 1's coach is 5,959 px and the engine needs the hillside, road and fence when it departs. **Ask the generator for the same scene without the object, quantise both, and the layer is a difference between two images** — the current technique with the generator in place of the composer. This is the rule, not an optimisation.

**3. Composition and hotspot geometry are decided BEFORE tracing.** A composed room can be told to move a sign four pixels; a traced one needs a regeneration that will not reproduce the rest of the frame. With 45 puzzles needing hotspots aligned to art, **that cost is felt during puzzle work rather than art work.**

## What this changes about the audits

**The audits become acceptance tools rather than construction tools**, which is a better job for them. Rulings 16, 17c, 18, 41, 42 and 46 still govern — they now verify a trace rather than steer a composition.

**Docs 11 and 12 are revived and inverted:** doc 12's subject blocks become the per-room generation briefs, and doc 11's downsampling pipeline becomes the tracing input rather than a fallback.

## Scope

**This changes nothing today.** Doc 34's stop condition holds, Act I comes first, and Rooms 1, 2, 3, 5, 13, 18, 19, 29 and 36 stay as composed. It governs the remaining 40 when room art resumes.


---

# 54 · THE PRESENTATION SPEC IS REPLACED — 1920×1080, no locked palette

*Permitted under errata 52's stop condition as a direct canon contradiction: the presentation layer specified across docs 06, 11 and 18 describes art the project no longer produces and can no longer produce. Nothing else follows until doc 34's condition is met.*

## The ruling

| | Was | Is |
|---|---|---|
| Window | 320 × 200 | **1920 × 1080** |
| Play area | 320 × 144 | **1920 × 864** |
| Verb panel | 56 px | **216 px** |
| Colour | 256-entry locked indexed palette | **Full RGB. No index palette.** |
| Character height | ~40 px, two drawn sizes | **240 px**, Monkey Island's 27.8% of the play area, scaled by depth from there — corrected below |
| Scaling | Decimation, errata 24 | **Ordinary filtered resampling** |
| Font | 1-bit hand-authored 5 × 7 | **Replacement required — unspecified** |
| Background animation | Palette cycling, doc 18 | **None. Mechanism removed.** |
| Generation size, gate section 6 | 1600 × 720 exactly | **5× the room's authored width — void under this ruling; generate at play-area size** |

## Why, and it was measured rather than argued

The project owner supplied a generated Room 1 plate and stated it was the target quality. Three measurements decided it:

**1. Resolution was costing almost nothing.** Downsampling that plate from 1870 × 841 to 320 × 144 introduced a mean error of **2.99** out of 255. The dithered texture that makes the art look rich is high-frequency noise, not information.

**2. The locked palette was costing nearly twice as much.** Quantising the same image to `consolation-256` introduced a mean error of **5.69** — mean per-pixel distance 11.0, p90 23.6. **46% of the frame collapsed into `accent_indigo`**, an eight-entry family, because nothing else in the palette fit the sky or the wet mud.

**3. A palette refitted to the art removed 80% of that.** Same 256 indices, same resolution, entries derived from the actual art: error fell from 5.69 to **1.13**.

So the argument that this look required abandoning 320 × 144 was **wrong**. The resolution was nearly free; the palette was the damage. But the palette was tuned against composed art that errata 53 discarded, and the project owner has confirmed no finished room or character survives — so there is nothing left for a refitted palette to stay consistent with, and indexed colour buys nothing it does not also cost.

**Full RGB is therefore chosen not because 320 × 144 failed, but because the constraint it existed to serve no longer exists.**

## What this supersedes

- **Doc 11 in full.** The pixel-art direction, the resolution table, the downsampling pipeline, the 5× integer display rule.
- **Doc 18 in full.** Palette cycling requires an index palette. **Room 1's `hobs_lamp` and `puddles` cycling declarations are void** — see also issue X5, which found the mechanism was background-only and could never have animated a sprite lamp.
- **Doc 06's presentation section.** Resolution, palette, font.
- **Errata 24's decimation scaler.** Its two-drawn-sizes finding was about a 40 px character and a mechanism that no longer applies. Characters now scale by ordinary resampling.
- **Errata 39's integer-scaling rule.** Its fullscreen and mouse-completeness rulings stand.
- **Doc 35 gate section 6's size clause**, already amended once by issue X2.
- **`art/palette/consolation-256.json`** ceases to be authoritative. Retained for reference only.

## What it does NOT touch

Every written line. Every puzzle. Every dialogue tree. The reveal schedule. The room topology. The verb model and errata 28b's click rules. Doc 33's save and shell architecture. Doc 34's coordinator verdict and its stop condition. **This is a presentation ruling and nothing else.**

Doc 29's movement, occlusion and camera rules stand; only the pixel figures in them are restated at the new scale.

## Consequences that are now open work

- **The 5 × 7 font is unusable at 1920 × 1080** and has no replacement specified.
- **Sprite scaling by depth** needs a per-room scale curve; 240 px is a reference height at the curve's mid zone, not a character's size.
- **Room 1's plate is 1870 × 841** against a 1920 × 864 target. A 2.7% upscale is accepted rather than regenerating a plate the project owner has approved.
- **The character pipeline is `docs/38`**, and it exists because of this ruling.
- **Animation replaces palette cycling** as the only way anything in a room moves. Every room's motion floor under errata 35a now costs sprite frames.

## Correction: the character height

**This ruling originally said ~233px at mid-depth. That number was wrong.**

It was derived from Monkey Island's proportions — 27% of play height — and never checked against Room 1's plate once the plate existed. Measured against the picture instead: the fence's far-left post runs from row 520 to row 680, 160px, and the project owner reads its top as chest-to-shoulder height on a man. That gives **~205px at that depth**, and it cross-checks — the fence then works out to 4.5 feet, right for a frontier rail fence.

**CORRECTED AGAIN: 205 became 240.** The fence reading was circular — "the top reads as chest-to-shoulder" was an eye judgement, and deriving a height from it dressed an intuition as a measurement. The wagon wheel at bottom left is a second, independent anchor, and checking the two against each other is what exposed it. At 205 the protagonist was 23.7% of the play area against Monkey Island's 27.8%; 240 matches the reference this game is built on.

**240 is an anchor, not a fixed height.** Characters scale with depth; 205 is the height where the fence stands, roughly where Thad talks to the driver. It is the first real data point for the per-room scale curve, which had none.

Recorded in full as Q21 in `docs/36-issue-list.md`.

## Precedence

This ruling governs presentation. Where any document conflicts with it on resolution, palette, scaling, font or background animation, this wins. It is the last global ruling until doc 34's stop condition is met.

---

# 56 · THADDEUS IS WRITTEN, AND THE VOICE IS LA-FLAVOURED. ERRATA 49'S MECHANISM STANDS; ITS REASONING IS FOOTNOTED.

Two rulings by Tyler, from listening, which is the only way either could have been settled.

## 1 · The THADDEUS melody

Doc 28 describes the theme and nobody had written it, so Room 1's bed — cue `O-02-M` — did not exist and could not be produced. It exists now, in the proof, and every choice answers a sentence of the brief.

**Four bars of 3/4 at 76, G major, solo fiddle, unaccompanied.**

| The brief | The setting |
|---|---|
| *"in a different metre from everything else in the score"* | CONSOLATION is 4/4 at 152 with a jaw harp on the offbeats — a town dancing at itself. THADDEUS is 3/4 at 76: half the speed, in a bar that will not fit inside the town's. A waltz among reels is foreign before a word is spoken |
| *"Thad is not from here"* | G major, not the town's D. G is its subdominant — related, plainer, and where a New England hymn tune sits. In D he would have been a variation on Consolation |
| *"earnest, plain"* | Stepwise throughout except one rise to the fifth in bar two, held. It is the only ambitious thing he does and he comes straight back down from it |
| *"He does not get to finish a thought in his own game"* | It ends on the third, not the tonic. A tune that has stopped rather than finished, wanting a fifth bar it does not get |

He plays at the town's −35 cents. **The flat is the place, not the man** — he is not from here, but he is here.

**It is a placeholder in the same sense CONSOLATION's melody is**, and both are now equally canonical: written against doc 28 because no notated score exists there, and replaceable by anyone who writes a better one.

## 2 · The voice: LA-flavoured, not bowed and not FM

Three 1990s were on the table and they are not the same sound. **AdLib/OPL2** is FM — buzzy, metallic, the sound most people mean by "PC game music." **The Roland MT-32** is LA synthesis — warmer, rounder, and what LucasArts composers actually wrote for. The proof's original voices were neither: summed partials, quantised to 10 bits and rolled off at 11 kHz, an evocation of the era by a third route.

Auditioned against each other on the same tune and the same tuning. **The LA-flavoured voice is canon.**

**IT IS A MANNER, NOT AN EMULATION, and the difference is stated so nobody later mistakes it for one.** LA synthesis pairs a very short *sampled attack transient* held in the unit's ROM with a synthesised sustain. Those samples are hardware ROM — emulators require them supplied separately and this project has none. The transient here is **constructed**: bandpassed noise plus a high inharmonic ping, gone inside 40ms.

The structure is the real borrowing, and it is what makes LA timbres warmer than FM or than summed partials:

1. a hard inharmonic transient, gone before the ear has decided what it is hearing;
2. **one** filtered sawtooth, not three detuned ones;
3. a **resonant low-pass whose cutoff is the envelope** — open on the attack, closing through the note.

Item 3 is the whole character. Putting the envelope on the *filter* rather than only on the amplitude is what the ear reads as an instrument rather than an oscillator.

## 3 · Errata 49 is not reversed

Its mechanism stands unchanged: **render stems offline at build time from the same synthesis path**, because live synthesis costs 12.9% of a core for one theme — 25–50% on a Chromebook — against a decoded stem's ~1%.

What is footnoted is its *reasoning*. Errata 49 argued for stems partly because "a synthesised solo fiddle is the most recognisable *this is a computer* sound in game audio, and it would be playing during the moment the game is about." **Tyler has ruled that sound the goal rather than the problem.** The conclusion is unaffected — the stems are rendered from this synthesis either way — but no future reader should cite that sentence as a reason to commission recorded instruments.

Errata 49 item 3, "commission the themes as MIDI, not audio", is likewise satisfied rather than superseded: the themes are note data in the proof, which is what a MIDI commission would have delivered.

## Outstanding

**RESOLVED, SAME SITTING: all four instruments are LA-flavoured.** Piano, jaw harp and harmonica were rebuilt in the same manner and CONSOLATION was auditioned entire against its original. Tyler took the LA version of both themes. The town and its protagonist are one machine.

Two findings from building the other three, worth keeping. **The MT-32's pianos are famously not very piano** — a hammer thock, one saw, a filter that shuts fast — and CONSOLATION is piano-led, so the piano carries the ruling rather than the fiddle that prompted it. And **the jaw harp barely changed**, which is informative rather than a failure: a twang IS a transient with a formant falling off it, so it was already built the way LA builds everything, and the LA version only moves the sweep into the filter's resonance.

**The offline renderer is written and has never been run.** `tools/render-music.mjs` drives the proof itself in an `OfflineAudioContext` — the proof exports `createEngine(ctx, opts)` and takes any context, so there is no second copy of the synthesis, which matters because two synths agree today and drift a semitone apart in a month. It needs Chromium and was written where none could be installed, so it is unproven until somebody runs it. `manifest.music` names both stems; `Music.ts` treats a missing file as silence, so the game is unchanged until they exist and plays the moment they do.

---

# 57 · EVERY DIALOGUE OPTION AUTHORS ITS OWN AFTERMATH — R1 RULED, ERRATA 37 SUPERSEDED

Tyler's ruling, doc 47's R1, taken with the maximal option on the table: not a default with
overrides, but **`afterUse`, authored, on every option in every tree.** There is no engine
default to fall back on; an option without an aftermath is a build failure, the same way a
hotspot without a LISTEN line is.

## Why errata 37's revocation does not bar this

The revocation stood on three legs and two are gone. **"Removal reshuffles rows"** died with
doc 30's performance loop: the list is hidden during the exchange and rebuilt after, so nothing
ever moves under a cursor. **"A rule where some options vanish cannot be learned"** argued
against a universal *tag-based* rule and was right — but this is not a rule, it is authorship,
which is what Monkey Island actually did: the script rebuilt the list, per conversation.
**"Nothing here is long enough to need pruning"** still stands, and is why `afterUse` is about
feel, not necessity — a conversation that can end differently than it began.

## The vocabulary

| `afterUse` | On rebuild, the option… |
|---|---|
| `retain` | stays, greys, remains selectable; its repeat responses are written content |
| `remove` | is gone. Its work is done and the conversation has moved past it |
| `rephrase` | stays but its text changes (`rephraseTo`), because the answer changed the question |
| `replace` | is replaced by a different authored option (`replaceWith`), a new door where the old one was |
| `counted-repeat` | stays at full weight, not greyed; tracks its count; responses are indexed by it. Winnie's raccoon is this, five deep |

## Constraints that survive from errata 37 and doc 04

- **A tree must always be leavable.** An option that ends the tree may not `remove` itself
  unless another ender is live in every reachable state. Validator-enforced, not convention.
- **`HOB_C1` option 4 authors `retain` and looks exactly like its neighbours.** The comic
  option that solves the mystery must be indistinguishable in data-visible behaviour from the
  comic options that don't. Doc 04 implementation warning 2, restated here because `afterUse`
  is a new place to accidentally leak it.
- **Doc 30 §1's "errata 37 is preserved exactly" is amended by this errata** — the preserved
  part is the *content* obligation (repeat responses are written, spent options may remain
  meaningful), not the universal mechanism.

## Notation and enforcement

In doc 04, the tag cell carries the aftermath: `[PROGRESS · remove]`, `[COMIC · retain]`,
`[TOPIC · counted-repeat]`. The compiler emits it as `option.afterUse` (with `rephraseTo` /
`replaceWith` where those verbs are used). **The existing spine tables are not retrofitted:**
W1 rewrites every tree to full branches, and the aftermath is authored there, once, per option,
as each tree is grown. `check-dialogue-afteruse` runs permissive (legal values, leavability)
until the first W1 tree lands, then strict: every option declares, or the build fails naming
the tree, node and option.

## For the dialogue rebuild in flight

The performance loop's step 8 was withheld as Tyler's; it is now ruled. The rebuild's CHOOSING
phase rebuilds the list from `afterUse` rather than from the universal grey rule. Until W1
content lands, every existing option behaves as `retain`, which is bit-identical to today.

---

# 58 · MAIN STREET IS INTO DEPTH — Q2 RULED, ERRATA 43 AMENDED

Tyler adopts the resolution recorded in doc 36 Q2, unchanged: **frame right stays east** — the
coach's departure and the road home, so `road_east`'s line ("Home is that way. It is eleven
hundred miles that way") stands unaltered — and **the route to Main Street is into depth,
toward the visible town**, with Main Street receiving Thad at a far-depth entrance per doc 29's
road-into-depth transition. Errata 43's west-to-east ordering drops its cardinal wording, which
was never load-bearing.

**The ruling ratifies the game as shipped.** Beat 11's traced path already walks him into depth
toward the town lights, back to camera, out the exit named CONSOLATION — the mud beat and the
title were built on this reading. `road_west → main_street` is conceptually correct as wired;
the exit rect's re-derivation remains Q4's, unchanged by this.

**Room 2's plate brief follows directly:** the player arrives from depth at the far end; east
— frame right — is the way back toward the stage road.

*Clarified same week, against doc 36 D7:* the street itself is **lateral and wide** — Main
Street is authored wider than the viewport (3840×864, two screens) with the camera following,
per D7's ruling that scrolling and errata 43's three-screen topology are orthogonal. Errata
58's "into depth" governs the ARRIVAL: the stage-road connection enters as a road from depth
at the street's east end, and Thad walks down it into the lateral street. The 320×144 room-02
plate in the repo is retired-presentation placeholder art and is replaced by this generation.

---

# 59 · `sound` RETURNS TO THE SEQUENCE RUNNER, FENCED — ERRATA 28a PARTIALLY REVERSED

Tyler's ruling. Errata 28a struck `sound` and `musicTransition` from the first cut; three
scripts now need the first of them — the case hitting the mud (O-06-S1), the Listening's
score-state coupling, and the county seal at the filing — and the ruling reinstates it **on
`wait`'s exact fence: legal only in beats whose control is `none`.** A cutscene may place a
sound on a beat; gameplay may not, so the town never becomes a soundboard, which was 28a's
whole fear and it stays answered.

`musicTransition` stays struck — beds follow rooms (Music.ts) and layering is doc 45's next
mechanism, not a sequence step. The Listening's coupling is score-*state*, driven by the puzzle
rather than by staged steps, and will be specified with the mechanic; this errata only
unblocks the two one-shots and the pattern.

Implementation: an eighth step kind `{ do: 'sound', src, gain? }`, same missing-file-is-silence
contract as the beds, same validator posture as `wait` — staged outside a control:none beat is
a build failure naming the beat.

---

# 60 · ACT IS A NUMBER — Q5 RULED

Tyler adopts the act field as proposed. **`ACT` is a numeric counter in game state, written at
exactly four places: the act turns in doc 48's scripts** (S1 sets 2, the funeral's opening sets
3, S4's close sets 4). Nothing else writes it; content never reconstructs "which flags mean Act
II" from constellations, which is how drift happens.

**Authoring:** any hotspot, response, or staging step may carry `act: 2` or `act: "2-3"`,
compiling to `when: { ACT: { atLeast, atMost } }` — sugar over the existing Condition machinery,
constraining nothing. Visual state changes across acts compile to ruling 19a's paired gates, as
they always have.

**The part that earns the field is validation:** with explicit ranges the compiler checks
*coverage* — a hotspot live in Acts I and III with nothing covering II is an authoring hole
named at build time, not a hotspot that silently flickers out of existence for a third of the
game. No flag-based scheme can ask that question.

R4 is ruled in the same sitting: **Hob's "Wouldn't stand there." is about the mud**, recorded
in doc 04 beside the line. It is a practical warning wearing gnomic clothes, paid off when the
mud takes Thad's boot minutes later, and it obligates nothing in Act III. The handwriting
option remains the game's only throwaway-that-mattered, by design.

---

# 61 · THE TWO READING HOLDS ARE DELIBERATE, NOT DRIFT

Recorded because it has now been reported as a defect twice, both times by
Claude, and both times it was not one.

| Consumer | Formula | Tuned by |
|---|---|---|
| `GameScene.lineSeconds` — the opening, examine lines, cutscene says | `max(1.6, glyphs × 0.045)` | watching the opening |
| `DialoguePerformance.readingHold` — utterances inside an exchange | `clamp(1.8, 8.0, 0.45 + glyphs × 0.055)` | doc 30 §4.1, binding for dialogue |

**Merging them retimes the opening**, which is signed off. They are separate
because they are answering different questions: how long a line hangs in a
scene nobody is talking in, and how long a line hangs between two people who
are. Doc 30 §4.1 binds the second and says nothing about the first.

The one thing they must share is the EXEMPTION, and they do: `setSay` expires
a line on the first formula unless `dialogue.isActive`, because during an
exchange the performance owns the clock and two timers would race. That guard
is why `01d353a` and the performance loop composed without a change — though
`01d353a`'s stated reason ("an exchange holds its line until the player
clicks") went stale the moment the performance landed, and is superseded here.

**If a future pass wants one formula, it is a retune of the opening, watched,
not a refactor.**

**SUPERSEDED — one formula, and the retune is owed.** Tyler's ruling: merge
them. `GameScene.lineSeconds` now calls `readingHold`, `lineSecondsPerGlyph`
and `lineSecondsMinimum` are gone from `ui.json` and from the schema, and doc
30 §4.1's four constants are the only reading hold in the engine — which is
also what §4.1 asks for, one timing service owning scripted, dialogue and bark
alike.

**What it cost, measured rather than estimated.** Every one of the opening's
fifteen lines gets longer and none gets shorter. Its speech runs **25.9s →
31.2s**, a fifth again. The longest line in it is 73 glyphs — 3.28s before,
4.46s now — so the 8-second ceiling never fires in the opening and the whole
difference is the base and the rate.

**The watch is still owed.** This paragraph is the refactor; nobody has yet
watched the opening at the new timing. If it drags, the four numbers in
`ui.json` are where it is fixed, and lowering them retimes dialogue with it —
which is the coupling this errata was recording in the first place.

---

# 62 · THE EXISTING BITMAP FACE IS THE SHIPPING FACE — ERRATA 54's FONT VOIDING REVERSED, Q6 AND Q16 CLOSED

Tyler's ruling, and it closes the longest-standing open item errata 54 left.

**The existing 1-bit hand-authored face is retained as the canonical runtime
typeface.** Not provisionally, not until something better lands — retained.

| Region | Scale | Drawn by |
|---|---|---|
| Play area — speech, dialogue options, act cards | `GLYPH_SCALE` **6** | `BitmapFont` |
| Verb panel — sentence line, verb labels, inventory | `PANEL_GLYPH_SCALE` **4** | `BitmapFont` |

**Errata 54's line "the 5 × 7 font is unusable at 1920 × 1080" is reversed on
its conclusion and stands on its facts.** It was unusable *at 1× in a frame six
times larger*, which is what it was doing when that sentence was written. It is
not unusable when scaled, and the scaling landed under Q6. What was left open
after that was a preference, and Tyler has been reading and approving the
presentation this whole time — which is the evidence that settles a preference.

## What this ends

- **Q6 and Q16 are closed.** No replacement face is required or wanted.
- **`docs/51-font-decision-sheet.md` is reference only.** The four candidates,
  the sheets under `renders/font-candidates/`, `tools/font/`, and
  `engine/render/PreviewFont.ts` are retained as a diagnostic and as the record
  of a question that was asked and answered. **None is a shipping path.**
  `PreviewFont` remains dev-only behind `?font=`; with no query parameter the
  build is bit-identical to one without the file.
- **The build ledger's `font-decision` item is resolved**, and the rooms
  blocked on it are no longer blocked on it.

## Glyph coverage was never the problem, and is already satisfied

The rule stands: **extend the existing face, never swap the typeface.** It does
not need extending today. All seven characters CLAUDE.md names —

```
'  '  "  "  —  –  …
```

— are present in `art/ui/font-5x7.json`, and `check-glyph-coverage` asserts
every content string against the face on every run. A future line wanting a
glyph the face lacks is a glyph to draw, not a face to replace.

## The validator that was measuring a frame that does not exist

`check-item-names` compared an **unscaled** glyph width against
`320 − panel.sentence.x × 2`. Three errors at once: 320 was the pre-errata-54
frame; `sentence.x` was 36, a value the ×6 migration had already moved into
screen space; and the width was never multiplied by the scale the panel draws
at. They pointed in opposite directions, so nothing ever failed.

It now measures the real thing: the composed sentence
`ui.sentence.itemTemplate` — the longest verb label, the item, the longest
target name in the game — at `PANEL_GLYPH_SCALE`, against the sentence line's
actual width of 1848 screen units. The worst case in the build today is
**1296 of 1848, 70%**. Widening 320 to 1920 and stopping there would have made
every conceivable label pass, which doc 51 named in advance as a vacuous
assertion bought with a one-line edit.

**No approved font was changed to make a validator green**, and no approved
font may be.

---

# 63 · ROOM SHIPPING DIMENSIONS ARE CANONICAL, AND AN IMAGE API DOES NOT GET A VOTE

Stated as a ruling because it was about to be treated as negotiable.

| | Shipping background |
|---|---|
| **Fixed room** | **1920 × 864** |
| **Scrolling room** | **authored room width × 864** |

Main Street is ≈3700 × 864 because it scrolls. **Room 5 is a fixed room and its
shipping plate is therefore exactly 1920 × 864.** Room 5's JSON is already
authored in that coordinate system; the legacy 320 × 144 Room 5 plate is
obsolete art, not a dimensional specification.

**No generation tool redefines a room's dimensions to match what a model can
return.** The direction of accommodation is fixed: the source is adapted to the
room, never the room to the source.

## The provisional source-acquisition transform — ROOM 5 PILOT ONLY

`gpt-image-2` returns 1536 × 1024 landscape and cannot return 1920 × 864. For
the Room 5 pilot, and for nothing else yet:

```
API source           1536 × 1024        kept untouched
crop                 x 8, y 170, w 1520, h 684      exactly 20:9
resample             1520 × 684  →  1920 × 864      deterministic, ordinary filtered
```

The prompt must place the intended playable composition inside a central 20:9
safe region with expendable composition above and below it.

**Forbidden in the derivation:** nearest-neighbour merely because the old pixel
pipeline used it; AI upscaling; sharpening; denoising; recolouring; contrast
enhancement; and any generative second pass whose purpose is reaching the
shipping dimensions.

**Both artefacts are preserved** — the untouched source and the derived
candidate — and provenance records the source path and hash, the crop
rectangle, the exact resampling algorithm, and the derived path and hash.
Source-level gates run on the source; every shipping-level gate runs on the
derived 1920 × 864 candidate.

**THIS IS PROVISIONAL AND DOES NOT BECOME A FORTY-ROOM RULE BECAUSE THE COMMAND
EXECUTES.** Tyler's full-frame review of Room 5 decides whether this
source-to-shipping treatment is visually acceptable, before Room 6 exists.

---

# 64 · ACT I MAIN STREET IS NIGHT, AND ROOM 5 INHERITS THE STREET'S STATE — OWNER RULINGS

Tyler's rulings of 2026-09-04, on `proofs/room-05/time-of-day-audit.md`. That
audit found the canon split on Main Street's own time of day — doc 13, doc 16,
doc 26, doc 12 and errata 43 saying day; doc 17, Room 1's lines about the town,
errata 58, doc 35's gate ruling and the signed-off plate saying night — and
found Room 5's daylight candidate entered, in the built game, from a night
street. These four rulings resolve it. Canon reconciliation only: no image was
generated or edited, no API operation spent, no geometry, Winnie or proof
artefact touched, nothing promoted, Room 6 not begun.

## 64a · The canonical Act I / base presentation of Main Street is NIGHT

Based on, and preserving: Room 1's explicit night opening (doc 17); the direct
Room 1 → Main Street continuity (doc 17 beat 11, "he is still walking when
Main Street arrives"; Room 1's THE ROAD WEST, "A town, at night, half of it
asleep"); the signed-off Room 2 plate `art/backgrounds/room-02-main-street.png`
and its declared lamps; the town lights in the opening (errata 58, "toward the
town lights"); and the approved Nugget interior's night exterior views.

**Any prior prose saying the Act I / base Main Street state is daylight is
superseded where it conflicts.** Reconciled with this erratum:

- `docs/13-room-02-content.md::PART TWO` — THE MUD · PICK UP now reads
  *"I have picked up some mud. I am now a man holding mud, in a street, at
  night."* (Tyler's wording; the joke otherwise untouched.) Re-extracted into
  `content/rooms/main-street.json` by the normal pipeline.
- Errata 43's "both exteriors, both day" for Lower Street and the Lane —
  superseded: both inherit Main Street's night. Errata 43's "same time of day"
  stands, and now means night. Inline pointers left at the original lines.
- The two statements that Room 1 is "the only night exterior in the game"
  (errata 17-era rationale; errata 33/35-era Hob note) — no longer true as
  stated; inline pointers left. Room 1 remains the only exterior whose sole
  light is carried.
- `docs/12-art-prompts.md` row 35's "warm low sun" for the base street — doc
  12 is already superseded as final spec (doc 11, then errata 54); noted, not
  edited.

**Two written lines conflict with this ruling and are NOT rewritten here**,
because they are comedy and replacement wording is Tyler's, not the
pipeline's — exactly as the mud line was: `docs/16-room-03-content.md::THE
FRONT DOORS → Room 2` LOOK 2 *"Daylight past them. It is always a surprise."*
and `docs/26-batch-a.md` the hotel's STREET DOOR LOOK 3 *"Daylight, past it.
It is always brighter than I remember."* Both describe Main Street from an
adjoining interior in its base state. Recorded under
`docs/36-issue-list.md::Q26 · ROOM 5 NEEDS A NIGHT STATE BEFORE IT SHIPS, AND TWO INTERIOR LINES STILL SAY DAYLIGHT`
for Tyler's wording. *(Resolved the same day: Tyler reworded both as
time-neutral — "The street past them. It is always a surprise." and "The
street, past it. It is always brighter than I remember." — see Q26.)*

## 64b · Room 5 is not permanently daylight

Room 5 inherits the exterior lighting state appropriate to the current
story/world state. For the immediate Act I route — **Room 1 night → Main
Street night → Room 5 night** — the current bright-daylight Room 5 candidate
is NOT the correct Act I shipping state.

**The daylight candidate is NOT rejected and NOT deleted.** It is reclassified
as **ROOM 5 — DAY VISUAL CANDIDATE** and remains the approved source of the
room's composition, spatial layout, geometry ancestry, canonical Winnie design
ancestry, object placement and general visual-style review. It stays useful
for a later daylight-state review. No visual approval is implied by any of
this; `visual_accepted` is Tyler's and is unset.

## 64c · Room 5 requires a NIGHT visual state before it ships

Before Room 5 can be promoted for normal Act I gameplay it requires a night
treatment consistent with the signed-off Main Street exterior. The audit
established that daylight affects more than the glass — the exterior through
the glazed openings, direct floor and wainscot sunlight, directional interior
illumination, shadows, and Winnie's local lighting — so **a window-only
overlay is insufficient.** NIGHT is a genuine alternate visual plate/state,
derived from the SAME accepted Room 5 composition and object geometry.

**Not created yet.** The remaining image operation is not spent on it. It
follows Tyler's visual review of the day candidate's composition, style, scale
and Winnie, and nothing precedes that review.

## 64d · No simulated day/night cycle

This does not authorise a clock, a real-time cycle or a general day/night
simulation. Time of day remains an authored story/world visual state, selected
by canon. Before Room 5's state switching is implemented, determine whether the
existing conditional room/state architecture can select the correct visual
plate from canonical flags; if it can, use it; if it cannot, report the
smallest missing mechanism before building anything global. (Observed at the
time of ruling, not built: a room file carries one `background` path and
`backgroundFrames` for cycling; the `when`/flag machinery of errata 60 gates
hotspots and dialogue, not plates. The gap, if it is one, is a conditional
background, and it is sized when the night plate exists.)

**Room 5's status under these rulings:** CANDIDATE COMPLETE — HUMAN VISUAL
GATE PENDING, WITH REQUIRED NIGHT VARIANT BEFORE SHIPPING.

# 65 · THE STAGE DRIVER'S EXIT ARRIVES AFTER THE THREE ARE ASKED — RECORDED FROM THE BUILD, FOR TYLER TO CONFIRM OR STRIKE

Doc 30 §16 opens its binding Room 1 proof with "the tree opens with four choices in the lower interface." Doc 17 v3.1 writes the driver's four options with no gate. **The build does not open with four.** Since the tree was extracted (`tools/extract-content.mjs`, `room01Driver`), "Thank you for the ride." is gated on `T_DRIVER_ASKED` reaching 3 — a counter each of the other three rows adds to on every selection — so the tree opens with three rows and the exit arrives once three questions have been asked, in any combination. The extractor's stated reason: nothing is removed once present (errata 37 revoked), so the three are always askable and the fourth always arrives; the count is the tree's one reachability condition, and it keeps the exit from being taken before the opening has taught what it exists to teach. **That rule lives only in the extractor and its commit; no document ruled it.** This entry records it, and reads §16's "four choices" as the tree's full set, reached once the three are spent. It changes no runtime behaviour. Tyler confirms it as the rule or strikes it, in which case the extractor drops the gate and §16 stands as written.

**CONFIRMED (Tyler, 2026-11-06; errata 147): "Keep it". The exit arrives after the three questions. No longer open.**

§16's other older line — "the used PROGRESS option is gone" — is already superseded: errata 57 authors every option's aftermath, and until W1's trees land every existing option behaves as `retain` (kept and dimmed). Nothing to add there.

# 66 · ROOM 5'S LATER STATES — OWNER RULINGS A TO K (2026-09-05), AND DOC 08'S RECORDS-ROOM FLOORBOARD SUPERSEDED

Tyler's rulings after the Room 5 playtest-fixture harness (doc 36 Q111) found the later-state sources ambiguous. Each is canon from this entry; the implementation that consumes them is doc 53's contract and a later task. None of this is built here.

**A · The padded log.** Puzzle C4 yields THE PADDED IMPROVEMENT COMPANY SUBMISSION LOG, a real inventory object (item id `padded_log`). C5's successful action — what doc 02's "Show Winnie" means — is **SHOW / USE the padded log on Winnie.** No other trigger. Showing is not surrendering: the log stays held unless a later authored source consumes it.

**B · The C5 state is puzzle progress, not a topic flag.** "Thad knows the queue is padded" (`T_QUEUE_PADDED`, knowledge) and "Winnie has been shown the evidence" are different facts. The second is **puzzle progress: `puzzles.C5 = complete`** in the game state's puzzle namespace (doc 36 Q112 declares it; the save carries it; nothing writes it yet). No topic flag may stand in for it.

**C · WIN_B2 is launched by the evidence action.** A successful use of the padded log on Winnie opens WIN_B2 then and there, its authored opening verbatim. The player is not made to show, leave and talk again.

**D · The second ledger is under the loose floorboard in Room 5, the assay office front.** Doc 05 calls that board critical and says the room "contains the second ledger's hiding place"; doc 25 writes its repeats and overrides around it; the physical board is owner-approved and foreshadows this. **Doc 08's "ROOM 6 — THE FLOORBOARD, LIFTED (after C5)" and its "THE SECOND LEDGER" hotspot are superseded as to location**: one floorboard, in Room 5. Doc 08's lines for those two subjects are not voided as writing; where they are used, they are used in Room 5.

**E · WIN_B3 is canonical, verbatim, and Winnie retrieves the ledger.** She produces it from under the Room 5 floor herself; the player does not pry the board open in early play, and the early override OPEN — "Not with her at the counter." stands. The later implementation stages her physical retrieval; nothing spawns the ledger into Thad's inventory. Whether it stays on the counter afterward is decided when the scene is built. Consequence: doc 04's node rules 1 (three options) and 2 (a COMIC option), which the extractor applied to skip WIN_B3, do not bar it — it is a scene with one row, as written.

**F · The Act II assay is off screen.** WIN_F1's Act IV assay is "the first assay the player ever watches happen", so C6's Prosperity assay is not shown. C6 still delivers its authored payoff — Prosperity worthless, Document B issued anyway, Winnie's five Liar's-Assay pairs (errata 3) — off screen.

**G · No soil-sample item.** Act I already puts a soil assay in Winnie's queue; the item ledger lists no sample. C6 treats the queued assay as already having its material. A contradiction found later is reported then, not resolved by a new item.

**H · Document B is a real inventory item** (item id `document_b`, the Assay of Record): C6 yields it; documents A, B and D are retained as examinable souvenirs. Its examination copy is not authored; that gap is a gap, not to be filled.

**I · The death certificate is a real inventory item** (item id `death_certificate`): E4 yields it, E6 and E9 use it, it cannot be lost. Its examination copy is not authored.

**J · WIN_C1 is canonical, verbatim.** The Act III tree in doc 04 is implemented whole — the retained failed attempts and the one advancing row, "You're right. Forget it.", after which the authored signing exchange plays. Not a yes/no. Consequence, as in E: rule 2 (a COMIC option) does not bar it.

**K · WIN_F1 stands and is not F3/F5.** Fixture R5-G opening WIN_F1 is not gameplay acceptance. The real-gold assay, its outcome and F5's certification (WIN_F2, Room 7) are still to be implemented.

---

# 67 · THE TWO EXAMINE PASSES ARE MERGED — OWNER RULING (2026-10-31)

**Found:** twenty-two rooms were scripted twice. The batch docs (08, 09, 10, late July) wrote each room's hotspots, some in full and some sketched; doc 05's W3 pass (2026-08-04) then wrote a complete set for the same rooms without reconciling against them. The two sets name different objects, or the same object differently (Room 13's *THE TEETH* and *THE JAR OF TEETH*), and each carries plants. Doc 49 uses doc 05's names. The two rooms already compiled (13, 18) use the batch names.

**Ruling (Tyler, 2026-10-31: "Merge them"):** a room's examine layer is **both passes**. Every subject either pass wrote is a hotspot. Where both passes wrote the same object, it is **one** hotspot:
- **name:** doc 05's (the name doc 49 and the later documents use);
- **variant order:** doc 05's line is variant 1, the batch line variant 2, and any repeat variants written for either follow in the order they were written;
- **same-object pairs are declared, never guessed:** a completion section states them as `**DOC 05 NAME** ≡ **BATCH NAME**`. Two names with no declaration are two objects. A pair with an identical name in both passes needs no declaration.

No authored line is cut. Hotspot counts per room grow beyond doc 05's prose counts; those counts describe the W3 pass, not the room. Rulings already made on a batch subject's *location* (66 D, the second ledger) stand.

**The readiness gate implements this:** `examine.merged` names the batch section, `≡` lines fold pairs, and the hotspot-count cross-check compares doc 05's count with doc 05's subjects only.

---

# 68 · Q143 DECIDED — DELEGATED RULINGS (2026-10-31)

**Tyler, 2026-10-31: "I want you to make all of those decisions yourself."** Each ruling below was made by Claude under that delegation and is recorded so it can be reversed by name. The writing they release is in doc 54, doc 04 and doc 48.

**A · A5, the raccoon (Rooms 23/24).** No new item enters the critical path.
- **Naming:** the first TALK TO the raccoon opens `RAC_A1` (doc 04): three names and a `[COMIC]` refusal. Any name sets `T_RACCOON_NAMED` and the hotspot's display name becomes the chosen name; the lines do not change (doc 05: "varies by naming choice").
- **Bait:** USE the **jar of pickled eggs** (bible item list) on the hole. Three more raccoons arrive; they are gone the next time Thad enters. The eggs are spent.
- **Smoke:** USE **Dr. Purvis's Restorative Bile Tonic** (bible item list) on the hole. It fumes; Thad retreats coughing and cannot approach the hole until he leaves and returns. The tonic is spent.
- **Both come from the Mercantile on Thad's account** — PICK UP on THE PICKLE JAR and DR. PURVIS'S TONIC. The account is doc 05's own fact: in Act III the credit ledger shows "My account is ruled off and marked DECEASED." Both attempts are optional, so neither can strand the player.
- **Send Pratt:** Pratt is met at his claim in Act I, next to Prosperity (doc 02 D2: "the only neighbour"). `PRA_A1` (doc 04) asks him; he is bitten; `T_PRATT_BITTEN`. PRA_B1's "How's the bite?" depends on it. **PRA_D2 is the first *jump*, not the first meeting**; its lines need no change.
- **The blanket:** borrowed from the livery man — a new LIV_A1 option (doc 04), because doc 49 makes PICK UP on Grievance's blanket a refusal. USE it on the hole: the hole goes cold, the raccoon leaves for good, `T_WARM_HOLE` is set, and **the blanket comes back into inventory**, so the hole is warm again and its LISTEN never changes. Nothing is set by LISTENING to the hole.

**B · A10 is a puzzle (doc 02 wins over doc 48 S1).** In FAN_A2, options 1–5 retain and grey; only option 6 advances.

**C · `T_SWINDLED` is Deke's** (A3, doc 27 option 6). Doc 48 S1 beat 3 sets a new flag, **`T_DINED`**, instead.

**D · C3/C4, searching the office (Room 11).** While the manufactured funeral runs (C3), Room 11 is drawn without Fanshawe. Only then do PICK UP on THE SUBMISSION LOG and THE STOCK PORTRAIT DRAWER give the padded log and the fake photograph; with him in the room they are refused. Lines in doc 54.

**E · Doc 49's homeless refusals.** A refusal whose object is a placed object under another name attaches to it (Room 9's two; THE SURVEY STAKE; THE SITE ENTIRE; Room 11's GLOBE belongs to **Room 10's** THE PORTRAIT OF FANSHAWE, whose LOOK describes the globe and the thumb; THE RACCOON'S FORMER RESIDENCE is THE HOLE after A5; Room 21's THE DOOR is the shack's exit). The rest — Room 11's THE CONTRACT DRAWER and THE PEN (NO INK), Room 21's THE LAMP RESERVE, THE WALL CALENDAR and THE STOOL BY THE WINDOW — are **retired**: they name objects no room has, and adding objects to hold them would change the rooms.

**F · B3, the Grievance puzzle (Room 15).** No pitch interface. The tuning fork is the tool (doc 02's ledger already spends it at B3). Once the livery man has hummed the tune (LIV_A1 option 4, `T_HUM_HEARD`), USE THE TUNING FORK on Grievance: Thad sounds the fork, whistles the tune corrected, and she moves. Before the hum, the same USE gets a refusal. Lines in doc 54.

**G · Room 27's markers are doc 05's eleven.** Doc 08's eleven names are retired. Doc 08's device survives in one place: the blank marker's LISTEN repeats are "Nothing." Doc 08's THE MARKERS folds into the blank marker; its WORKINGS, SLUICE FRAMES, A BOOT and THE PATH merge in.

**H · The merge's doubled jokes (every "For Tyler's cut" list in doc 54).** Where a merged object shows the same joke twice, the **later** variant is dropped from the sequence, provided three remain; doc 54 marks each as *Decided*. Mechanical corrections are made at source: doc 09's "storey" becomes "story"; doc 09's Grievance becomes "she"; doc 10's "C. PRATT" becomes "N. PRATT"; doc 10's *swept* loses its italics; doc 05's "THE SIGN: NO COLOUR YET" becomes "THE SIGN: NO COLOR YET". **Contradictions keep the version more lines are built on, and on a tie doc 05's (the later pass):** the key rack has four keys out (docs 09 and 26, three lines against one); the mile post reads 1 MI. both ways (doc 05); Pratt's working is the trench (doc 05); the sluice is one community sluice of forty feet (doc 05, which Room 26's mercury flask is chained to). The line that disagrees is dropped from its sequence. The price display is chalked *and* nailed up — no contradiction.

---

# 69 · FURTHER DELEGATED RULINGS (2026-10-31)

*Made under the same delegation as 68 ("I want you to make all of those decisions yourself"), as the writing reached them.*

**A · Room 34 is one room in two states.** Doc 10's Room 34 is the way down (Thad's tunnel, the rock face, the lamp, the fork); doc 05's is the old working the way down reaches after F3 (the timbering, the tended lantern, the even footprints, the seam). Before F3 the room shows doc 10's subjects with doc 05's THE DARK, THE AIR, THE WALLS, THE TIMBERING and THE WAY BACK UP; after F3, doc 05's THE SEAM, THE OLD LANTERN and THE FOOTPRINTS appear. F3 sets `T_BROKE_THROUGH` (doc 02's F3 row now says so), and that flag is the state. F3's breakthrough itself is staged in Room 33, which remains blocked on OQ-06.

**B · Room 36 is doc 05's where doc 08 contradicts it**, because doc 48 S7 says Room 36 is "scripted in doc 05". Doc 08's sign, trough LISTEN, boardwalk and steeple LISTEN are dropped from their sequences; its agreeing lines, and its two lost-dog conditionals, stay.

**C · Room 19 (Thad's room).** The window faces the **alley** (doc 08 and doc 26, five lines, against doc 05's one): doc 05's THE WINDOW LOOK is dropped from the sequence; its LISTEN stays. The room costs **five** dollars a week (doc 02 A2; doc 26): doc 08's "four" is corrected at source. Doc 26's THE DESK LOOK 2 and LISTEN 3 copy doc 08's line 1 almost word for word and are dropped from the sequence. Doc 05's THE LETTERS HOME is Thad's drafts, the same object as doc 08's THE OUTGOING LETTER; doc 05's THE DOOR is the room's exit, whose lines doc 26 writes.

**D · Doc 08's nineteen names go with the second ledger to Room 5.** Errata 66 D put the second ledger under Room 5's board. Doc 08's "THE NAMES — individually examinable, nineteen of them" are that ledger's entries, so they are examined there, not in Room 6. Room 6 keeps doc 05's THE NINETEEN NAMES. The nineteen are written in doc 54 (Room 14's section) because nine of them are on Boot Hill's markers.

**E · The nineteen names, written; Boot Hill's markers, and Pike's grave.** Neither doc 05 (Room 14) nor doc 08 (Room 6) wrote the nineteen; both left stage directions. They are written in doc 54: nineteen names, trades and dates in the second ledger (Room 5), nine of them again on Boot Hill with their years of death. Nothing says how any of them died. Boot Hill's THE NINETEEN and Room 5's THE NAMES are each one hotspot whose LOOK reads along the row. Ezra Pike's grave is its own hotspot (doc 49's PIKE'S HEADBOARD and PLOT ELEVEN, doc 27's "third row, second from the end"), findable from Act I, because A1 sends Thad to it; doc 05's "tenth marker" line is its first LOOK.


---

# 70 · ROOMS 32 AND 33 — THE COFFIN AND THE LISTENING, DECIDED (2026-10-31)

*Tyler, 2026-10-31: "finish 32 and 33", under the standing delegation ("I want you to make all of those decisions yourself"). What was open was staging and audio decisions, not missing comedy. Each is recorded so it can be reversed by name.*

**A · Room 32 obeys invariant 2 and doc 05, and doc 48 S3 yields where it disagrees.** No verb panel, no hotspots, no LOOK, no LISTEN, no narration, no music. S3's beat 1 line ("This is the quietest room in Consolation…") and its beat 2 ("LOOK/LISTEN only") are void; so are doc 49's two Room 32 refusals (THE LID, THE DARK), which need a panel the room does not have. S3's beat 3 — the knock from outside, even, counted, and the lid opening on Hob's lantern straight into HOB_C1 — stands, without "that answers his": Thad never knocks, because nothing in the room lets him.

**B · Room 32's timeline (doc 45's R32 cues, given an authored pattern).** All times are active, unpaused game time from the lid-close nail; the interval is doc 45's 180,000 ms.
- **0 s** — the lid closes. `R32-MUTE`: the score stops dead, its playhead carried silently. The verb panel is gone between one frame and the next (doc 05). The screen is black but for one candle-width of seam light (S3 beat 1's picture, which stands).
- **2 s to 90 s** — `R32-DIRT`, the authored pattern doc 45 asks for: shovelfuls on the lid every 2–3 s for the first 30 s, close and hollow; then every 4–6 s and duller, earth landing on earth, until about 75 s; the last at about 88 s. Each shovelful narrows the seam light; it is gone by about 40 s. Nothing at all from 90 s to 180 s.
- **180 s** — Hob begins digging: spade into earth, far, then nearer. `R32-RETURN`: the score comes back mid-phrase at the playhead it would have reached, and **the verb panel returns first, before the art has resolved** (doc 05).
- **About 186 s** — the spade strikes the lid. Three knocks, even, a beat apart (S3 beat 3). The lid opens on Hob's lantern. No line. Straight into HOB_C1.

**C · OQ-06 is ruled.**
1. **The Room 33 score is THADDEUS, complete** — solo fiddle, the complete statement doc 28 withholds until Act IV and doc 48 S5 names ("this is the one place it finishes"). `R33-M` is that bed.
2. **The 90-second automation starts on S5 beat 1's fork strike** — the room's first sound, in a `control: none` beat, where errata 59 lets a cue sit. It runs −35 → 0 cents across exactly 90 s of active time and stays at 0 for the rest of the game.
3. **The void is never gated and the tuning never snaps.** The correct spot answers from the first tap. Found before 90 s: its line plays and the automation runs on undisturbed; S5 beat 3 (Thad sits down in the dark and listens) begins when the score reaches 0. Found after 90 s: beat 3 follows the line at once. Either way, by the time he finds it the score is in tune (doc 28 Part Five) or arrives there while he sits.
4. **WINNIE never bypasses the global detune** — doc 45's reading stands.
5. **Room 33's lamp** (invariant 8) ramps to stillness on the same automation. Errata 54 voided palette cycling, so this is the lamp's frame animation, slowed to a stop; nothing announces it.

**D · The mechanic is doc 28 Part Five and doc 45's, not S5 beat 2's.** Doc 28: tap, hear a knock, follow the tail that lengthens toward the void; doc 45 `R33-TAP`/`R33-RIPPLE`/`R33-VOID`; errata 49: live synthesis for the tap. S5 beat 2's "the player tunes by LISTEN, interval by interval" is void. S5 beats 1 and 3 stand.

**E · F3 is staged in Room 33** (errata 69 A), after F2, with the pickaxe whose head "falls off twice for comedy; always refittable" (doc 02's ledger). Lines in doc 54.

**F · Room 33's LOOK ladder** empties over its first eight selections and then says "Rock." for as long as the player keeps looking (doc 05: "systematically emptied out over about thirty selections"). It ends on the word, not on advice: no line tells the player to listen.

**G · A room may be its own cutscene: the room timeline.** Room 32 has no actor on screen, no interaction and nothing but timed events, so it does not run through the sequence runner (doc 22's interaction chain, whose kinds errata 28a, 30a, 38 and 59 admit one at a time). It runs a **timeline**: `{ at, do }` events in the room's own file, against active, unpaused time (engine/core/RoomTimeline.ts), doing five things — switch a whole-frame plate, play a one-shot, show or hide the verb panel, resume a suspended bed (`R32-RETURN`), open a conversation. Fenced to rooms that declare `interface: 'none'`, so it can never stage ordinary play. With it: `actor: 'hidden'` (the player is not drawn), `music: 'suspend'` (`R32-MUTE`: the bed stops dead and its playhead is carried), and `plates`. Room 32's sounds are rendered offline (errata 49) by tools/audio/render-coffin-sfx.py and its plates drawn by tools/art/render-coffin-plates.py; **Tyler auditions both before the room ships.**

# 71 · ROOM 32 MEETS ERRATA 52, HOB IS EXTRACTED, AND ERRATA 70 C2 IS WITHDRAWN (2026-10-31)

*Delegated ("You decide what's next"; "I want you to make all of those decisions yourself"). Found while wiring the coffin into HOB_C1: errata 70 was written without errata 52 in view, and errata 52 is binding (doc 34). Three of 70's rulings disagreed with it. This errata brings 70 back under 52 and records what the build now does. Each item can be reversed by name.*

**A · Four minutes sealed (errata 52 / doc 34 item 10, and HOB_C1's first line).** Errata 52 adopted doc 34's reconciliation of Hob's "You were down four minutes. I counted. I always count." with doc 45's three minutes: four minutes sealed, three of them before the dig. Errata 70 B had the lid open at about 186 s, which makes Hob wrong about the one thing he says he is never wrong about. **Amended:** everything to 180 s stands (lid, dirt, the silence, `R32-RETURN` and the panel at 180 s when Hob begins to dig). **Hob then digs for about a minute** — far, then nearer, spade strokes every four to six seconds — and strikes the lid at **236 s**. Three knocks at 237.5, 238.5 and 239.5 s. **The lid opens on his lantern at 241 s.** Straight into HOB_C1 at 241.5 s. His count is true. No new sound: the existing far and near spade one-shots carry the minute at rising gain, and Tyler's audition of Room 32 covers them.

**B · Reveal-on-intent: MENU and SKIP SCENE (errata 52 / doc 34 item 10).** Errata 52 adopted doc 34's overlay because a three-minute room with no interface cannot otherwise be mouse-only accessible. Room 32's first build (PR #75) missed it: a click did nothing at all for three minutes. **Built now.** While the panel is away, pointer movement or a click reveals two controls for three seconds, in the cells MENU and MAP use in the panel: **MENU** (the menu button's own label) and **SKIP SCENE** (content/ui/menu.json). Nothing else is drawn. MENU opens the pause menu, which stops the room's clock and so the score's hidden playhead with it (doc 34: "pauses with the scene if the shell opens"). SKIP SCENE lands where watching does: one **checkpoint** step in the timeline (the lid into HOB_C1). Skipping applies the state of every step it passes — the plates, the panel, the score at the playhead it would have reached — and plays none of their sounds. A room whose checkpoint is already behind the player (a save made after E8) loads straight onto it.

**C · The lid is the action that completes E8.** Doc 02: E8, "Hob digs him out." The checkpoint step completes E8 through a journal and autosaves (doc 34: "watch and skip land at one E8 checkpoint"), and opens HOB through its **E8 entry** as errata 66 C's action does: the action performs HOB_C1's opening once. A TALK TO Hob afterwards opens HOB_C1's list without replaying it.

**D · HOB's tree, extracted (doc 04, `# HOB`) to content/dialogue/hob.json.** Start HOB_A1; entries E9 → HOB_C2, then E8 → HOB_C1, each puzzle-gated in errata 66 C's sense. **HOB_C2's opening belongs to doc 48 S4's shack scene** (Room 21), which is the action that performs it when that room is built. As the document writes them:
- `*(nothing)*` (HOB_A1 options 2 and 5) is a **beat**, shown as written in quieter ink — Tyler's ruling for a reply that is a direction (2026-10-31, option A).
- `Thad: "…"` (HOB_A1 option 1) is **Thad's aside**, not Hob's line; it plays as Thad's.
- Option 6's **pair 21** (the Liar's Assay) is reported, not wired: doc 03's duel machinery is not built. Its line plays.
- The **"Running" lines** (every fourth night, unprompted) are ambient barks, not the tree. They belong to the ambient layer when Hob is placed in a night room.
- Doc 04 says "five produce no response at all"; as written, three do (1, 2, 5). Extracted as written; the count in the prose is not a line and is not changed.
- `T_HOB_KNOWS` and `T_HOB_HANDWRITING` are declared. HOB_C1 option 4 stays `[COMIC]` and nothing in the data marks it (invariant 7).

**E · Errata 70 C2 is withdrawn. The 90-second arc starts on the confirmed void (errata 52).** Errata 52 moved F2's tuning arc to the confirmed-void reveal: "elapsed time would make waiting advance the dramatic state; proximity would turn the music into a hidden meter." Errata 70 C2 started it on the fork strike — elapsed time, the thing 52 ruled out — without citing 52. **Restored:** the search runs on the tap gradient alone, against the −35-cent score. **On the confirmed void** its line plays, and `R33-TUNE` runs −35 → 0 cents across exactly 90 active seconds from that moment, and stays at 0 for the rest of the game. **S5 beat 3 is those ninety seconds:** Thad sits down in the dark and listens while THADDEUS comes into tune. Room 33's lamp (invariant 8) slows to stillness on the same ninety seconds, so the room arrives at complete stillness and complete tune together, as doc 28 writes it. Because it begins only after the void is found, it tells the player nothing (invariant 9, and the hint errata 52 struck). F3 follows when the ninety seconds are over. 70 C1 (THADDEUS complete), C3's "the void is never gated" and "the tuning never snaps", C4 and C5 stand. C3's found-before/found-after cases fall away: there is only after.

# 72 · THE FULL GAME BUILD (Tyler, 2026-10-31)

*Tyler, in chat: "Here's my thought process. Build the whole game in the style of what we've done so far. I'll play through it and we can make adjustments as I play." Asked three questions, he answered: **"Real art room by room"**; **"Review while playing"**; **"Up to 4 per room (~120)"**.*

**A · Every remaining room is named.** 4, 6–23 (23 and 24 are one room), 25–31, 33–36, in doc 20's numbering, which is the canonical build order (doc 36 Q142). Rooms 13, 18, 19, 29 and 36, which exist only at the void 320×144 size, are rebuilt at errata 54's. Room 5 is built; Room 32 is built and awaits Tyler's audition. Each room still needs `BUILDABLE WITHOUT INVENTION: YES` from its gate, and still follows ruling 22's order (graybox, then the legibility gate, then art).

**B · Real art, room by room.** A room ships with its finished plate before the next begins. Generation happens only in a session started in Tyler's "OpenAI" cloud environment.

**C · Four image operations per room**, covering its plate, any companion state and its own new characters, all logged under one asset id `room-NN` (`art/staging/caps.json`; attemptsTotal 52 → 172). A room that spends its four without a usable result stops, is reported, and the build moves to the next room. No room borrows another's.

**D · The character style gate's step 3 moves to the playthrough.** Steps 1 (generated against Thad in the room), 2 (measured: `tests/scale.test.ts`, edges, colour and contrast in Thad's range) and 4 (a miss is corrected, against the side-by-side) stand. Instead of a side-by-side before the cut, the character goes in and Tyler flags misses while he plays.

**E · Tyler's visual and audio acceptance moves to the playthrough as well.** Every room merges to main and deploys as soon as it is built and green, so what he plays is what exists. Acceptance is his, as before; it is given or withheld while he plays.

**F · The writing rules are unchanged.** No line is written by the builder. A subject whose line is missing is reported in doc 36 and the room ships without that subject's missing variant rather than with an invented one, or waits if the gap is in a puzzle's path. Staging and mechanism gaps are decided under the standing delegation and recorded here, as errata 68–71 were.

# 73 · THE LIAR'S ASSAY'S WRONG ANSWERS, AND HOW THE DUELS RUN (2026-10-31)

*Room 4's builder stopped (doc 36 Q146): the duels in Room 4 need three wrong counters per pair, and only pair 1's were written. Tyler's instruction of 2026-10-31, "do everything you have to to finish the writing so the other rooms can be built", covers this layer; Q144 missed it. Written and decided in this session, by one voice, under that instruction and the standing delegation. Every line and ruling below can be struck or changed by name.*

**A · The wrong answers are written** in doc 03 Part Three, "Wrong answers, pairs 2–23": three per pair, each with its reply, plus the three jokes beside pair 24 in Duel Three's fifth exchange. That is 69 counters and 69 replies, none reused (doc 03 Part Five, note 1). No wrong answer takes the right answer's shape (claim acquaintance, then downgrade), so the rule that makes the system a system still picks out exactly one option. A reply is spoken by whoever threw the boast: **Vessel** for pairs only he throws, **Reply** for pairs 4 and 9 (thrown by Vessel and, in Duel Three, by Fanshawe), **Fanshawe** for 22, 23 and the fifth exchange. The standing mockery lines remain a pool for anything else that loses.

**B · Duels One and Two are fought in Room 4.** Doc 05 ("The Assay duels are held here"), doc 54 and doc 20's map agree, and doc 20 has no camp room and forbids timed travel screens. Doc 03's "a camp two days out" is where Thad finds Vessel: B1 finds out where, and B2–B3 get him there with Grievance, off screen. B4's "the local way" is the Assay, which has judges, a fee and a room, so it brings the two of them back to the Nugget's back room. Vessel's "You came all this way" stands, because Thad did. **From B3's completion, Vessel is in Room 4.** For Duels One and Two, Sowerby's handbill, the judges and the pencil are Room 4's, as written; Duel Three stays public, on Main Street.

**C · What Thad is offered.** For a boast whose counter he has not learned, the three wrong answers and nothing else. Once he has learned it, the right counter joins them as a fourth. Its position among the four varies by pair and is never always the same slot.

**D · Duel One's arithmetic.** Thad writes each counter in his notebook as he hears it ("Malnourished. Bishop. Yes."), and **the notebook joins his repertoire when the duel is over**, not during it. Vessel throws pairs 1, 2, 3 and 4, then pair 1 again. Thad has nothing but wrong answers to all five, and loses five straight exchanges. On the repeat of pair 1 nobody mutters anything; he has already written it down.

**E · Duel Two's order is the builder's to decide**, with two conditions: a Thad who holds exactly fourteen pairs can win, verified by the traversal, and losing Duel Two closes nothing, so TALK TO Vessel offers it again (invariant 6). Vessel draws from pairs 1–21, Tier 1 first ("Vessel escalates").

**F · The bystander who mutters each counter** is a voice from the ring of chairs, unnamed, as doc 03 writes it. Staging.

**H · Room 4's other three gaps, written.** Duel Two had no way to be asked for, and the two things it returns had no lines. Written: **VES_B1 option 5**, "I'd like a rematch." (doc 04), offered once Duel One is lost; **THE POCKET WATCH** and **THE AFFIDAVIT** (Document A), three LOOK and three LISTEN each (doc 23). A lost Duel Two ends on the reply that lost it; nothing more is said, and option 5 offers it again.

**G · The readiness gate missed this** because it checks that a puzzle's sections resolve, not that every node inside them is written. A builder may add a check that every duel node has three wrong answers and a reply for each. That is tooling and needs no ruling.

# 74 · NAMED IS NOT WRITTEN: THE GATE CHECKS EACH PUZZLE'S CONTENT (2026-10-31)

*Room 4 answered `BUILDABLE WITHOUT INVENTION: YES` and then stopped its builder on sixty-nine unwritten lines (Q146), because the gate asked only whether a room's puzzles were named. Tyler asked whether this would happen in every room. An audit of all 45 puzzles (doc 56) says it would have: most puzzles outside Room 4 lack lines, items or decisions.*

**A · Every puzzle needs an audited content entry** in `proofs/readiness/puzzles.json`, listing what it needs: dialogue nodes (a doc 04/27 node with at least three written options and a [COMIC]), items (`## NAME` with LOOK and LISTEN 1–3), duel pairs (three wrong answers with replies each), and scenes or rulings (sections that resolve). `tools/lib/puzzle-content.mjs` checks each one, and the readiness gate's "Puzzle requirements complete?" answers NO for any room hosting a puzzle with no entry or with an unresolved need.

**B · Today only B5 and B6 have entries**, so Room 4 is the only room with puzzles that answers YES. That is the truth, not a regression: doc 56 lists what each other puzzle lacks. An entry is added when a puzzle's gaps are closed, never before.

# 75 · THE PUZZLE COMPLETION PASS (2026-11-01)

*Tyler, 2026-10-31, on doc 56's audit: "You decide. And don't take shortcuts. Do everything correctly to make the game feel as much like an end product Monkey Island style game as possible. Keep the puzzles interesting and clever and tough without being impossible. Keep the dialogue really punchy and good. Make the game really come to life." Written and decided in one voice. **Doc 57 is the pass**; nodes are in doc 04, duel lines in doc 03, items in doc 23, room subjects in doc 54. Each ruling below can be reversed by name.*

**A · Act II's deadlock is broken.** SUM_B1's documents no longer unlock one another in a chain (A → B → D), which made D wait on A while A (Duel Two) needed D's comebacks. All three are offered from SUM_B1's opening; C waits on A, B and D. The trials are any-order, as doc 02 says.

**B · D5 no longer quotes an offer Thad has not heard.** PRA_D5 opened on the eleven-thousand-dollar offer, which is made only at E0b, after Document D. It now opens on the Company's own books — "Claim Two, contingent, eleven thousand dollars" — which Sheng reads Thad at D4. E0b's offer is then that same number, said out loud.

**C · The fake funeral is a memorial for Ezra Pike** (C3). Fanshawe attends every funeral (Frame, FRA_A1 5); Pike was buried six years ago on credit and never sung over (Sowerby, SOW_A1 5); Thad's letter of introduction to Pike, sealed, is his standing to arrange it; Frame's notice starts **the funeral day**, which empties Fanshawe's office (C4) and fills Sowerby's plate (D4), and ends when Thad walks up Boot Hill. It can be held again. One funeral serves both trials, as doc 02 wants.

**D · Sheng's terms are the linen debt (D3/D4)**, and his reading of the Thursday ledger is the reward. SHE_D1's loan moves to Act III: it is the two dollars and sixty cents Thad's funeral costs, and it is what doc 02 means by "Sheng's goodwill (D4)" at E3.

**E · E6's executor is Hob, appointed on Form 31-E**, which Hob signs and Sump accepts once Thad is recorded deceased; Thad enters the archive as the executor's agent (docs 08 and 54's "as one's own executor" stands as Thad's description of it). **The signature is the clue (E9):** THE EXECUTOR'S FORM on THE MOTT FILE shows the same hand; or, with `T_HOB_HANDWRITING`, LOOKing at the file is enough — invariant 7's silent solve. THE TIMESHEET's LISTEN is unchanged and sets nothing.

**F · E7: Thad gets into the coffin on purpose,** after S2 beat 3, on the undertaker's promise that the lid stays loose; the undertaker nails it from habit. Doc 04's graveside note (Thad in the box for Sowerby's eleven minutes) governs; S2's free play is the gathering before it. S2 beat 4 ("Boot Hill opens") is replaced.

**G · A7's money loop is closed.** A8 requires the tuning fork only (doc 02's "requires the boundary" is withdrawn); the barman pays two dollars a tuning, the piano is flat again whenever Thad returns, and the filing fee pays Ozymandia, who divines over Fanshawe's map. Doc 02's dead-end audit ("repeatable… the joke improves with repetition") is now literally true.

**H · ACT moves at the three act cards:** 2 at A10's PART TWO; **3 at E0b's PART THREE** (new card, after Clause 9); 4 at E10's PART FOUR. Errata 60's "the funeral's opening sets ACT 3" is withdrawn: E1–E6 come before the funeral.

**I · Duel Three (F4) needs the five pairs it uses** — 4 and 9 (guaranteed in Act II) and 22–24 (given by the confession, E10) — not twenty-four; a lost exchange is thrown again; the order is 4, 9, 22, 23, then the fifth. Duels One and Two are first to five.

**J · Every pair has a written route** (doc 57's table): Tier 4's five and the livery man's each gain an `[ASSAY]` option in which the character tells the story of the pair; Winnie's five and Pratt's six are their sparrings (WIN_B4 1, PRA_D6 4); 22–24 come with the truth at E10.

**K · Smaller rulings.** Items follow `T_SWINDLED` (Q141 route 1). THE LIVERY BLANKET is the one blanket; HORSE BLANKET and doc 24's A5 line are superseded. The hotel room is the reward for A2; there is no key item. The map is what finds Prosperity (A4). A9's order is the deed, the survey, the fee. Doc 27's undertaker and Vessel supersede doc 04's sketches UND_A1 and VES_A1. FAN_A0 gives Fanshawe an Act I node before the swindle. The obituary is THADEUS GRUBBE (errata 9 over FRA_E1, now reconciled). Room 9's headline board shows errata 9's run. The F5 filing is Form 12-C (Amended) for Claim One, in Mott's name; Thad keeps Claim Two. `T_NO_GOLD_EVER` and `T_STRIKE_WAS_LIE` are one flag.

# 76 · ROOM 4 BUILT — THE BUILDER'S DECISIONS (2026-11-01)

*Made by the Room 4 builder under doc 55 section 5's standing delegation ("staging, mechanism and placement gaps ... each decision is named so it can be reversed by name"). No line was written. Every ruling below can be struck or changed by its letter.*

**A · How the duels run, where errata 73 left it to the builder.**
- **First to five, in both duels** (doc 03 "How it plays"). Duel One also ends when its five-boast sequence (73 D) is spent, and it always ends lost.
- **Duel Two's order (73 E, doc 57 B6: "Tier 1 first, never repeating").** Tier 1 always first. Then, if the player holds fourteen or more of pairs 1–21, the pairs he holds before the rest; if he holds fewer, the rest before the pairs he holds. Each run is ascending. That makes doc 02 B6's "≥14 pairs" a property of the duel rather than a gate in front of it. **Every player holding fourteen can win, and no player holding thirteen can**, which `tests/assay.test.ts` proves over all 131,072 sets of pairs. The order reads what he knows, because no fixed order can promise that: Tier 1-then-ascending sends five unanswerable boasts at a player missing pairs 5–11, and Tier 4 is "optional, missable" (doc 03). That would be a dead end (invariant 6).
- **The right counter's slot** among the four is `(3n + 1) mod 4` for pair n (73 C: "varies by pair and is never always the same slot").
- **What starts Duel One (doc 57 B4).** VES_B1 option 6, "I need you to sign an affidavit.", completes **B4** and starts Duel One. Option 3 is the replay ("twice if asked"). Duel One completes **B5** when it ends, since it cannot be won. Duel Two completes **B6** when it is won. **The first TALK TO plays doc 03's Duel One greeting once** (`openingOnce`, `T_VESSEL_GREETED`).
- **A duel's options (VES_B1 options 3 and 6, `remove`) are spent only once their duel has written its result.** A duel dropped mid-fight leaves it on offer (invariant 6). A duel saved mid-fight is in the save file and resumes at the same boast.
- **A won duel's yields reach the inventory through the game state, not the tree**, because doc 34 keeps inventory out of a conversation.

**B · Staging and placement.**
- **The duel marks:** Thad at (800, 760) facing right, Vessel at (1180, 760) facing left, either side of the burnt line. Doc 54's "Not across the line" puts Vessel across it.
- **Vessel is in Room 4 from B3** (73 B), as a second placement of his Room 3 record, gated on `T_VESSEL_FOUND`. That flag is declared pending because B3 (Room 15) is unbuilt. **The three judges sit behind the long table from B3 until Duel Two is won**, out of the lamp's pool (doc 05: the lamp "leaves the judges dark"). When the Assay is over they go home. Vessel has no written departure, so he stays.
- **"In a duel"** (doc 54's people overrides) means the Assay is sitting: Vessel found and Duel Two not yet won. During a duel's own exchanges no verb can be chosen, because a duel is a conversation.
- **The walk band (y 705–840, x 240–1680) is in front of every chair.** A man behind one would be drawn over a chair that is nearer than he is. No plane masks him anywhere he can stand.
- **THE CHAIRS is the champion's chair**, the one with the cushion that its LOOK 3 and TALK TO name. The challenger's chair is drawn and not separately clickable. **THE RING OF CHAIRS is the right-hand group.**
- **Coming back into the Nugget,** Thad arrives at (870, 590), left of Vessel's place (930 until Vessel moved to the open floor by the barrel, 2026-11-01). At the back door's own x he arrived hidden behind Vessel.
- **Sowerby (errata 75: "Sowerby holds the pencil").** He stands at the foot of the back wall beside the table's left end, in front of the chalkboard and in the judges' shadow, holding the pencil up, and is present while the Assay sits. Before each duel he reads the handbill's five rules as doc 03 Part One lists them (Duel Two adds doc 03's three-line exchange first). His ambient id is his speaker id, so his words sit over his head. **Room 4 is his first drawing and so his canonical design** (doc 38 section 1). Canon gives him only "Reverend" and his manner, so he is a plain 1850s preacher: black frock coat, white collar, grey hair. **Redrawn whole (Tyler, 2026-11-01, option 1; room-04's fourth operation):** the first drawing stood him behind a table that does not reach him, and he had no legs. While he is present, a prop of the plate's own bare wood covers the pencil on the table, because he is holding it (doc 36 Q148). That drawing had a chair in front of his left leg; Tyler raised the room to five operations, and the fifth drew him alone on magenta, keyed whole.

**C · The room's look.** Material identity (17b), distinct from the Nugget's warm timber next door: green-shaded lamplight, chalky grey slate, green paint, worn pine. **One visual state:** the only window is painted over, so the hour is never seen. THE DOOR TO THE BAR and THE WINDOW, PAINTED OVER are plate. `tools/room-gate.mjs` flagged both "it opens" from their names, but no line or verb opens either. The door is the exit, and a transit plays no picture of opening.

**D · The art.** Room 4 used **3 of its 4 operations**: a composition master generated against Thad with the graybox as its layout, and the same picture with nobody in it.
- **The plate.** The plate's dropped cushion was restored from the master's own pixels. The plate takes Room 4's own 20:9 crop (x 8, y 120), because the generator drew the slate, door and window above Room 5's crop.
- **The judges** are the difference between the two pictures (doc 36 D4).
- **Sowerby** is operation 3: an edit of the room as it stands (plate, judges, Deke, Thad at game size) adding only him, then cut by subtraction (`tools/art/room04-sowerby.py`). His texture is 2.86 against Thad's 4.27.
- **Deke** is re-cut from your approved sheet at this room's 530 px, then graded to his own figure as the master painted him here.
- **Promotion.** Everything shipped through `promoteProvisional` (errata 72 E): technical gates passed, and recorded as **pending your playthrough**, never as accepted.

**E · Left for you, and not decided.**
- ~~The voice from the ring speaks in the fallback ink.~~ **Decided by the builder under errata 78:** three sets rendered on the room in the game at x6; Deke sunny gold `#f2c85a`, Sowerby pale violet `#c8b4e8`, the ring a dim warm grey `#b0a898` (`content/ui/speech-colours.json`, each with its reason). Change freely.
- **The Assay adjourns when Thad walks out after Duel Two, not the instant it is won (builder, errata 78).** Played in the browser, winning made the judges and Sowerby vanish in front of him -- what Tyler ruled out for Vessel the same day ("it would bother me immensely to have a character just disappear"). They have no walk to leave by, so they stay while he is in the room; the door writes `T_ASSAY_ADJOURNED` as he leaves (`setOnTransitWhen`, new: an exit's flag writes only while a condition holds), and when he comes back they are gone.
- **A renderer fix:** a speaker's head is found where the room places them, not where their file does. Room 4's Vessel is a placement of his Nugget record, and his words had hung over his Nugget spot.

---

# 77 · EVERY CHARACTER MOVES FROM THE START, AND IT IS CHECKED (2026-11-01)

**Tyler's ruling.** After Room 4's back row shipped with a one-pixel breath and nothing else -- "the four men in the back are completely stationary", then "I thought it was written into our production rules that everyone had to have deliberate movement" -- he asked: "How do we ensure future characters all have movement from the start?" and chose to write the rule down and enforce it with a check, as character scale already is.

It was written down: errata 35 says nobody is ever perfectly still and gives named figures deliberate actions, not a breath. What it lacked was a check, so a figure could ship holding a breath and nothing else and nothing would fail. That is closed here.

**The rule.** Every visible character in a shipping room, in its own room and in every room a placement puts it:

1. **Is never still.** Something on it changes at least every 10 seconds: a running idle (`rate`) or a beat (`beatEvery`).
2. **Has a deliberate action.** At least one frame changes 10% of the figure's pixels against its rest frame. A one-pixel breath changes 5-8% and does not count; a lean, a gesture, a turned head or a drink does.
3. **Does it often enough.** That action plays at least every 30 seconds -- in the beat, in a break from its pool, or in the running idle. 30 s is the slowest pace already approved (Main Street's three, 23-29 s).

`tests/movement.test.mjs` holds all three, measured from the frames themselves and from the engine's own schedule (`ambientFrameAt`, sampled over ten minutes of play), not from what a file says about them -- so a crawling idle or an action buried in one break pool of four fails as the gap it really leaves. Run against Room 4 as it first shipped, it fails exactly the four men Tyler flagged and passes everyone else.

**Exceptions.** `identity` figures draw nothing and are not checked; candidate rooms are not shipping rooms. Any other figure that must be still -- the Nugget candidate's man on the landing, "who has not moved", would be one -- carries a `movementException` that quotes the ruling allowing it. There is no silent way past the check.

**From the start.** A new character is generated with its action poses in the brief (as Deke's five-pose sheet was). Where a room has no image operations left, actions are derived from the character's own rest frame with whole-pixel moves that cannot open a hole: leans and nods as shears, hands lifted by a warp, a forearm turned about the corner of the joint it folds into (`tools/rig/room04-idles.py`, Room 4's back row). The character style gate in CLAUDE.md carries this as its fifth step.

---

# 78 · NO OFFICIAL PLAYTHROUGH UNTIL THE WHOLE GAME IS READY (2026-11-01)

**Tyler's ruling.** Asked whether Room 4 was complete and what it needed from him: "I'm not going to officially play through anything until the game is ready for a full play through. Until then I'm expecting you to get everything to it's best possible place."

**What changes.** Errata 72 E has rooms ship before acceptance and Tyler accept them in the playthrough; that stands, and the playthrough is now one, at the end. Until then a room is not waiting on him: its builder takes it as far as it can go without him --

- **Plays it in the running game,** every route through it, and fixes what reads badly (placement of lines, legibility of choices, people who vanish or freeze), instead of handing those to the playthrough.
- **Makes the look decisions earlier errata left to Tyler** where the room needs them to be finished -- a speech colour, a staging choice -- from a rendered sample in the room, recorded with its reason so he can reverse it in one place.
- **Stops only where the writing or a ruling is missing,** exactly as before: never generated content, never a gate skipped.

What Tyler still decides: acceptance of the art (errata 72 E, at the full playthrough), and anything that asks him for a decision the docs do not make.


---

# 79 · ROOM 6 BUILT — THE BUILDER'S DECISIONS (2026-11-01)

*Made by the Room 6 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · One visual state, night.** The records room is reached only through Room 5, and Room 5's base presentation is night (errata 64b, 66; its day plate is a companion staged for a later state). So the records room is night too: the high window shows a night sky, the desk lamp is the work light and the stove is lit low (doc 54). Nobody is staged here (doc 20; the readiness gate), no puzzle is sited here (doc 02) and doc 05 Part Two-B wrote no act variant, so nothing in the room changes: its proof spec declares no principal change and says why (`principalChange: { none }`, new in `tools/gauntlet/proof.mjs`), rather than inventing one.

**B · The light is errata 31a, literally.** A dark field (walls and shelves dim), a lit floor, a lamp at the desk. The graybox's legibility gate (`proofs/room-06/graybox.json`) re-blocked the starched apron and the pinned map down into the field's value, because at paper-white Thad's face would sink against them; the generated room kept them dim.

**C · The layout.** Doc 54's seventeen subjects less the two errata 66 D and 69 D moved to Room 5. The door to the front office at the left of the back wall (Room 5's records door is at its right, so this room lies to its right); the apron on its peg by the door ("the peg creaking when the door opens"); the map, the reference shelf and the drawers of certificates on the left wall; the stove with the tea things beside it; the high window over the high desk and the stool ("exactly where the window light falls on the ledger"); the sample shelf; the scales cabinet; the bench under the acid bottles with the crucible on it; the cot in the near corner, facing the door ("she sleeps facing the way she might be needed"). THE NINETEEN NAMES are the open register's right-hand page (errata 69 D: "how the assay register reads them").

**D · The art: 3 of room-06's 4 operations.** 1, a composition master against the graybox with Thad once for scale; 2, the same picture with him taken out; 3, that plate given to the generator at 0.8 scale in the 20:9 band, asking it to extend the walls into the side strips. Operation 2's framing could not be cropped to 20:9 without halving the window and losing the mat; operation 3 re-framed the whole room a little further back instead, every subject in it, and that is the plate (`tools/art/room06-plate.mjs`, crop x 8, y 152). Promoted provisionally, pending Tyler's playthrough (errata 72 E). One operation is unspent.

**E · The depth.** The master painted Thad about 380 tall at y 680, which makes the door 1.4 times his height and the stool reach his thigh. Composited at that size and at a door-led size, the door-led one reads as a man in the room: 433 at y 655, 528 at y 845, within 8% of Room 5's own curve next door (`reference/room-06/annotation.json`).

**F · The way back has no lines, and is marked so.** No document writes Room 6's side of the door to the front office (doc 25 writes Room 5's side). It is a stub exit, as Main Street's door to the hotel is: it works, and its LOOK and LISTEN wait for lines (doc 36 Q149). The room id is `assay_records`; the stub room `stub_assay_records` is retired.

**G · Tooling, found while building.** The gauntlet's waits clicked through nothing under `conversationWaitsForClick`, so every route that passes through the opening timed out on the driver's first answer; `tools/gauntlet/route.mjs` now reads a performing line by click during any wait that is not waiting for a line, as `settle()` already did. `tools/compile-room.mjs` accepts a merged room that a range document (doc 25's 05-07) has no section for.

---

# 80 · ROOM 7 BUILT — THE BUILDER'S DECISIONS (2026-11-01)

*Made by the Room 7 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · One visual state, night.** Room 7 is off Lower Street (errata 43), which inherits Main Street's night (errata 64a), and it is reached today by the map. The counter's two oil lamps light Sump's window and the floor in front of it; the window shows the night street. Doc 05 Part Two-B's one act variant (THE COUNTER, act 3) is a line, not a picture.

**B · Sump's look.** Canon gives Registrar Cadwallader Sump no appearance -- only his voice ("every response is a citation... completely immovable"). He is a plain territorial clerk of the 1850s: middle-aged, thin, upright, clean-shaven, hair combed flat, small round spectacles, white shirt, black sleeve protectors, dark waistcoat. Drawn first in the composition master behind his counter beside Thad (style gate step 1), then alone on magenta in five poses (rest, breath, writing, stamping, looking up over his spectacles), keyed by `tools/art/room07-sump.py` and cut at the ledger's far edge as Winnie is at hers (posture `behind-counter`). **Room 7 is his first drawing and so his canonical design** (doc 38 section 1).

**C · Staging.** The street door at the left, with its bell on a spring; the window and the bench under it; the map and the forms rack on the back wall; the counter across the right half with its partition, Sump's window between the two lamps, the clock behind him and the sealed archive door with its posted statute at the right. Doc 19 section 2's two roped lines come forward from the counter on brass posts, both empty, so the walkable floor is the public floor left of them (x 220-1010). **Thad talks to Sump from the counter's left end** (890, 790), clear of the ticket spindle and outside both queues -- nobody stands in either line.

**D · How A6 and A9 run (doc 57).** A6: SUM_A1 option 1, or THE DEED on the counter without THE SURVEY -- Sump's refusal in his voice (SUM_A1 option 1's words), `T_SURVEY_NEEDED`, A6. A9 in the statute's order, each a USE: the deed on the counter with the survey in hand (doc 24's "Filed." line; `T_DEED_LODGED`); the survey on the counter after it (lodged, it leaves inventory; `T_SURVEY_LODGED`); THE FILING FEE on Sump after both (doc 24's line, then the read-back, every word, and "There is a note for you" -- the fee is spent, THE INVITATION given, `T_BORDERS_MOTT`, A9). Out of order, Sump says which comes first, in doc 57's words, and nothing is taken. The deed is never taken: doc 02's ledger says it cannot be lost. `T_DEED_LODGED` and `T_SURVEY_LODGED` are routing flags with no lines of their own. SUM_A1's "I have a survey." is offered while Thad carries it (a dialogue option may now gate on what he holds, read through the game state; a tree still never writes inventory).

**E · Sump's tree by act.** SUM_A1 in Act I, SUM_B1 from Act II, SUM_E1 from Act III (errata 75 H's ACT). Extracted now: SUM_A1, SUM_B1 (less its last document option) and SUM_E1. **Waiting for the rooms that make them playable** (doc 36 Q150): SUM_B1's About Document C (Documents B and D, from C6 and D6), SUM_C1 (the death certificate, E4) and SUM_F1 (Act IV's filing). D6, E0 and F5, sited in Room 7, are recorded in `proofs/played-pending.json` with why.

**F · Lines no hotspot can carry (doc 36 Q150).** Doc 49 Part 4 writes wrong-verb lines for THE CHAINED PEN, FORM 12-C (THE STACK), THE COUNTER BELL, THE STATUTE BOOK and THE PARTITION, which docs 05 and 25 do not name. The chained pen is very likely SUMP'S PEN, but doc 49's PICK UP for it differs from doc 25's, and choosing between two written lines is not the builder's; the other four have no LOOK or LISTEN, so they cannot be hotspots. Declared `unhoused` in the annotation, named on every compile, carried nowhere until Tyler rules.

**G · The art: 3 of room-07's 4 operations.** A composition master against the graybox, with Thad and Sump; the same picture with both taken out (Room 7's own 20:9 crop, x 8, y 120); Sump's five-pose sheet on magenta. One operation is unspent. Promoted provisionally, pending Tyler's playthrough (errata 72 E).

**H · Found while building, and fixed.**
- **The map made Room 7 unreachable.** At the play area's type scale the undertaker's label runs across the registrar's marker, and the first label under a click won, so the registrar -- whose only built way in is the map -- could not be clicked in Act I. A map click now goes to a place that can be travelled to before one that cannot, then to the nearest marker (`engine/render/MapLayout.ts`); `tests/map.test.ts` proves every travellable place is reached by its own marker in every fixture's state, and fails on the old rule.
- **An item on a person with a plain pair** (doc 57's fee on Sump) fell through to the people pool; it now resolves through the same interaction as an item on any object, walking Thad to the person's stand. A pair rule may name who speaks its line (`by`), give the rest of an exchange with speakers (`then`), and take items (`takes`).
- **The compiler** reads a subject's base lines from the room document before doc 05's act block (Room 7's counter had taken its Act III line as its first LOOK), and an annotation may name a section that supersedes a subject whole (`supersededBy`: doc 19 section 2's THE TWO LINES).

---

# 81 · ROOM 8 BUILT — THE BUILDER'S DECISIONS (2026-11-01)

*Made by the Room 8 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · One visual state, night,** as Room 7 through its door. The lamp in its bracket by the door is the only light and the deep stacks stay dark (doc 08); the barred window shows the night street. Nobody is staged here (the readiness gate), and the archive has no act but Act III (doc 08: "Entered once, in Act III, as one's own executor").

**B · The way in is doc 57 E9's door.** In Room 7, OPEN on THE SEALED ARCHIVE DOOR with `T_EXECUTOR_NAMED` is the clerk's exchange (doc 57's words, by speaker) and leads into Room 8; before it, the door's own OPEN override answers ("Locked..."). E6, which names the executor, is in rooms not built, so `T_EXECUTOR_NAMED` is declared pending and the fixture `r8-a` and the proof route set it.

**C · E9, both ways, quietly.** THE EXECUTOR'S FORM on THE MOTT FILE (the same hand), or LOOK at the file with `T_HOB_HANDWRITING` (invariant 7): each writes `T_SAME_HAND` and completes E9, and nothing announces it. THE TIMESHEET's LISTEN is the same line three times, declared a deliberate repetition in `content/ui/duplicate-allowlist.json` as doc 54 asks, with nothing else said about it (invariant 3). THE EXECUTOR'S FORM joins the manifest with a drawn icon.

**D · The art: 2 of room-08's 4 operations.** A composition master against the graybox with Thad once for scale; then one edit that took him out and extended the walls into the side strips, which re-framed the room whole (as Room 6's third did). Room 8's own crop, x 8, y 140. Promoted provisionally (errata 72 E). Two operations unspent.

**E · The way back has no lines** (doc 36 Q151): no document writes the archive's side of its door. A stub exit, as Room 6's is.

**F · Found while building, and fixed.** A response that leads elsewhere and has lines -- the archive door -- moved the room at once, so the clerk's first line hung over the archive and the rest were cancelled. The game state now reports such a destination (`goesTo`) and the scene moves once the last line has been read; `tests/room-08.test.ts` holds it. An examine response may now name its speaker, carry speaker-tagged lines and complete a puzzle; an annotation's `sceneLines` reads doc 57's scene lines on a room's subjects, words and speakers from the document.

---

# 82 · ROOM 9 BUILT — THE BUILDER'S DECISIONS (2026-11-01)

*Made by the Room 9 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · One visual state, night.** The Clarion is on Main Street, whose base state is night (errata 64a), and Frame works late: lamps over the press and the desk, the street dark through the lettered window.

**B · Frame's look.** Canon gives Ignatius Frame no appearance -- only his voice ("enthusiastic, amoral, and permanently mid-sentence"). He is a wiry printer-editor of about forty: untidy hair, rolled sleeves, an ink-stained apron over a loose waistcoat, a pencil behind his ear. Drawn first in the composition master at his press beside Thad, then alone on magenta in five poses (rest, breath, talking, taking a quote, leaning in), keyed whole by `tools/art/room09-frame.py`. **Room 9 is his first drawing and so his canonical design** (doc 38 section 1).

**C · Staging.** The street door and the front window at the left, the schedule board (doc 57: the headline board) beside the window; the stacks of back editions and the Mott photograph on the back wall; Frame's desk under its drift; the press, the type case and the ink keg at the right. Frame stands at his press; **Thad talks to him from before the desk** (1120, 790), by the furniture rather than on open floor (doc 55 section 8).

**D · Frame's tree and the running gag.** FRA_A1, FRA_B1 and FRA_E1 are extracted from doc 04 with their routing: option 1 opens the trade; 6 begins the funeral day (`T_FUNERAL_DAY`, C3); 7 is pair 16 (`ASSAY_PAIR_16`); FRA_B1 1 and 2 both pay with Fiddler's Gulch (`T_VESSEL_LOCATION`, B1); FRA_E1 opens on `T_DECEASED` and its option 1 gives THE OBITUARY (E5) through the game state, as a won duel's yields do. Option 4's three rotating answers play in order and then hold the last (the runner does not rotate; reported). **The headline board** carries doc 57's editions: each answers the board's next LOOK once after its event, latest first, marks itself and every older one read (`T_HEADLINE_<event>_SEEN`), and counts `MISSPELLINGS_SEEN`; then the board's ordinary lines resume. An examine rule may now wait on a puzzle's completion (`afterPuzzles`), because C5 is puzzle progress and not a flag (errata 66 B).

**E · The art: 3 of room-09's 4 operations.** A composition master against the graybox with Thad and Frame (it kept the 20:9 band, so the standard crop); the same room with nobody in it; Frame's five-pose sheet. One operation is unspent. Promoted provisionally (errata 72 E).

**F · The way back has no lines** (doc 36 Q152): doc 14 writes Main Street's side of the Clarion door and nothing writes the inside. A stub exit, as Rooms 6 and 8's are.

**G · Found while building.** The compiler drops a document's `*emphasis*` asterisks in merged rooms (doc 54 italicises *Clarion*; the face has no italic). The gauntlet's waits read through a conversation's greeting under click-to-read, and a route along Main Street walks in short legs (the camera does not follow a click west of its edge).

# 83 · ROOM 10 BUILT — THE BUILDER'S DECISIONS (2026-11-02)

*Made by the Room 10 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, and Act IV's empty rack.** The lobby is on Main Street, whose base state is night (errata 64a), and its stove is never allowed to go out (doc 54): the desk lamp and the stove's glow, the street dark through the blinds. Doc 05 Part Two-B writes THE PROSPECTUS RACK empty in act 4, which is a picture: room-10 operation 4 emptied the plate's rack and changed nothing else, and `tools/art/room10-rack.py` ships only the pixels that changed, as a prop drawn while `ACT` is at least 4. THE CHAIRS' act-4 line ("nobody waiting in any of them") needs no picture: nobody is drawn waiting in any act. **Identity (17b, assigned at composition time):** varnished walnut, polished brass and Company green, with one red runner because doc 05 writes the carpet red; Fanshawe's office (Room 11) keeps the game's saturated red.

**B · The lobby clerk's look.** Docs 05, 49 and 54 place a clerk at the desk ("High enough that you address the clerk's collar"; "Free, insists the clerk"; "breathing through his nose with the patience of a professional") and give him no tree, no bark and no appearance. He is a neat, thin young clerk: pomaded hair parted in the middle, a high stiff collar and bow tie, sleeve garters, a dark waistcoat. Drawn first in the composition master behind his desk beside Thad, then alone on magenta in five poses (rest, breath, writing, the watch, looking up), keyed by `tools/art/room10-clerk.py` and cut at the desk top (posture behind-counter, as Sump). **Room 10 is his first drawing and so his canonical design** (doc 38 section 1). He is not spoken to; a TALK TO on him answers from the verb pools.

**C · Staging.** The street door, the blinds and the stove at the left, the subscription book on its stand by the stove (doc 54: "the warm air off the stove"); the chairs along the back wall facing the inner door (doc 54), the testimonials and the map wall above them; the prospectus rack and the spittoon; the map of holdings over the model on its table; the portrait over the desk; the case clock; the inner door at the right. The walk band runs the runner from the street door to the clock, short of the inner door.

**D · The inner door is a hotspot, not yet a way through.** THE DOOR TO THE OFFICE has its lines (docs 05, 54); Room 11 is not built, and Room 11's build makes the door an exit, as Room 8's made Room 7's archive door one.

**E · The art: 4 of room-10's 4 operations.** A composition master against the graybox with Thad and the clerk (it kept the 20:9 band, so the standard crop); the same room with nobody in it, adding the model town the master left out; the clerk's five-pose sheet; the act-4 rack. Promoted provisionally (errata 72 E).

**F · The way back has no lines** (doc 36 Q153): doc 14 writes Main Street's side of the Company door and nothing writes the inside. A stub exit, as Rooms 6, 8 and 9's are.

**G · Found while building.** (a) and (b) are reported, not changed. (a) The plate has five chairs and doc 05 says six; operation 2 was asked for six and painted five, and no operation was left to ask again. (b) Doc 49's THE PROSPECTUS RACK · PICK UP ("I took one") is ungated, so it plays in Act IV beside an empty rack; choosing to gate a written line is not the builder's. (c) **Fixed:** Main Street's arrivals named the Company door `company` and the hotel door `hotel`, which are not room ids, and gave the claims road no arrival, so coming back through any of the three put Thad at the street's east edge. They now name `company_lobby`, `hotel_lobby` and `stub_claims_road`, and `tools/check-room-entries.mjs` fails a way back into a room of several doors that has no arrival of its own.

# 84 · ROOM 11 BUILT — THE BUILDER'S DECISIONS (2026-11-02)

*Made by the Room 11 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, and two of the room's states are props.** The office is off the lobby on Main Street (night, errata 64a), and the dinner is at night (doc 57). The dinner's laid table (doc 48 S1 beat 1) is room-11 operation 4's pixels over the desk, drawn while Thad holds THE INVITATION until `T_DINED`; after the dinner the handkerchief is Thad's and the desk is drawn bare (the plate's own leather laid over the linen). On the funeral day Fanshawe is absent (errata 68 D) -- a figure, not a picture. **Identity (17b):** deep leather, gilt and red, the only saturated interior in the game.

**B · Fanshawe's look.** Canon gives him no appearance but his portrait's ("painted at approximately twice life size and one-third his actual age"). He is a portly, prosperous gentleman of about sixty with the portrait's moustache: silver hair and whiskers, a black frock coat, a brocade waistcoat, a gold watch chain. Drawn first in the composition master behind his desk beside Thad, then alone on magenta in five poses (rest, breath, welcome, the watch, laughing), keyed and cut at the desk top (`tools/art/room11-fanshawe.py`). **Room 11 is his first drawing and so his canonical design** (doc 38 section 1).

**C · Staging, and the act cards.** The door and the window at the left; the map board and the chairs; the portrait over the desk, the sabre beside it; the ledgers, the sideboard with its drawer and the decanter; the safe at the right. Thad talks to Fanshawe from before the desk's left end (820, 790), clear of his welcoming hand. **The act cards after the opening** are doc 57's (PART TWO, PART THREE), extracted to `content/act-cards.json`; the engine shows a card when ACT rises in play, once the scene's lines are read and no conversation is open, never on a load.

**D · Fanshawe's tree, routed.** FAN_A0 before the swindle; FAN_A1 after it, both answers about the claim giving THE COMPANY MAP (doc 04); FAN_A2 while Thad holds THE INVITATION until `T_DINED` -- only option 6 advances (errata 68 B), and it plays beat 3's line and gives THE HANDKERCHIEF (doc 57); its universal exit is doc 57's "Leaving the table" line; FAN_B1 from Act II, whose option 1 goes on to FAN_B2 (the introduction, then the card: no document says how B2 is reached, and it is the next thing the introduction is for); FAN_C1 after E0 until the clause is read, its option 1 E0b with Thad's aside and `ACT` 3. FAN_B1's note and FAN_B2's card are the rule ledger's, not items: no document lists either as one.

**E · Beat 4 at the door.** "A very fine dinner." / "I believe I own something." play the first time Thad leaves after the dinner -- the doorway is the porch (doc 57) -- and then `ACT` is 2 and its card shows. An exit may now carry such a beat (`transitScene`); every other crossing is silent (doc 14).

**F · He opens on Thad twice.** The dinner (on entering, holding the invitation) and the offer (on entering after E0) are one accost with two conditions (`whenAny`); the tree's entries choose the node.

**G · The funeral day's search.** Doc 54's C3/C4 lines: PICK UP the log gives THE SUBMISSION LOG and `T_QUEUE_PADDED`; OPEN or PICK UP the drawer gives THE PHOTOGRAPH and `T_MOTT_FACE_UNKNOWN` and completes C4, once (a rule may now answer `untilPuzzles`, because `T_MOTT_FACE_UNKNOWN` is also Frame's groundwork); with Fanshawe present both refuse. The empty office's line plays on the first entry while the funeral runs (`sayWhen`), read from doc 54. `tests/c5.test.ts` held that no T_QUEUE_PADDED was declared; doc 57 C4 names it, so the test now holds that nothing at Winnie's window writes it.

**H · The art: 4 of room-11's 4 operations.** A composition master with Thad and Fanshawe (it kept the band); the room with nobody in it -- which also took the colonel out of his own portrait; Fanshawe's five-pose sheet; and one edit that restored the colonel and laid the desk for dinner. The shipping plate is operation 2 with operation 4's portrait canvas (`tools/art/room11-compose.py`); the dinner is operation 4's desk. Promoted provisionally (errata 72 E).

**I · Reported, not built or not played** (doc 36 Q154). (a) FAN_D1, the war's payoff, needs all five contradictions; only two are offered by any node (FAN_A1 3, FAN_B2 3), so it cannot be reached, and it is not built. (b) S1's staging -- Thad seated, the pen with no ink, the charm, Thad holding the deed wrong side up on the porch -- is not played; there is no seated or deed clip, and nobody is painted into a plate. (c) Doc 05 says eleven chairs; the plate has six. (d) The log stays drawn on the desk after it is taken. (e) The vault (Room 35) opens off this office in Act IV and is not built.

**J · Too sharp, redrawn at Thad's pixel size -- Fanshawe and the three before him.** Tyler (2026-11-02): "is his quality too high compared to Thad?" It was, and Sump, Frame and the lobby clerk were the same: drawn on a far finer grid than Thad, whose pixels are big square blocks (about 80 of them from hair to shoe). Post-processing was tried and rejected -- a median ("Thad is pixelated, not smooth") and a pixelation of the old drawings ("NONE of those options are good"). Tyler chose to regenerate each against Thad ("Bigger pixels"), +2 operations each on room-07, -09, -10 and -11 (`art/staging/caps.json`). One each was spent: every figure's five-pose sheet redrawn on Thad's coarse grid, generated against a side-by-side of Thad beside the figure as first drawn (`tools/art/cast-vs-thad.py`), cut by the room's own cut script. Before and after, in the rooms: `renders/full-build-cast-redrawn.png`. A texture number was tried as a check and dropped: it rewards smooth shading, the direction Tyler rejected. Frame reads brighter and flatter than his room's light; Sump sits a little higher over his counter. One operation each is left.

**K · The dinner is staged.** Tyler (2026-11-05), seeing all seven options at once: "Weren't we going to only unveil certain conversation options until others had already played out?" -- and, offered three ways, "You decide." Doc 04's FAN_A2 now tags its follow-ups under rule 7: the dinner opens on options 1, 2 and 7; 3 follows 1, 4 follows 2, 5 follows 3, and 6, the one option that does not sell, follows 2. The player hears two pitches graciously deferred before the honest answer is on the table, so doc 02's "find the one that doesn't" still has its five to find it among. No line changed. `tests/room-11.test.ts` holds the order.

# 85 · ROOM 12 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 12 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, one visual state.** The store is on Main Street (night, errata 64a): the lamp hung over the counter and the stove's glow. Doc 05 Part Two-B's two act variants (THE CREDIT LEDGER, act 3; THE DYNAMITE CRATE, acts 3-4) are lines, not pictures. **Identity (17b):** warm, but broken up by fabric, tin and printed labels.

**B · Nobody is drawn.** Doc 49 puts the proprietor in the back room (THE CALICO: "the proprietor knows the sound a tug makes from the back room"), and no document gives him an appearance or a line to say in person.

**C · Staging.** The street doors at the left; the boots on their nail, the pickaxes and the barrel of shovels; the tower of pans and the price board; the stove with its chairs and the dynamite crate beside it; the calico on its shelf; the counter, with the scales, two open books, the order form and the pickle jar; the shelves behind it -- tins, the tonic, the unsold scales in paper, the lamp oil; the nail keg at the counter's end. **The catalogue is the left book open on the counter, and its five written sections are the five paper slips standing up out of it**, left to right: LADIES' NOTIONS, PATENT MACHINES, FIREARMS, MUSICAL INSTRUMENTS, the furniture pages. The order form lies loose beside the right book, THE CREDIT LEDGER.

**D · On account.** Doc 54's errata 68 A pickups: the first PICK UP on THE PICKLE JAR, DR. PURVIS'S TONIC and THE PICKAXES gives THE PICKLED EGGS, THE TONIC and THE PICKAXE, and marks the account (`T_EGGS_ON_ACCOUNT`, `T_TONIC_ON_ACCOUNT`, `T_PICKAXE_ON_ACCOUNT`); the jar and the pickaxes then answer their written "again". The tonic has no "again": asked again, it says its line and gives nothing (doc 36 Q155). The eggs and the tonic are extracted from doc 23. A scene line may now be read with no case (`· PICK UP — "..."`).

**E · Main Street's sixth door.** Doc 20 lists the Mercantile among Main Street's six façades, and Main Street was built without its door. It is the store with goods in its window, west of the Company: an exit over the storefront, an arrival on its steps. Doc 14 writes no lines for it, and none for the store's side of it: stub exits both ways (errata 72 F).

**F · Given, and the source stays.** A response that gives `items` treats its object as a container that is itself taken (Room 1's case), so the pickaxe would have taken the rack with it -- and Room 11's photograph had already taken the sideboard's drawer out of the room. A response may now `grants` an item and leave its source: the store's three and the drawer's photograph. `tests/room-11.test.ts` and `tests/room-12.test.ts` hold that the drawer and the shelves stay.

**G · The art: 3 of room-12's 4 operations.** A composition master with Thad, which filled the 3:2 canvas, so the room takes its own 20:9 crop; the room with nobody in it, adding the catalogue's five slips (the edit gave the ledger slips too); and one edit adding the unsold scales and the lamp oil, which took the curtain to the back room and painted LAMP OIL on the cans. Promoted provisionally (errata 72 E). One operation is left.

# 86 · ROOM 13 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 13 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, one visual state.** The undertaker's is off the map, at the town's hour (night, errata 64a): one oil lamp hung over the viewing table, the corners dimmer. Doc 05 Part Two-B wrote no act variant for the room, and UND_C1 (Act III) is dialogue, not a picture. **Identity (17b):** bone-white and pale pine, near-monochrome on purpose (doc 26).

**B · The undertaker's look.** Never named (doc 27 note 2). Doc 27's examine layer is his only description -- "a man in his fifties in a clean apron, doing something careful with a plane" -- so he is lean, clean-shaven, grey hair cut short, shirt sleeves rolled, a white apron. Drawn first in room-13's composition master beside Thad, then alone on magenta in five poses (rest, breath, planing, putting the plane down, waiting) **generated against a side-by-side with Thad from the first image** (`tools/art/cast-vs-thad.py`, errata 84 J), cut at the table top by `tools/art/room13-undertaker.py`. He planes on his own beats and looks up to talk.

**C · Staging, and THE COFFINS' USE.** The street door, the window and the waiting bench at the left; the price board and the good suit on its peg; the doorway to the back room, whose pencil-marked frame is THE MEASURING WALL (doc 05: "heights penciled on the door frame"); the coffins stacked by size; the viewing table under its lamp, with the lilies and THE TEETH (a jar) on the shelf above; the hearse harness, the tools and the ledger on its stand at the right. The undertaker stands behind the table's right end. **Doc 26 writes THE COFFINS · USE as "Not yet." and forbids a variant; doc 49 writes a second line for the same verb.** The room plays doc 26's (an annotation may now name the document an override is read from, `overrideFrom`), and doc 49's is reported, not played (doc 36 Q156): which of two written lines plays is Tyler's.

**D · A1 is the news.** Doc 02 and doc 57: Pike is dead, and the undertaker is who says so. Doc 27's tree is the one built (errata 75); its option "Up the hill?" writes `T_PIKE_DEAD`, and now also completes A1. Boot Hill appears on the map at the same flag (errata 31b).

**E · UND_C1 and E3's third step.** Doc 04's UND_C1 is extracted as the undertaker's Act III node, opened on `T_NEED_TO_DIE`; option 1 sizes the coffin (`T_COFFIN_SIZED`). Doc 57's three USE SHENG'S LOAN lines are one pair: paid with the Reverend's figure and the sizing (the loan spent, `T_FUNERAL_BOOKED`, E3), refused in his words before either. SHENG'S LOAN is extracted as an item with its icon. The figure (SOW_C1, Room 17) and the loan (SHE_D1, Room 28) come from rooms not built, so E3 plays in `tests/room-13.test.ts` from fixture `r13-b`. **Not played:** "Frame's notice goes up: FUNERAL THURSDAY: THE PIANO MAN" -- the notice belongs to rooms 2 and 9's boards and is not drawn (doc 36 Q156).

**F · The art: 3 of room-13's 4 operations.** A composition master with Thad and the undertaker; the room with nobody in it; the undertaker's five-pose sheet against Thad. The old foreground (`art/foregrounds/room-13-undertakers.png`), drawn for the voided 320×144 room, is removed. Promoted provisionally (errata 72 E). One operation is left.

# 87 · ROOM 14 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 14 builder under doc 55 section 5's standing delegation, with two of Tyler's rulings (F). No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, elevated three-quarter.** Boot Hill is reached by the map (errata 31b, 43) at the town's hour (errata 64a, 64d), seen from a little above as errata 34 asks. The moon is above the frame (the standard crop leaves it out), its light on the grass and the boards; the town's lamps are small and warm below at the left, and breathe slowly (invariant 9). **Identity (17b):** dry grass and wild oats, weathered boards, one white stone.

**B · Nobody is drawn.** Doc 20: nobody living is staged on Boot Hill; the funeral is Room 31. **Not built:** doc 57 D4's Sowerby "at the gate with the plate" on the funeral day, while `T_SHENG_TASK` is set and D4 is not done. Sowerby is not yet drawn for any room but the Nugget's back room and is not standing anywhere outdoors; the beat waits for him and for SHE_D1 (Room 28) (doc 36 Q157).

**C · The funeral day ends here.** Doc 57 C3: "Room 14, Boot Hill -- entering ends the day. The service is just over." On the first arrival that day Thad says doc 57's line and `T_FUNERAL_DAY` clears, so Fanshawe is back at his desk and Sowerby in his church; another service can be held. A room's arrival lines may now carry `saySet`, written when the lines play: `onEnter.set` lands before they are read, so clearing the day there would have silenced the line.

**D · The plot beside Pike.** Doc 27: Pike is "third row, second from the end"; the end plot beside him is PIKE'S NEIGHBOR (doc 54). It is grass until the grave is dug for Thad. Doc 05's line puts Frame's spelling on its marker, and Frame's spelling is the obituary's (E5, errata 9), so the open grave, its spoil heap, spade and new board are drawn and answer from `T_OBITUARY` until the funeral. After it (`T_FUNERAL_DONE`, doc 57 E8) the same plot is MY OWN PLOT, act 3-4: the headboard, the grass starting over it, a tuning peg on top (doc 54's own lines). **The count:** doc 05 says twelve markers; the scattered plate has Mott's stone and fourteen boards. THE NINETEEN is the scatter between Mott's stone and Pike's board, read along as doc 54 writes; the front board furthest right lies outside its rect.

**E · The compiler.** An exit whose only line is doc 49's (THE GATE's CLOSE) is read from the examine file's `exitsAndUnplaced`. A subject written only in one act (MY OWN PLOT) takes that act's lines and repeats as its own, and the act gates the hotspot. No document writes THE GATE a LOOK or LISTEN, so it is a stub exit (errata 72 F) that keeps doc 49's CLOSE; `exitSubjects` may now say `stub`.

**F · The art: 5 operations (Tyler raised room-14's cap from 4 to 5, 2026-11-05).** A composition master with Thad; the plate, with Thad out, the end board of the back row taken away to leave the plot, and a ninth board added; **the stones scattered** -- Tyler, seeing the plate: "I think the gravestones need to maybe be a bit more scattered?" -- which spent the operation the cap was raised for; the open grave; and Thad's filled grave, which drew the mound but no headboard and put the peg on Pike's board. With the cap spent, the filled grave is composed from operations 4 and 5's own pixels (`tools/art/room14-compose.py`): operation 4's new board, operation 5's grassed mound, operation 5's peg moved onto the new board. **Names on the boards:** Tyler asked whether names would be more realistic than symbols. Kept as marks: doc 35 forbids lettering in a plate ("the engine draws sign text at runtime", not built), a board is about 65 pixels wide, and doc 54 gives the names through LOOK, read along the row. Reported (doc 36 Q157). Promoted provisionally (errata 72 E).

# 88 · ROOM 15 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 15 builder under doc 55 section 5's standing delegation, with Tyler's rulings on the pen (F). No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, one plate.** The livery is reached by the map at the town's hour (errata 64a): one lantern on the post by Grievance's stall, the corners dark. **Identity (17b):** weathered plank, straw and leather. Doc 05 Part Two-B writes no act variant for the stable.

**B · The livery man and Grievance.** No document describes the livery man; he is drawn as the composition master drew him -- old, lean, a battered hat, braces -- tipped back in a kitchen chair against the wall, facing Grievance's stall (doc 54's chair and his PUSH line). Grievance is a mule "the color of a wet saddle" (doc 54), looking out over her half door. Each was generated on magenta against a side-by-side with Thad (operations 3 and 4), cut by `tools/art/room15-figures.py` and lit toward the plate around them. He hums, talks and pulls his hat down; she turns her ears and her head and snorts.

**C · Staging.** The stable doors at the left (the exit, to the map); the tack wall and the anvil; the loft and its ladder above; the pen of mules; the board of names on its post and the livery man's chair beside it; Grievance's stall and its lantern; her feed bin with the folded blanket; the other stalls (hay, the sulky, the folding chairs -- doc 05's "six stalls, one occupied"). Thad talks to the livery man from just right of the pen.

**D · The blanket on loan.** LIV_A1 option 5 lends THE LIVERY BLANKET (doc 23, extracted) and writes `T_BLANKET_BORROWED`: while it is out, the bin is drawn bare (the plate's own panel laid over the blanket, `tools/art/room15-props.py`) and GRIEVANCE'S BLANKET is not a subject. Doc 23: it "comes back after" A5, which clears the flag when Rooms 23/24 are built. Doc 57 A5's "one blanket" is now true of the content too: doc 24's HORSE BLANKET row and pool are read as THE LIVERY BLANKET, and the retired `horse_blanket` item is removed.

**E · LIV_A1, B2, B3.** LIV_A1 is extracted from doc 04 with doc 57's routing: option 1 is Grievance's refusal; 6 is the man she moved for (`T_GRIEVANCE_MOTT`, B2); 4, the tune, waits for 6 and writes `T_HUM_HEARD`; 7 is pair 20. B3 is the tuning fork on GRIEVANCE, one pair with doc 54's and doc 57's four cases: refused before the hum; refused without Vessel's whereabouts (`T_VESSEL_LOCATION`, Frame's B1); with both, the livery man's "Twelve years.", then **the ride, over black** -- a spoken line may now carry `overBlack`, which blacks the play area under it until the room changes -- then the Nugget (a pair's case may now `goto` a room once its lines are read), `T_VESSEL_FOUND` and B3; after B3, doc 54's last line. The compiler now accepts a case override that a combination pair plays by its label. **Not played:** doc 54's staging of the success -- Thad striking the fork, whistling the corrected tune, Grievance walking out of her stall -- is a direction, not a line, and is not animated (doc 36 Q158).

**F · The pen, and the art: 5 operations (Tyler raised room-15's cap from 4 to 5, 2026-11-05).** A composition master; the plate with nobody in it; the livery man's sheet; Grievance's sheet; and a sheet of four side-on mules. Doc 09 writes "Four mules, numbered". The master drew them as heads and necks with no bodies -- Tyler: "what the hell are the four half donkey things in that pen?" -- and four drawn from Grievance's sheet looked "absolutely ridiculous"; Tyler raised the cap for a proper sheet (operation 5). At this depth the pen is about 1.7 m across and a mule side-on about 2.1 m long, so even one does not fit whole at true scale, and four in it looked like one "built into the wall" (Tyler). **Tyler chose two in the pen, facing out, at true scale, drawn from Grievance's sheet in their own colours** (the darker looks across at her). Operation 5's sheet is kept and not shipped. Doc 09's and doc 54's lines about four mules are unchanged (doc 36 Q158). Promoted provisionally (errata 72 E).

# 89 · ROOM 16 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 16 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, one visual state.** The tent is reached by the map at the town's hour (errata 64a): the red lantern hung centre (doc 05) and the stove. Doc 05 Part Two-B writes no variant for the tent; her Act IV appearance is at Prosperity (doc 04). **Identity (17b):** painted canvas, velvet and brass, bare earth.

**B · Madame Ozymandia's look -- and a correction of the builder's own.** No document describes her: doc 01 gives a brass rod, "a great deal of humming, and an entrance fee"; doc 04 "enormous theatrical authority deployed over total fraud". The composition master was briefed with a head-wrap, hoop earrings and kohl, and drew an ethnic fortune-teller caricature -- the builder's error, not the documents'. Her sheet draws her instead as an American spiritualist medium of the 1850s, the frontier's own fraud of the period: black silk, lace collar, cameo, a small bonnet with its veil put up. Five poses against Thad (operation 3), cut at the table top by `tools/art/room16-ozymandia.py`: she hums, pronounces with a hand raised, and holds out a palm for the fee. The master is reference only.

**C · Staging.** The flap at the left (the exit, to the map); the testimonial board and the price list; the incense burner and the cushions; the curtain behind her; the red lantern; the round table with the crystal ball, the cash box with its eye, the cards and the tea service, and THE SECOND ROD's long box beneath it; THE BRASS ROD standing in its holder; the stove; the chart. She stands behind the table at its head; the ball, box and tea pot are in front of her, an occlusion plane (Room 5's mechanism for Winnie's bars). Thad talks to her from the client's side, before the table's left.

**D · Nothing else changes.** The tent's proof declares no principal change: A7 changes the inventory, not the picture.

**E · OZY_A1 and A7.** OZY_A1 is extracted from doc 04: option 1 waits for `T_SURVEY_NEEDED` (A6) and names her price, which the filing fee answers (`T_OZY_ASKED`, a routing flag); 5 is pair 19; 4 plants the Act IV corroboration and, as doc 04 says, sets nothing ("never mentioned again"). Doc 57 A7's three cases are two pairs on her: THE FILING FEE after her price (the fee spent, `T_OZY_PAID`, the exchange as written -- her lines and Thad's alternating at each dash); THE COMPANY MAP after the fee (THE SURVEY, the map handed back, A7) and before it (her line asking in advance). The filing fee before she has named a price has no written case and answers from the item's pool.

**F · The art: 3 of room-16's 4 operations.** A composition master; the tent with nobody in it; her five-pose sheet. Her veil is a purple near the magenta key, so her keying threshold is raised, and her darkest silk, which came back an exact purple-black (red equal to blue), takes a touch of the red lantern -- which is also what lets the key gate pass, since it reads exact purple-black as trapped key. Promoted provisionally (errata 72 E). One operation is left.

# 90 · ROOM 17 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 17 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, one plate.** The church is reached by the map at the town's hour (errata 64a): wall lamps, the lamp on the pulpit, the stove. Doc 05 Part Two-B writes no variant for it. **Identity (17b):** whitewashed plank under open rafters, honey wood.

**B · Sowerby, the same man.** He is already drawn as a judge in Room 4's back room. The church draws him at his pulpit from a new five-pose sheet generated against a side-by-side of Thad and that drawing (operation 3): he preaches with a finger raised, counts adjectives off on his fingers, lays a hand on his heart. He is placed in the church on his existing record (a placement may now carry its own `tree`: SOWERBY here, none in the back room), and is absent on the funeral day ("Sowerby is not there. He is up the hill", doc 57 C3). **Cut at the pulpit, not the desk:** he was first cut at the reading desk's top, which left the wall showing beneath his waist either side of it -- Tyler: "the top half of his body is floating with no lower half". He is cut at the pulpit's top, and the reading desk stands in front of him as occlusion plane 1. The plane is the desk's own wood, told from the wall by its saturation: a first mask by brightness took the wall too and drew it over his waist again.

**C · Staging.** The door at the left (the exit, to the map), never locked; the board of services by it ("The board is by the door", SOW_A1 option 2) and the collection plate on its stand; the subscription list; the belfry hatch with the bell and its rope; the windows; the pews with the hymnal; the church-sized stove; the pulpit; the meeting table at the hall's end, in the foreground, where the walk band stops short of it.

**D · The funeral day is the picture's change.** On `T_FUNERAL_DAY` the pulpit is empty.

**E · SOW_A1, SOW_C1, C3 and E3.** Both nodes are extracted from doc 04 with doc 57's routing: SOW_A1 5 waits for `T_FANSHAWE_FUNERALS` and `T_PIKE_DEAD` and asks who speaks for the deceased (`T_SOW_FUNERAL_ASKED`); doc 57 C3's USE THE LETTER answers it -- the memorial booked (`T_MEMORIAL_BOOKED`), the letter given back. 6 waits for `T_SHENG_TASK` and not a funeral day (D4); 7, another service, for the memorial and for C4 or D4 not done (a dialogue option may now carry `whenAny`; "C3 complete" is read as the memorial booked and not the funeral day); 8 is pair 17. SOW_C1 opens on `T_NEED_TO_DIE` until the price is set: option 1 adds four to `SOWERBY_ADJECTIVES`, option 3 sets `T_SOWERBY_PRICE` (E3 step 1). **Not built:** the live price counter on screen during SOW_C1 (doc 04's mechanic; errata 75: "ADJECTIVES and the price") -- its words and layout are not written (doc 36 Q160).

**F · The art: 3 of room-17's 4 operations.** A composition master; the church with nobody in it; Sowerby's pulpit sheet. Promoted provisionally (errata 72 E). One operation is left.

# 91 · ROOM 18 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 18 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, rebuilt.** The 320x144 lobby is retired and the room rebuilt at errata 54's size, at the town's hour (errata 64a): lamps and the stove. **Identity (17b):** papered walls over dark wainscot, a worn runner, brass.

**B · The clerk's look.** No document describes him; doc 27 gives his voice ("proprietorial about a building he does not own... he is administering"). He is drawn as a fussy desk clerk of the period -- centre-parted hair, spectacles, a moustache, sleeve garters, waistcoat and bow tie -- five poses against Thad (operation 3): reading, writing, looking up over his spectacles, and turning the register round (doc 27 option 4). Cut at the desk top; the open register stands in front of him as occlusion plane 1, the book's whole outline (a mask of its pages alone let his shirt show through the gutter).

**C · Staging.** The street door and the window at the left, the settee and the spittoon; the painting and the engraving (doc 54: both stay); the parlor piano in its corner under a fern; the clerk's desk with the register and the bell, the key rack and the clock behind it; the stove; the stairs at the right. Thad talks to the clerk from before the desk's left end.

**D · The plate's frame.** The composition master painted a band narrower than 20:9, which no crop could take without losing the street door or the stairs. Operation 2, asked to take the people out and fill the band, repainted the room taller across the canvas; a 20:9 crop from y 125 keeps the cornice, both exits and the floor.

**E · A2, and the stairs.** Doc 24's fork-on-piano pair is routed to the lobby's PARLOR PIANO (it was routed to a parlour room that does not exist) with doc 57's three cases: refused before the clerk's leave (`T_TUNES_PIANOS`, his option 4); with it, doc 24's line, then the clerk's "Top of the stairs, second door..." (`T_ROOM_GRANTED`, A2); after it, the line for checking again. THE STAIRS are the way to Room 19 only once the room is given; before, they are THE STAIRS still -- their own LOOK and LISTEN -- and walking, USE or OPEN on them is the clerk's "The stairs come with a room, sir" (doc 57 A2). An exit subject may now carry `when`, and `closed` for that answering stand-in. Two checks learned what this needed: the flag-order check now counts a combination case's writes (the piano's `T_ROOM_GRANTED` opens the stairs), and the duplicate-line check counts the stand-in (`stateOf: "stairs"`) as the stairs themselves, one object in two states (proofs/check-friction.json).

**F · The art: 3 of room-18's 4 operations.** A composition master; the lobby with nobody in it, re-framed; the clerk's sheet. Promoted provisionally (errata 72 E). One operation is left.

# 92 · ROOM 19 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 19 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, rebuilt.** The 320x144 room is retired and the room rebuilt at errata 54's size, at the town's hour (errata 64a): one lamp on the desk. **Identity (17b):** faded paper over plank, bare boards, an iron bed, a tin basin; nobody else is in it.

**B · Staging.** The door at the left with his coat hung on it (doc 26: THE COAT ON THE DOOR); the wardrobe, its door ajar (doc 54: "The door drifting on its hinge"); the window over the desk (errata 69 C: the alley; the plate shows the back wall of the building across it and the tops of barrels, and no cat, because Act IV's line says the cat has gone); the desk with the lamp, the sheet begun, the case and his mother's letters tied in a bundle; the washstand with its jug, basin and a piece of mirror the size of a hand (doc 26); the bed; and THE WALL, the thin plank wall to the next room, at the right beside the bed (doc 26 note 1, drawn with no number on it). The coat hangs on the door and an exit is hit before any hotspot, so THE DOOR is the panel below the coat.

**C · The plate.** Operation 1, the composition master, filled the band; operation 2 took Thad out, made the mirror small and put the alley in the window; the 20:9 crop is the band itself.

**D · The outgoing letter's LOOK is its written lines, always.** Doc 08 wrote THE OUTGOING LETTER's LOOK as "reflects whichever version the player last chose", and doc 26 that a chosen letter "replaces variant 1". Doc 04 Part Three says "Nothing tracks it. Nothing depends on it", doc 15 "tracking nothing", and design invariant 10 that nothing in the letters-home system "is ever tracked or referenced". Quoting the choice back is tracking it, so it is not built: the letter answers with doc 05's and doc 26's lines in every act, and no choice is recorded anywhere (`tests/room-19.test.ts` proves no flag moves).

**E · The letters home.** Doc 04 Part Three: "available in Thad's hotel room in every act". USE on THE LETTERS HOME opens that act's three versions in Acts I-III, listed by the document's own names for them -- honest, flattering, flattering with a number in it -- and the one chosen is the letter, spoken whole as his line for the choice (doc 30 section 6.2's `option.echo`, now built), after which the choice closes. Act IV is "the only version offered. No choice. Four lines.": USE reads it, four lines. The tree is extracted from doc 04 (`content/dialogue/letters-home.json`); a room annotation may now name a subject that opens a tree (`opensTree`).

**F · Split lines, a defect found here.** Act IV's letter arrived as "Dear Mother." alone. The engine read "is this the first look" after advancing the line cursor, so a response rule's `then` lines -- doc 30 section 5's setup, beat, punchline -- were never spoken: every split first LOOK and LISTEN in the game, 139 rules, said its first sentence and dropped the rest. Fixed in `engine/core/VerbSystem.ts`, held by `tests/split-lines.test.ts`.

**G · The art: 2 of room-19's 4 operations.** A composition master and the room with nobody in it. Promoted provisionally (errata 72 E). Two operations are left.

# 93 · ROOM 20 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 20 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, built new.** The alley behind Main Street, at the street's hour (errata 64a): the stars, one back door propped open with its lamplight across the mud, and the street's lamp through the gap. **Identity (17b):** bare boards and bare posts, the backs of the false fronts, mud.

**B · Staging.** Left to right: the gap back to the street; THE BACK DOORS, a row of four, one propped open with a brick (doc 54); THE CRATES under the open door, with THE CAT on the top one in its light; THE RAIN BARREL under a downspout; THE WASH LINE strung across, high, with one shirt and the long underwear (doc 05); THE BACK OF THE IMPROVEMENT COMPANY, one story with no windows and the bracing of its false front against the sky (doc 09, doc 54); THE SIDE DOOR in it, THE ASH PILE beside it, and THE BARRELS stacked true at the right. **The cat's light:** doc 05's and doc 54's cat sits "in the one square of sun" and moves "after the sun"; the street is night (errata 64a), so she sits in the one square of lamplight from the open door, and her lines are as written (doc 36 Q163 a).

**C · The ways in and out.** Doc 20: "East, the back lots | 20 · back alley", and the alley is reached from Main Street's east end. Doc 20 puts the stage road at the street's west end, which is the plate's right (Room 1 arrives there), so the east end is the plate's left, past the mercantile: Main Street gains THE BACK LOTS there, and the alley's gap leads back. No document writes either a LOOK or a LISTEN, so both are stub exits, as Rooms 6, 8, 9 and 10's are. Doc 20's way on to Room 21, the watchman's shack, is not drawn: Room 21 is not built, and its door comes with it.

**D · The plate.** Operation 1, the composition master, painted the band taller than 20:9 and drew Thad smaller than the graybox planned; the room's depth is taken from the master (323 tall at y 800), and the crop from y 132 keeps the bracing's posts and the mud. Operation 2 took Thad and the cat out.

**E · The cat is a figure.** Errata 77: every visible character moves. Five poses on magenta against Thad (operation 3) -- rest, breath, her tail up, her head turned, a paw washed -- sat on the crate's lid (`content/ambient/alley-cat.json`). THE CAT hotspot lies over her, so her LOOK and LISTEN and doc 49's PICK UP and TALK TO are answered there; she has no tree. She is in the alley in every act: Room 19's window says "The cat has gone" in Act IV, and no document says she leaves the alley (doc 36 Q163 b).

**G · E6's first half: Hob on his rounds, in the alley.** `proofs/readiness/puzzles.json` sites E6 in Rooms 20 and 7: doc 04's HOB_E6 is open "once `T_EXECUTOR_RULE` is set and until E6 is complete; he is on his rounds at night (Main Street, the back alley)". Placed in the alley, he made the readiness gate answer NO: no document wrote his wrong-verb refusals there (Main Street was tried and answered the same). **Tyler, 2026-11-05:** "I prefer the Alley", and "write three lines for Hob on his rounds: what he says to PICK UP, PUSH and USE" -- the three are in doc 54's Room 20 Overrides, marked as written then at his request, the one exception to the rule against new lines in this build. Hob is his approved Room 1 drawing, mirrored and scaled to the alley (`tools/art/room20-hob.py`, no image operation), before the Company's side door with his lantern, from `T_EXECUTOR_RULE` until `T_EXECUTOR_NAMED`. HOB_E6 opens on those flags (an entry), its option 1 gives THE EXECUTOR'S FORM (doc 04's State column, now read), and doc 57's cases are pairs -- the Registrar's two (`T_EXECUTOR_NAMED`, E6), Winnie's and Frame's refusals; Sheng's waits for his room. Played in `tests/room-20.test.ts`.

**F · The art: 3 of room-20's 4 operations.** A composition master; the alley with nobody in it; the cat's sheet. Promoted provisionally (errata 72 E). One operation is left.

# 94 · ROOM 21 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 21 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Night, built new.** Hob's shack off the back alley, at the town's hour (errata 64a): one lamp on the table. **Identity (17b):** bare plank, swept boards, very clean and very bare.

**B · Staging.** The door at the left; THE COAT ON THE NAIL beside it, too good for the room; THE STOVE, cold, with its empty ash bucket; THE WINDOW in the back wall onto the dark street; doc 48 S4's table, two chairs and THE LAMP; THE COT made square; THE TALLY MARKS over the wall above and beside it. Hob is here only for the confession (doc 54): his approved Room 1 drawing, mirrored and scaled to the shack, beside the table, from E9 (`T_SAME_HAND`) until the confession is over (`T_HOB_IS_MOTT`) -- who is present is decided as Thad arrives, so he stays through the visit it ends in. His wrong verbs here are doc 54's Room 21 Overrides.

**C · The ways in and out.** Doc 20: the alley "leads on to 21 · watchman's shack", and the shack has one way back. THE DOOR has doc 49's CLOSE and no LOOK or LISTEN, so it is a stub exit as Boot Hill's gate is; the alley gains THE WATCHMAN'S SHACK at its far end, also a stub. Doc 49's other three Room 21 refusals stay retired (errata 68 E).

**D · The art: 3 of room-21's 4 operations.** A composition master; the shack with nobody in it and the table bare; and its companion after the confession -- dawn starting in the window and the two cups set -- cut into two props (`tools/art/room21-props.py`): THE CUPS from `T_SAME_HAND` (S4 beat 1, "Hob sets two cups"), THE DAWN WINDOW from `T_HOB_IS_MOTT` (S4 beat 3, "Outside, dawn is starting"). The plate's crop is 1500x675 from (18, 174): the band was painted short of 684 rows. One operation is left.

**E · The confession (doc 48 S4, doc 57 E10).** Entering after E9 is the action that completes E10: the room's accost may now carry `completes`, firing only while the puzzle is incomplete, completing it, and performing its tree's puzzle-gated opening once. HOB_C2's opening begins with S4 beat 1's line. Its way out is S4 beat 3: Hob's line, `T_HOB_IS_MOTT`, `T_NO_GOLD_EVER` (doc 04's name; S4's `T_STRIKE_WAS_LIE`, errata 75 K) and `ACT` = 4, whose rise brings the card -- **PART FOUR — THE QUIETEST PART OF THE GAME**, now extracted from doc 57 E10. **Not built:** Act IV's opening in Room 19 ("Packed. It took four minutes...", doc 57) -- the case packed on the bed is a Room 19 state for Act IV, and comes with the Act IV rooms (doc 36 Q164).

# 95 · ROOM 22 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 22 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Dusk, built new.** The road out to the diggings, at dusk: the men coming back "at seven at night" (doc 10), the town's first lamps lit below and its chimney smoke straight up (doc 54). The stub room is retired; the room's id is `claims_road`, and Main Street's way, the map's entry and Main Street's arrival follow it. **Identity (17b):** a dirt road rutted a foot deep, sage and greasewood, the diggings' scars on the hills.

**B · Staging.** The town below at the left and the way back down to it; the road rising across the frame; THE MILE POST with two arms and THE BOOT upright at its foot (doc 05); THE SCRUB on the slopes; THE VIEW AHEAD, the hills opened up by the diggings, and the road turning up into them at the right.

**C · The plate.** Operation 1 painted the whole canvas; the 20:9 crop from y 200 keeps the town, the hills and the road in front of the post. Operation 2 took Thad and both crowds out.

**D · The ways.** Back down to Main Street at the left: a stub exit (doc 14 writes Main Street's side). Up to the claims at the right: see F.

**E · The two crowds walk the road (Tyler, 2026-11-05: "Walk the road").** Doc 10: "The two crowd hotspots are the whole room." Operation 3 drew four miners as one group on magenta against Thad, four frames walking out with their tools on their shoulders and four walking back with them hanging (`tools/art/room22-miners.py`). Each group is a **loop walker**, new in the engine (`AmbientFile.loop`): it walks its path on the road -- out from the near edge up into the diggings, or back down -- drawn at the height its path declares, then is off the frame for a pause and walks again. Both ends of every loop are off the frame, so nobody is seen to appear or vanish (`tests/movement.test.mjs`). They are examined through THE MEN GOING OUT and THE MEN COMING BACK, over the far road and the middle road. Doc 10 times them six in the morning and seven at night; at dusk both are on the road.

**F · A4: the way up only with the map.** Doc 57: "Room 22 offers the way to it, only while Thad holds the map", and without it, walking up answers "Forty feet of ground, somewhere up one of these..." A target may now need something in hand (`holding`), and an exit subject whose room is not built yet may be `pending`: only its closed stand-in is built. Without the map the way up answers with doc 57's line; with it the stand-in is gone, and the way itself -- to Room 23 -- comes with Room 23.

**G · The art: 3 of room-22's 4 operations.** A composition master; the road with nobody on it; the miners' walk sheet. Promoted provisionally (errata 72 E). One operation is left.

# 96 · ROOMS 23/24 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Rooms 23/24 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Dusk, built new.** Prosperity and its hole are one room (CLAUDE.md, `prosperity`), at the road's hour: dusk. **Identity (17b):** a bare hillside claim -- mud, rock and something unidentified -- a leaning numbered stake, a dark old hole, an older boundary stake up the slope, a bare ridge, a low creek at the claim's foot.

**B · The subjects.** Doc 05's seven and doc 54's merge. THE CLAIM MARKER (MINE) "is this stake" (doc 54): the compiler now folds a merged alias's act lines into its subject instead of making a second stake. CLAIM ONE'S BOUNDARY is there after A9 (`T_BORDERS_MOTT`). THE HOLE's LISTEN is doc 05's line three times, declared a deliberate repetition as doc 54 asks, and compiled like every other line (invariant 3). Doc 49's THE RACCOON'S FORMER RESIDENCE · OPEN is THE HOLE after A5 (errata 68 E): an override may now hold only in a state (`overrideWhen`).

**C · The ways (doc 57 A4).** "Room 23 appears on the town map, and Room 22 offers the way to it, only while Thad holds the map." The map's location may now need something in hand (`holding`); Room 22's way up is an exit to Prosperity with the map and doc 57's line without it. The way back down is a stub exit; leaving clears the meeting and the fumes.

**D · The art: 3 of room-23's 4 operations.** A composition master; the claim with nobody on it; the raccoon's sheet on magenta against Thad -- four sitting poses and four walking. The meeting is three more of him from that sheet, each a shade apart (`tools/art/room23-raccoon.py`). One operation is left.

**E · The raccoon and his name.** He sits in the hole's mouth while the hole is warm. Doc 04 RAC_A1 (extracted) is opened by the first TALK TO through THE RACCOON hotspot over him; a naming option sets `T_RACCOON_NAMED` and `RACCOON_NAME` 1-3, and the hotspot is called by the row's display name after (`names`; the compiler's `namesFrom`). A figure with no tree under a hotspot that answers TALK TO is spoken to through the hotspot. After naming, TALK TO is doc 57's three lines.

**F · A5's three attempts (doc 54).** The bait: three more raccoons **walk in** -- an engine addition: a figure whose condition starts holding while Thad watches walks its `arrive` path instead of appearing -- and settle around the first; the eggs are spent; they are gone the next time he enters. The smoke: the tonic is spent and, while the fumes last, every verb on THE HOLE or THE RACCOON is doc 54's one line (the compiler's `verbRules`; one line written for one state, so a scene line, and one answer on both subjects: the duplicate check now counts a scene line shared in one state as one owner, which retired four allowlist entries -- the friction review of 2026-11-05). Thad's retreat "as far as the claim marker" is not staged. The blanket: the hole goes cold, A5, `T_WARM_HOLE`; the raccoon walks off up the slope (his exit), and the meeting with him if it is there; the blanket comes back; again, doc 54's "after".

**G · F1 (doc 57).** In Act IV, after A5, LOOK at the hole is the draught -- `T_DRAUGHT`, F1. The pickaxe answers before and after it; "Room 34 opens below the hole" waits for Room 34.

**H · The proof starts from a fixture.** No route can put the Company's map in Thad's hand, so a proof spec may now start from a fixture (`fixture`), and the manifest records it; the doors pass walks the road's way up with the map.

# 97 · ROOM 25 BUILT — THE BUILDER'S DECISIONS (2026-11-05)

*Made by the Room 25 builder under doc 55 section 5's standing delegation. No line was written. Every ruling below can be struck or changed by its letter.*

**A · Dusk, as next door (Tyler, 2026-11-05).** The builder first painted it in the morning -- "Lovely morning" (doc 04 PRA_A1), the coffee pot not yet at ten (doc 54) -- and Tyler ruled it out: the game has no clock, every exterior before it is at dusk or night, and Prosperity next door is at dusk, so walking over the border stones turned evening into morning and back. Room-25's fourth operation relit the empty claim to Prosperity's dusk; Pratt is graded into it as he is next door; the sign's lettering is pale paint, the YET the brightest (doc 49: "The YET gleamed"). No line changed: "Lovely morning" is Thad's, said at dusk, and Pratt checks the sky and says "Yep." **Identity (17b):** the best-kept claim in the district, which has produced nothing in nine years: swept ground, a whitewashed boundary, a level lean-to, sorted tailings, a square trench.

**B · Pratt's trees, and his offer.** Doc 04's five nodes, extracted (`content/dialogue/pratt.json`): PRA_A1 in Act I, PRA_B1 from Act II, PRA_D6 once he has turned. PRA_D5 has no options -- "arithmetic, done out loud, slowly" -- so it is the exchange PRA_B1 option 7 plays, every line of it, and the conversation goes on to PRA_D6 (doc 57 D5). "Every single conversation, regardless of topic, ends with Pratt making an offer. It never stops": a tree may now carry a `closing`, the owner's next line in a run as any ending option closes the conversation, held at the last (`PRATT_OFFERS`). Doc 04's run is read whole; "Twenty dollars." *(pause)* "That's my number..." is one offer of two lines. His sparring (PRA_D6 option 4) is "Try me." and, as Winnie's, waits for the sparring runtime.

**C · The ways.** Pratt's claim is "next door" (doc 04 PRA_A1, "beside Prosperity"; doc 05, "the claim next door"). Prosperity gains a stub exit at its right, past the creek, to Pratt's claim, and Pratt's claim one back over the border stones. On the town map it is a place with the Company's map in hand, as Prosperity is (doc 57 A4: the map finds the claims).

**D · D2 on Prosperity (doc 57).** "The first time Thad comes to Prosperity in Act II, Pratt is on it": he stands by the claim marker with his mallet, driving his own new stake, and PRA_D2 opens as Thad arrives (an accost, once). Its option 1 opens D2 and he walks home next door; the stake stays, a prop of Room 23, until he signs the quitclaim (D5). A talking figure is drawn in one piece, so the stake was cut from his frames and stands where his mallet lands.

**E · The art: all 4 of room-25's operations.** A composition master; the claim with nobody on it; Pratt's sheet on magenta against Thad -- four poses with his rake (rest, breath, checking the sky, raking), four walking with his mallet, four driving the stake. The Prosperity frames are graded into its dusk. THE SIGN's board is painted blank and lettered in the shipping face from the documents ("N. PRATT", doc 54; "NO COLOR YET", the sign's name), ruled in three lines (`tools/art/room25-sign.py`). The fourth relit the plate to dusk (A).

**F · What waits.** D6's second half is Room 7's: "the next time Thad enters the Registrar's, Pratt is at the counter" -- PRA_D6 option 5 sets `T_PRATT_SWEARS` and the counter scene is not staged yet. A5's fourth way (PRA_A1 option 1) plays as dialogue; Pratt's walk over to the hole is the line's stage direction, not staged.

# 98 · THE DIGGINGS ARE AT NIGHT — OWNER RULING (Tyler, 2026-11-05)

*Tyler: "Raise the caps if you need to to make sure everything is appropriately set at night. Going from night back to dusk doesn't make sense."*

**A · The town's hour is night, everywhere outside.** Errata 64a set Act I's Main Street at night and 64d ruled out a clock; Rooms 22, 23/24 and 25 were built at dusk (95 A, 96 A, 97 A), so walking out of the night town onto the road went back in time. All three are relit to night, and those three letters' hour is superseded by this one. The only change of light the game makes is the one the documents write: dawn at the end (doc 48 S4 beat 3, the shack's window; Room 36, Main Street at dawn).

**B · How.** One operation each relit the empty plate to night against the approved night exteriors (Rooms 1 and 14) -- room-22 attempt 4, room-23 attempt 4, room-25 attempt 5 (its cap raised by one under this ruling; `art/staging/caps.json`). Nothing moved: every rect, walk band and depth curve stands. The figures carry one night grade (0.66, 0.68, 0.84): the miners, the raccoons and the meeting, Pratt on his claim and on Prosperity, and his stake. THE SIGN's pale lettering stands.

**C · No line changed.** Doc 10 times the miners "six in the morning and seven at night" and both crowds walk the road (95 E): at night they are the late shift home and the early one out, unchanged. "Lovely morning" is Thad's, said in the dark; Pratt checks the sky and says "Yep."

**D · Seen in (Tyler, 2026-11-05: "I'll take your recommendations").** Measured against the approved night rooms, the lower half of the frame -- where people stand and things are clicked -- averaged 30-37 there, 30 on the road, 27 on Prosperity and 23 on Pratt's claim, which was also one flat blue with no warm light. Prosperity is lifted by 1.25 and Pratt's claim by 1.45 (`tools/art/plate-lift.py`: each pixel gains its own luminance times the gain, its hue untouched). Pratt's claim gains its one warm light from the documents: the coffee fire is lit ("A faint ping as the tin warms"; "At ten it will boil", doc 54), so room-25's sixth operation (its cap raised again under this ruling) put a low bed of embers under the pot, lighting the ring, the pot, the chair and the near post. It does not flicker (invariant 9). The road is left as it was. `tools/check-night-exposure.mjs` now fails any night exterior darker than the approved ones.

# 99 · ROOMS 26-30, THE DIGGINGS -- THE BUILDER'S DECISIONS (2026-11-05)

*Made by the builder of Rooms 26-30 under doc 55 section 5's standing delegation and Tyler's "Proceed with 26-30". No line was written. Every ruling below can be struck or changed by its letter.*

**A · Reached "via 22".** Doc 20 lists the creek, the abandoned claim row, Sheng's laundry, the high ridge and Mott's supposed site as reached through Room 22, "the junction. Everything below reaches through it", and its town map shows locations "as they become known". Room 22's plate offers one way, up to Prosperity; so walking the road to the claims sets `T_SEEN_CLAIMS_ROAD`, and each of the five goes on the map from then. Each has a way back up to the road (a stub exit: no document writes it a line), landing by the mile post. All five are at night, the town's hour (errata 98), and measured against the approved night rooms (`tools/check-night-exposure.mjs`).

**B · Room 26, the creek and the sluice.** Doc 05's seven and doc 10's seven, merged by doc 54 into ten. **Identity (17b):** a shallow creek over stone; the community sluice -- forty feet of boxes on trestles -- along its far bank with the headgate at the right; one willow on this bank. **Art: 3 of room-26's 4 operations** -- a composition master; the creek with nobody at it and THE MERCURY FLASK hung on the sluice's near end, which the master had not drawn; THE MAN PANNING's sheet on magenta against Thad, crouched, peering, tipping, swirling. He has no tree ("He has not spoken in nine hours", doc 10) and is examined through the hotspot over him. The plate is lifted by 1.45 to the approved night rooms' level.

**C · Room 27, the abandoned claim row.** Doc 05's fifteen subjects: eleven claim markers, THE WORKINGS, THE SLUICE FRAMES, A BOOT (doc 08) and THE PATH; nobody ("Nobody comes up here", doc 08). **Identity (17b):** eleven abandoned claims along a worked hillside, each marker before its hole, a path worn deep in front of them, the old sluice frames up behind. The markers carry painted marks, not words: eleven boards of lettering at that distance would read as noise, and the hover label names each one. Left to right they take doc 05's names -- EUREKA "the first marker in the row", THE MOTHERLODE "in letters that used up two boards" on the other two-board marker, the rest in doc 05's order. **Art: all 4 of room-27's operations.** The master drew ten markers from a layout of eleven; the plate took Thad out; two further operations asked for the eleventh -- in words, then over a grey placeholder -- and drew none. So THE BLANK ONE, "the last marker", is a prop cut from the plate's own tenth marker, its board cleared bare, standing set apart at the path's end (`tools/art/room27-marker.py`). The plate is lifted by 1.3 to the approved night rooms' level.

**D · Room 28, Sheng's laundry.** Doc 05's and doc 10's passes merged by doc 54 into seventeen subjects; AH-LAM SHENG at his ironing board ("He is ironing", doc 54). **Identity (17b):** a plank laundry, three copper boilers on their own fires, a mangle, a stove of irons, a curtained back room, and a counter that is also a bank; the high ridge path climbs from the open door, the drying lines outside. At night, lit by the coppers. **His tree** (doc 04 SHE_A1, SHE_D1, extracted): SHE_D1, "the paper", opens only while its business is open -- from holding the paper (A1 option 1, once Pratt is "told to") until the Thursday ledger is read, and in Act III until the loan is taken -- so SHE_A1's options, pair 18 among them, are never lost. D1 option 1 is Sheng's terms (**D3**); 1-prime, with THE LINEN MONEY in hand, reads the ledger (**D4**'s laundry half, `T_PRATT_TRAIL`); option 2 gives SHENG'S LOAN (E3). THE LINEN MONEY is loaded and has its icon (coin and a button, doc 23). **Not staged:** D4's first half -- the Reverend paying out of the collection plate on the funeral day "at the foot of Boot Hill" (doc 57 D4) needs Sowerby standing there with the plate. THE HIGH RIDGE PATH is the open door; it becomes the way up to Room 29 when Room 29 is built. **Art: 3 of room-28's 4 operations** -- a composition master, the laundry with nobody in it, and Sheng with his board on magenta against Thad.

**E · Room 29, the high ridge.** Doc 05's eight subjects; nobody. **Identity (17b):** the bare rock top of the ridge, a cairn, a seat of rock and a brass survey pin; below, the whole of Consolation -- two streets of lamp-lit windows and a steeple -- the diggings' scattered lights beyond, the road east running off into the hills. Its 320x144 plate is retired (doc 55 section 2) and replaced at the same path, which `content/ui/title.json` names for the title screen still to be built (doc 17: the title "over the ridge at night. Consolation below as scattered lamps in a great deal of darkness", which the new plate is). **The ways:** "The path up the ridge starts at the door" -- Room 28's THE HIGH RIDGE PATH is now the way up, keeping its lines, and the ridge's path the way down; and on the map after the road (A). THE ROAD EAST's LISTEN is "Nothing coming." three times, declared in content as doc 54 decides ("five uses, deliberately"). **Art: 2 of room-29's 4 operations** -- a composition master and the ridge with nobody on it, lifted by 1.35 to the approved night rooms' level.

**F · Room 30, Mott's supposed site -- and the act lines a merge carries.** Doc 05's thirteen subjects; nobody ("the pilgrims are in the lines, not the room"). **Identity (17b):** one great bowl of overlapping pits dug to pale bedrock, an old windlass over the deepest shaft, spoil heaps grown into hills; on the near rim the sieve pile, the post of initials, the survey stake and the carved stone; Prosperity one ridge over and the town's steeple far off. The stone carries carved marks, not MOTT, as the markers of Room 27 carry marks. **Art: 2 of room-30's 4 operations** -- a composition master, and the site with nobody on it, THE OFFERINGS pressed in at the bowl's centre and A NEW DIGGING by the windlass, which the master had not drawn. **The compiler:** doc 54's merge carries Part Two-B's act lines on a merged subject (`acts`), and the compiler never read them. THE SITE's Act IV line compiled to nothing, and so, since they were built, had Room 23's THE CLAIM MARKER (Act IV) and Room 19's THE WINDOW (Act IV), HIS MOTHER'S LETTERS (Acts II-IV) and THE COAT ON THE DOOR (Act III). They are compiled now, as act-gated rules ahead of each chain; `tests/lessons.test.ts` fails any act line the extraction carries that its built room does not.
**G · Room 31, the funeral.** Doc 20: reached from Boot Hill once the executor is named (E6) -- the open plot beside Pike's is the way up from E6, with the obituary, until the funeral is done; its words stay on PIKE'S NEIGHBOR, hidden meanwhile. ~~By day, very high and very blue~~ **At night (K, Tyler 2026-11-06)**; the day composition is relit under operation 4's moon. **Staging (doc 48 S2):** the service is already gathered when Thad walks up at the back (beat 1's procession is not walked: there is no choreography for nine people and a hearse, doc 36 Q173); Sowerby's eulogy is his ambient bark, doc 48's own words, written into his file by the compiler; beat 3 is the second LOOK at the grave (the grave's own second line, then the watchman's two) or the way back toward the hill, and he walks off the hill at once, the words anchored where he stood; after it the way back refuses (doc 57 E7), and THE COFFIN · USE is the lying down -- Thad's line, the undertaker's -- into Room 32. Room 32 writes `T_LAID_IN` on entry (so the service does not vanish while the undertaker is speaking) and, once the lid has opened and HOB_C1 is over, hands him back to Room 31 by a new room field, `afterTimeline` (doc 57 E8); Room 31 is then the night plate (a new field, `plateWhen`), nobody, the grave open with the coffin in it, and his line writes `T_FUNERAL_DONE`. A door scene may now `stay` (the refusal), and a hotspot whose TALK TO is an override answers it over a figure with no tree (the mourners). **Cast:** cut from the composition master by subtraction (Room 4's judges' method) -- the undertaker at the coffin, Sowerby officiating, the mourners as one group, the watchman with his hat in his hand, Grievance in black in the hearse harness -- each with actions derived from its rest frame (errata 77); the hearse and the coffin on its trestles are one prop, gone by night; the coffin's name plate is blank brass laid on the lid by script, because the master drew none and no picture carries text. **Art: 4 of room-31's 4 operations** -- the composition master, the hill with nobody and no hearse or coffin, the watchman's walk off the hill on magenta against Thad, and the hill at night with the grave dug open.
**H · Rooms 34 and 33, under Prosperity and the listening chamber (F1-F3).** **Room 34** is one room in two states (errata 69 A): Thad's own tunnel by his one lamp, the rock face, the old pegged timbering and THE GAP to the hollow; after F3 (`T_BROKE_THROUGH`) the seam, the tended lantern and the even footprints, on the second plate (`plateWhen`). The pickaxe on the hole after F1 says doc 57's three days and forty feet and leads down (`T_DUG_DOWN`); from then the hole's mouth is a small way down inside THE HOLE, whose own lines are untouched (invariant 3). THE GAP's lines are doc 57's, read by the compiler (`linesFrom`). **Room 33:** EVERY ROCK SURFACE is the whole chamber; its LOOK is the ladder that empties out (errata 70 F); a LISTEN on it is a tap, placed where the click lands (engine/core/Listening.ts): the knock and its ripple, which lasts exactly as long as the sound's tail, lengthen toward the void, and that is the only guide. **The taps are rendered, not synthesised live**: sixteen steps from the far rock's dull knock to the void's edge, each with its measured tail (tools/audio/render-r33-sfx.py), played as every other one-shot is -- doc 45's gradient, near enough continuous, and testable. The void is where room-33 operation 3 broke the wall, never a hotspot and never named on hover; its one line is said on the first tap that lands on it, and `R33-TUNE` runs: the score from -35 cents to 0 across ninety seconds (a playback rate, `Music.setTune`), the lamp's flicker narrowing to a steady glow on the same clock (invariant 8), and no click is his until it is over (doc 48 S5 beat 3); `T_IN_TUNE` then holds the score at 0 for the rest of the game (the manifest's `music.tunedFlag`). The fork is struck once on the first entry (beat 1, an A440 rendered by script). F3 is doc 54's three swings, read in order -- a direction performed as one (doc 58, extended here to room lines and pair rules), a quote as Thad's -- the third adding doc 57's piece of wall: THE SAMPLE, `T_BROKE_THROUGH`, `T_STRIKE_FOUND`, and Room 34's second state. **Not done, for Tyler (doc 36 Q174):** `R33-M`, THADDEUS complete, is not written -- the only THADDEUS is a four-bar placeholder that stops on the third, and finishing it is composition -- so the ninety seconds are silent but for the tuning of nothing; and Thad stands rather than sits, there being no seated Thad. **Art:** room-34 3 of 4 (master, plate, the second state); room-33 3 of 4 (master, plate, the broken wall).
**I · Room 35, the Company vault.** Doc 54's sixteen subjects; nobody; no puzzle (doc 02). **Identity (17b):** riveted iron, the great round door standing open, the real ledgers, the tin deed boxes, the portrait boxes, the rolled maps and the pinned private map, the search fund open on a lectern, the strongbox, the locked drawer, the champagne for the day, the visitor's chair with its untouched whisky, the original subscription framed, the card file of letters; lit by an oil lamp on the floor under a gas lamp never lit. **The way in:** doc 05's THE SAFE in Fanshawe's office is 'the size of a small cabin'; from Act IV (doc 20's gate) its door is a small exit inside THE SAFE, whose lines stay its own, and THE VAULT DOOR leads back. **Art: 2 of room-35's 4 operations** -- the composition master, and the vault with nobody in it and the gas lamp put out as written; operation 2 also took the search fund and the unsold deeds, which are copied back from the master (tools/art/room35-patch.py).
**J · Room 36, Main Street at dawn.** Doc 20: Room 2's street, which it replaces after F5. **The plate is Room 2's pixels under the morning's light:** no operation paints 3700 wide, and a new picture would not be the approved street, so operation 1 relit a small copy of the whole street to first light and tools/art/room36-dawn.py carries only the light back -- the ratio of the two pictures, blurred far past any detail, laid over Room 2's plate -- with the sky above Room 2's own mountains replaced by the morning's, as a gradient. Every board, sign and puddle is Room 2's; the windows are dark and the glow is low in the east. **Staging (doc 48 S7):** beat 1's dog on his back in the road is room-36 operation 2's sheet of the same dog; beat 2 is play, the nine dawn hotspots on Room 2's rects; the one exit is the coach stop, east, and taking it plays beat 3's line, 'Leave the mud.', and beat 4's Act IV letter over black, read from the letters file the extraction writes (the fixed Act IV letter; nothing about the player's letters is read, invariant 10), and he stays, over black, the stop gone (`T_CLOSE_SAID`). **Not built (doc 36 Q176):** beat 3's picture -- the sign repainted upward by a man on a ladder who nods -- and beat 5's credits; and the way in, which is F5's, waits on F4 and F5. **Art: 2 of room-36's 4 operations.**
**K · Room 31 is at night, and five lines were rewritten to say so. Tyler, 2026-11-06: "we don't want something flipping from night to day and back to night lol I thought we'd already fully established that."** Every exterior in the game is night (errata 64a, 87 A), and G built the funeral by day because one line said "very blue": Boot Hill at night, the funeral by day, the hill at night again after it. **G's "by day" is void.** The service is at night under operation 4's moon: tools/art/room31-night.py relights the day composition (plate and every cast sheet) by the ratio of the day and night pictures, blurred past any detail, and puts operation 4's sky over the hill -- no image operation, no new figure. **Tyler authorised the rewrites ("Night; rewrite them"), one voice, nothing structural:** the same subjects, verbs, repeat counts and flags. Every change, before and after:
- doc 54, Room 31, THE SKY, LOOK 1: "Clear, very high and very blue. It is a beautiful day to be buried, if one has to be." → "Clear, very high and full of stars. It is a beautiful night to be buried, if one has to be."
- doc 54, Room 31, THE SKY, LOOK 2: "One cloud, keeping to itself over the hills." → "One cloud, keeping to itself across the moon."
- doc 54, Room 31, THE SKY, LISTEN 1: "A hawk, very high, one long cry." → "An owl, somewhere up the hill, asking one long question."
- doc 05, the headboard, LISTEN: "Wet paint, drying. My legacy, curing in the sun." → "Wet paint, drying. My legacy, curing in the night air."
- doc 10, the watchman at the funeral, LOOK: "The night watchman, standing at the back, in daylight. I have never seen him in daylight." → "The night watchman, standing at the back, off his rounds. I have never once seen him stand still."
- doc 48, S2 beat 3's builder note: "planted in daylight" → "planted in public" (not shown).
**The lesson is a check:** tools/check-night-exposure.mjs now fails any exterior whose baseline is not a night exterior, or whose sky (the plate's top fifth) is brighter than 60, unless its baseline names the ruling in `daylight` -- Room 36's dawn, the last room, is the one.
**L · Room 33's score, THADDEUS complete, is composed. Tyler, 2026-11-06: "Didn't you compose the song? Finish the song yourself if you can."** Doc 45 names R33-M as the fragment's "fourth-bar completion", so the complete statement is the same four bars of 3/4 at 76 in G, solo fiddle: bars 1-3 the fragment's note for note, and bar 4 the tonic held for the whole bar where the fragment touches it and lifts away to the third. It is a placeholder composition by the builder, like every theme in the score (doc 28 Part Seven: a composer may replace them), rendered by tools/render-music.mjs (`--only thaddeus-complete-room-33.wav`), baked at -35 cents, and brought to pitch by the ninety seconds as before. Room 1's fragment is untouched, so nothing plays complete before Room 33. **For Tyler's ear.**
**M · The chain through built rooms (doc 36 Q177).** C6, D4's first half, D6, E0, E4 and E5 are built as doc 57 writes them, with the mechanics each needed: a room may write a flag on entry only while a condition holds (`onEnter.setWhen`: C6's "out of the office and back", D4's Reverend at the gate); a dialogue node may act once when it opens (`onOpen`: WIN_B4 "completes C6 and issues Document B"); and a room may play an exchange with other voices on arrival, read from the document, whose outcome lands when its last line is read (`onEnter.scenes`: D6 at the counter, D4 at the gate). WIN_C1 is extracted with the no-[COMIC] exemption doc 04 writes it with ("The relationship scene"); SUM_C1 opens on `T_DEATH_CERTIFIED`, written by the signing, until the decease is recorded. No line is new.
**N · F4, Duel Three, on Main Street (doc 36 Q178).** Doc 57 F4 as written: the first time Thad steps onto the street after `T_ASSAY_RUN` (now extracted from WIN_F1 option 1's own direction), Fanshawe calls the duel -- an accost whose greeting is doc 03's challenge and the first boast -- and it runs 4, 9, 22, 23, then the fifth. A lost exchange is thrown again with Fanshawe's three lines in turn, so the duel cannot be lost; pair 24 (the truth) is always on offer, its three jokes Part Three's; pairs 22-24 are known once E10 completes (doc 57 E10: "Pairs 22, 23 and 24 join"). The win scene is doc 03's: Sowerby's verdict, "It's true.", "Better still!", the hat. **Staging:** room-02 operations 1 and 2 (the street by the assay office with Fanshawe, the judges' table on the hotel porch, Sowerby with the pencil and half the town; then the same with nobody), cut by subtraction (tools/art/room02-duel-cast.py) and laid over Room 2's own approved street, present for the visit the duel is called on. **For Tyler:** the master seated four judges where Room 4 has three; Fanshawe does not walk back to his office (no walk of him exists) -- he and the town are gone the next time Thad comes onto the street.
**O · F5, the filing, and the way into Room 36 (doc 36 Q179).** Doc 57 F5 and doc 48 S6 as written. After F4, Winnie is at the end of the Registrar's counter (her accepted Room 5 sheet). Beat 1: the death certificate, the deed, the certificate and the sample are laid on THE COUNTER one by one, in any order, each with doc 57's lines (combination cases read from doc 57; a pair that is only its cases says so, `otherwise: "pool"`, and outside them the item's own pool answers -- doc 24 tier 2); anything already down or given before is "Already on file". Beat 2: with four down, SUM_F1 is the Registrar's (extracted); "Obadiah Mott." plays Sump's line, WIN_F2 as doc 04 writes it and beat 4's read-back, writes `T_FILED` and F5, and ends the conversation; the room then hands on to Main Street at dawn (`afterTimeline`, now allowed on a room with no timeline). **Beat 3's county seal has no sound**: doc 48 makes it the seal SFX under errata 28a's unruled question, so it is not built -- for Tyler. **Found on the way, with its lesson:** Documents B, C and D and the death certificate were handed over by C6, E0, E4 and D6 but were never loaded items (no icon, unusable); they are now in the manifest with icons, and tests/lessons.test.ts reads what dialogue, openings and arrival scenes hand over.
**P · Tyler's rulings of 2026-11-06, and the three he delegated.** (1) **Seven mourners: "7 is fine."** The three lines that counted nine now count seven -- doc 10's THE MOURNERS LOOK "Nine people have come to my funeral." -> "Seven people have come to my funeral." and LISTEN "Nothing. Nine people, not talking." -> "Nothing. Seven people, not talking."; doc 54's THE HATS LISTEN 3 "Nothing. Nine hats, held still." -> "Nothing. Seven hats, held still." (2) **The county seal (delegated): a one-shot, for the seal only.** Errata 28a's question is answered for doc 48 S6 beat 3 and nothing else: tools/audio/render-seal-sfx.py renders it, the loudest one-shot in the game, and it plays as a beat between WIN_F2 and the read-back while the score rests for two seconds and picks up where it stopped (a performed line may carry a `sound`). The case impact and the score-state coupling remain unruled. (3) **The procession (delegated): it has already arrived.** Doc 48 S2 beat 1's procession is not walked; Thad comes up the plot as the town finishes gathering and stands at the back of his own funeral -- late to it, which is his. No choreography for nine people and a hearse is written, and none is invented. (4) **The man on the ladder (delegated): performed in the beat's own words.** The sign is at Room 1's coach stop; a dawn Room 1 for one beat is not built. Taking the coach stop at dawn plays doc 48 S7 beat 3's description as a stage direction -- "At the coach stop: the sign — POP. 2,000 AND CLIMBING — being repainted upward by a man on a ladder, who nods." -- then "Leave the mud." and the letter over black. (5) **Thad sits in Room 33** (Tyler: new Thad art if needed) -- in hand. (6) **Credits** wait (Tyler).

# 100 · THE VOICE IS LOOSENED, AND A DIALOGUE PASS IS AUTHORIZED — OWNER RULING (Tyler, 2026-11-05)

*Tyler, after playing Rooms 1–5: "I feel like it's all a bit too sterile. I feel like a lot of it reads like a computer wrote it… one of my favorite things about Monkey Island was how clever and at times almost silly it could be." The script audit's recommendations followed; Tyler: "Proceed on both."*

**A · The voice.** Doc 01's "flat, procedural tone of a man reading a train timetable" and the house line "dry, deadpan" are loosened to **doc 59, the voice guide**, which overrides them wherever they conflict. Thad stays sincere, never sarcastic or weary, and can still report disaster calmly; he now also wants things out loud, tries things and fails, talks in contractions, and the volume of the writing varies from a shrug to a set piece. Doc 05's contracts stand unchanged: LISTEN never lies and is shorter than LOOK; the three load-bearing LISTEN lines are never rewritten and stay indistinguishable; only the town misspells his name. The invariants stand unchanged.

**B · A dialogue pass is authorized, and it is the one exception to "never generate written content."** Existing lines may be rewritten to doc 59, in the document they live in, then re-extracted. One voice writes every line (no subagents, unchanged). Nothing structural changes unless that room's errata letter says so: the same hotspots, verbs, repeat counts, flags, gates and act variants, and every fact a puzzle reads survives. The prohibition stands for everything else: a line the documents never wrote is still a hard stop, and a builder still never invents one.

**C · Room 3 is the sample, and the pass waits on it.** Room 3 was rewritten first (doc 60 lists every line before and after; 100 edits across docs 05, 16, 27 and 49). Tyler plays it and rules on the direction before any other room is rewritten. Vessel's [COMIC] reply gains one direction-led line ("She hasn't, but she's a long way off."); every other change is a rewrite of an existing line.

**D · Stage directions are shown (doc 58).** The other half of the same ruling: the italic directions in conversation replies, which the extractor had been dropping, are now performed on screen in parentheses in the beat's quieter ink. Builder notes stay hidden.

**E · Tyler's ruling on the sample (2026-11-05), after playing Room 3:** "The dialogue in Room 3 is so much better… way better." The direction is approved and the pass goes on to the other rooms under doc 59. His one miss was Vessel's "Producing, mind.", which he did not understand. It is rewritten to read on one pass, and the joke underneath it (the claim produces mud) is kept. Doc 59 rule 8 is the reason: period slang that hides the joke fails the one-read test.

---

# 101 · HOB ON HIS ROUNDS IN ACTS I–II, AND HOW ACT IV OPENS — DECIDED (Tyler delegated, 2026-11-05)

*Tyler, 2026-11-05: "You decide on both of the open questions." The full-game playthrough (tests/full-game.test.ts) found both.*

**A · Hob is on his rounds from the first night.** Doc 04 calls HOB_A1 "the whole game": the player who asks him about Mott in Act I gets a four-second pause and forgets it for fifteen hours. Nothing reached HOB_A1 — Hob was placed only from Act III — so that pause could never happen. From the start of the game through Act II he stands on his rounds in the back alley (Room 20), at the spot and in the approved drawing his Act III rounds already use (doc 07: "on his rounds at night (Main Street, the back alley)"; no image operation), and his conversation there opens on HOB_A1. From Act III the existing placements govern unchanged. Doc 04's "Running" lines (every fourth night) need a count of nights the game does not keep, and stay unwired.

**B · Act IV opens in Thad's room.** Doc 57 gives the line and the setting but not the cut. When Act IV begins, after the PART FOUR card, the game cuts to Room 19 and Thad says doc 57's line once, unprompted ("Packed. It took four minutes…"). The packed case on the bed and the morning light are Room 19's Act IV state and wait for the next session with an image budget; until then the room shows as it is, and the line carries the morning.

---

# 102 · THE OTHER FOUR THEMES ARE WRITTEN, BY THE BUILDER — OWNER RULING (Tyler, 2026-11-05)

Asked whether the music and sound were done, and told that four of doc 28's six themes had never been written, Tyler chose: **"Have me compose them the way THADDEUS was done. You would listen and approve each one."**

So THE STRIKE, THE ASSAY, WINNIE and THE COMPANY now exist as note data in `proofs/audio/consolation-audio-proof.html`, in the LA manner errata 56 made canon, and as stems rendered by `tools/render-music.mjs` (`audio/the-strike.wav`, `the-assay.wav`, `winnie.wav`, `the-company.wav`). **They are placeholders in the same sense CONSOLATION and THADDEUS are**, written against doc 28 because no notated score exists, and **none is accepted until Tyler has heard it.** The builder cannot hear them; the checks below are measurements, not judgement.

| Theme | Doc 28's brief | The setting |
|---|---|---|
| **THE STRIKE** | "Three notes, ascending, unresolved … Harmonica, always distant" | B-flat, C, E at 60, the E held. The outer interval is a tritone. Harmonica on the far bus. A one-shot (doc 45 §0.3), rendered with its tail rung out, not folded into a loop |
| **THE COMPANY** | "Warm, generous, and in a major key … shares its first three notes with THE STRIKE and nobody notices for ten hours" | F major, 4/4 at 96. It opens B-flat, C, E in THE STRIKE's register, as quick quarter notes over IV and V7, landing on F: the same three notes with the answer supplied. Fiddle with vibrato over a parlour piano; the piano doubles the tune the second time. **Doc 45 OQ-03 is answered: fiddle and upright piano** |
| **THE ASSAY** | "Jaw harp and piano, mechanical, in a metre that keeps adding a beat" | D minor at 88, bars of 3, 4, 5 and 6, then round. Each bar is the last with one more tick, and every bar ends on the same stamp: C-sharp, the leading tone, which is the piano's broken note (doc 05), so it lands a semitone short every time and cannot resolve. The jaw harp sweeps upward on the stamp |
| **WINNIE** | "In tune … avoiding C-sharp entirely. Four bars, no ornament, no vibrato on the fiddle" | C major at 88, four bars, quarter and half notes. The fiddle's vibrato is zero, the only part in the score where it is (a per-part `vibrato` depth in the synthesis; every other part keeps its 11 cents). **It ends on the tonic**, the only theme before Act IV that does |

**Keys are chosen around the piano's C-sharp.** WINNIE avoiding it only means something if the theme she shares an office with does not, so THE ASSAY leans on it and WINNIE never touches it. THE COMPANY sits in F, where the broken note does not occur: it sounds flawless because it avoids the fault, not because it is true.

**WINNIE and THE ASSAY share a tempo** so they can share a cycle when Thad is at the counter (doc 45 `R05-M2`): eighteen beats against sixteen, aligned every 144. WINNIE still plays at −35 cents with everything else (doc 45 §0.2); her "in tune" is the avoided note and the absent vibrato, not an exemption from the bus.

**Measured, because nobody here can listen:** THE STRIKE's three pitches land within 0.3 cents of B-flat, C and E at −35; THE ASSAY's stamp sounds at C (512.8 Hz), a semitone under C-sharp, as the piano's fault requires; WINNIE's held E has zero pitch spread (no vibrato), THE COMPANY's has 17.7 Hz; no loop has a silent run; THE ASSAY's loop seam is an ordinary sample step (80th percentile).

**Not done by this, and next once the themes are heard:** the room mixes doc 28 Part Three asks for (arrangements of these themes per room, including the Nugget's diegetic piano and the hotel's through-the-wall CONSOLATION), wiring them into `manifest.music`, and doc 28 Part Six's SFX. Beat-timed cues still wait on errata 28a, which is Tyler's to reverse.

## 102 (cont.) · The everyday sounds, rendered for the same audition

Tyler asked, the same night, what other sounds he could hear alongside the themes. **`tools/audio/render-everyday-sfx.py`** renders doc 28 Part Six's essential list and the doc 45 cues specified plainly enough to build (footsteps on mud, boardwalk, plank and dirt, four takes each; the batwings, the assay office latch and the locked archive door; the team moving, standing and departing; the case into the mud with the fork at exactly A440; the flat church bell, near and distant; paper, the stamp, the Assay's pencil; the floorboards, the sign, the leather chairs, Sump's clock, the wind, the Clarion's press). Files only: **no cue is wired until Tyler has heard them**, the same rule as the themes.

**The flat bell is cast for D and half a step flat: C-sharp 4, exactly 277.18 Hz**, measured at 277.12 in the render. It bypasses the score's −35 cents (doc 45 §0.2) and is the same pitch every strike. Doc 28 Room 31 then puts CONSOLATION "on the flat church bell's pitch", which is the town's own key lowered by that half step.

**Loops are built to be loops.** The beds (team, clock, wind, press) fold their releases back over the start like the music stems, a continuous noise (the wheels' rumble) is generated exactly one loop long in the frequency domain so its end runs into its start, and the output filter is run in over the loop's own end so sample 0 does not follow silence. Measured seams: clock and press at the 0th percentile of sample steps, the rest between the 70th and 94th: ordinary steps, no click.

**Not made:** R03-A's indistinct talk and R01-WEST-3's laugh are human voices, which want recordings; the spittoon waits on OQ-11.

## 102 (cont.) · Tyler's audition — 2026-11-06

**"I like all of it except the footsteps on the boardwalk and the doors swinging. The footstep need to sound like they're on wood and the swinging doors maybe need a bit of a hinge creakiness or something vs the seagull type sound."**

So **THE STRIKE, THE ASSAY, WINNIE and THE COMPANY are approved as written**, and so is every everyday sound except two, along with Room 32's coffin sounds and Room 33's taps, void and fork (the audition errata 49 and doc 57 F2 required).

Both misses are rebuilt, and the lesson is the same in both: **a clean sine is a tone, and a tone is what Tyler heard as wrong.** The first boardwalk rang pure sine modes (a drum); the first batwing's hinge was a pitched square wave gliding through 700–1,200 Hz (a gull). Both are now modal synthesis: a noise strike, or a stick-slip pulse train, rung through damped resonators, so what rings is the grain of the excitation and not a tone. The boardwalk's strongest energy now sits in wood's 250–750 Hz; the batwing's, which was 1,376 and 2,769 Hz, is now 170–430 Hz, the iron hinge and the leaf. The replaced functions still draw their random numbers, so every approved sound re-renders byte for byte. Doc 55 §8 carries the rule.

**Then the plank floor too (Tyler, a few minutes later): "It should probably have the same wood sound, just maybe with more of a muted thud vs the boardwalk since the boardwalk is hollow underneath."** The plank step is now the boardwalk's wood struck the same way, on a floor laid tight over joists: every mode dies faster (to −26 dB in about 45 ms against the boardwalk's 72), the highs are softened, no loose end slaps, and the weight lands as a low thud (three to five times the boardwalk's share of energy under 200 Hz). So the two surfaces are one material, and the difference between them is what is underneath.

**Third try (Tyler): "The wood sounds like glass bottles being struck vs creaky dry wood that thuds."** Resonators that ring at a pitch, however short, read as glass. So the wood steps are now no resonance at all: **a thud** (low noise, the main body), **a tok** (a broad mid band of noise, gone in under ten milliseconds) and **a creak** (dry stick-slip as the board flexes on its nails). The boardwalk's thud is lower and longer with a hollow drop under it, and it creaks on most steps; the plank floor's thud is short and muted, and it creaks rarely and faintly. Measured: everything above 800 Hz is down 30 dB within 17–25 ms (the first boardwalk took 206).

**Fourth try (Tyler pointed to a real recording, "Footsteps, Human, Boardwalk, Walking, Medium 02" on Epidemic Sound, and asked for something similar).** The builder cannot hear it, and the audio sits behind a sign-in, so it served as a description: a recorded boot on a board. The step is now built from the parts of one that the first three left out: the sole's soft pat a hair before the weight, the heel's thock as broad bands of noise (no resonator), the roll from heel to toe with a scuff of sole across grain, the board bending onto its joist, sometimes the plank knocking its neighbour or creaking, and for the boardwalk only a short echo off the ground underneath (4.5, 9.5 and 16 ms), which is what hollow sounds like without a tone. Spectral peakiness 4–16 against the first boardwalk's 531. Six takes per wood surface now, not four, because a walk on wood repeats its feet more audibly than one in mud. If Tyler downloads the recording, it replaces these.

**A correction to this record.** The audition page's sound files were not re-uploaded with the second, third and fourth tries: each republish changed only the page's words. So every verdict above after the first ("not like wood", "glass bottles") was about **the first renders**, the sine-mode boardwalk and plank, and Tyler never heard the batwing hinge. The second and third tries were never auditioned, not rejected. All current files went up together with the wood-block calibration (four amounts of ring, A to D), which asks Tyler which sounds like wood.

**Approved (Tyler, 2026-11-06): "The redone versions you finally pushed to me were so much better. And the office door swing too."** The fourth-try boardwalk and plank steps and the iron-hinge batwings stand. With that, every theme and every sound in this ruling is approved by ear. The wood-block calibration was not needed and is not a game asset.

---

# 103 · THE ROOM MIXES (doc 28 Part Three), BUILT FROM THE APPROVED THEMES

With every theme approved (errata 102), each room doc 28 Part Three names now has its music in `content/manifest.json`, every entry carrying its doc 28 line in `why`. **Arrangements only:** no new melody anywhere. Each is the approved theme re-scored, as doc 28 asks ("Each room declares a stem mix, not a track").

| Room | Bed | How it is made |
|---|---|---|
| 1 · Stage road | THADDEUS, solo fiddle, **and** the Nugget's piano from town as a layer (doc 45 O-07-M) | The piano is CONSOLATION's piano parts alone, low-passed at 1.5 kHz with the echoes of the street (`distance: far`) |
| 2 · Main Street | CONSOLATION, full | The title stem |
| 3 · The Nugget | CONSOLATION on the upright alone, diegetic | The same piano parts, broken C-sharp and all |
| 5/6 · Assay office | WINNIE | |
| 7/8 · Registrar | THE ASSAY, unaccompanied jaw harp | THE ASSAY's jaw-harp part alone |
| 10/11 · The Company | THE COMPANY | |
| 13 · Undertaker's | **Silence** | `null`: a room's deliberate silence, which the engine now tells apart from a room with no entry |
| 18/19 · Hotel | CONSOLATION, faintly through a wall | The full mix low-passed at 420 Hz with a wall's short reflections (`distance: wall`) |
| 23/24 · Prosperity | THADDEUS and THE STRIKE, quiet | Two layers on their own loops — THADDEUS at his length, THE STRIKE every 29 seconds — so they drift and never meet the same way twice: "neither knows" |
| 31 · The funeral | CONSOLATION, slow, on the bell's pitch | The tune on the fiddle at half speed, down the bell's half step (cast for D, sounding C-sharp); no piano at a graveside, and the piano's broken note would be this key's tonic. The approved bell tolls under it every 21 seconds as a layer |
| 36 · Dawn | CONSOLATION, in tune, thin, one instrument | The tune on the fiddle alone; in tune by T_IN_TUNE, as the whole score is after Room 33 |

**THE NUGGET PIANO AFTER IT IS TUNED (doc 45 OQ-12, decided under the standing delegation).** Once `T_NUGGET_PIANO_TUNED` is set, the Nugget and the stage road's distant piano play the same performance with the C-sharp mended. Only the C-sharp changes: Thad tunes the instrument, and the score's −35 cents is invariant 5's alone, untouched until Room 33.

**THE ENGINE.** A bed may carry `layers` (each its own loop, started with the bed and never re-synced: doc 28's pairs are things that do not share a clock), and `variants` swap a bed on a flag, first match wins. A file in both the outgoing and incoming beds carries on rather than restarting under itself; the coffin's suspend stops every layer and brings each back where *it* would have been. `tests/room-music.test.ts`.

**NOT DONE, AND WHY.** R05-M2 (THE ASSAY layered over WINNIE while Thad is at the counter) needs a counter state the engine does not have. THE STRIKE as Hob crosses in Room 1 (O-09-M) is beat-timed, and errata 28a still stands. Twenty rooms that doc 28 never mentions play the title bed as before, until Tyler says otherwise.

---

# 104 · EVERY OTHER ROOM, THE WOODTICK WAY — OWNER RULING (Tyler, 2026-11-06)

Doc 28 Part Three names seventeen rooms; the eighteen it does not played the title bed by default. Tyler asked how Monkey Island handles it. *The Secret of Monkey Island* gives its main places their own tunes and cuts between them; *Monkey Island 2* (iMUSE) gives each building in a town the town's theme on its own instrument, with transitions that finish their phrase. Doc 28 is the second approach already. Offered the Woodtick way for the rest, **Tyler: "Yes."**

| Room | Music |
|---|---|
| Mercantile | CONSOLATION, the tune on fiddle alone (Room 36's stem; out of tune here, in tune there) |
| Sheng's laundry | the tune on harmonica alone |
| Livery | fiddle over the jaw harp's offbeats |
| The Clarion | harmonica over the jaw harp's offbeats |
| Madame Ozymandia's tent | harmonica at half speed against the fiddle's counter-line |
| Church | the funeral arrangement without the bell, which tolls only at the graveside |
| Boot Hill | the funeral's music, bell and all |
| Nugget back room | the saloon piano through the wall (tuned after `T_NUGGET_PIANO_TUNED`) |
| Back alley | the saloon piano from the alley behind it (doc 28's Lane: "piano alone") |
| Company vault | THE COMPANY through the wall from Fanshawe's office |
| Watchman's shack | THE STRIKE alone, every 29 seconds: Hob's place |
| Claims road, claim row, creek, high ridge, Mott's site, Pratt's claim | Prosperity's mix: THADDEUS and THE STRIKE on their own clocks |
| District map | CONSOLATION, full |

Still no new notes: every arrangement hands CONSOLATION's own tune, offbeats and counter-line to different players. **Every playable room now has its music chosen**, and `tests/room-music.test.ts` fails on a room that has none, so a new room cannot fall back to the title bed by omission.

**Approved (Tyler, 2026-11-06): "Keep"**, for both errata 103 and 104, after hearing every room on the audition page.

---

# 105 · THE EVERYDAY SOUNDS, WIRED INTO THE GAME

The sounds Tyler approved by ear (errata 102) now play in the game, where doc 45 says they do. **Which sound plays when is content** (`content/audio/sounds.json`, named in the manifest as `sounds`); the engine knows a cue id, a verb on a target, a door between two rooms, a foot coming down and a room's background, and nothing about Consolation.

- **Footsteps** sound once per foot plant (doc 45 §3.4), taken from the gait (distance walked, doc 43), so they keep time with the legs at any size. A walk box whose own `surface` is a footstep surface (Main Street's boardwalk) walks on boards; anywhere else on the room's floor: mud on the road and the street, plank floors indoors, dirt on the hill, the diggings, the tent and under ground. A walk never repeats a take twice running.
- **Verbs.** R01-SIGN on the sign's first two LISTENs, not the third ("the sign has stopped"); R01-CASE-B2's fork on the case's second; R02-BELL, R03-HANDBILL, R05-QUEUE, R05-FLOOR, R08-TIME, R09-PAPER, R11-CHAIRS; R07/08-LOCK when the archive door is tried before Thad is the executor. A verb's result now says which written line was spoken (`variant`), which is what lets a sound follow a line.
- **Doors.** R03-DOOR, the batwings, three swings each smaller, walking between the Nugget and Main Street; R05/06-LATCH between the assay office and the street or the records room.
- **The board.** R05-FLOOR-STEP, already fired by the step trigger, now creaks.
- **Backgrounds.** R02-A's wind on Main Street and R07-A's clock in the registrar's, on a second bed player that is never detuned (it is not the score) and falls silent wherever the score is suspended.
- **Invariant 3 holds.** The timesheet's paper is the queue book's paper, file for file; `tests/sounds.test.ts` fails if a load-bearing LISTEN ever gets a sound no other object makes.

**Not wired, and why.** The opening's team, case and Hob cues are beat-timed (errata 28a). R17-BELL has no bell-rope action to hang on. R09-PRESS waits for a documented "operating state". R23/24-MUD, R21-WINDOW, R03-A's crowd and the spittoon have no approved file. U-STAMP and U-ASSAY-PENCIL are OPEN in doc 45 itself.

---

# 106 · EVERY REMAINING SOUND, AND EVERY SOUND IN ITS PLACE — OWNER RULING (Tyler, 2026-11-06)

**"Handle the sounds that aren't hooked up yet. And make sure sfx aren't absurdly loud. The sound level needs to make sure they're background effects not sounds that take center stage."**

**ERRATA 28a's ban on timed sound is reversed for cues.** Tyler was told the opening's sounds waited on exactly that reversal, and asked for them. A cutscene may now carry a `cue` step: a doc 45 cue by id, fired as the beat reaches it, taking no time. The opening carries four: the standing team's breathing from beat 2 (O-02-S2; the coach is placed already halted, so O-02-S1's arrival has nothing to go with), the case into the mud in beat 6 (O-06-S1), the team pulling away in 6b (O-06B-S), and THE STRIKE as Hob crosses in beat 9 (O-09-M).

**The rest of doc 45, wired** (`content/audio/sounds.json`; new sounds rendered by `tools/audio/render-room-sfx.py`):

| Cue | What | How |
|---|---|---|
| R01-COACH-2 | the axle squealing away, LISTEN 1–2 | new: stick-slip, each turn quieter |
| R01-WEST-3 | a distant laugh, LISTEN 3 | new: five formant "ha"s across a street |
| R03-SPITTOON | LISTEN 1–2; 3 is "I've stopped listening" | new: a small wet arrival and the brass |
| R03-A | the Nugget's room: talk with no words, glasses, the chandelier ticking | new loop |
| R02-A | the wind with a handbill in it, and the dog's breathing while the dog is there | wind and paper as approved; new breathing |
| R07-A | Sump's clock, shuffling, paper | the approved clock and paper, with shuffles |
| R09-PRESS | the press, running: the room's own LISTEN hears it every time | the approved press, as the Clarion's background |
| R21-WINDOW | "The street. All of it." | the approved wind, the Nugget's piano faint, a latch |
| R23/24-MUD | Prosperity's mud, LISTEN 1–2 | new: sucking and settling |
| U-STAMP | the two places the writing says a stamp lands | the approved stamp, on the line itself |
| U-ASSAY-PENCIL | each point the judges write down | the approved pencil |

**R17-BELL, corrected the same morning.** This paragraph first said the church had no bell-rope action and that one would have to be written. **That was wrong.** Doc 49 wrote it (THE BELL ROPE · PULL, "The whole town orders its morning by that flat note, and it was not morning..."), and it has been in the game all along as the rope's PULL override; the search that missed it read the rope's `responses` and not its `overrides`. Tyler asked for the rope to be properly integrated, and it is now: PULL on the rope strikes the approved bell, the near one, overhead, the same fixed C-sharp the town hears from Main Street, at 8 dB under the music (a bell the whole town hears sits a little above a paper rustle and still under the score). No line was written for it. **Not done:** Thad has no rope-pulling animation (the only back-facing pull is `tug`, his boot stuck in the mud, arms at his sides, which would not read as a pull on a rope overhead), so the line and the bell carry it, as they carry every verb without a reaction clip; drawing one is art work for a session with an image budget.

**THE LEVELS.** The first wiring set gains by eye, and measured against the music the fork in the case was ten decibels over it, the distant bell seven, the hollow board six, the coffin's dirt ten, Room 33's void and fork sixteen. Now every sound has a place under the music as it actually plays (the median room bed), and its gain is set from measurement: footsteps 16 dB under, one-shots 10, doors 13–14, backgrounds 18, the opening's STRIKE (score, not an effect) 8. The coffin and the listening chamber are turned down as rooms (`roomGain`), keeping the shape inside them, so their loudest is no louder than the music. **`tools/check-sound-levels.mjs`** measures all 108 and fails on any sound more than 2 dB above its place.

---

# 107 · THE BELL IS HEARD — TYLER, 2026-11-06

**"The bell is hard to hear over the music."** Measured, it was: errata 106 put the rope's bell 8 dB under the *median* room bed, but the church's music is about that loud, so the bell's strike sat 8 dB under the music actually playing and its ringing tail 13 under. Worse, the church plays CONSOLATION on the bell's own pitch, so the music masked exactly the note that should stand out. Main Street's distant bell was 15 dB under that street's louder bed.

**The music now ducks.** A cue may dip the score under it (`duck`: to a fraction of its level, for so many seconds, down in a quarter second and back over a second and a half). The rope's bell ducks the church's music to 0.35 for six seconds and rings 6 dB over what is left; Main Street's distant bell ducks to 0.5 for five and sits 2 dB over. Errata 106's ceilings stand for everything else: footsteps, doors, paper and backgrounds are still background.

**A featured sound now has a floor.** `levels.featured` names the cues the room is about (the two bells); `tools/check-sound-levels.mjs` fails if one does not duck the music or sits more than 2 dB under its place, measured against its own room's music as ducked. Proved: the old bell fails it.

---

# 108 · THE BELL TOLLS, AND THE MUSIC IS ALREADY DOWN — TYLER, 2026-11-06

**"The bell doesn't toll loudly enough for long enough and the music dips too late."** Both true, and measurable:

- **Too short.** One strike rang out and was gone while the music was still held down. A pull on a bell rope swings the bell, and it strikes on each swing: R17-BELL is now **three strikes of the approved bell**, two and a half seconds apart, each softer as the swing dies, ringing out over about twelve seconds (`church-bell-toll.wav`, `tools/audio/render-room-sfx.py`). Same bell, same flat note. Main Street's distant bell stays one strike, as doc 45 writes it.
- **Too quiet.** The strikes now sit 10 dB over the ducked church music (was 6), and the music ducks further, to a quarter (was 0.35), for twelve seconds.
- **Too late.** The dip took a quarter second and started with the strike, so the bell's attack -- the moment that says *bell* -- landed on music still at full level. The dip now takes 80 ms and the bell waits 120 ms for it (`duck.attack`, the sound's `at`); the music comes back over two and a half seconds.

**The level check now asks both questions** of a featured sound: does it wait for the dip (its `at` is at least the duck's attack), and is it still heard -- within 10 dB of the ducked music -- for as long as the music is held down. Proved: errata 107's bell fails on timing and level.

---

# 109 · WHAT THE WRITING SAYS IS HEARD, HEARD; THAD IN THE ROOM'S LIGHT; THE CLERK'S BARKS — 2026-11-06

Tyler, on the pre-playthrough review: **"Start."** The first group of the review's "can build now" list -- the moments the documents already write that the game was only showing as text, and two consistency fixes the art audit found. No line is written here; every sound below plays under a line the documents already have.

**Duel music.** Doc 45 R04-DUEL writes the duels to THE ASSAY. While a duel runs, the room's music gives way to its bed (`manifest.music.duels`), and comes back when it ends. The third duel, the final one, has its own: **THE FINAL DUEL** (`the-final-duel.wav`, the music proof's FINAL_DUEL_LA) -- THE COMPANY's melody on the fiddle twice over THE ASSAY's piano, faster (96), so the last duel sounds like the Company's ground. Any other duel plays THE ASSAY.

**The hum, the whistle and the tuning (doc 04 LIV_A1 option 4; doc 02 B3, A2, A8).** What the puzzles turn on is a pitch, and until now the player only read about it.

- **The livery man's hum** (LIV-HUM), on his own line "That's what the fella whistled...": CONSOLATION's first phrase an octave down, every note a little off and the eighth a half step wrong -- "recognisably the town theme and recognisably wrong".
- **Grievance** (B3-WHISTLE), on USE the fork on her while the puzzle is open: the fork, the same phrase whistled right at A440, and her hooves as she goes.
- **The pianos** (A-TUNING), on USE the fork on the Nugget's piano or the hotel parlor's while each is out of tune: the broken C-sharp as the room has always heard it, the fork, the pin turning, the mended notes. The room's music changes to the tuned version at once.

The phrase is the town theme's, from the music proof; the voices sit at true pitch, not the score's -35 cents, because a man's whistle is not the score. All three duck the music and are featured sounds under errata 107/108's floor and timing checks (`tools/audio/render-tunes.py`).

**A verb's sound is chosen before the verb runs.** A sound rule may now name the item used (`item`) and the flags it needs (`when`). Those are read *before* the interaction, so the tuning sounds on the use that tunes the piano, not on the use after it, when the flag it sets has already closed the rule.

**Thad in the room's light (`figureLight`).** The art audit's real mismatch: in the dark rooms and at the funeral, Thad was drawn at the plate's daylight default -- bright and warm in the vault, the chamber and the tunnels, warm under the funeral's moonlight beside a cool undertaker. Rooms 6, 33, 34 and 35 now light him warm and low (lamp or candle, 0.67-0.84), and Room 31 cool (moonlight, 0.85). **Not changed: the undertaker's 7-pixel "sink"** the audit also flagged. It is the tapered rows of his shoes, not a figure standing in the ground; moving him would have been a fix for a fault that is not there.

**The hotel clerk's barks.** His file said "Doc 07 writes no barks for the clerk". Doc 07 §8 writes him nine -- a different misspelling of Grubb for every reputation but one, which he gets right once and never again. They are in the game now, and the town's barks are **extracted, not typed**: `tools/extract-content.mjs` reads every single-voice doc 07 bark table into its ambient file (`tools/town-barks.json` says which goes where). The five that were typed by hand came out word for word the same; their apostrophes are now the document's own straight ones. The transforms are the ones the hand-typed files already used: directions dropped, emphasis made plain, and an exchange with Thad cut to its first line (the pie woman's R_DEAD). Six doc 07 townspeople are written barks and are in no built room (the message boy, the man leaving tomorrow, the barber, the photographer, the dog's owner, and the stage driver as a town figure); `tools/town-barks.json` names them, and `tests/town-barks.test.ts` fails on any doc 07 table routed nowhere.


---

# 110 · FIVE MORE OF DOC 07'S TOWNSPEOPLE, WRITTEN IN AND WAITING ON THEIR PICTURES — TYLER, 2026-11-06

Tyler: **"Go: townspeople, up to 10 images."** That covers the figures doc 07 writes whose place is a room already built: the message boy (#5), the man leaving tomorrow (#7), the two boundary men (#2, #3), the fiddler (#11) and the dog's owner (#18). The cap is `townspeople-110` in `art/staging/caps.json`: 10 operations, five sheets and up to five corrections.

**This session has no image key, so the pictures are made in the image session** from `reference/townspeople/brief.md`. Everything else is done here, and no line was written.

**Their words are extracted, never typed.** `tools/extract-content.mjs` reads each micro-tree from doc 07 into `content/dialogue/amb-*.json`, and each bark table into the figure's ambient file. `tools/town-barks.json` routes them. The notation is doc 07's:
- ↳ is a follow-up;
- an indented *Thad:* line is an interjection;
- **A:** and **B:** name which boundary man speaks;
- directions are performed or hidden by doc 58's rules.

The figures greet with their bark, like the card sharp, because doc 07 writes no opening line for any of them. Exits are doc 04 part one's pool.

**What doc 07 says in prose, made to happen:**
- **The dog's owner.** "There's a dog on Main Street" sets `T_BILL_FOUND` and ends the talk ("He goes"). From then on he stands on Main Street beside the dog, with no bark, and "How's Bill?" is offered. Doc 07 writes that R_TRUTH has no bark once he is resolved; it is read as his resolved state in every reputation, because a man beside his dog does not ask whether you have seen one.
- **The message boy.** He "runs off" after the school question, but that option is [COMIC], and a COMIC option is never an exit (`tests/resolution.test.ts`), so he stays.

**What doc 07 leaves unwritten, and is left out:**
- **The message boy's *(pay)* option** has no words for Thad to say. It is not on his menu until Tyler writes or rules it.
- **The fiddler's barks are all playing:** faster for R_BORDERS_MOTT, the passing tune for R_DEAD, his A retuned during F2 (doc 06). That is music, not yet made, so he has no balloon.

**Doc 58's hidden list** gains two builder's notes from these trees: "He goes. This is the resolution…" and "He runs off. This is the only explanation of the schoolhouse…". **Doc 07's "Not a colour"** is now "color", as the one-strike man's was.

**Engine (no content):**
- A bark may be said by two people (`barkExchange`), each line over its own speaker and one after another. The pair also greets in both voices.
- A placement may carry its own `barks` (`{}` is none).
- A figure may be `awaitingArt`: the room compiler casts no one who carries it, so a figure is never a voice with no body. The field comes off when his sheet is cut.
- A `child` posture is held to the curve at a declared stature between 0.55 and 0.8 (`tests/scale.test.ts`).

**Placed:**
- the boy on Main Street between the Company and the Clarion;
- the man leaving tomorrow just east of the hotel's door;
- the boundary men in mid-street, facing each other;
- the dog's owner in the alley by the crates, and later on Main Street beside the dog;
- the fiddler by the Nugget's piano.

`tests/staging-clear.test.ts` proves the stands once the art is cut.

**Not placed, Tyler's decisions:**
- **The bell-ringer (#4).** Doc 07 puts him on the church steps, which are on Lower Street (errata 43), and that is unbuilt. The pre-playthrough review listed the steps as built; they are not.
- **The stage driver (#12).** He "arrives, complains, departs", and no document says when the coach is in town after the opening.

**Found, and reported rather than changed.** The other five townspeople's trees (the letter-writer, pie woman, map seller, card sharp and one-strike man, typed in by hand on 2026-07-30) carry six lines no document writes:
- the letter-writer's prompt "The letter-writer looks up." and his repeat "Once. And I charged him double.";
- the map seller's prompt "The map seller brightens considerably." and his repeats "Like a man eating his own dinner, sir." and "Still not been disproved.";
- the pie woman's prompt "The pie woman does not look up."

Tyler has played them. Whether they go into doc 07 or come out is his.

---

# 111 · ONE ARTIST, ONE CAST — THE CAST MASTER IS LOCKED (Tyler, 2026-11-06)

*Numbered 101 and 102 on their branch (PR #151) while main took 101-110 for Hob's rounds, the music and the sounds; renumbered 111 and 112 when the branch merged after them. Every citation of them on the branch now reads 111 or 112.*

*Tyler: "put all characters in the game side by side in a line up. I want them to all look like they were drawn by the same artist for the same game at the same time." On method: "have chatgpt draw all characters on one sheet … And then have chatgpt draw all the versions of each character after they're locked in." On the anchors: "Thad, Hob and Deke … have the level of pixelation, detail, and look that I think fits the game." On master 02: "Sooo much better. They look like characters from the same game now."*

**A · The master is the canonical design.** `art/staging/cast-master/master-02.png` (cast-unify attempt 9; read as laid out by `tools/art/cast-master-sheet.py`, render `renders/cast-master-02.png`) is the canonical design of all 23 recurring characters. It supersedes doc 38 §1's "a character's first drawing is his canonical design" for each of them, and every earlier canonical sheet is reference only.

**B · Versions come from the master, never from each other.** Every pose, bust, seated figure and action of a character is drawn from that character's crop of master 02, with Thad beside it at the same scale, on magenta. A later version is never generated from an earlier version: drift compounds.

**C · One scale, one pixel.** The generator drew master 02's lower rows about 9% short, which comes out 9% coarser in the game. Every row is scaled so its median man matches the top row's, then every figure is reduced by 3 and drawn back nearest-neighbour, so every figure is made of the same square pixel. Pose sheets are cut the same way.

**D · Builds.** Frontier people are of ordinary, mostly lean build. Measured as torso width over height (Thad 0.32): only Pratt and Fanshawe are heavy, the hotel clerk is short with a small paunch, and the bald judge thick-set; nobody is round (Tyler, on master 01: "some extraordinary stout people").

**E · The three judges** are a thick-set bald man with white mutton-chops, a gaunt man with a waxed moustache and a green cravat, and a lean bearded former miner in a grey hat. Canon gives them no description. The young red-haired judge of master 01 was cut (Tyler: "He seems out of place").

**F · Thad, Hob and Deke keep their shipping art.** The master changed them only slightly. Their clips stand.

**G · The counter people (Tyler, 2026-11-06, three corrections in one sitting).** The Registrar, the Company clerk and Winnie in both her rooms are drawn from the master with nothing on the counter (cast-unify 11), cut on the drawing's own grid with clean edges, their waists on the measured far edge of what lies in front of them and their hands on the plate's own ledger or desk. Winnie in Room 7 WAITS, arms folded (cast-unify 13; 12 was off-colour and unused): nothing at that end of the counter can be written on, and her signing and stamping in F5 are performed as directions. Her ink stand is gone from Room 7; it had stood at Room 5's coordinates, 800 px from her. She has her own sheet at Room 7's depth (she stood 18% smaller than the Registrar on Room 5's). Thirteen of twenty cast-unify operations used.

**H · Open: resting hands shift between poses.** The generator drew each pose with the resting hand a little elsewhere: the Registrar's moves 17-20 px when he stamps or looks up, Winnie's about 20 px in Room 5 when she writes. Registered on the head, the hand pops; registered on the hand, the head would. Not yet corrected; it is the next thing looked at on these four.

**I · Fanshawe, and three that are not yet right (2026-11-06).** Fanshawe is drawn from the master (cast-unify 14), his waist on his desk's back edge (y 495): the drawing he replaces stood with a strip of wall between his waist and the desk. A redraw is sized so the head, crown to shoulders, matches the drawing it replaces (`tools/art/face-size.py`); a face-width measure put him 21% too large and was replaced. Not yet right, and left as they were: the HOTEL CLERK (two drawings, cast-unify 14 and 15, kept his hands behind the register, never on its pages), OZYMANDIA (twice she laid her hands on a table whose ball, box and teapot stand in front of her; next, fingertips to her temples, which needs nothing on the table), and the UNDERTAKER (his plane in both hands in every pose is right, but his forearms reach farther than his bench is deep, and both its edges slant: the plane would overhang the front). `tools/art/bust-register.py --bottom` now holds a counter figure's point of contact still between poses. The room's scale curve is not a guide behind a counter: it is extrapolated there (it puts a man at Room 10's back counter taller than Thad at its front). Fifteen of twenty cast-unify operations used.

**J · The hotel clerk and Ozymandia (2026-11-06).** Drawn by cast-unify 16 against a picture of the last attempt standing in its own room, which is what finally moved the clerk's hands onto the register's pages (three briefs in words had not); his drawing's fifth pose came back as two raised fists and is not used. Ozymandia's fingertips are at her temples, the ball before her (her room's plane 1 draws it in front). `tests/master-cut-edges.test.mjs` now counts an edge pixel as key only when it is more magenta than the figure just inside it: her purple hair reaches her edge and is hers. Sixteen of thirty-five cast-unify operations used (Tyler raised the cap from 20, 2026-11-06).

**K · The undertaker, in both places, and Fanshawe at the duel (2026-11-06).** Cast-unify 17. At his bench the undertaker holds his plane at his chest in every pose -- turning it, sighting along its sole, thumbing the blade, looking up -- because the bench's front edge slants as steeply as its back and a plane laid on it overhung the front at any size near his; his waist follows the slanted back edge, matted column by column (`tools/art/waist-matte.py`). At the funeral he stands with his hands folded, head bowed, a glance toward the coffin, drawn in day colours and relit into the night as the rest of that cast is (`tools/art/room31-relight-one.py`); the drawing's fourth pose had another man's face and is not used. Fanshawe at the duel wears his top hat, at the figure height he had. Redrawn figures whose old sheets a room script writes get their own files, so running that script cannot put the old drawing back. A pocket of key enclosed by a figure (pink between the undertaker's hands; two pixels on the Company clerk) is now backdrop in the cutter and failed by `tests/master-cut-edges.test.mjs`. Seventeen of thirty-five operations used.

**L · Frame, the letter-writer and the map seller; heights crown to sole (2026-11-06).** Cast-unify 18: each holds his own thing in every pose -- the notebook, the writing case, the map -- so it never appears or vanishes. A standing figure's `figureHeight` is CROWN TO SOLE (`tools/art/figure-height.py`, `--hat` reads the crown under a hat from its brim): the duel Fanshawe's top hat had been counted as his height and drew the man under it about 11% short; corrected. Eighteen of thirty-five operations used.

**M · Pratt in all three places, and the pie woman (2026-11-06).** Cast-unify 19: Pratt with his rake in every pose on his claim (leaning, the sky, two strokes), with his mallet in every pose at Prosperity and at the Registrar's (resting, shouldered, overhead, struck); the pie woman with her basket. Pratt's new stake at Prosperity is moved to where the new strike's mallet head comes down (x 429, its top at y 758). The cutter learned three things on this sheet, each failed by a test first: a pose is held together by ANY of its pixels in a column (a thin rake handle had split a pose in two); a sheet already cleaned at its edge is not eroded a pixel more (the erosion broke the rake handle into pieces and the tines into specks: `tests/lessons.test.ts`, drawn whole); and key is blue well over green, so a red pie is not punched full of holes (`tests/master-cut-edges.test.mjs`), with a last pass that drops any key blend the shrink itself makes. Nineteen of thirty-five operations used.

**N · Sowerby, in all four places (2026-11-06).** Cast-unify 20: with the judges' pencil in the Nugget's back room and at the duel (one sheet, drawn at each room's man); preaching at the graveside and at Boot Hill's gate, drawn in day colours and relit into the funeral's night; and at his pulpit, cut at the waist with his hands on the pulpit's top either side of the reading desk. The drawing brought a reading desk of its own; wherever the room's desk (plane 1) stands in front of him every pixel of his is cleared, so his sheet carries no furniture and the desk seen is the room's. Twenty of thirty-five operations used.

**O · The three judges in the Nugget's back room (2026-11-06).** Cast-unify 21: the bald judge with white mutton-chops, the gaunt judge with the waxed moustache and green cravat, and the bearded former miner in the grey hat (E), each drawn seated in four poses -- hands folded, leaning to confer, a nod, drumming his fingers -- with nothing of the table drawn. Each waist is on the table's back edge (y 318) and each pair of hands on its far edge, so nothing of a judge lies over the table. The red-haired judge is gone from this room. Twenty-one of thirty-five operations used.

**P · The duel's judges' table, the livery man and the man panning (2026-11-06).** Cast-unify 22: the three judges drawn whole at one table for the hotel porch -- table, chairs, each man's own legs and boots under it -- their movement derived within each man's third as before (`tools/art/cast-unify-duel-table.py --master`); the livery man tipped back in his chair (doc 54), his humming pose's drawn musical note dropped as a speck; the man panning crouched with his pan in every pose, tipping and swirling. With these the red-haired judge is gone from the game. Twenty-two of thirty-five operations used.

**Q · Sheng; the stage driver stays (2026-11-06).** Cast-unify 23: Sheng at his ironing board in all seven of his poses, the board, shirt and iron in every one. The stage driver is not redrawn: he is baked into the coach's own frames with only his head an overlay, and CLAUDE.md's character gate names him with Thad and the Nugget's bar men as already in Thad's look. Every recurring character on the master is now drawn from it or, like Thad, Hob, Deke and the driver, kept. Twenty-three of thirty-five operations used.

**R · Three corrections from Tyler (2026-11-06): the livery man, the man panning, Duel Three.** The livery man is drawn without a chair and sits in the one the plate paints, mirrored to face Grievance's stall (doc 54); operation 22 had given him a chair of his own beside it. The man panning crouches side-on on the near bank, his pan dipped at the water's edge, as his first drawing did; operation 22 had him facing the viewer with his body over the creek. Both cast-unify 24. Duel Three: Thad walks down from the assay office door to face Fanshawe before the challenge (`accost.approach`, new: he walks to the caller's `walkTo` and the conversation opens on arrival); the left crowd moves off the dog; and the map seller moves to x 3270, right of the assay office steps -- at x 3140 Thad came out of that door behind him and his map lay across Thad, on every visit. A new check holds the last: wherever the player comes into a built room, he overlaps nobody. Twenty-four of thirty-five operations used.

**S · Duel Three's judges ON the porch (Tyler, 2026-11-06).** The table drawn flat-on and laid on the porch hung off its front edge. Cast-unify 25 painted the three judges and their table into Room 2's own porch -- the table on the boards in the porch's perspective, replacing the bench -- and `tools/art/room02-porch-judges.py` cuts them by subtraction at the plate's coordinates, drawn 1:1 (`duel_judges`, no figureHeight). The earlier flat-on table sheet is no longer drawn. Twenty-five of thirty-five operations used.

**T · Duel Three recomposed: no table (Tyler, 2026-11-06).** Tyler: "Do we need the desk at all?" -- ruled no; doc 57 F4's "the judges' table on the boardwalk" is the only mention and no line or puzzle reads it. The three judges stand on the hotel porch between its door and its corner post, Sowerby with the pencil right of the post, all on the boards well back from the edge (`duel_judge_1..3`, replacing `duel_judges`); Fanshawe stands in the street turned to Thad, in his top hat. The two crowds are eleven distinct townspeople (cast-unify 29), each at his own spot on the street at its depth curve (`tools/art/room02-duel-town.py`). The composition was painted once into a crop of the porch (cast-unify 27) to place everyone; the figures were drawn on magenta (cast-unify 28, 29) because the dark coats could not be cut from the painting. Cast-unify 26 (the whole street) re-laid the buildings and was not used. Twenty-nine of thirty-five operations used. Pending Tyler's look at the whole frame before merge.

**U · On the boards, not the wall (Tyler, 2026-11-06: "They're floating over the porch").** The judges' feet had been set at y 572, the foot of the hotel wall, above the porch's boards (y 584-606); the street's walk boxes cover that row, so the scale and staging checks passed. The boards were measured on the plate (`renders/main-street-porch-floor@6x.png`); the judges stand at y 597 and Sowerby at 601; Fanshawe moves to 2790,792 so his top hat stays below their feet. A figure on raised boards now declares `standsOn` -- the surface's outline -- and `tests/stands-on.test.mjs` holds his feet inside it (it fails with a judge back at y 572).

**V · Everyone looks toward the duel (Tyler, 2026-11-06: "As long as everyone is supposed to be looking where they're looking").** Measured, the generator had drawn all eleven townspeople looking left whatever the brief said, so the left crowd stared away from the duel; and the bearded judge looked away from both duellists. The left crowd's people are mirrored by `tools/art/room02-duel-town.py`, which now measures each face and refuses a crowd with anyone facing away; the bearded judge's sheet is mirrored. A figure that must look somewhere declares `faces`, held by `tests/faces.test.mjs` (fails on the unmirrored judge, -7.0).

**W · The mourners (2026-11-06).** The last of the old drawings, and they faced the camera like a photograph. Cast-unify 30 drew seven distinct mourners (doc 10's seven; every man with his hat in his hands, doc 10's THE HATS), each measured and turned to look toward the grave, standing at his own spot on the hill at its depth curve inside THE MOURNERS hotspot, and relit into the funeral's night (`tools/art/room31-mourners.py`, which refuses a mourner looking away). Every recurring character and both crowds are now drawn from the locked cast or, like Thad, Hob, Deke and the driver, kept. Thirty of thirty-five operations used.

**X · The funeral's undertaker and Hob (Tyler, 2026-11-06: "The old man is super weirdly short and stout. The man in the blue jacket is a bad cutout. PLEASE catch things like this.").** Cast-unify 31 redrew both at Thad's height and lean proportions -- Hob from his own art, hat in hand, standing and on a four-frame walk off the hill; the undertaker in his black coat -- relit into the night. Hob's old cut from the composition master kept hillside between his legs. Found on the way: his exit walk had been relit in place by every run of `tools/art/room31-night.py` until it was solid blue (0,0,136), and shipped; the script no longer touches it, and `tests/sheet-colour.test.mjs` fails any figure sheet that has lost its colour. Every placed figure was then rendered beside Thad in its room (`renders/figure-audit/`) and looked at; nothing else was out of proportion or badly cut. Thirty-one of thirty-five operations used.

**Y · One Hob (Tyler, 2026-11-06).** The funeral's Hob is drawn from his own in-game frames (cast-unify 32): his face, moustache and coat, his lit lantern (doc 54: the lid opens on Hob's lantern that night) and his hat in his other hand (doc 05). He walks off the hill on his own walk, hat back on. Cast-unify 31's bareheaded Hob is not used. Thirty-two of thirty-five operations used.

# 112 · ONE LEVEL OF PIXELATION FOR THE WHOLE GAME — OWNER RULING (Tyler, 2026-11-06)

*Tyler: "We need consistency throughout the whole game with the level of pixelation." Shown the funeral three ways at game size (renders/pixel-level-options-funeral-*.png) -- as it stood, everyone as chunky as Thad (A), everyone at the cast sheet's finer level (B) -- he chose **B**.*

**A · The level is the cast sheet's.** Every character is drawn at the level of the locked cast master (errata 111) -- the mourners, the duel's people, the counter cast. The figures still drawn coarser are redrawn from their cast-sheet selves: **Thad** (all 33 clips, rebuilt from redrawn sources through the same rig), **Hob** (all four clips, and his alley, shack and funeral placements), **Deke**, and any other figure the pixel line-up (renders/pixel-level-faces-as-drawn.png) shows coarser. Errata 111 F ("Thad, Hob and Deke keep their shipping art") is withdrawn.

**B · Never enlarged.** A figure's sheet is drawn at or above the size the engine shows it, so the engine never enlarges it into bigger blocks.

**C · Budget.** cast-unify raised from 35 to 75 operations.

**D · Thad rebuilt at the cast sheet's level.** His four standing sources (`reference/casting/thad-stand-{right,left,front,back}-src.png`) are redrawn from the cast sheet in the same poses (cast-unify 33, 34: the first side views had their legs as one column, which the rig refuses), fitted to the old sources' figure size and feet (`tools/art/thad-sources.py`), and every rigged clip is rebuilt with the arguments its own rig.json recorded (`tools/art/thad-rebuild.py`: stand, idle, idle-break, recoil, tug, strain, wrench, walk-back, walk-front from a redrawn front stride, and the far-walk silhouette). His seven actions take one sheet of key poses (cast-unify 35; `tools/art/thad-chores.py`, the stand reseated on both ends), the look up at the driver its measured breath on the new pose (`tools/art/thad-lookup.py`), and both side walks a redrawn six-frame cycle (cast-unify 36; `tools/art/thad-walks.py`). Every frame is despilled (`tools/art/despill-frames.py`). The old sources and clips are kept in art/staging/thad-b/. The three `thad-talk-*` overlays are not redrawn: nothing in the game plays them (the rig check reports them unread). The card sharp's talk stand moves 7 px, the new profile being a little wider at the feet. Thirty-six of seventy-five operations used.

**E · Hob rebuilt at the cast sheet's level, everywhere.** One sheet (cast-unify 37) gives his standing pose and a four-frame walk, lantern in every figure; `tools/art/hob-b.py` fits the pose into his rig source and rebuilds stand, idle and idle-break with their recorded arguments, and seats the walk on its old canvases with the lantern's light anchor moved with the lantern. The alley and shack sheets are rebuilt from the new idle by their own scripts (`tools/art/room20-hob.py`, `room21-hob.py`). The funeral's Hob is redrawn from the new Hob's own frame, bareheaded with his hat in his hand and his lantern (cast-unify 38), and leaves on the new walk. Thirty-eight of seventy-five operations used.

**F · Deke rebuilt at the cast sheet's level.** One sheet (cast-unify 39): his four standing poses and a six-frame walk with his hat on, cut for the Nugget (428), the back room (530) and his walk out. He moves 4 px along the bar and the card sharp's talk stand 8 px, the new drawing standing a little wider. Thirty-nine of seventy-five operations used.

**G · Every figure snapped to one grid: a man is 115 art pixels tall.** With the redraws in, the line-up still showed one figure finer than its neighbour wherever the generator had drawn it larger. So the rule is now arithmetic, not a judgement per figure: a man's height is **N = 115** art pixels wherever he stands (the level of the funeral mock-up Tyler chose). `tools/art/one-level.py` reduces every frame of every character sheet and actor clip to that grid and draws it back up nearest-neighbour. The art pixel is `b = (a man's height in that sheet's pixels) / 115`: `figureHeight / stature` for a sheet the engine scales, the room's man at the figure's feet for a 1:1 sheet, and the rig's figure height for an actor clip. The coach and the driver are not people at that scale and are left alone. The grid is **fitted to each figure's own opaque box**: the block is nudged so a whole number of blocks spans crown to sole, and anchored there. A grid laid from the frame's corner moved soles and crowns by a row or two, and the rig-record check and the counter-waist check both caught it. A behind-counter figure keeps its waist cut on the plate's edge (`recut`). Frames are despilled afterwards. A drawing coarser than the level cannot be snapped finer; the line-up at game size (`renders/pixel-level-faces-at-one-level.png`, drawn by `tools/art/face-lineup.py`) is where that would show, and it shows none. **Held by `tests/one-level.test.mjs`:** the same grid is laid over every frame, and every block must be one colour. On the snapped game the worst of 472 frames has 6.0% of its pixels off their block's colour. On the same frames before the snap, 461 of 472 are over the 8% bound. No operations used.

**H · Walks (Tyler, 2026-11-06, of every walk recorded in the game: "Thad and the racoons are good. Hob could be better generally. Hob at the funeral isn't great. Deke isn't great. Pratt is horrible.").** Two faults, both measured. (1) A departing or looping figure's cycle ran at `fps` whatever his speed: Pratt a full cycle every 53 px on a man nearly 400 px tall, his legs pumping four times faster than he moved; the funeral Hob every 47 px; Deke every 450 px, gliding. Thad's cycle advances with distance and his is the walk Tyler passed, so an exit, loop or arrival may now declare `strideRatio`, one cycle as a share of the man's drawn height, and its frames advance with the ground covered at the local height (`engine/core/Departure.ts`); animals keep the clock. (2) The cycles were not cycles: Hob's and the funeral Hob's four frames led with the same leg every step, Pratt's four were one stride pumped. Hob, Deke and Pratt are redrawn as six frames posed on Thad's walk (cast-unify 40, 44, 45; 41-43 were replaced: Pratt's first with the same leg in front in all six, Hob's first with both legs one tone, Pratt's second with the same stride six times). `tools/art/walk-c.py` cuts them at the old walks' drawn size, Hob's on his clip's canvases with the lantern's light anchor found per frame, and the funeral's copy relit for the night. Every stride is measured from the drawing's own frames (R5f), calibrated against Thad's recorded 0.588: Hob 0.608, Deke and Pratt 0.600, the funeral Hob 0.584, the claims road's miners 0.50 and 0.46 (their drawings unchanged). Which leg leads could not be measured -- in profile both contact poses share a silhouette, and the generator lit Pratt's front leg in all three drawings -- so that stays Tyler's eye, on the recorded walks. Held by `tests/walk-gait.test.mjs`. Forty-five of seventy-five operations used.

**I · Walks, second round (Tyler, 2026-11-06: "Hob looks like he's kind of scooting across air. Deke seems pretty good. Not as good as Thad, but close. Pratt walks so slow it's hard to even figure out if his walk could be good. The miners are awful").** Hob's drawing (cast-unify 44) held a wide stride in five frames of six, so he slid; redrawn with every frame's pose named (46) -- two contacts, two mid-steps, two passing poses -- and the funeral Hob relit from it. Pratt walked a fifth of his height a second; he now walks at Deke's pace, which Tyler passed, half his height a second (about 200 px/s), and the funeral Hob at Hob's own Room 1 pace (194 px/s). The miners are four men drawn alone, each a six-frame walk with his tool (47, 48), composed into the crowd by `tools/art/walk-c.py` one behind another on staggered steps; the crowd walking back is the same men mirrored (doc 10). They climbed a road from 440 px tall to 36 at a fixed 55 px/s, crawling near the camera and racing far away, so a walk may now declare `pace` in its own heights a second (`engine/core/Departure.ts`; with it, speed follows the local height, and the stride uses the walk's own `heights`); the miners walk at 0.5. Strides re-measured from the new frames (R5f): Hob 0.709, Deke 0.611, Pratt 0.727, the miners 0.777 -- the test's stride ceiling, 0.75, sat below a human stride (about 0.8 of stature) and is 0.95 (proofs/check-friction.json). `tests/walk-gait.test.mjs` now also holds the pace (0.35-1.2 heights a second, and a pace on any road whose heights more than halve) and the feet passing in each half of the cycle; run on the previous commit's walks it fails seven checks, the four things Tyler named. Forty-eight of seventy-five operations used.

**J · Pratt leaner; the miners off the beat (Tyler, 2026-11-06: "Hob looks good. Deke looks good. Pratt's gait is kind of awkward because his knee goes so high. Also, I realized that standing next to Thad Pratt look like a much 'thicker' character… The miners all walking in complete unison looks insane").** Asked whether Pratt should be leaner -- errata 111 D had made him and Fanshawe the cast's two heavy builds -- Tyler chose "Leaner, still sturdy". Pratt is redrawn in all his poses as an ordinary working man a little broader than Thad, his face, hat and clothes unchanged (cast-unify 49: the rake on his claim, the mallet at Prosperity and the registrar's), shoulders about 1.4 of Thad's against 1.7 before (`renders/pratt-leaner-beside-thad.png`); figureHeight crown to sole, the hat not counted (363 with the rake, 386 with the mallet). His walk is redrawn from the leaner man with low knees named in the brief (50), sized the same way on its passing frame (341); his stake at Prosperity moves to x 434, under the new strike. The miners' crowd stepped as one although each man had his own phase: a pose and the pose half a cycle on share a silhouette, and every man changed pose on the same frame. It now runs twelve frames a cycle, each man holding a pose for two and changing on his own beat, from his own point in the cycle, a little different in size, spacing and nearness. `tools/art/walk-c.py` now measures every size against the walks before this work (commit e5e3739), not its own last output -- the sizes crept with every run -- writes the frames into the content files and snaps what it cut, so a run is repeatable; `tools/art/one-level.py` and `tests/one-level.test.mjs` now include looping walkers, which they had skipped. The game's probe reports where each departing or looping walker drew (`walkers`), and the walk recorder follows that. Fifty of seventy-five operations used.

**K · Pratt's hand and size; the miners' view and lanes (Tyler, 2026-11-06: "Pratt's hand randomly leaves his mallet in one frame… scale wise, he still looks way bigger than Thad… His gait is way better though but maybe still weirdly slow. The miners… weirdly split down the hill and up the hill from the same point… the ones walking up are walking up sideways. And hands leave their tools also. How are you missing these things?").** They were missed because each walk was judged from a strip of a few frames, never every frame at size, never the facing against the way the figure travels, and never the scene with both crowds in it. Now `tools/art/walk-review.py` writes every frame of every walk large (`renders/walks-every-frame/`), and every one is looked at before a walk is shown; the whole scene is looked at too. Pratt's walk frame 2 had his arm off the handle; it is replaced by frame 5, the other passing pose (grafting frame 1's arm onto it left seams). His stature is 0.96 of the room's man, from 1.03, so with his hat he stands level with Thad, and he walks 0.7 of his height a second. The miners' crowds are redrawn seen from behind going up the road and from the front coming down it (cast-unify 51-54, eight frames each, posed on Thad's own back and front walks; 53's men were drawn turned the wrong way and are mirrored), spaced so no man's tool crosses another's face, and walk in two lanes so they pass instead of meeting and parting. A walk may declare `view` (`profile`, `away`, `toward`), and `tests/walk-gait.test.mjs` requires a walk that goes into the picture -- its depth change, |ln(h2/h1)|, at least 0.1 of how far it crosses in man heights (the flat walks 0-0.04, the claims road 0.2) -- to be drawn `away` or `toward` the way it goes. `tests/one-level.test.mjs` now reads a block edge that falls exactly on a pixel centre either way, as the snap's nearest-neighbour draw-up does (an evenly snapped frame of exactly 3.5 px blocks read 12% off). Fifty-four of seventy-five operations used.

**L · Through a shut door; gliding and ghosts (Tyler, 2026-11-06: "Does Pratt just disappear through a closed door? The miners glide. They don't walk. And the ones coming up and the ones going down pass directly through each other like ghosts.").** Pratt's exit ended in front of the registrar's shut street door. Asked, Tyler chose "Door opens for him": an exit may declare `door` -- the open doorway (room-07 attempt 5, the plate's left end redrawn with the door open, fitted into the plate's door frame in perspective by `tools/art/room07-door.py`), drawn as room geometry while the walker crosses the last 320 px and for 0.8 s after he is through (`AmbientLayer.openDoors`) -- and his path now ends in the doorway. Deke's exit ends at the Nugget's batwing doors, which the plate draws open (`throughOpening`). The miners' legs counted strides by ground covered on the screen, which a man walking into the picture barely covers; a walk drawn `away` or `toward` now keeps a walking time instead, 1.3 strides a second (Thad 1.38). And each crowd is nearly as wide as the road, so lanes could not keep them apart: both loops are 64 s, the men going out from 0 to 29 s and coming back from 31 to 59 s, never on the road together. `tests/walk-gait.test.mjs` holds all three: an exit that ends inside the picture ends at a door or an opening; a walk into the picture keeps 1.0-1.7 strides a second and does not count by distance; two loops in a room are never on screen at once -- on the previous commit's content they fail five checks. Room 7: five of six operations used.

**M · The miners stutter (Tyler, 2026-11-06: "The miners are still stutter stepping").** The generator's eight frames per man (cast-unify 51-54) were one wide stride drawn eight times with small differences -- foot spread 64-92 px on a 250 px man in every frame, against Thad's back walk passing from 47 to 18 -- so the feet never came together and the legs jittered. Each man is now drawn once, standing, from behind and from the front (55, 56), and walked by `tools/rig/character.py` with the arguments Thad's own back and front walks were made with (`--view headon --pose striding`, as their rig.json records): from behind his feet pass twice a cycle (spread 73 to 203 and back), and from the front his walk follows Thad's front walk. Rigged frames in `art/staging/walk-c/rig-miners/`; `tools/art/walk-c.py` composes the crowds from them. A crowd loop names its men's cycles (`men`), and `tests/walk-gait.test.mjs` requires each to pass the feet -- it fails both crowds on the previous commit's content. Fifty-six of seventy-five operations used.

**N · The miners bounce (Tyler, 2026-11-06: "They look like they're bouncing/stomping up and down the hillside now").** The rig holds a man's crown still and his soles rise about 5% of his height as a foot steps toward or away, as Thad's own back walk does; the crowd cropped each pose to itself and stood it on its lowest pixel, which lifted the whole man twice a stride. `tools/art/walk-c.py` now keeps every rigged frame in its cycle's shared box and places it by that box, so each man's crown moves 0-1 px over the cycle. `tests/walk-gait.test.mjs` holds a crowd drawn `away` or `toward` to under 2% crown movement per man; it fails both crowds on the previous commit.

**O · The miners turned along the road (Tyler, 2026-11-06: "Their legs are walking forward in relation to the camera/screen while their bodies are moving at a diagonal up the mountain. They need to be fully oriented in the direction they're walking up/down the mountain.").** The road climbs diagonally to the top-right; the straight-on rigged walks (errata M) pointed the men's legs up the screen while they travelled across it. Each man is now drawn at three-quarters along the road -- going up from behind, turned to the top-right; coming down from the front, turned to the bottom-left -- six named poses each, the generator shown the road with the way marked (cast-unify 57-60). Each pose is held to the cycle's median height so crown and soles keep their lines (the drawings varied up to 2.5%). `view` gains `away-right`, `away-left`, `toward-right`, `toward-left`, and `tests/walk-gait.test.mjs` requires a walk that goes into the picture and more than two of the man's heights across it to be turned the way it crosses (fails both straight-on crowds), each man's own cycle to hold its height within 1%, and each crowd's heads-and-shoulders band to move under 1% of the frame (the stomping crowd moved 1.05-2.37%). Deke's, Hob's and Pratt's walks are left exactly as Tyler passed them: their committed sheets had been snapped to the level twice, and a rerun of `tools/art/walk-c.py` (which snaps once) would change their pixels, so they were restored. Sixty of seventy-five operations used.

**P · Behind the cabin (Tyler, 2026-11-06, of the miners far up the road: "the little ones at the top just randomly walking across a building"; asked, he chose "Behind the cabin").** The loop's last leg ran from the bend straight through the cabin at the top of the road. The cabin is cut from the plate's own pixels as a room prop (`cabin_front`, `tools/art/room22-cabin.py`, base on the road's edge), invisible until someone is behind it; both paths now end behind it (1852,194), so the men going out pass behind the cabin and are hidden, and the men coming back step out from behind it. Each loop is 64 s again (out 0-22 s, back 31-51 s). A loop may end hidden behind a prop it names (`hiddenBehind`); `tests/movement.test.mjs` accepts that only when the prop covers the whole walker there and is drawn in front of him. `tools/art/walk-review.py` now also draws every walk's path over its room with a box the walker's size at each point (`renders/walks-every-frame/<walker>-path.png`), the picture that shows a path crossing a building.

**Q · Merged with main (2026-11-06).** Main had taken errata 101-110 (Hob's rounds, the music, the sounds, the bell, the townspeople) while this branch held its cast and walk rulings as 101 and 102. Main's numbers stand; the cast rulings are 111 and 112 here, and every citation this branch wrote is renumbered to match. The image caps add both sides' raises (attemptsTotal 276); the ledger keeps every attempt from both; the map seller keeps main's extracted barks and this branch's placement. Main's new rope-pull clip (`thad-reach-back`, Room 17's bell) was drawn before the one level and is snapped to it (`tools/art/one-level.py --only thad-reach-back/`), as `tests/one-level.test.mjs` requires of every figure. Content re-extracted from the documents.

**R · Every other movement, looked at (Tyler, 2026-11-06, after the walks: "Any other movement in the game we should evaluate?" then "Merge it and then proceed").** Every frame of every clip that is not a walk -- Thad's 30 action and idle clips, Hob's and the coach's, and all 55 ambient animations -- is drawn large by `tools/art/walk-review.py --all` (`renders/movement-every-frame/`, each frame in its own bordered canvas, so a pose offset in its canvas reads as one) and looked at; the suspects were recorded in the game (`tools/gauntlet/walk-gifs.mjs room:<id>[:<fixture>]`, 35 s of a room). One fault: **Sowerby at the church pulpit drew the reading desk in each of his poses, a different desk each time, so the book-rest jumped when he gestured.** The plate already draws that desk; `tools/art/room17-sowerby-desk.py` clears his frames inside its traced outline, keeping his hands, and `sprite.plateFurniture` records the outline -- `tests/plate-furniture.test.mjs` fails a frame that draws its own furniture there (fails on the old sheet). Looked at and sound: the Nugget's drinkers (the man lifts his mug to drink), the livery's mules (the gaps are the stall's rails), the coach's clips (frame 1 is not empty; the pose sits further right in its canvas). For Tyler's eye: Thad's five everyday verbs (pick up, give, use, carry, shrug) play at 7 frames a second as one frame standing in profile, three of a three-quarter pose, and back -- a quick snap with no in-between. **Tyler, 2026-11-06, of the whole review page: "Everything on that review sheet is good."** The verbs keep their snap; the review is closed.

---

# 113 · NEW LINES FOR ROOMS THE PLAYER COMES BACK TO — OWNER RULING (Tyler, 2026-11-06)

Tyler remembered the Monkey Island touch of familiar rooms with new things in them. He was told that making more of Consolation's rooms change between acts needs new writing, which the project forbids. He said: **"I'm giving you permission to do it."**

**A · The act-change pass is authorized, and it is the second exception** to "never generate written content", beside errata 100's dialogue pass. It writes new act-variant lines only, in doc 05 Part Two-B (or the room's own document), under doc 92's rules:
- no puzzle, flag, gate, item or hotspot changes;
- no load-bearing LISTEN line and no puzzle-fact LISTEN gets a variant;
- nothing the plate does not show;
- every line true whenever it can be read;
- doc 59's voice, one writer, no subagents.

Every other missing line is still a hard stop. Whether this also covers the gaps errata 110 reported (the message boy's *(pay)* option, the six hand-typed July lines) is asked, not assumed.

**B · Main Street is the sample.** It has 16 new lines: 8 for Act III and 8 for Act IV, which had none. Doc 92 lists them. No other room is written until Tyler has played it and ruled.

To see them on the live site:
- Act III: `?fixture=r7-d&room=main_street`
- Act IV: `?fixture=r2-f4&room=main_street`

**C · CLAUDE.md** names this exception beside errata 100's, so a later session does not treat the pass as forbidden.

---

# 114 · THE SAMPLE IS APPROVED, AND THE PERMISSION REACHES THE GAPS — OWNER RULING (Tyler, 2026-11-06)

**"I trust your judgement so proceed with what you wrote. And my permission covers those other things."**

**A · Main Street is approved and the act-change pass goes on** (errata 113, doc 92), room by room, a batch to a pull request. Tyler ruled without playing the sample; his playthrough is where a miss is found and corrected. Batch 1 adds 17 lines across the Nugget, the assay office, the Registrar, the hotel lobby and Thad's room (doc 92 lists them).

**B · The message boy's *(pay)* option is written.** In doc 07, Thad says "Here's your penny. Make it worth it." as a follow-up to "Tell me something.", and the boy's answer is doc 07's own. Nothing is spent: like the pie woman's "I'll take a pie", the purchase is said, not taken from the inventory. Doc 07's note under it ("This is true, is never followed up…") is hidden by name in doc 58.

**C · The six July lines are kept and written into doc 07.** They are the opening lines over three trees (the letter-writer looks up; the pie woman does not; the map seller brightens considerably) and three repeats (the letter-writer's "Once. And I charged him double.", the map seller's "Like a man eating his own dinner, sir." and "Still not been disproved."). Tyler had played them, so they stay as he heard them. Doc 07's NOTATION gains ***Opening:***. `tests/town-trees-sourced.test.ts` now holds every line of every townsperson's tree to doc 07, word for word. It is proved by deleting one of the six, which fails it.

# 115 · THE TOWNSPEOPLE DRAWN AT THE CAST'S PIXEL SIZE, CUT AND CAST — TYLER, 2026-11-06

Errata 110's five townspeople have their pictures, under Tyler's "Go: townspeople, up to 10 images" (`townspeople-110`, `reference/townspeople/brief.md`), raised twice on his word: to 11 ("+1 op, redraw all 5") and to 15 (the fiddler and three more "pulled up to about the same level of pixelation which should make sense with the characters in the Nugget"). **All 15 operations are spent.** None was refused, and no line was written.

**It took three passes to reach the cast's pixel size, and Tyler's eye called each one:**

| Pass | Grid (blocks, head to boots) | Tyler |
|---|---|---|
| Thad, for comparison | **about 104** | |
| First sheets, briefed in general words | about 200 | "None of the new characters seem to match the pixelation level of the cast we worked really hard on." |
| Second, Fanshawe's prompt ("about 80 big pixels") | 62–84 | "They all maybe look slightly too pixelated?" The boy was "the best"; "the fiddler looks out of place". |
| Third: the fiddler, the man leaving tomorrow, the boundary men, the dog's owner | 87–138 | |

The boy keeps his second sheet: 62 blocks at a child's height, which is about 92 for a man.

**Why the second pass overshot.** Fanshawe's prompt says Thad is "about 80 pixels tall". Measured, he is about 104 (`tools/art/measure-grid.py`: the spacing of colour edges inside the figure, on the sheet at its own resolution). The undertaker is 104, and Sump and Fanshawe 84–87. Asking for 80 got 62–84.

**What the third pass showed the generator** (`reference/townspeople/nugget-cast-standard.png`, `-prompt-03.txt`):
- the Nugget's own cast, close up, as the standard: the card players, the bar men, Deke and Thad, with small pixels, soft warm shading on faces, hands and clothes, and muted, slightly dark colour;
- the second-pass fiddler beside them, as the miss;
- the figure's own sheet, for the poses;
- a request for about 110 pixels tall, shaded like the men in the picture and no sharper than them.

All four came back in that range at the first try.

**The operations (`art/staging/ledger.json`):**

| # | Sheet | Result |
|---|---|---|
| 1–5 | first sheets | too fine |
| 6 | the boy's correction in general words | too fine |
| 7–11 | second sheets | the boy kept; the rest too coarse |
| 12–15 | third sheets: the boundary men (first, to prove the brief), the fiddler, the man leaving tomorrow, the dog's owner | **cut** |

**The comparisons:**
- `renders/townspeople-vs-cast@3x.png` (`tools/art/townspeople-lineup.py`) draws every figure at the size the game draws it in his own room, beside Thad and the passed cast, enlarged 3× with hard edges.
- The judgement that settled it was Tyler's, made in the room: the fiddler against the Nugget.

**What the generator did that the prompts did not ask:**
- The boundary men point at each other across the forty feet, not away to their own ground. It reads as the argument, and every pass kept it.
- The dog's owner looks to the left at rest. That suits a man looking for his dog, and his TALK pose turns to Thad.

**The cut** (`tools/art/townspeople-cut.py`, through `tools/art/cut-ambient-sheet.py`):
- Each figure is cut at the height the brief gives: the boy at 109 (160 × 0.68), the man leaving tomorrow at 152, the boundary men at 170, the dog's owner at 317, the fiddler at 288.
- The cutter gains two options; every figure cut before keeps its defaults.
  - `--min-island` keeps the boy's penny.
  - `--register right` sets the man leaving tomorrow by the right edge of his boots. His bag sits at his boots in four poses of five and swung the centre of his "legs".
- Every sprite declares `figureHeight` and `stature`, so the renderer holds the figure to the room's curve wherever he stands. That is how the dog's owner is 317 in the alley and 167 on Main Street from one sheet.

**What moves (errata 77, `tests/movement.test.mjs`):** each has a rest pose, a breath derived from it (`tools/rig/ambient-breath.py`), a pool of breaks and a TALK pose.

| Figure | Breaks | Every |
|---|---|---|
| Boy | looks back down the street; flips his penny | 11 s |
| Man leaving tomorrow | reaches, lifts the bag and sets it down; or looks down the road with a hand on it | 17 s |
| Boundary men | point; argue | 10 s each, B half a cycle after A, so they never point on the same beat |
| Dog's owner, alley | shades his eyes and looks; calls | 13 s |
| Dog's owner, Main Street (his placement's own sprite) | rests on GLAD, smiling down at Bill, and looks up the street now and then | 14 s |
| Fiddler | TUNE; a busier bowing passage | 19 s |

The fiddler's idle is his playing: two bow positions, about 0.6 s a stroke.

**Not on the duel's visit.** The one visit Fanshawe calls the duel, doc 57's "half the town" stands at the saloon end (`duel-town-left`, `duel-fanshawe`), across the very mud where the man leaving tomorrow waits with his bag and where the dog's owner stands with Bill. `tests/staging-clear.test.ts` found them inside the crowd, at 69% and 74% overlap. Both are absent while `T_DUEL_CROWD` holds (they are in the crowd) and back the next visit. Presence is decided as Thad arrives, so neither vanishes in front of him.

**Merged after errata 111–114 (2026-11-06).** This entry was written as 111 on its branch while main took 111–114 for the locked cast master (111), one level of pixelation for the whole game (112) and the act-change lines (113, 114); it is 115. Its figures are snapped to 112 G's grid -- a man 115 art pixels tall -- by `tools/art/one-level.py`, as every figure is (`tests/one-level.test.mjs`).
- **Heights:** each `figureHeight` is crown to sole (112 L). `tools/art/figure-height.py --hat` took the boundary man A's folded arms, the dog's owner's collar and the fiddler's fiddle for their brims, so those three are read by eye from the rest frame's row widths: 165, 315 and 288.
- **`faces`:** the boundary men declare it, A right and B left, at each other, and so does the boy, right, toward Thad's stand (`tests/faces.test.mjs`).
- **The dog's owner declares none.** At rest he looks off up the alley for his dog (doc 07: "Looking for the lost dog"), away from Thad's stand, and his TALK pose, the one the conversation shows, turns to Thad. The brief asked for `faces` on him; his rest pose is the reason it is left off.

**Cast and seen.**
- The six files are in the manifest, `awaitingArt` is gone, and Main Street, the Nugget and the back alley are recompiled.
- In the game, TALK TO opens each figure's doc 07 tree with its own options: the boy, the man leaving tomorrow, the boundary men, the dog's owner in the alley, the fiddler in the Nugget.

**A test that assumed it was alone.** `tests/room-20.test.ts` took the alley's conversation to be the first person there with a tree. The dog's owner stands there now, so it asks for the doc 04 conversation, not a doc 07 micro-tree (`amb_*`).

**The proofs** (`renders/proofs/{main-street,back-alley,nugget}/`):
- **Main Street and the back alley pass.** Main Street's was last recorded failing, in 2026-09.
- **Two gates were measuring the wrong thing, and are fixed in `tools/gauntlet/proof.mjs`:**
  - *A figure out of panel B's shot was failed as "nothing drew".* Main Street is 3700 wide and the panel shows one stretch of it. The letter-writer, there since 2026-09, failed it with the boy and a boundary man. Such a figure is now looked at where he stands: Thad is stood beside him, the camera follows, and the same populated-minus-suppressed pair is measured.
  - *Gate 8B measured Thad's feet behind whoever stood in front of the mark.* The dog's owner is on the alley's centre line, and his coat read as 46px of float. Along the authored row, an x where Thad would stand behind a present figure is now passed over while another x remains, as an x off the floor already was. The row itself never moves.
- **The Nugget's proof still fails, on two things that were there before today:**
  - Its far depth row (y515, x900–1015) lies wholly behind Deke at the bar, so gates 8A and 8B measure him and the card sharp with Thad.
  - `proofs/spec/nugget.json` names no principal change, so panel D cannot be taken. Which change is principal is authorship.
  - The fiddler is clear of both: the near mark stepped off him to x224 and passed.

**Left for the playthrough** (style gate step 3, errata 72): how each figure reads in his room at play speed.

**Open, and not this pass's:**
- **The fiddler's bowing is not on the music's bar grid** (doc 22). The score has no tempo or bar grid yet, so his rate is fixed. It goes with his playing in the music: faster for R_BORDERS_MOTT, the passing tune for R_DEAD, and retuning first in F2.
- The message boy's *(pay)*, the bell-ringer and the stage driver remain Tyler's (errata 110).

---

# 116 · THE TOWN HEARS ABOUT THAD; THE FIDDLER PLAYS; TWO FIGURES STAY OUT — TYLER, 2026-11-06

Tyler, on what was still open: **"2. I agree. 3. I'll take your recommendation here."** And: **"Do the fiddler's music."**

**A · Two townspeople stay out.**
- **The stage driver** is not placed in town. He drives away in the opening, and no document says when the coach is back.
- **The bell-ringer** waits for Lower Street, where doc 07 puts him (the church steps, errata 43).

**B · Reputation was never raised. It is now, as doc 06 designs it.** Building the fiddler's barks showed that `GameState.reputation` was a number nothing ever changed. Every townsperson said his R_NOBODY line for the whole game, and eight-ninths of doc 07's barks were unreachable. That is a large part of why the pre-playthrough review found the town the same in every act. Doc 06's propagation engine has always said what moves it: Frame's headline for each of A3, A5, A7, A9, B5, B6, E5 and F4. `tools/extract-content.mjs` now reads that table into `content/reputation.json` (`setBy`). Thad's reputation is the furthest state, in errata 7's order, whose puzzle is complete. It can only rise, and it is read from the save's own puzzle progress. `tests/reputation.test.ts` holds it; it fails on the old getter.

**C · The fiddler's music (doc 07 #11). No new notes: everything he plays is CONSOLATION's own.**
- **In the Nugget, while he is there,** the room's music carries his fiddle: the theme's own fiddle part, with the piano (doc 28: "Piano-led, fiddle joining"). A music layer may now name the person whose playing it is (`whenPresent`). A part joining a bed already playing joins it in time, so tuning the piano does not throw the band out.
- **R_BORDERS_MOTT,** "He plays something faster. Still flat.": the tune, once through, at half again the speed.
- **R_DEAD,** "He plays the passing tune. Correctly. Flat.": the funeral's arrangement, its first half.
- Both are his barks, played on approach as a bark is (`barkCues`). They duck the room's music and are featured sounds under errata 107/108's checks.
- **R_TRUTH, in F2:** "twenty seconds into the tuning arc, he stops mid-phrase, tunes his A, and continues". This is Room 33's R33-FIDDLER, fired on the arc's own clock (`listening.tune.cues`). It is far off and under the score, and it is off the music bus, so his A is drawn up the 35 cents to 440 while the score is still flat. Nothing remarks on it, and invariant 5's ninety seconds are unchanged.
- The stems are rendered from the music proof by `tools/render-music.mjs` (an `inTune` stem for the one phrase that is), and the retuning is assembled by `tools/audio/render-fiddler.py`. He was drawn and cast the same afternoon (errata 115), so his fiddle plays from now on; his layer still names him, and a Nugget without him has none.

**D · Three art fixes have a brief** (`reference/art-fixes/brief.md`), for the session with the image key, within the rooms' existing caps:
- Room 19's packed case and morning light for Act IV (errata 101 B);
- the dawn street's glowing roof edges, in the tooling first;
- the undertaker's flat ceiling band.

---

# 117 · WHAT IS MEANT TO BE NOTICED IS LOUD ENOUGH TO NOTICE — TYLER, 2026-11-06

**"It needs to really be noticeable if it's supposed to be noticeable."** Tyler said this of the fiddler's clips, and he was right. Two of the three fiddler moments are meant to be heard and were set where they are easy to miss.

**A · His walk-up performances are his remarks.** He plays faster for R_BORDERS_MOTT and the passing tune for R_DEAD. These are what any other townsperson would say in a balloon, and they went in at 4 dB over a room ducked to 0.3 and 0.2. They now duck the Nugget to 0.15 and 0.12 and sit 10 dB over what is left: the level of the rope's bell, the loudest featured sound in the game.

**B · His retune in F2 is there to be noticed by a player who is listening,** and never remarked on. It went in 8 dB under the score, far off and muffled, and would have been missed by nearly everyone. It now sits 2 dB under the score, still far off. Nothing ducks for it: the score's ninety seconds are the arc, and nothing interrupts them.

**C · The Nugget's fiddle under the piano stays background.** It is the band, not a moment.

**The lesson is a check.** `tools/check-sound-levels.mjs` now fails:
- a townsperson's played bark that is not featured, or is placed under 8 dB over the ducked music;
- a sound on Room 33's tuning arc placed more than 4 dB under the score.

Proved on the old levels, which fail both.

---

# 118 · THE OPEN ITEMS OF 115: THE BOW ON THE BEAT, THE PAIR'S GREETING, THE NUGGET'S PROOF — TYLER, 2026-11-06

Tyler: "Handle all of the open items." Errata 115 left three.

**A · The fiddler bows on the beat** (doc 22: "fiddler idles in time with the musical bar grid").
- A sprite may now declare `keepsTime: "music"`.
- The scene gives the renderer the playing bed's own position (`Music.position()`) and the room bed's `tempo`. Such a figure's idle and breaks are read from that clock, so the bow changes stroke on the beat.
- With no bed sounding (locked audio, a missing file), he keeps the same tempo on the scene clock.
- The Nugget's bed declares CONSOLATION's tempo, 152 in 4/4 (`proofs/audio/consolation-audio-proof.html`). His fiddle, errata 116's layer, is locked to that same bed, so the bow keeps time with the fiddle you hear.
- His breaks come every twelve bars (18.95 s), each on a bar line.
- `tests/keeps-time.test.mjs` holds it, and fails on his old fixed rate.

**B · The boundary men's two-voice greeting is on screen.** Watched in the browser with a reputation that has an exchange (R_WON_DUEL): A's "Beat Vessel.", then on the next click B's "Wouldn't have beat *me*.", with A's line still to come. In R_NOBODY doc 07 gives the pair one line, A's, so a fresh game shows one voice.
- It looked missing in 115's captures because the capture tool's click helper read every queued line before clicking. Nothing in the game needed fixing.
- The walk-past bark fires within 60 px of man A's feet, and Thad's stand is 92 px from him. So it is heard by brushing past him, not by walking up to talk.

**C · The Nugget's proof passes**, the first time it has.
- **Its far depth row (y 515, x 900–1015) lies wholly behind Deke**, so gates 8A and 8B measured Deke with Thad. Panel C now draws the room without its bystanders while it measures the protagonist: `bystanders`, a render-only control like panel A's `cast`. The authored row and x are kept, and this replaces 115's step-to-another-x, which moved the mark.
- **Its spec names a principal change:** the swindle (`T_SWINDLED`; doc 27 DEKE VESSEL option 6, doc 57 A3: "he finishes his drink, collects his hat, and leaves the Nugget"). Deke is gone from the bar.
- Setting the flag in the room opens what follows the swindle, so the door is not walked to through a conversation. A route may now `enter` a room by control, logged as no evidence that a player can walk there, and panel D re-enters the Nugget that way.
- The back alley's proof still passes with the change.

---

# 119 · THREE ART FIXES: THAD'S ROOM IN THE MORNING, THE DAWN STREET'S EDGES, THE UNDERTAKER'S CEILING — TYLER, 2026-11-06

Tyler: "Read reference/art-fixes/brief.md and carry it out." Each item fit its room's existing cap (four operations per room, errata 72). Two operations were spent of the five the brief allowed.

**A · Room 19 in Act IV is the morning, packed** (errata 101 B: "The packed case on the bed and the morning light are Room 19's Act IV state").
- **One operation**, room-19 attempt 3 (`reference/room-19/prompts/act4-01.txt`). Its input was the shipping night plate placed back in plate-01's frame at (8,171). Its second image was Thad's case cut from Room 1.
  - The brief's rect for the case (1002,745 105×98) holds only mud on today's plate. The case is the `case_mud` object sprite (`art/objects/room-01-case-mud.png`), so that is what was sent.
- **It came back right**, so the correction operation was not spent: the same room with every object in place, the lamp out, pale light from the window across the floor, and the case closed and strapped on the bed.
  - It sits within a pixel of the night plate, so every rect read off the night plate holds.
  - Derived with the night plate's crop (`tools/art/room19-act4-plate.mjs`) and promoted provisionally to `art/backgrounds/room-19-thads-room-act4.png`.
- **Wired:**
  - The annotation declares `plates.act4` and `plateWhen` ACT ≥ 4. `tools/compile-room.mjs` now carries both when an annotation declares them; Rooms 31 and 34 keep theirs as before.
  - The desk lamp's flicker is `when` ACT ≤ 3, so a cold lamp breathes no light.
  - **No `figureLight`** (errata 109): the morning plate averages 34.9 against the night's 32.1, and the night never needed one.
- **The case is on the bed, inside the bed's hotspot**, so clicking it answers as the bed. No new hotspot: none is written.
- **Held by** `tests/room-19.test.ts`, and shown by `thads_room`'s proof. Its panel D was "none in the picture"; it is now the morning, re-entered by control from the lobby with the act set.

**B · The dawn street's glowing edges (Room 36): fixed in the tooling, with no operation.**
- **Measured, the rims were not the blur.** They were a few pixels of Room 2's night sky that the sky mask missed round every silhouette, because the mask was found on a median-filtered picture. Room 2's faint night ridge lines were also left in. The morning's light multiplied both into bright outlines and blue streaks.
- **`tools/art/room36-dawn.py` now:**
  - grows the sky into every neighbour still coloured like the night sky;
  - counts a piece of night floating free of the ground, inside the search band, as sky;
  - reads the light from ground pixels only: the normalized convolution the brief asked for.
  - The mountains above the saloon are morning sky.
- **Re-promoted** as `room36-plate.mjs --promote` does. Room-36 still has two operations left.
- **Lesson:** a doc 55 §8 row.

**C · The undertaker's ceiling (Room 13).**
- **One operation**, room-13 attempt 4, the room's last (`reference/room-13/prompts/ceiling-01.txt`). Its input was the shipping plate placed back at (8,170), with the flat strip marked as missing picture.
- **Only rows 0–39 are taken from it** (`tools/art/room13-ceiling.mjs`).
  - Every row from 40 down is the shipping plate's, byte for byte, so no hotspot, walk box or occlusion plane moves.
  - The painted ceiling meets the top beam where the old plate's picture began, and the lamp's chain now hangs from it.
- **Promoted** through `promoteProvisional`. The brief named `room13-promote.mjs`, but that promotes the undertaker's sprite, not the plate.
- **Flat rows at the top:** 38 before, 0 after.

**The lesson is a check.** `tools/check-plate-flat-edges.mjs` is in `run-all`. It fails any room plate or state plate whose top or bottom 12 rows or more barely vary across the width (spread under 1.6).
- It was calibrated on all 41 plates: the laundry's dark ceiling spreads 3 or more.
- Room 32 is exempt by name, because its dark is the room (invariant 2).
- It failed the old Room 13 plate. `tests/plate-flat-edges.test.mjs` puts the band back, at the top and at the bottom, and is caught both times.

**Also: errata 118's fiddler kept time across one loop only** (found by review on #182). The bed's file position wraps to 0 at its end. The Nugget's piano loops every 16 bars, and the fiddler's breaks come every 12. So every wrap restarted his schedule, with an extra break four bars after the last.
- `Music.position()` now counts the loops (`LoopClock`), so his time runs on continuously.
- `tests/keeps-time.test.mjs` drives three loops of the real bed's length. The frames now match continuous time, and it shows that reading the file's own time draws other frames.

**Waiting on Tyler:** all three plates are promoted pending his playthrough (errata 72 E).

---

# 120 · DUEL THREE COULD NEVER END — FOUND BY THE DUEL AUDIT, FIXED (2026-11-06)

The audit Tyler asked for ("Go on all five") played the duels as a newcomer, and found a dead end that breaks invariant 6.

**The fault.** Duel Three throws pairs 4, 9, 22, 23 and 24, and re-throws a lost exchange. A pair the player has not learned is offered only its three wrong answers. Errata 75 I calls 4 and 9 "guaranteed in Act II". Pair 9 was not: its one source is Winnie's "Teach me to answer a boast." in WIN_B4, an option a player can walk past. Once the funeral is booked, WIN_B4 never opens again, and Duel Two can be won without it. Such a player reached exchange 2 of the final duel and could never leave it. Every test of F4 handed the player pairs 4 and 9 by fixture, so none saw it.

**The fix keeps the ruling's word.** Duel Three now knows pairs 4 and 9 itself (`knows: [4, 9, 24]`), as it already knew pair 24. Fanshawe throws Thad's own repertoire back at him, and "guaranteed" now means guaranteed.

**The lesson is a test.** `tests/assay.test.ts` plays Duel Three from the fewest pairs a player can hold (Duel One's four and the confession's, and the confession's alone) and fails if it does not end. It fails on the old content.

**And the last filing had lost its direction.** The fairness audit found it independently. Doc 04 has Winnie, after running the assay (WIN_F1 option 1), say: "Twenty-two hundred dollars to the ton." *(beat)* "Nine years I've waited to write down a number I believed." *(She writes it down.)* "File it. I'll be at the Registrar's when you do." Her extractor kept the first quoted line of a reply and dropped the rest, so the game never told the player where to go for F5. She now says all three. `tests/replies-whole.test.ts` holds every line of every doc 04 reply to what the game says. It fails on the old extractor.

The audits' other findings change how the duels and puzzles play, and are Tyler's to rule on (reported separately).

---

# 121 · THE STAGING THE BUILD LEFT OUT — TYLER, 2026-11-06 ("Proceed")

Tyler, on the list of what the full build left unstaged (doc 36 Q173, Q174, Q176): **"Proceed."** Each item is built from what the documents already describe, and no line is written.

**A · Thad sits for the ninety seconds (doc 48 S5 beat 3: "He sits down in the dark and listens to it").** Room 33's fourth operation drew four poses of him at one scale against his cast sheet, his key poses and a frame of him in the chamber (`art/staging/room-33/thad-sits/sheet.png`): standing, half down, a hand behind him, sitting with his knees drawn up. `tools/art/thad-sit.py` cuts them onto his chores' scale and snaps them to one level: `sit` (his chore stand, then the poses, the middle two held a frame each, so the sit takes 0.86 s rather than a verb's 0.57), `rise` (the same, backwards), and `seated` as a state of `idle`, `idle-break` and `stand`, left and right (left is the drawing mirrored). **In the game:** once the void's line has come down he turns toward the void and sits; seated is his mover state, so it saves with the room; the ninety seconds take every click as before; the first click after them stands him up and is spent doing it.

**Seated is ONE still frame.** Invariant 8: by the time the score resolves, the lamp -- the only moving thing in the frame -- has stopped. A seated figure that breathed would be a second moving thing, so the seated idle and its break are the same single frame. Errata 77's movement rule is for the people of the town, not for this.

**What holds it:** `tests/thad-sits.test.mjs` (sit and rise are each other backwards; every seated clip is one frame, the one the sit ends on; the sit lasts at least 0.8 s). `tools/check-rig-describes-frames.mjs` gains `scale_from`: a pose that never stands names the clip that does, and is held to its figure and its sole row (recorded in `proofs/check-friction.json`).

**Art: room-33 4 of 4 operations.**

**B · Beat 3 of the close is drawn, at the coach stop (doc 48 S7 beat 3: "At the coach stop: the sign — POP. 2,000 AND CLIMBING — being repainted upward by a man on a ladder, who nods. Thad's last spoken line: 'Leave the mud.'").** Errata 99 P performed the picture as a stage direction because a dawn Room 1 was not built; it is built now, and the direction is gone.

- **The place.** `coach_stop_dawn` (`content/rooms/coach-stop-dawn.json`) is Room 1 at first light, as Room 36 is Room 2: Room 1's ground, walk box and depth curve, unchanged; no hotspots and no exits, because the game ends there. Its plate is Room 1's own pixels with its sign's lettering, under room-36 operation 3's light, by the same transfer as Room 36's street (`tools/art/room36-dawn.py`, now taking Room 1's own skyline and putting out its town's windows; `tools/art/coach-stop-dawn-plate.mjs`). The numbers on the sign are the approved lettering's: nothing is painted over or added -- the new number is the man's to paint, and no document writes it.
- **The man on the ladder.** Room-36 operation 4 drew him beside the hero for scale. `tools/art/sign-painter.py` cuts him at one level; his step-ladder is lengthened (the steps keep their thickness, the gaps widen to a man's step) so his brush reaches the board's number line, and his dab and his nod are derived from his own frames. He paints; `onArrival` plays his nod two seconds after Thad comes in, and a break repeats it now and then.
- **The words are where they were.** Room 36's exit still carries the beat compiled from doc 48 and the letters file, unchanged: it now `arrives` -- the room changes first, and "Leave the mud." follows 3.8 s later, once the nod is done; the Act IV letter follows over black. A load after the close finds the room black (`blackWhen`), not a picture with nothing left in it.
- **What holds it:** `tests/room-36.test.ts` (the close goes to the coach stop; the man is there; the line waits for his nod; no way out; black after). Seen in `renders/walks/the-close.gif`.

**Art: room-36 4 of 4 operations.**

# 122 · THE BACKGROUND IS HEARD — TYLER, 2026-11-06

*Tyler, listening to "Every remaining sound, at its real level": "you can't hear really any of the background sounds and noises. The music completely overpowers everything."*

**A · The places were too low.** Errata 106 answered "make sure sfx aren't absurdly loud ... background effects not sounds that take center stage" with places 16-20 dB under the median room bed (about a quarter as loud as the score), and set every gain to sit exactly on them. Nothing was too loud, and nothing was heard. `content/audio/sounds.json` `levels` now places:
- each room's background 8 dB under the music (the Nugget's synthesized crowd 12, errata 106's rule that a synthesized voice is most convincing barely there), and its layers 10;
- footsteps 10 under, measured on the loudest step of each floor;
- one-off cues 4 under, and every per-cue place 6 higher than it was.

The featured moments (the bells, the hum, the whistle, the tunings, the fiddler's barks), the Strike, the tuning arc's fiddler, and the coffin's and chamber's scripted sounds keep their places. Every changed gain is set by measurement to its place, not by ear.

**B · Two beds re-rendered.** The Nugget's crowd and the registrar's bed would have needed gains over 1 (an HTML audio element cannot play louder than its file), so `tools/audio/render-room-sfx.py` renders them nearer full scale (peak 0.98 and 0.95); nothing else in that script's output changed.

**C · What holds it.** `tools/check-sound-levels.mjs` had a ceiling only. It now also fails:
- any place lower than -12 dB under the music;
- any sound more than 6 dB under its place, its "floor". For footsteps the floor is checked on each floor's loudest step. The coffin's and the chamber's scripted sounds keep a ceiling only, because their distance is the scene.

Proved: the old `sounds.json` fails it on eleven places.

**D · Heard.** The Themes page's new top section plays Main Street, the Nugget, the registrar, the Clarion and the stage road three ways at one overall volume: before, as now in the game, and 6 dB louder still. Tyler picks by ear; the game ships the middle one until he does.

**E · Approved (Tyler, 2026-11-06, having listened): "The now in the game sound level is perfect."** These are the levels. `tools/check-sound-levels.mjs` holds them in both directions: a ceiling, and a floor.

# 123 · THE POLISH PASS: WRONG ANSWERS WHERE PLAYERS CLICK, AND THE VOICE FINISHED UNDERGROUND — TYLER, 2026-11-06

Tyler, on what else would make the game great: **"Go on all five."** Two of the five are writing, under the permission of errata 113 and 114. The other three are audits, reported to Tyler before anything changes.

**A · Wrong answers where players click most.** Doc 49's doctrine gives each room its "funny diagonal", five to eight authored wrong-verb lines, and the rest fall to the generic refusals. Measured across the game, 28% of hotspot-and-verb pairs have a line of their own. Twenty-four new lines are added in the rooms players spend longest in: the Nugget, the assay office, the Registrar's, the Clarion, Fanshawe's office, the mercantile, the hotel lobby, the back alley and Sheng's laundry. Each goes where a player is most likely to try a verb and get a shrug: opening a window, picking up a spike, sitting on a bench, pushing the patrons. Under doc 49's rules, none hints and none punishes, and no object a puzzle reads is given one.

**B · The voice pass is finished.** Errata 100's pass had reached 31 rooms. The three underground rooms of Act IV (the listening chamber, under Prosperity and the vault) get it now, lightly, because they already had the voice: 36 edits, almost all contractions, plus the seam's bare "Nothing." openers varied. Doc 93 lists every line before and after. No fact a puzzle reads is touched, and nor is the void's line.


**Two art briefs for the session with the image key (Tyler, 2026-11-06: "proceed with your recommendations on the items that are still open").**
- **The fiddler, drawn as Charlie.** Tyler: "I think the fiddler is perfect to look like Charlie" (his husband, who asked to be a character). `reference/fiddler-charlie/brief.md` changes only the fiddler's face, hair and build; it keeps his poses, costume and pixel level, and recuts to the same frames. Cap `fiddler-charlie`, 2 operations. **The photograph never enters the repository:** it is attached in the image session and saved under `art/staging/private/`, which `.gitignore` now excludes.
- **The undertaker and Ozymandia, softer.** `reference/cast-softer/brief.md` is one cast-unify operation for both, plus a correction if it misses. It answers Tyler's notes that both are "too detailed compared to Thad", which still hold in part after errata 111 and 112 (the side-by-sides are in the brief's folder). No new cap: cast-unify has 15 of its 75 left.

# 124 · FOUR UNFAIR GATES, FROM THE FAIRNESS AND BOOKENDS AUDITS — TYLER, 2026-11-06 ("proceed with your recommendations on the items that are still open")

The puzzle-fairness audit and the first-and-last-ten-minutes audit found these. Each fix moves a gate and writes no line.

**A · C5 waits on the log, not the drawer.** THE SUBMISSION LOG on Winnie was gated on C4. C4 completes only on the stock-portrait drawer in Fanshawe's office, which opens only on a funeral day and which nothing connects to Winnie. So the right item on the right person answered "That accomplishes nothing I can see", while the log's own LOOK says "Winnie is going to want to see this." The `requiresPuzzles: [C4]` was an artifact of doc 36's first reading of C4 ("search the office, get the log"), from before doc 57 put C4's completion on the drawer.
- The pair now waits on `T_QUEUE_PADDED`, the flag the log's PICK UP writes. Pairs gain `requiresFlags` for this.
- The photograph keeps its own uses.
- Fixtures `r5-c` and `r5-c-post` now hold the flag their log implies.

**B · The archive waits for the funeral.** Doc 02 makes E9 depend on E8. The archive door opened on `T_EXECUTOR_NAMED` alone, so a player who went straight there after Sump's "Accepted." could compare the hands and hear the confession before the funeral. Act IV would then open with the coffin (invariant 2's scene) never played. The door's executor exchange now also waits for `T_FUNERAL_DONE`; until then the door's own OPEN override answers. Every later fixture that holds `T_SAME_HAND` now holds `T_FUNERAL_DONE`, which its story implies.

**C · The last letter waits for the gold.** Doc 04's Act IV letter ("The gold is real. The story is better.") was the Room 19 letter's USE for the whole of Act IV, and Act IV opens in Room 19 before any gold is found. A player who had used the letters in every act read the ending in its first minute.
- It now waits for `T_STRIKE_FOUND` (F3), so it is true when read.
- Before that, the letter answers with its own fourth LOOK line: "It goes out Thursday, with whatever is on it by Thursday."
- Nothing is set or tracked (invariant 10). `tools/compile-room.mjs` `opensTree.lastLetter` gains `until` and `before`.

**D · A pair out of state does not say its success.** Fourteen pairs consist only of cases, and each one's pair-level `say` is a copy of its first case's success line. When no case held, the engine spoke that line and did nothing. The filing fee offered to Ozymandia before she named her price answered "That was the filing fee. It is now a divining fee." while taking nothing, so the player believed he had paid. The same happened with the letter on Sowerby before the memorial was asked for. Out of state, every pair of cases now yields to the item's pool, as `otherwise: "pool"` already did (`engine/core/VerbSystem.ts`).

**What holds them:**
- `tests/c5.test.ts`: the log works with the drawer unopened.
- `tests/archive-after-funeral.test.ts`.
- `tests/last-letter.test.ts`: no room says "The gold is real" except behind `T_STRIKE_FOUND`.
- `tests/pair-out-of-state.test.ts`.

Each test fails with its fix removed.

**Left for Tyler (each needs writing, or a ruling on a load-bearing line):**
- The risky puzzles: A5, A6, B3, D3, E1, E3, E4, E6, E7 and E9 (the audit's list).
- THE FILING FEE's pool. It is doc 24's FOUR DOLLARS pool, shared under one heading, and says "I have four dollars" while Thad holds two.

# 125 · E6'S THREE MISSING CANDIDATES, WIRED — TYLER, 2026-11-06 ("proceed with your recommendations")

The fairness audit called E6 "an elimination puzzle with nothing to eliminate". Doc 57 E6 writes five refusals under the interest rule, but only Winnie's and Frame's shipped (errata 93 G: "Sheng's waits for his room"). Sheng's, Pratt's and Sowerby's waited for rooms that have since been built: the laundry, Pratt's claim and the church. They are now extracted from doc 57 as pairs on THE EXECUTOR'S FORM. No line is written.

Still open, and Tyler's call: the form exists only after Hob signs it, so these refusals land after the puzzle is solved. Hearing the interest rule bite before Hob would need an "I need an executor" option somewhere, which is new writing.

**What holds it:** `tests/e6-candidates.test.ts`, which requires every person doc 57 answers on the form, other than the registrar, to have a pair. It fails on the old extraction.

---

# 126 · QUEUED LINES PLAY ON THEIR OWN AND NEVER EAT A CLICK; A WAITING LINE SAYS SO — the bookends audit, findings 1 and 11 (Tyler, 2026-11-06: "proceed with your recommendations")

**The fault.** Only a conversation's greeting and an arrival scene with an outcome chained from line to line. Every other queued line showed its first line for its reading hold, went blank, and waited for a click that nothing asked for. That covered a verb's `then`, Main Street's first sight, a door's beat, the filing's read-backs, and the close and its letter. The click that came was spent on the next line, not on what it was for:
- the first click on Main Street did not walk Thad;
- on the map, the undertaker's marker silently went nowhere;
- after "Dear Mother." the letter waited on a black screen, one click per line.

**The rule now** (`engine/core/SpeechPolicy.ts`, used by `GameScene`):
- **A conversation's lines wait for a click.** That covers its greeting and its exchanges, under Tyler's click-to-read ruling (ui.json `conversationWaitsForClick`, 2026-11-01, unchanged). They stay on screen while they wait.
- **A waiting line shows a small still triangle after its last word** (finding 11). It is interface grammar, not words, and it does not blink.
- **Every other line comes down on doc 30 §4.1's reading hold,** and the next queued line follows by itself, as greetings always did.
- **A click outside a conversation is never spent on the speech channel.** It walks, uses a verb or travels, and the lines keep playing.
- **A new answer replaces what was still to be said of the last one,** as a new action interrupts the old in SCUMM.
- **A room change drops lines still queued in the room left,** and any travel a scene was waiting to make. An arrival scene's owed outcome lands at once, so leaving mid-scene can never lose a flag, an item or a puzzle (invariant 6).

**Not changed:** a conversation still waits for its click, Thad's echo of the chosen option included. Whether the echo should advance on its hold (finding 11's second suggestion) touches Tyler's 2026-11-01 ruling, and is his to make. **Ruled in errata 147: the echo advances on its hold.**

**Tooling.** `tools/gauntlet/route.mjs`'s `flush` used to click queued lines through. Such a click now walks, so it waits them out and clicks only a line the probe reports `waiting`. The probe gains `waiting`.

**What holds it:** `tests/speech-pacing.test.ts`. A line outside a conversation never waits and never takes a click. A conversation's line waits and takes one. A hold that runs out brings up the next queued line. Every multi-line scene in the content (onEnter, arrival scenes, every `then`, every transit scene) plays to its last line with no click. Making `holdOver` answer `down` with lines queued fails it.

---

# 127 · THE CLUE PASS — OWNER RULING (Tyler, 2026-11-06)

*Asked: "Nine puzzles are solvable but rely on a guess, each missing one clue line … May I write them, under the same rules as the act-change lines, and show you before anything ships?" Tyler chose **"Yes, write and ship them."***

**A · The permission.** New lines that answer the fairness audit's missing clues, written in `docs/94-clue-pass.md` under its rules: a line in a state the player is already in, never the solving action, no hint system (invariant 4), no LISTEN, nothing marked (invariant 3), true whenever read, and doc 59's voice from one writer. CLAUDE.md records it as the third exception to "never generate written content". It covers doc 94's lines and no others.

**B · What was written** (each wired by `verbRules`, `ref` to doc 94):
- **E1:** the archive door, Act III until E9, says why Thad wants in.
- **E4:** the forms rack, from E2 until certification, says the assayer of record signs a death.
- **D3:** Pratt's claim, from D2 until Sheng names his debtor, points the money toward Sheng.
- **E3:** the undertaker's price board, from E2 until the funeral is booked, says Thad can't afford it. It gives no total, so Sheng still knows the figure first.
- **E7:** the coffin, until Hob's "Good turnout.", says "not yet" and where to stand.
- **THE FILING FEE** gets its own pool in doc 24. It had shared FOUR DOLLARS' pool and said "I have four dollars".

**C · Not written** (doc 94 says why): A5, A6, E6, E9 and B3.

**What holds it:** `tests/clue-pass.test.ts`. Every doc 94 line must be in a room, behind a gate, and the filing fee's pool must not call it four dollars.

# 130 · LOSING DUEL TWO TEACHES; THE PENCIL MARKS THE POINT; DUEL ONE NEEDS B4 — FROM THE DUEL AUDIT (Tyler, 2026-11-06: "proceed with your recommendations")

The duel audit played Room 4's two duels as a first-time player. Its findings 2, 3, 4 and 9 included five that need no new words. No line is written below. Every change is structure, mechanism or staging, and each can be struck by its letter.

**A · A lost Duel Two teaches (audit finding 2). Errata 73 H is amended.**
- **Before:** only Duel One muttered counters. A player short of fourteen pairs lost Duel Two 4-5 every time. Each retry was the same 33 lines and taught nothing.
- **Doc 03 Part One's "Learning" is written for every duel:** "When an opponent uses a boast Thad has no answer to, Thad hears the correct counter from the crowd -- some bystander mutters it."
- **So Duel Two learns by losing (`learnsByLosing`).** The first time Vessel throws a boast Thad cannot answer, the voice from the ring mutters its counter. The counter joins his repertoire when the duel ends, won or lost, as Duel One's notebook does (73 D). Only Duel One has notebook lines, so Duel Two has the mutter alone.
- **The cost, accepted as the audit put it:** fourteen pairs can now be reached by losing. From Duel One's four, a player wins on the third attempt at the latest, and each retry throws boasts he has not heard. Errata 76 A's property stands within any one duel: fourteen can win and thirteen cannot.
- **What stays the faster and funnier route:** Winnie, Pratt and the town.

**B · The pencil marks the point when it is won (audit finding 4).**
- **Before:** the judges' pencil (doc 45 U-ASSAY-PENCIL) sounded when the exchange settled. That was after the *next* boast had been read, and it sounded the same whoever scored.
- **Now each point is written down in a held beat** after the line that won it (Thad's counter, or the reply to a wrong one) and before anything else is said. The beat is 0.6 s with nothing on screen, Sowerby's (`pencil`, doc 03: "Sowerby holds the pencil"). A click does not cut it short, and it ends by itself even when lines wait for a click.
- **This is also the beat the audit asked for after a right counter.** Before, Vessel threw his next boast on the next click, and the punchline got no reaction.
- **The duel's music now starts when the duel is chosen,** under Sowerby's rules, not after them (doc 45 R04-DUEL: "Any Liar's Assay duel begins").

**C · Duel Two throws the pairs he holds latest tier first (audit finding 3c).** Thrown in ascending order, a winning player heard only pair 5 after Tier 1. The town's pairs, "the reward for talking to everyone" (doc 03), were never thrown at him. Tier 1 still comes first (doc 57 B6). Held pairs still come before unheld ones, so `tests/assay.test.ts`'s 131,072-set proof is unchanged.

**D · Duel One needs B4, and ends with the Assay (audit findings 9a, 9b).**
- **Option 3 is now offered only after Duel One is lost, and option 6 is always the way in.** Errata 76 A calls option 3 "the replay", and doc 57 B5 says it "replays it for anyone who enjoys losing". But option 3 was on offer from the start. Taking it first played Duel One and completed B5 without B4.
- **Option 3 is not offered once Duel Two is won.** Once the judges have gone home there is no Assay to sit. On the other route, Vessel was still being asked to sign an affidavit he had already signed.

**E · The rematch is not greyed (audit finding 2d).** Doc 04's VES_B1 option 5 is now `counted-repeat`, not `retain`. A greyed row reads as "already asked", and after a lost Duel Two it is the only way on. It still closes when Duel Two is won.

**What holds it:** `tests/assay.test.ts`. Each new test was proved by putting its defect back, and each failed:
- a lost Duel Two teaches only what was thrown at him unanswered, and he wins by the third attempt with no two retries the same;
- every scored exchange has exactly one mark, after the scoring line and before the next boast;
- a held beat ignores clicks and ends by itself under `conversationWaitsForClick`;
- Duel One is reachable only through B4, and not once Duel Two is won;
- the rematch is never greyed.

Played in the browser from `r4-a`: B4, Duel One lost, then Duel Two lost 4-5. The pencil sounded in the beat after each reply or counter, and pairs 5-9 joined.

**Not done here, and why:**
- **A score on screen** (audit 4): no document puts a running tally anywhere. The chalk's own LISTEN says it "speaks once a duel, on slate, and then it's done", so this is Tyler's to rule on.
- **The sparrings performing every pair they grant** (3a), **the notebook as an item** (3b), and **Duel One's repeat offering the counter just written down** (9c, against 73 D): each needs Tyler's ruling or his words.
- **The memory game** (5e, against 73 C): the player's whole repertoire offered against each boast. Also Tyler's ruling.
- **The standing mockery pool** (finding 6): placing "Son, you've told the truth. In front of people." is a writing decision.

---

# 131 · THE DUELS STAGED: THE RING'S VOICE, DUEL THREE'S SPEAKERS, AND THE RELEASE — FROM THE DUEL AND BOOKENDS AUDITS (Tyler, 2026-11-06: "proceed with your recommendations")

Duel audit findings 4, 5 and 7, and bookends audit finding 7 ("Duel Three's victory is not staged; it is just the next line"). Everything below is staging and mechanism around lines doc 03 already wrote. No line is written, and each change can be struck by its letter.

**A · The ring's mutter comes from the ring.** Errata 73 F calls it "a voice from the ring of chairs, unnamed", and it had no figure, so it fell back to the top of the frame. Doc 30 section 3.1 forbids that fallback. A room may now declare where a voice with no figure speaks from (`voices`, carried from the annotation by `tools/compile-room.mjs`). Room 4's ring speaks low over the right-hand chairs, below the duellists' heads, in its own dim ink.

**B · The judges' pencil is seen, and a direction can be performed instead of printed.**
- **The pencil.** In the mark beat (errata 130 B), the pencil's holder holds the frame his sheet names for it (`markFrame`): Sowerby lowers the pencil to his chest, in Room 4 and on Main Street. That is the hit made visible without a word.
- **Directions.** A figure's sheet may name stage directions it performs (`performs`, keyed by the direction's words as the document writes them). Such a direction is not printed. The figure holds that frame for a beat that cannot be clicked through. Doc 03's "(He puts on his hat.)" is the first: Fanshawe's frame 4, his hat, for 1.5 s.
- **Doc 58's default is unchanged** for every direction no figure performs.

**C · Duel Three's speakers stand where they are.** The assay speaks as `fanshawe` and `sowerby`, but Main Street's figures are `duel_fanshawe` and `duel_sowerby`. Their lines hung over Fanshawe's office x and the back room's, which on the 3700-wide street is off-screen left, so every line was clamped to the left edge. A figure may now speak as another id (`speaksAs`). Any speaker in a conversation takes his talk frame, in his own tree or not, so Sowerby now leans in to read the rules.

**D · Sowerby reads the handbill before Duel Three, and the silence before his verdict is held.**
- **The handbill.** Doc 03 Part One: he reads it "at unbearable length before every match". Duel Three had only the challenge, so Rule 3 ("Truth is admissible but has never been raised") was last heard an act earlier. The five rules now follow the challenge.
- **The silence.** "Silence on Main Street. Long. Fanshawe does not move." is now a held silence after the truth: 3 s, nothing on screen, nothing clickable, the duel's music stopped, every figure on its rest frame. The pencil goes down in it, and then Sowerby gives his verdict.
- The two prose directions are read from doc 03 by the extractor, so they cannot drift.

**E · The street erupts.** "The street erupts." is a cue (`F4-ERUPTS`) on the line after Sowerby's verdict, Thad's "It's true.", which is where doc 03 puts it.
- **The sound** is the approved Nugget crowd, cut and shaped: three windows of `nugget-crowd.wav` laid together and swelled up and away over six seconds (`tools/audio/render-duel-sfx.py`, nothing synthesized). It plays over the silence, because the music stays down until the duel is over.
- **Its place** is 0 dB against the music, the music being off, and `tools/check-sound-levels.mjs` holds it there, ceiling and floor.
- **The crowd and the judges** play their break poses for three seconds (`stirsOn`).
- **Pending Tyler's ear,** like every sound errata 102 auditioned.

**F · After the hat, they go.** When `T_FANSHAWE_BEATEN` lands, Duel Three's cast leaves: Fanshawe, Sowerby, the three judges and the two crowd groups. Before this they stood frozen and the player was handed the panel among statues. None of them has a walk (errata 99 N), and nobody may just vanish (Tyler, 2026-11-01). So a figure may now leave by fading (`leaves`): each fades over 2.5 s. Once Fanshawe has gone, his office door closes off the frame (`F4-DOOR`, the approved latch, 10 dB under the music).
- Doc 03: "He walks back up the street to his office, and for the first time in twelve years, he closes the door."
- `tests/lessons.test.ts`'s "nobody vanishes" rule is unchanged. A fading figure is present until its fade is over.

**What holds it:** `tests/duel-staging.test.ts`, each test proved by putting its defect back. Ten defects were reintroduced, one at a time, and each was caught:
- every voice in every duel resolves to a figure in the duel's room, or to a declared voice;
- the pencil's holder has a mark frame;
- the handbill is read before Duel Three;
- the release is ordered silence, pencil, verdict, eruption, with the hat performed by the figure present;
- the cast fades rather than vanishing, and the door sounds once, after Fanshawe has gone.

**Played in the browser from `r2-f4`:** the challenge and the five rules over Fanshawe and Sowerby; the truth; 3 s of silence; the pencil; the verdict over Sowerby on the porch; the eruption on "It's true."; Fanshawe tipping his hat with nothing printed; "Well played"; the cast fading; and the door 2.5 s later.

**Not done, and why:**
- **The spit line as a position meter** (duel audit 5a) needs step clips the cast does not have.
- **A score on screen** (audit 4) is in no document (errata 130).
- **Two different marks for the two sides** needs a second pencil sound, which no approved file has.

---

# 135 · THE UNDERTAKER AND MADAME OZYMANDIA, SOFTER — TYLER, 2026-11-07 (reference/cast-softer/brief.md)

Tyler, of the pre-playthrough art check: the undertaker "too detailed compared to Thad's", with shoulders too broad; "Ozymandia has too much detail compared to Thad." The brief's recommendation, one softer redraw of both, is done. **One operation spent: cast-unify 61 of 75** (`reference/cast-unify-31.txt`, `art/staging/cast-unify/batch-31/`). The redraw did not plainly miss, so no correction operation was spent.

- **The drawing.** The undertaker and Ozymandia from their own crops of the locked master, on a board beside Thad's cast-sheet self, and against the two side-by-sides that showed the miss. Their poses are unchanged: the undertaker turning his plane, sighting along it, thumbing the blade, looking up; Ozymandia at her temples, humming, pronouncing, the palm out for the fee. Flat shading, simple faces, the undertaker's shoulders a lean man's, and Ozymandia's necklace a few plain beads, with no pendant and no rings.
- **The cut** (`tools/art/cast-softer.py`): `cast-unify-cut.py --grid 1`; every pose registered on the waist line (its lowest row and that row's middle, the fixed thing behind a bench or a table -- `bust-register.py`'s head finder took Ozymandia's raised hand for her head and slid her half her width); each re-cut so the rest frame's bust is as tall as the drawing it replaces (the undertaker 190, Ozymandia 184); the undertaker's waist matted along the bench's slanted back edge (y 494 at x 1430 to y 516 at x 1650), so he now stands at y 509; one level. Ozymandia's placement and plane 1 are unchanged: in the game the ball, the box and the tea pot stand in front of her.
- **Measured** (`tools/art/cast-softer-measure.py`, at game size, Thad drawn nearest-neighbour as the engine draws him; `art/staging/cast-unify/batch-31/measure-*.json`):

| | texture (× Thad's) | head (× Thad's) | shoulders (× Thad's) |
|---|---|---|---|
| the undertaker, before | 6.64 (1.80) | 1.09 | 0.95 |
| the undertaker, after | 6.58 (1.78) | 1.09 | 0.78 |
| Ozymandia, before | 4.86 (1.26) | — | 0.89 |
| Ozymandia, after | 4.88 (1.27) | — | 0.82 |

  **The texture number did not move, and the pictures did.** The metric is the mean brightness step between neighbouring pixels. A waist-up figure has a cream shirt against dark outlines, hands and a wooden plane in a small area, and those boundaries dominate it, so the undertaker stays over the 1.35 flag. As the style gate says, numbers flag but do not decide. The before-and-after beside Thad in each room is `renders/cast-softer-undertaker-before-after.png` and `renders/cast-softer-ozymandia-before-after.png`. Tyler, 2026-11-07: "I think they're both better now." The undertaker's head is within the brief's 10% of Thad's at that depth. Ozymandia's is not measured: her hands are at her temples.
- **What carried a lesson.** The first before-and-after showed Ozymandia in front of her ball, because it was composited without her occlusion plane (Tyler caught it). The game was right. `tools/art/figure-audit-sheets.mjs` had the same gap and now punches each figure out by its `clipPlane`'s mask, as the renderer does; a row in doc 55 §8 records it.
- **For Tyler's playthrough:** both at their benches and tables, in all five frames.

---

# 128 · A TITLE SCREEN AND AN ENDING — the bookends audit, findings 2 and 3 (Tyler, 2026-11-06: "proceed with your recommendations")

**The faults.**
- **No title screen (finding 3).** Boot went straight into Room 1. A browser plays nothing before a click, and none was possible until the driver's tree, about 14 s in. So the coach, Room 1's THADDEUS bed, "My name is Thaddeus Grubb…" and "Course you have." all played in silence, after 2.8 s of black.
- **"Quit to Title" did not go to a title.** It silently started a new game.
- **No ending (finding 2).** After "— Your Thaddeus." the play area stayed black for ever, and the bed looped on.

**The title** (`content/ui/title.json`, now named by the manifest; drawn by `Renderer.drawTitleScreen`; the menu's rules are in `engine/core/Bookends.ts`):
- It is what doc 36 Q59 specified: the ridge plate, the drawn title (`art/ui/title-logo.png`) in its sky, and NEW GAME / CONTINUE / OPTIONS / CREDITS in the game's face on the dark ground below.
- **NEW GAME is the click that unlocks audio,** so the opening plays with sound from its first frame. The title's own bed is O-01-M (`music.title`), detuned like the rest of the score. A browser starts it only after a click anywhere on the title.
- **CONTINUE** loads the newest save (the autosave). It is visible and dim with no save (doc 33 table 5). It is also dim when that save was taken after the close, because a finished game has nothing to continue (`GameState.canContinue`).
- **OPTIONS** opens the options page alone; its Back returns to the title.
- **CREDITS stays on the menu, drawn dim and inert.** Tyler ruled that there is no credits list for now (below), and no document has one (doc 48 S7 beat 5, doc 45 OQ-08). Inert was the simpler of the two choices he allowed; the other was showing only "THE END".
- **Boot goes to the title.** A `?room=` or `?fixture=` review link still goes straight into the game.
- **"Quit to Title" goes to the title.** Per doc 33 table 5, it neither resets the world nor deletes a save.
- While the title is up, nothing of the game runs behind it.

**The close** (Room 36's exit into `coach_stop_dawn`, errata 121 B):
- **No panel from his arrival at the coach stop.** Doc 48 S7 beats 3–5 are control `none`, so the room declares `"interface": "none"`. Its scene controls offer MENU only: SKIP SCENE is shown only in a room with a timeline to skip.
- **The letter is one page.** Each line joins the page under the one before, rather than four subtitles each erasing the last. Then the page holds whole.
- **Then it fades, the screen stays black a moment, and the title returns over the ridge, with THE END under the drawn title.** Tyler's ruling, 2026-11-06: asked what the ending should say, he chose **"Title + THE END only (Recommended)"**. The words are `content/ui/title.json` `theEnd`, and they show only when the title is reached through the close. The timings are `endingHoldSeconds` 7, `endingFadeSeconds` 3 and `endingBlackSeconds` 2 in ui.json, interface timing to change after watching it.
- **The dawn bed is let finish** (`Music.finish`): it stops looping and plays to the end of its file, which is whole bars, then stops. Nothing replaces or extends it (doc 45). The title does not start its own bed over it.
- **A game loaded after the close** goes straight to black and the title.
- The room declares this with `"endsGame": true`.

**Tooling.** The probe reports `title` and `ending`, and `__gauntlet.titleItem(id)` says where an item is drawn. The opening gauntlet (`run.mjs`) and every route (`route.mjs` `pastTitle`) click NEW GAME, as a player does. The opening gauntlet passes with the title in front of it.

**What holds it:** `tests/bookends.test.ts`:
- the title's plate, logo and four items exist;
- CONTINUE is dim with no save and with a finished one, and CREDITS is inert;
- exactly one room ends the game, with no panel, and its letter is entirely over black;
- the ending's phases run hold → fade → black → title.

Removing `endsGame` from the coach stop fails it.

**For Tyler, later:** a credits list, if he wants one, and what it plays over (doc 45 OQ-08).

---

# 132 · THE FIDDLER, DRAWN AS CHARLIE — TYLER, 2026-11-07

Tyler: "Read reference/fiddler-charlie/brief.md and do it." He attached the photograph of Charlie, his husband (errata 123).

- **One operation of the two** (`fiddler-charlie` attempt 1, `reference/fiddler-charlie/op-01.spec.json`). Its three images, in the brief's order:
  - the fiddler's own sheet;
  - the Nugget cast standard;
  - the photograph.
- **It came back keeping everything the brief keeps:** the five poses in order and place, the costume, the hat, the fiddle and bow, and the height. Only the face, hair and build changed, to Charlie's: dark hair, stubble and a warm, slightly crooked smile. The correction was not spent.
- **The photograph never entered the repository.** It is at `art/staging/private/charlie.png`, which `.gitignore` excludes. The ledger records its path and hash, not the picture. No render was made from it, and nothing under `renders/` shows it.
- **Cut as errata 115 cut him.**
  - `tools/art/townspeople-cut.py --only fiddler` reads the new sheet, at the same 288 px figure height and in the same frame order.
  - The new drawing cut one pixel narrower, so the frames are padded to the 144 px the sprite declares. `content/ambient/fiddler.json` stands unchanged: frames, breaks, `keepsTime` and talk frame.
  - Snapped by `one-level.py --only`. `--only` leaves the other townspeople's cuts and their `cut.json` entries alone.
- **Checked:**
  - `npm test` and `run-all` pass, including the one-level, movement, keeps-time and key-edge checks.
  - The Nugget's proof passes.
  - `renders/fiddler-charlie-beside-thad-in-the-nugget@1x.png` and `@2x.png` show him beside Thad at game size.

**Waiting on Tyler:** this is a likeness, so his eye is the test, before the merge. One correction remains under the cap.

---

# 129 · HOB IS CLICKABLE, AND NOBODY IS WALKED ONTO HIM — the bookends audit, finding 4 (Tyler, 2026-11-06: "proceed with your recommendations")

**The fault.** At control in Room 1, Hob stands in front of the only exit. The exit opens on `T_HOB_GONE`, which needs `T_HOB_SPOKEN`, which only LOOK or LISTEN on his 60×73 lamp wrote.
- **His body was not a target** (movers carry no rect; doc 36 Q60). Hovering him showed a bare "Look at", and LOOK and TALK TO on him did nothing at all. Doc 17's written TALK TO override, "He's walking. I'll let him walk…", could not be reached.
- **A click on the gap behind him walked Thad into him.** The floor under the gap is where Hob stands, so the two were left overlapping: "nobody stands on anybody", broken by the first free click of the game.

**The fix: routing and geometry, no new lines.**
- **The lamp declares who carries it** (`"heldBy": "hob"`, written by `tools/extract-content.mjs`). A click on that figure is a click on the lamp. Hovering him names THE WATCHMAN'S LAMP. LOOK and LISTEN on him speak to him exactly as the lamp does (`T_HOB_SPOKEN`). TALK TO plays the override. He wins over scenery larger than himself (the mud he stands in), by the rule `personAt` already uses for people. His body is reckoned from his feet and drawn height (`GameScene.targetUnder`), not from the renderer's dev-only rectangles.
- **A walk never ends on a standing mover** (`engine/core/Standing.ts`). If a walk's end, after it is snapped to the floor, falls inside a standing figure's footprint, it moves to his side, the side Thad is coming from, a body's width clear. The same holds for the point an object's approach walks to. Only movers count (Hob, the coach's team); the town's ambient figures keep their authored stands.

**Not done, and why.** Doc 17 beat 9 stages the lamp *crossing* the road, and the lamp's lines say "crossing" while Hob stands still. Staging the crossing as written was the other option. It changes Q63's ruled standing gate (Hob blocks the exit until addressed), so it is left for Tyler.

**What holds it:** `tests/hob-gate.test.ts`. A walk that would end on Hob ends beside him on the near side. A walk clear of him, or at another depth, is untouched. The lamp names Hob as its carrier, and keeps its TALK TO override and its `T_HOB_SPOKEN` writes. Removing `heldBy` or the clearance fails it.

---

# 134 · DIALOGUE OPTIONS WRAP, AND EVERY ONE FITS THE PANEL — the bookends audit, finding 6 (Tyler, 2026-11-06: "proceed with your recommendations")

**The fault.** Option rows did not wrap. The truth option in Duel Three, the most important choice in the game, ran off the right edge mid-word: "There is no gold in Mott's claim. There never was. Obadiah Mott invented it to rai". Pair 9's counter alone is 1,884 px at the panel's scale, against 1,848 px of room.

**The fix** (`Renderer.choiceLines` / `optionRows`):
- **A row that does not fit wraps,** in the panel's face at `PANEL_GLYPH_SCALE`, within the play area's width less the speech margins (`CHOICE_WIDTH`). Its continuation hangs under the text, not under the "- ".
- **The list is bottom-anchored by rows, not by options,** so a wrapped option is taller.
- **The click boxes are taken from the same layout,** so a click anywhere on a wrapped option's rows chooses it.
- The probe's `choiceLines` still counts options, one per option, as doc 30 §14's checks expect.

**What holds it:** `tests/option-fit.test.ts` checks every option the content can offer at the panel's scale:
- every tree option and its rephrasing;
- every counter, wrong answer and offer in the Assay.

Each must fit in at most three rows (`OPTION_MAX_ROWS`), each row within the width, every word kept in order. Taking the wrapping out fails it on pair 9's counter.

---

# 133 · THE QUIET MOMENTS: ROOM 33'S NINETY SECONDS, THE FADE INTO DAWN, BEAT 11, AND PAUSES — the bookends audit, findings 8, 9, 10 and 15 (Tyler, 2026-11-06: "proceed with your recommendations")

**A · Room 33's ninety seconds no longer look like a hang (finding 8).**
- **The fault.** The full verb panel and inventory stayed lit, and the sentence line still read "Look at EVERY ROCK SURFACE", over a frame in which nothing could be done.
- **The fix.** For the arc, the panel and inventory are **dimmed, not removed**: drawn as always under black at 60%. They stay as inert as they already were. The sentence line is blank, and the pointer names nothing.
- **Nothing is added.** No text and no motion; invariants 8 and 9 stand, and the lamp is still the only moving thing in the frame.
- Thad's sit is errata 121 A's, unchanged.

**B · The filing fades into the dawn (finding 10).**
- **The fault.** `afterTimeline` cut from the night registrar straight to the dawn street. The held item and the sentence line ("Look at THE SAMPLE") carried over.
- **The fix.** Room 7 declares `"fade": true` in its annotation, through `tools/compile-room.mjs`. The office fades to black, holds there, and the dawn street fades up: doc 48 S7 beat 1, "Fade up on the street". The hold waits for the street's plate, so the fade comes up on it. Timings are ui.json's `roomFadeOutSeconds` 1, `roomFadeHoldSeconds` 1 and `roomFadeInSeconds` 1.5.
- **Nothing carries over.** As the room hands on (`GameState.handOn`), the held item is put down and the verb is cleared.
- **The four filed documents leave the inventory once filed** (Tyler agreed, 2026-11-06). THE DEED, THE DEATH CERTIFICATE, THE CERTIFICATE and THE SAMPLE now have `lostWhen: { T_FILED: true }`. They follow the flag, as the watch and the four dollars do, so a save restores it. The deed's file is hand-written; the other three are written by `tools/extract-content.mjs`.

**C · Beat 11 hides the panel (finding 15).** Doc 17 beat 11 is the walk away under the title, and it is control `none` like beats 2–7. While a carried beat with control `none` plays, the panel is not drawn and a click does nothing, so a stale "Walk to CONSOLATION" no longer sits under the title.

**D · A bare pause is a rest (finding 9).**
- **The fault.** Doc 58 rule 2 shows `(beat)` and `(pause)` as the character saying "…". Under click-to-read, each one stood on screen as a floating ellipsis waiting for a click.
- **The fix.** It is still shown, and now it holds for its reading hold and gives way by itself, in a conversation too (`SpeechPolicy.isRest`, `DialoguePerformance.tick`). Sump's "…" in the filing's read-back is a pair's line, and already plays on its hold (errata 126).

**Not done, and why.**
- **Parenthetical directions are still shown as text.** That includes "(stamping)", "(He blots it.)" and "(Stamp. Thad is alive.)". Doc 58, ruled by Tyler on 2026-11-05, says a direction in a reply is shown in the quieter ink. Performing one instead needs a pose or a picture: a stamp frame for Sump or Winnie, or the dawn coach stop, which errata 121 B has since drawn. This session has no image API.
- The duel's "(He puts on his hat.)" belongs to the session doing the duels.

**What holds it:** `tests/r33-dawn.test.ts`:
- the filing fades, and the room-fade timings exist;
- from fixture `r7-f5`, the four documents are carried before T_FILED and gone after it;
- `handOn` puts the held item down;
- a pause never waits for a click, while a reply still does.

Removing the sample's `lostWhen`, or treating "…" as a line, fails it.

---

# 136 · THE SCORE IN CHALK, THE MOCKERY HEARD, THE SPARRINGS WHOLE, THE COUNTER JUST LEARNED — OWNER RULING (Tyler, 2026-11-06)

Tyler was asked: "Four more improvements need your OK… Which should I do?" He selected all four:
- **"Chalk score on the slate (Recommended)"**
- **"Use the unused mockery lines (Recommended)"**
- **"Sparrings show every pair (Recommended)"**
- **"Offer the counter just learned (Recommended)"**

They are the duel audit's findings 4, 6, 3a and 9c, recommended in errata 130 and 131 as his to rule on. No line is written. Every word below is doc 03's, extracted.

**A · The score is chalked on the slate.** In Room 4, while a duel runs, the score is shown as tally marks on the right of THE SCOREBOARD (`tally`, carried from the annotation by `tools/compile-room.mjs`). There are no words.
- **The layout:** the player's row is above Vessel's. Each row is four uprights with a fifth struck across, in the slate's own way of counting and at the plate's painted tallies' size. The marks are a little brighter than the old ones, because they are today's.
- **When a mark appears:** as the judges' pencil goes down (errata 130 B), not when the exchange lands, which is after the next boast.
- **When the slate clears:** when the duel is over.
- **Duel Three has no slate.** The street has none, and the duel cannot be lost.

**B · The standing mockery is heard. Errata 73 H is amended again.** Doc 03 Part Three's five lines were extracted and never read.
- **The plant.** "Son, you've told the truth. In front of people." ("That last one lands very differently in Act IV") now closes Duel One's loss, after "That's the trouble.", in Vessel's voice, as Tyler chose.
- **The other four.** They are said in turn, one per lost Duel Two ("rotated on any loss"). Vessel says his jeer after the reply that lost it and the judges' mark, before the ring teaches what Thad lacked (errata 130 A). `T_DUEL_TWO_LOSSES` keeps the turn, and a duel saved mid-fight keeps it too.

**C · The sparrings perform every pair they grant.**
- **Before:** Winnie's lesson set pairs 5-9 and performed 6; Pratt's set 10-15 and performed 13.
- **Now each other pair is run through:** Thad says the boast, the teacher says the counter, in doc 03 Part Two's words.
- **Placement:** after Winnie's "Sit." and Pratt's "Try me.", and before the rest of doc 03's sparring. So Winnie's "Say it again." and Pratt's "Where'd that come from?" still close their scenes, as written.
- **The extractor reads it all from doc 03,** and fails if a sparring performs none of the pairs its row grants.

**D · The repeat of pair 1 offers the counter just written down. Errata 73 D is amended.** Duel One's fifth boast offers "I've seen your bishop. He was malnourished." beside its three wrong answers (`offersMuttered`). Thad has just written "Malnourished. Bishop. Yes." The duel still cannot be won: one point is not five, and it ends lost 1-4. Duel Two is unchanged. Errata 73 C stands as it is.

**What holds it:** `tests/assay.test.ts`. Each new test was proved by putting its defect back, and each failed:
- the jeers turn across losses, the plant closes Duel One, and the counter moves;
- the repeat offers the counter and the duel is still lost;
- both sparrings perform every pair they grant, each boast by Thad and answered by the teacher;
- the runner says whom each point is for, and Room 4's slate holds five marks a side within THE SCOREBOARD.

# 137 · FRAME AND THE THREE JUDGES ARE TOO THICK; THE OPENING STAYS AS IT IS — TYLER, 2026-11-06

**A · Leaner.** Tyler: "Ignatius and the 3 judges are all really thick compared to Thad. They look like dwarves vs characters from this same universe of characters." All four are within 5% of the room's man in height. They fail on build: broader shoulders than Thad, and a larger head at the same height. `reference/leaner-cast/brief.md` briefs the image session:
- one cast-unify sheet for Frame;
- one sheet for the three judges, standing (Duel Three's porch) and seated (the Nugget's back room);
- one correction each if a sheet plainly misses.

Up to 4 operations come from cast-unify's remaining 14 (errata 111, 112 C). The side-by-sides are in the brief's folder. Doc 55 §8 gains the rule: build is judged beside Thad, not only height.

**B · The opening's arrival stays as built.** The coach has already stopped and the case is already in the mud in the first frame, where doc 17 has the coach rolling in and the case falling (the bookends audit, finding 12). Tyler: "no I like it as is." It is not an open item.

---

# 138 · FRAME AND THE THREE JUDGES, LEANER — TYLER, 2026-11-07 (reference/leaner-cast/brief.md)

Tyler, 2026-11-06: "Ignatius and the 3 judges are all really thick compared to Thad. They look like dwarves vs characters from this same universe of characters." Errata 137's brief is done.

**Three operations spent, cast-unify 62-64 of 75:**
- 62, Frame (`reference/cast-unify-32.txt`, batch-32).
- 63, the three judges standing and seated on one sheet (`reference/cast-unify-33.txt`, batch-33). The brief asked for two rows. Four were drawn -- one standing row, then one seated row per judge -- so that each face is drawn larger than twelve busts in a row would allow.
- 64, a correction of the gaunt judge's seated row (`reference/cast-unify-34.txt`, batch-34). 63 drew his first seated pose, his rest and the frame shown most, in a black bow tie and a brown waistcoat; his green cravat is in every pose of 64.

Frame's correction was not spent: he does not plainly miss.

- **Drawn** from the locked master, beside Thad, against the brief's side-by-sides. The faces, hair, clothes and colours are the master's (errata 111 E, L), and every current pose is kept: Frame's notebook is in every pose; the judges watch and confer, nod, and stroke a beard on the porch, and fold their hands, lean to confer, nod and drum their fingers at the table. The build is the hero's: lean, long-legged, the same height.
- **Cut** (`tools/art/leaner-cast.py`). Frame and each standing judge (cut from his own pair) at their old figure heights with `cast-unify-cut.py --grid 1`; `figureHeight` crown to sole (`--hat` for the bearded judge). The bearded judge is mirrored to face the duel (111 V), with his feet on the porch boards as before (111 U). Each seated judge is cut to the bust height of the drawing he replaces and registered on the head and the hands' row (`bust-register.py --bottom`), with his waist on the table's back edge as before (111 O). Records are written before the snap to one level.
- **Measured before anyone looks**, at game size beside Thad at the same depth (`tools/art/build-vs-thad.py`; `art/staging/cast-unify/batch-33/build-*.json`). Shoulders, × Thad's:

| | before | after |
|---|---|---|
| Frame | (see note) | (see note) |
| the bald judge, standing / seated | 1.19 / 1.35 | 1.15 / 1.22 |
| the gaunt judge, standing / seated | 0.96 / 1.21 | 1.04 / 1.08 |
| the bearded judge, standing / seated | 1.15 / 1.25 | 1.00 / 1.08 |

  **Heads, crown to chin, read by ruler** at one man's height (`renders/leaner-cast-heads-ruler-before-after.png`). The automatic neck-finder fails on beards, hats and the porch's 110-pixel men, and its numbers are not used.

| × Thad's | before | after |
|---|---|---|
| Frame | ~1.5 | ~1.12 |
| the bald judge | ~1.5 | ~1.25 |
| the gaunt judge | ~1.45 | ~1.3 |
| the bearded judge, under his hat | — | ~1.2 |

  **Still flagged:** the heads are all outside the brief's 10%, though all smaller; the generator draws older men with bigger heads. The bald judge seated is at 1.22 for the shoulders: he is the thick-set one (111 D). Frame's shoulder number does not read his apron's breadth (the band it measures sits under his old, bigger head). The pictures are the measure: `renders/leaner-cast-*-before-after.png`, each beside Thad in his room.
- **For Tyler's playthrough:** the four in the Clarion, on the porch for Duel Three, and at the Nugget's back table -- above all, whether the heads now read as this game's people.

---

# 139 · THE JUDGES' HEADS: TWO MORE OPERATIONS MISSED, AND WHY — TYLER, 2026-11-07

Tyler, of the bald judge after errata 138: **"This head still seems weirdly large."** Measured by ruler at one man's height, the standing judges' heads were still about 1.25-1.3× Thad's (138).

- **Cast-unify 65** (`reference/cast-unify-35.txt`, batch-35, within 138's brief, its fourth operation): the standing row again, with the heads asked for at the hero's size and one eighth of the man. It drew the six men smaller overall and kept the same proportion: not used.
- **Cast-unify 66** (`reference/cast-unify-36.txt`, batch-36; Tyler: "One more try, Thad as template"): Thad's own figure six times as the picture edited, each to become a judge with the hero's proportions. Not used.

**Why it keeps missing.** The template, like every cast-unify board, is Thad's **cast-sheet** drawing. Measured at one man's height, its head (crown to chin) is about **1.3× the in-game Thad's** (`renders/thad-in-game-vs-cast-sheet-heads.png`: in-game ~40/300, cast sheet ~52/300). Op 66's bald judge matches the cast-sheet head, at ~1.45× the in-game Thad's. So "a head the size of the hero's" has been asked against the wrong hero all along. Every figure drawn from these boards inherits that head, and the in-game Thad, redrawn smaller-headed (errata 112), is the outlier the cast is measured against.

**Next, when a redraw is wanted:** build the board from the in-game Thad (`art/actors/thad-stand-front/stand-00.png`), not his cast-sheet self, and measure heads against him. What is live is unchanged: 138's leaner judges. Sixty-six of seventy-five cast-unify operations are spent.

---

# 140 · EVERY ITEM AUDITED: WHAT IT IS, HOW IT IS GOT, WHAT IT IS FOR, WHEN IT LEAVES — the items audit (Tyler, 2026-11-06: "Are all items in the inventory (and items that can be picked up) crafted correctly, able to be picked up, combined if/when they need to be, etc?")

Twenty-six items (doc 23's rows; the fixture token is not one). Each was checked against docs 02, 23, 24, 57 and this errata, and against the running game on a new fixture, `r7-f5-held`: the state continuous play from a fresh save is in at the filing, nineteen items in hand. No line was written, and no art was made.

**A · Data and extraction.**
- **THE LINEN MONEY stayed in the inventory for the rest of the game.** Doc 23 says "Given to Sheng"; doc 57 D4 says "Sheng takes it". A tree may not write inventory, so it now follows the flag that exchange writes, as the four dollars follow T_SWINDLED: `lostWhen: { T_PRATT_TRAIL: true }`, written by `tools/extract-content.mjs`.
- **A second survey.** THE COMPANY MAP on Madame Ozymandia had no bound after A7. Once Sump had lodged the survey at A9, it handed a fresh one back. The case now also needs `T_SURVEY_LODGED: false`; after that, the map's own pool answers.
- **"Already on file" missed two papers.** Doc 57 F5: "USE anything else Thad has given the office before". THE EXECUTOR'S FORM (accepted at E6) and THE FILING FEE (paid at A9, and earned again at the piano) fell to a pool. Both now have the case.
- **The deed and the letter were retyped.** Doc 23's Act I items were written by hand, and three apostrophes and quotes had been curled; the document has them straight. They now match the document character for character.
- **The note on every Act II item** said "Errata 66 ruling A: shown to the character at C5 and kept; never consumed". That includes the loan and the linen money, which are spent and given. It now stays on the submission log only.

**B · Engine.**
- **An item's repeat lines started again in every room.** The cursor was keyed to the room he stood in. It is now keyed to the inventory, as `GameState.scopeOf` always said it was.
- **A room object that shares an item's id shared its lines.** Room 34's THE TUNING FORK is a hotspot. LOOK at the fork in the inventory twice, then at the one in the room, and the room's fork spoke its third line first. Room 11's THE HANDKERCHIEF was keyed the same way. Items are now told apart by what made them (`GameState.isItemTarget`), not by id.
- **An item on a person with no pair got the people pool.** THE TUNING FORK on Winnie said "I would not know where to begin, and the beginning is the part people object to.", which is written for USE on a person with nothing in hand. Doc 24's tiers are for "this item on anything unhandled", so it now goes to the pair, then the item's pool, then the global pool. THE SUBMISSION LOG on Winnie after C5 is the same: "the pair yields to the ordinary pools" (its own note). Before, it said nothing.
- **Item on item was impossible.** Holding THE LETTER and pointing at THE TUNING FORK, the sentence read "Use THE LETTER on THE TUNING FORK", and the click swapped which item was held. Doc 22 asks for "item-to-item sentences". With USE selected and an item in hand, a click on a different item now performs that sentence through doc 24's tiers (`GameState.inventoryClick`). The global pool's "They are two separate objects and I should like them to remain so." is finally reachable. Clicking the held item still puts it down.
- **The item stayed in hand after the sentence.** The verb cleared when "Use X on Y" finished, but the item did not. The next hover read "Look at THE TUNING FORK on THE COUNTER", and the next USE on an item carried the stale one. The item is now put down with the verb.
- **The inventory scrolled one icon at a time** in a grid four wide. Every icon slid a cell and the first of each row wrapped onto the row above. It now moves a row at a time, so the bottom row comes up to the top.

**C · Checked and sound.** Every item is in the manifest, with an icon that loads and draws, and its doc 23 LOOK and LISTEN, three each. Every item has a source:
- **Pick-ups:** the case's three take the case; the eggs, tonic and pickaxe are once each on account; the photograph comes once, from a drawer of forty.
- **Room objects that hide:** the log's hotspot goes with the log; Room 11's handkerchief is gone after the dinner; Grievance's blanket is not in her bin while it is lent.

Every USE doc 57 writes is a pair, and every spend in doc 23 takes its item:
- **Spent or lodged:** the four dollars, the survey, the fee twice, the loan, the eggs and the tonic.
- **Filed:** the four papers at T_FILED (errata 133).

The whole game, played through, ends carrying exactly what doc 23 keeps, and nothing it needs had left before it was needed.

**D · For Tyler (not changed).**
- **The blanket.** Errata 68 A has it "come back into inventory" after A5, and that is what happens. Errata 76 D read doc 23's "comes back after it" as back to the livery, "which clears the flag when Rooms 23/24 are built". That was never done, and doing it alone would draw a blanket in the bin while Thad still carries one.
- **The icons.** See the session report: the eggs, linen money, loan, blanket and handkerchief icons read poorly. Every icon is magnified from a 30×21 cell by 3.8, a non-integer step, so its pixels are uneven.
- **THE EXECUTOR'S FORM on Sump after E6** replays the acceptance in full. Doc 57 has no line for after.

**What holds it:** `tests/items.test.ts`, over every item the manifest loads. Each defect above was put back and failed it:
- doc 23 verbatim;
- an icon drawn;
- a source, and carried in play;
- bounded sources;
- the second survey;
- doc 57's USEs;
- "Already on file";
- spends take;
- pools on people and items;
- item-on-item pairs both ways;
- an item's lines kept across rooms and apart from a room object's;
- the end state;
- the fixture equal to play;
- scrolling by rows.

---

# 141 · PHYSICAL DIRECTIONS ARE ACTED, NARRATION STAYS PRINTED — OWNER RULING (Tyler, 2026-11-06)

Tyler was told: "a few directions are still printed rather than acted, such as '(stamping)' during the filing. Acting them out needs new poses." He answered: **"then let's do it? Lol"**. This amends doc 58 (Tyler, 2026-11-05), under which every shown direction was printed in parentheses.

**A · The ruling.**
- **A physical direction is acted.** A visible action by a figure on screen is performed in a pose or a short run of poses, and its text is not printed.
- **Narration stays printed,** exactly as doc 58 rules: meaning, tones and pauses.
- **When in doubt, it stays printed.** A direction whose joke would be lost by acting it is kept printed and listed for Tyler.

**B · The decision lives in `docs/95-acted-directions.md`.** It catalogues all 67 shown directions:
- **A, acted now:** 11;
- **B, physical but waiting for a pose:** 9;
- **C, printed:** 47.

`tools/extract-content.mjs` reads the table into `content/acted-directions.json`, and the loader gives each A row to the figures it names as `sprite.performs`. Fanshawe's hat (errata 131 B) now comes from there too. His hand-written entry is gone.

**C · How a direction is acted.** Errata 131 B's mechanism is extended, and nothing about a direction's words is in code:
- **Any figure that acts it.** Every figure in the room that acts the words acts them, whoever the line is written for. "They resume immediately." is both boundary men.
- **Every channel.** The same reading serves a conversation's exchange, a verb's queued lines (Sump's "Stamp." at the filing) and a room's arrival scene (the notarizing on D6's arrival).
- **A run of frames,** across the row's seconds. No beat of it can be clicked through.
- **A frame held through speech.** Ozymandia says "'You have never seen breakfast.'" with her eyes still closed, then opens them with her palm out for "Two dollars."
- **A cue on a frame.** The approved stamp lands as Sump's stamp comes down: doc 45 U-STAMP, "where the writing says one does".

**D · What is acted now.**
- Fanshawe's hat (Duel Three).
- Sump's stamp on the deed at the filing.
- Sump notarizing and stamping on Pratt's attestation, without looking up.
- The boundary men resuming.
- Deke tipping his hat and walking out of the Nugget. The drink is not shown.
- Frame looking up from his notebook and holding the look.
- Ozymandia's eyes, closed and opened.
- Pratt checking the sky.
- Sheng returning to his ironing.
- Winnie signing the death certificate.

Each was played in the browser (`tools/gauntlet/acted-proof.mjs`). The filing, before and after, is `renders/acted-directions-filing-before-after.png`.

**E · What waits for a pose (B).** `reference/acted-directions/brief.md` briefs five sheets, one per character, for:
- Winnie's stamping and signing at the Registrar's;
- Sump's blotting and the filing under glass;
- Pratt's hat, and his look at his feet at Prosperity;
- Deke's look at the watch;
- Thad finding and fitting the pick's head in Room 33.

The budget is five operations plus at most three corrections, from cast-unify's nine left (66 of 75 spent). Each board is the in-game Thad (errata 139), with the character's master crop (`tools/art/acted-boards.py`). Thad's rows also need the actor, not only an ambient figure, to act; the brief says how.

**F · For Tyler.** Doc 95's list has eight items, each with a recommendation:
- the pickaxe swings stay printed, and the fits are drawn;
- "Stamp. Thad is alive." stays printed;
- Hob's four seconds stays printed;
- Hob's lamp post stays printed, because the alley has none;
- Pratt's bite stays printed, because the hole is in another room;
- Sowerby's painful pause stays printed;
- Sowerby's shut eyes at Boot Hill stay printed;
- Deke's drink goes unshown.

Invariant 7 holds: HOB_C1 option 4's look is C and is presented exactly as before.

**What holds it:** `tests/acted-directions.test.ts`. Five defects were put back one at a time, and each was caught:
- a direction missing from doc 95;
- an acted direction given to a figure in another room;
- a figure acting narration by a hand-written `performs`;
- the engine printing an acted beat;
- a held frame lost.

---

# 142 · THE ITEM ICONS, AND THE BLANKET — TYLER, 2026-11-06

Two of errata 140's items-audit questions, answered.

**A · All 26 icons redrawn at slot size.** Seven icons read poorly: the eggs, the linen money, the loan, the blanket, the handkerchief, the pickaxe and the sample. All 26 are 30×21 cells enlarged by ×3.81 into 180×80 slots, so their pixels come out uneven. Tyler chose **"Redraw all 26 at slot size (Recommended)"**. The new icons are 60×40 art pixels, drawn at an integer ×2, in the cast's style, with every paper a different object. `reference/item-icons/brief.md` briefs the image session. The cap is `item-icons`, 2 operations.

**B · The blanket stays with Thad after A5.** Errata 68 A has it come back into his inventory, and that is what is built. Errata 76 D's plan to return it to Grievance's bin instead was never built and is struck. Tyler chose **"Thad keeps it (Recommended)"**.

---

# 144 · THE JUDGES REDRAWN WHOLE, AT THAD'S PROPORTIONS — TYLER, 2026-11-07

Tyler, of 138's leaner judges: **"This head still seems weirdly large."** Then, of a head-shrink tried on their own drawings: **"The heads look messed up. Redraw the full person for each of the oversized characters if you need to."** Errata 139 found why redraws kept coming back big-headed: every board showed the cast sheet's Thad, whose head is about 1.3× the in-game Thad's.

- **Cast-unify 67** (batch-37; reference/cast-unify-37.txt): the standing judges painted over the in-game Thad, with their full figures as reference. Heads still ~1.3×; not used.
- **Cast-unify 68** (batch-39; reference/cast-unify-39.txt): the same template, but with **only their faces** as reference (head-and-shoulders crops), and figures drawn ~780 px tall. The generator copies body proportions from any full figure it is shown, and this time the only one was Thad. **The standing judges are 68**: by ruler at one man's height, crown to chin ~40-42 against Thad's 40, where 138's were 50-55. All three are drawn turned toward the duel, so none is mirrored now (`tests/faces.test.mjs`); their feet are on the porch boards (`tests/stands-on.test.mjs`).
- **Cast-unify 69** (batch-40; reference/cast-unify-40.txt): 68's judges cut off at the waist, four times each, repainted seated -- hands folded, conferring, nodding, drumming. Cut to their old bust heights, their heads came out 1.1-1.2× Thad's, because the generator enlarged the head a little for the torso. So **each seated judge is cut so his head is Thad's at the table's depth** (`SEATED_SCALE` in `tools/art/leaner-cast.py`), and they sit as ordinary men at the table (`renders/leaner-cast-seated-judges-three-versions.png`).
- **The lesson, for every future redraw:** show the generator the in-game Thad as the only full figure, and the character only as a face. Measure heads by ruler against the in-game Thad (`renders/thad-in-game-vs-cast-sheet-heads.png`), never against the cast sheet.

**Operations:** 67-69, 69 of 75 cast-unify spent. Before and after, beside Thad in their rooms, against the drawings before 138: `renders/leaner-cast-duel-judge-*-before-after.png`, `renders/leaner-cast-seated-judge-*-before-after.png`. Left for the playthrough: the bearded judge seated wears a gold watch chain in two of his four poses, which his design does not have.

---

# 143 · CONVERSATIONS AS MONKEY ISLAND DREW THEM, AND EVERY PROMPT REVEALED WHEN ITS GATES SAY — the dialogue audit (Tyler, 2026-11-06: "Can you make sure the way the dialogue trees are presented the same way they're presented in MI and that they look as good as possible and that prompts are revealed correctly?")

Checked against both SCUMM games and against this project's own rulings: doc 30, errata 37 and 57 (used rows), 126 (click-to-read and the waiting mark), 134 (wrapping), and 54 and 62 (panel and face). Where a ruling differs from MI, the ruling stands: a used row greys and stays unless its aftermath says otherwise (errata 57), and every conversation line waits for a click (Tyler, 2026-11-01).

**A · What was off, seen in the running game** (before and after frames for each, from `tools/gauntlet/dialogue-proof.mjs` and a capture pass):
- **The verb panel came back for every answer performed between choices.** The verbs, the inventory and a sentence line still reading "Talk to THE LIVERY MAN" appeared under each line and went again when the list returned. Nothing on it could be used, since a click then only reads the line on. In MI the area belongs to the conversation from the greeting to its last word, and now it does here: from the greeting, through the list and every answer, until the conversation closes.
- **A long list grew up out of the panel over the room.** The list was bottom-anchored by row and grew a row upward per option, so the livery man's eight options covered Thad's feet. In MI the choices fill the interface area from its top and scroll. Now the list is set from the top of the panel, one row's breadth below its edge, and holds five rows at the panel's pitch (`CHOICE_ROWS`). A longer list scrolls by whole options with two arrows at the frame's right. They are the inventory arrows' width and inset, and the one that cannot move is dimmed (doc 30 §6.1). The mouse wheel scrolls too. Arrows appear only when the list is longer than the panel. The list goes back to its top whenever it is rebuilt. The room keeps all 864 rows.
- **Nothing lit under the pointer.** `optionPrefixSelected` was in ui.json and never drawn. The row under the pointer is now drawn in the bright ink with "> ". A used row keeps its dim ink and gets the bright marker, as doc 30 §6.1 says. A list that comes back under a resting pointer lights that row at once.
- **A wrapped option's continuation started 8 pixels left of its text.** It was indented with spaces, and a space is 4 units in this face where "-" is 6. Every row of an option is now drawn from the same x, after the marker.
- **The waiting triangle was cut off at the frame's edge.** Thad's echo by the coach is clamped at the right margin, and the clamp measured the words without the triangle (errata 126) after them. The clamp now measures both.
- **After a conversation closed, the sentence line named what had been hovered before it opened**, until the pointer moved. It now names what is under the pointer.

**Rulings the build makes, for Tyler to keep or strike:**
- **Five rows, not doc 30's four.** Doc 30 calls its four a starting value for a 56-pixel panel. At this scale five fill the panel, and four would make every five-option tree scroll; seventeen nodes have five options.
- **Top-anchored, not doc 30's "bottom-anchored".** Doc 30 bottom-anchored the list so it could grow into the play area by as few rows as possible. It no longer grows into the play area, and MI sets the choices from the top.

**B · What was already right and is unchanged:** the choices replace the panel, in the panel's face at `PANEL_GLYPH_SCALE`. Choosing hides the list. Thad says the line over his head in his colour, the other speaker answers over theirs in theirs, and the list returns after (doc 30 §16, re-proved). Rows are in authored order. Exits are last in every list the content can offer. No row's look depends on its tag or what it does: invariants 1 and 7, HOB_C1 option 4 included.

**C · Prompts revealed correctly — `tests/dialogue-reveal.test.ts`.** It walks every node of every tree. It tries every combination of the values the node's gates test, or a sample of them for a node that reads more than a few flags. It follows every order of choices, with counts capped where more choices change nothing, and comes back to the tree after an option ends it. At every list it checks:
- the list against an oracle read from the data (`when`, `whenAny`, `holds`, `after`, and `remove`/`replace`/`retain`/`counted-repeat`), in authored order;
- the list is never empty and no option shows twice;
- EXIT is last, and an ungated exit is always there;
- no state traps the player: some order of choices always leaves the node (the stage driver's exit waits for his three questions, by design);
- the k-th answer of a repeating option is the authored repeat for k, clamped;
- every option is offered somewhere and every node is reached.

**Result: no option is unrevealable, and none appears when its gates say it should not.** All 302 options, and every node, are offered or reached. Option text against its documents is `tools/extract-content.mjs --check`, which reports 0 stale.

`tools/check-flag-order.mjs` now also reads `whenAny` alternatives and a tree's `entries`. Both are gates, and neither was checked for a writable passing value. Both pass. And `DialogueRunner` now refuses a selection whose `whenAny` fails, as the list already did.

**D · Tooling.**
- `route.mjs`'s `option` scrolls to a row out of the window by clicking the arrows, as a player would.
- Its waits now read past any line that is waiting for a click. A wait for Thad's reply in Winnie's greeting sat on her first line until it timed out. The dialogue proof had failed there on main.
- `GAUNTLET_PORT` moves `proof.mjs`'s server. A second session proving at the same time otherwise ran against the first session's checkout.
- The probe reports `panel`, `optionsShown` and `optionArrow`.
- The dialogue proof now checks that the panel stays away through a conversation, and scrolls to the livery man's exit.

**What holds it:**
- `tests/dialogue-presentation.test.ts` gains six tests: the room keeps its height and every option can be scrolled to, with arrows exactly when needed; the hanging indent; the hover; no row styled by its tag; the triangle in the frame; and the panel staying away. Each fails with its defect put back.
- `tests/dialogue-reveal.test.ts` fails when the runner keeps a `remove` row, ignores `after` or `whenAny`, greys a `counted-repeat`, fails to clamp a repeat, or puts the exit first. It also fails on an `after` naming an option that does not exist. Each case was proved by putting it in.

**Still Tyler's (unchanged here):**
- Whether Thad's echo of a chosen line should advance on its reading hold rather than wait for a click (errata 126, finding 11's second suggestion).
- Whether the stage driver's exit should wait for his three questions (errata 65).

---

# 145 · FRAME REDRAWN WHOLE, AT THAD'S PROPORTIONS — TYLER, 2026-11-07

Tyler, offered Frame by errata 144's method: **"Yes do it."** 138's leaner Frame (cast-unify 62) still had the cast sheet's head, about 1.12× the in-game Thad's by ruler. **Cast-unify 70** (batch-41; `reference/cast-unify-41.txt`) painted him over the in-game Thad four times, with only his face as reference: the same editor -- untidy brown hair, pencil, rolled sleeves, ink-stained apron -- with his notebook in every pose (rest, talking, writing a quote, leaning in). By ruler at one man's height his head is now Thad's: crown to chin ~40, against Thad's 40, the live 62's ~45 and the original's ~60 (`renders/leaner-cast-frame-heads-ruler.png`). He is cut as before (`tools/art/leaner-cast.py frame`), at the same crown-to-sole height. Before and after beside Thad in the Clarion: `renders/leaner-cast-frame-before-after.png`. **Seventy of seventy-five cast-unify operations spent.**

---

# 146 · ALL 26 ITEM ICONS, REDRAWN AT SLOT SIZE — TYLER, 2026-11-07

Tyler: "Read reference/item-icons/brief.md … and do it: redraw all 26 item icons at 60×40, cut, test and merge as the brief says." The brief is errata 142's.

- **One operation of the two** (`item-icons` attempt 1, `reference/item-icons/op-01.spec.json`). Its two images:
  - `icons-before.png`, for what each icon is;
  - `style-reference.png`, Thad, Deke and the cast at game size (cropped from `renders/townspeople-vs-cast@3x.png`), for the style.
- **Each item is described from its own doc 23 LOOK lines.** The thirteen papers are thirteen different objects:
  - a sealed envelope; a folded printed map; a hand-drawn deed with its stake; a dark-spined ledger;
  - a sheet with a signature running off the edge; a bordered form; a sealed and ribboned certificate; an X with a pressed stamp; a black-bordered certificate;
  - a purple-inked survey; a gilt card standing up; a small numbered form; a folded newspaper.
- **It came back right.** All 26 are in order and each reads as its object, so the correction was not spent. The seven errata 140 found poor now read:
  - a jar of eggs in yellow brine;
  - copper coin with one bone button;
  - Sheng's coins in a paper twist;
  - a folded striped blanket;
  - a white lace handkerchief;
  - a pickaxe with its shim;
  - grey rock veined with gold.
- **Cut by `tools/art/item-icons-cut.py`.** The brief asked for each object scaled to fit 60×40, nearest-neighbour. Instead, all 26 share one factor (4.395 sheet pixels to an art pixel, the one that fits the largest object in 58×38), so they stay one scale family. The reduction is `one-level.py`'s premultiplied BOX, then a crisp alpha.
  - The magenta is taken out at the outline and wherever a pixel sits at the key's own hue (about 300°). The survey's violet ink (about 265°) keeps its colour.
  - A neighbour's edge reaching over the grid line (the jar's lid into the survey's cell) is left out.
  - It writes `art/ui/item-icons.png` (4 across, 240×280) and `content/ui/item-icons.json`, with `"cell": [60, 40]`.
- **Every icon now draws at exactly ×2** into the 180×80 slot, where the old cells came to ×3.81.
- **Found by review on #211, fixed before merging:** the first cut premultiplied colour, resized it as RGBA, and divided by alpha again. Pillow already premultiplies an RGBA resize, so part-covered edge pixels came out up to twice as bright and the outlines went pale. The cut now hands Pillow straight colour, and it fails if any art pixel is brighter than everything drawn under it; the old reduction trips that on all 26 icons. A doc 55 §8 row carries the lesson.
- **The old generator refuses.** `tools/pixelart/item_icons.py` is on `npm run renders`' list and would have written the 30×21 sheet and its JSON straight back. Both paths are now in `tools/pixelart/superseded.py`, and the module stops and names them, as the other superseded composers do (CLAUDE.md, Renders).
- **The lesson is a test.** `tests/item-icons-scale.test.ts` holds three things:
  - every cell fits its slot at a whole-number scale;
  - the declared cell is 60×40;
  - no icon pixel sits at the magenta key's hue.

  On the old sheet it fails.
- **Shown:**
  - `reference/item-icons/icons-after.png` has all 26 at game size beside their names, as `icons-before.png` did.
  - `renders/inventory-icons-r7-f5-held.png` is the panel in the game on fixture `r7-f5-held`.
- **Not changed:** `tools/gauntlet/snap.mjs` hangs here when it closes the browser, after the page has loaded and the probe has answered. The in-game frame was taken through the game's own `snapshot()`, as the proofs take theirs.
- **Waiting on Tyler:** the icons are cut into the game, and he judges them in the playthrough (errata 72). FOUR DOLLARS (three coins) and THE FILING FEE (two coins) are the closest pair. Both are silver coin, as doc 23 makes them, and they differ in count and arrangement.

---

# 147 · THAD'S ECHO MOVES ON BY ITSELF; USED OPTIONS STAY GREY; THE DRIVER'S EXIT IS CONFIRMED — OWNER RULINGS (Tyler, 2026-11-06, on errata 143's list)

**A · The echo moves on by itself.** Asked: "Should Thad's echo of your choice move on by itself, while the other character's reply still waits for your click?" Tyler chose **"Echo moves on by itself (Recommended)"**.
- Thad's echo of the chosen option now comes down on its reading hold (doc 30 §4.1). It never waits for a click and shows no waiting triangle.
- Every other conversation line still waits for its click: the greeting and every reply. This narrows the 2026-11-01 click-to-read ruling (ui.json `conversationWaitsForClick`, unchanged) by exactly one line, and closes errata 126's open question.
- A click during the echo still reads it on, as doc 30 §4.2 says.
- **Built:**
  - `SpeechPolicy.waitsForClick` takes `echo`;
  - `DialoguePerformance` gains `echoing` and `waiting`, and its clock passes the echo;
  - `GameScene` gives the echo no waiting mark;
  - the gauntlet's waits (`route.mjs`, `run.mjs`) click only a line the probe reports `waiting`. A click aimed at the echo would otherwise land on the reply that replaced it, and skip it unread.
- **What holds it** (`tests/speech-pacing.test.ts`):
  - the policy itself;
  - an exchange from every tree, performed on a clock: the echo comes down with no click, and every reply holds until clicked.
  - `tests/follow-ups.test.ts`'s click-to-read test now asserts the same.
  - Making the echo wait, or letting a reply come down by itself, fails them (both proved).

**B · Used options stay grey.** Tyler chose **"Keep grey-and-stay (Recommended)"**. Errata 57 and 37 are unchanged. A used option greys and stays unless its `afterUse` says otherwise. This includes the 112 options in trees whose documents predate errata 57 and author no aftermath.

**C · The stage driver's exit arrives after his three questions.** Tyler chose **"Keep it (Recommended)"**. Errata 65 is confirmed and no longer open. Doc 30 §16's "four choices" is the tree's full set.

**D · Errata 143's other choices stand.** Tyler did not overrule them:
- five rows in the list;
- the list set from the top of the panel;
- a used row under the pointer staying dim with a bright marker;
- no keyboard scrolling (the arrows and the wheel only).

Doc 30's affected lines carry a bracketed note pointing here: §1, §6.1, §6.2, §16, and Tables 1 and 8.

---

# 148 · THE ACTED DIRECTIONS' POSES: ALL NINE DRAWN — TYLER, 2026-11-07 (reference/acted-directions/brief.md)

*Tyler, told that some directions were still printed because acting them needed new poses (errata 141): "then let's do it? Lol". The brief drew them; all nine of doc 95's B rows are now A.*

**A · The operations.** Eight in all.
- Five, one sheet a character: cast-unify 71 to 75 (`reference/cast-unify-42.txt` to `-46.txt`). That spent the cap of 75: the brief counted 9 left, but 70 had been spent (errata 145), so only 5 were.
- Told that Deke's look was still undrawn with the cap spent, Tyler (2026-11-07): **"Go ahead and use more operations to finish."** The cap went 75 → 80 (`art/staging/caps.json`, under that instruction). Three were spent, 76 to 78 (`reference/cast-unify-47.txt` to `-49.txt`): Deke's look again, Thad fitting the head on, and Sump's blotter, which had read as his stamp. Two are left.

**B · How they were drawn.** Not from the board the brief names. Errata 144 found the generator copies the proportions of any full figure it is shown, and every board carries the master crop, whose heads are larger than the shipping sheets'. So each sheet's first image was a TEMPLATE: the character's own shipping rest frame repeated, the first copy left as it is, the others repainted into the new poses (errata 144's method). The second image was his current sheet, for identity. The new frames are therefore the size and build of the frames beside them, and the template's first figure is the ruler they are cut by.

**C · What was cut** (`tools/art/acted-poses.py`). Each row is cut at the height that makes its first figure as tall as the shipping rest frame. Each new pose is registered to that figure (on the waist line and the torso behind a counter, errata 111 G and H; on the soles and the legs standing), snapped to one level (errata 112), and APPENDED: every existing frame keeps its index and its pixels.
- **Winnie at the Registrar's** (71): 5 the stamp raised over a paper on the closed book, 6 the stamp down, 7 signing it. Rows 60 (`stamping`, U-STAMP on her frame 6) and 10 (`She signs beside it.`).
- **Sump** (78 and 72): 5 and 6 the rocker blotter at either end of its rock (78), 7 Claim One's filing in its glazed frame, held up at the window (72). Rows 62 (`He blots it.`) and 58 (the filing under glass, held through the next line).
- **Pratt on his claim** (73): 5 his hat off at his chest, the rake leaning on him, 6 the hat going back on. Row 49.
- **Pratt at Prosperity** (73): 5 head bowed over his boots, the mallet resting. Row 40.
- **Deke** (76): 5 his head bent to the watch Thad holds out, his hands still at his belt. Row 12 (`He looks at the watch.`). Operation 74 drew the watch in his own hand and another man's face, and is not used.
- **Thad, from the back** (75 and 77): a clip, `pick-fit` (`art/actors/thad-pick-fit-back/`): 0 his stand-back frame itself, 1 crouched, feeling the ground for the head with the bare handle in his other hand (75), 2 fitting the head onto the upright handle, 3 the pick whole (77). Rows 4 (`1 1 2 3 0`) and 6 (`2 3 0`). 75's own fitting pose had lost the handle, and its mended pick held across him is replaced by 77's upright one, which follows the fit.

**D · Thad acts in a clip.** Only an ambient figure could act a direction. Doc 95 now names the protagonist with his clip, `thad:pick-fit`, and the frames are that clip's.
- the loader puts his rows on `content.actor.performs`, and refuses a clip he does not have, a frame it does not have, or a clip drawn in more than one facing;
- `performersWith` adds him to whoever stands in the room, wherever he speaks;
- the scene holds the beat's frame on him (`Actor.hold`), in the clip's facing, and lets him go after.
- `tests/acted-directions.test.ts` holds his rows as it holds everyone's: the clip exists and has every frame, he performs the words in that clip and facing, nothing is printed, every beat holds a frame of the clip, the row lasts its seconds, and the clip's frame 0 is his stand frame byte for byte, so it cannot pop.

**E · Measured before anyone looks** (`tools/art/acted-poses-measure.py`, `renders/acted-poses-beside-thad.png`). These flag; they do not decide.
- **Texture** against Thad at each figure's depth (the flag is 1.35×): Winnie 1.15–1.24 (her rest frame 1.10); Pratt 0.98–1.06 (rest 1.10); Pratt at Prosperity 0.81 (rest 0.93); Deke 0.94 (rest 1.00); **Sump 1.37–1.67, flagged**. His shipping rest frame is already 1.36; the blotter frames (78) are 1.37 and 1.40, and his frame 7 is 1.67 because the filing under its glass has written lines on it.
- **Heads, by ruler** (errata 139): each new frame's head is its own rest frame's, crown to chin within an art pixel or two, as the template method intends. These characters keep the head sizes Tyler accepted for them on 2026-11-07.
- **Left for the playthrough:** the paper in Winnie's poses and the pick in Thad's appear only while acted; Pratt's rake changes hands while his hat is off.

---

# 149 · THE STAMP AND THE STREET ERUPTING, PICKED BY EAR — TYLER, 2026-11-06

*Tyler, of the two: "Erupts in applause, or what? I couldn't even tell what I was listening to." and "The stamp doesn't sound like a stamp."*

**A · Why they failed.** The eruption (errata 131 E) was the Nugget's crowd murmur, layered and swelled, so nothing in it cheered. The stamp (errata 106) was three resonant modes, so it rang like a small wood block. Both passed every level check.

**B · What he chose.** Three new versions of each were played to him, alone and in the scene, with the old one beside them for comparison. He chose **"B and B"**:
- The stamp is "Ink pad, then stamp": a soft dab on the pad, then a dull thump of rubber on paper on a wooden counter, then the lift. It has no pitched ring.
- The eruption is "Cheering": applause, two-finger whistles, whoops and shouts, and boots on the boardwalk.

`tools/audio/render-picked-sfx.py` renders all six candidates in the order they were auditioned, from one seed, and writes only the two picked. The committed files are byte-identical to what he heard.
- Gains are set as he heard them: U-STAMP 0.429 and F4-ERUPTS 0.155.
- U-STAMP's place is -10. The 400 ms window reads a short dab-and-thump quieter than the old ringing stamp at the same peak.

**C · What holds it.**
- `tests/sfx-one-renderer.test.mjs`: no two audio scripts write the same file. The old renderers no longer write `stamp.wav` or `crowd-erupts.wav`, so re-running them cannot put back the rejected sounds.
- Doc 55 §8 gains the rule: a sound has to say what it is, heard on its own.

---

# 150 · THE FUNERAL STAYS GATHERED, AND THERE ARE NO CREDITS — OWNER RULINGS (Tyler, 2026-11-07)

*Asked about the two staging extras left open (doc 36 Q173 and Q176), Tyler chose:*

**A · The funeral's procession: "Leave it gathered."** Doc 48 S2 beat 1 (the town walking in behind the coffin, Thad at the back) is not built. The service is already gathered when Thad arrives, as it is now. No image operation is spent on it.

**B · The credits: "Keep as is (Recommended)."** Doc 48 S7 beat 5 is not built. The close ends as errata 128 built it: the title, with THE END under it. CREDITS on the menu stays dim and inert. Their words are his, and none are written here.

Both are recorded in doc 36 Q173 and Q176. Nothing in the game changes.

---

# 151 · THE WHOLE GAME, PLAYED IN A REAL BROWSER — `npm run gauntlet:full` (Tyler, 2026-11-06: "Whole game in a real browser")

*Tyler chose "Whole game in a real browser (Recommended)": "The 145-step run, played through the actual game on screen, not just its logic. Catches anything that only breaks on screen."*

**A · What it is.** `tools/gauntlet/full-game.mjs`. It boots the dev build in Chromium, clicks NEW GAME on the title, and plays `tests/data/full-game-walkthrough.json` -- the 145 steps `tests/full-game.test.ts` plays headless through GameState -- through the real game by real input:
- `go`: the exits and the map, clicked; the way is chosen over the exits and map places open now, as the headless player chooses it;
- `talk`: TALK TO, then the person; `choose`: the option's row, scrolled to; `leave`: the open node's EXIT row;
- `verb`: the verb's cell, then the target; `use`: USE, the item's inventory slot, then the target;
- `duel`: the right counter when it is on the list, else the first;
- `tap`: LISTEN TO on the rock at the void; `wait`: the timeline runs out on its own clock.

Lines are read as a player reads them: a line waiting for a click is clicked after doc 30's minimum hold, and every other line plays out. Nothing is written into the game. Each step's `expect` is checked against the live probe; a break is recorded with a frame and the whole probe, and the run goes on. Frames are kept at every act turn, every break, and THE END. It also records any request that fails, any console error, any asset the room declares that did not load, any figure drawn as a fallback or graybox, the panel drawn inside the coffin, a black play area, and any target no point of which the sentence line names.

**B · What the probe gained** (`engine/dev/Probe.ts`, dev-only; ids only, never words): `verb` (the selected verb), `present` (who is in the room), `targets`, `duel`, `theEnd`, `hovered` (what the sentence line names), `card` (an act card is up) and `fading` (a room fade).

**C · What it found.**
1. **The fork went to the fiddler (A8, the Nugget).** The fiddler stands in front of the piano. With THE TUNING FORK held over the piano the sentence line read "Use THE TUNING FORK on THE PIANO", and the click used it on the fiddler: a held item went to whoever's box the click was in. The click and the pointer now share one rule (`AmbientLayer.personAt`, moved from GameScene), and a held item goes to a person only when that rule names them or the item has a written pair with them in that room (`AmbientLayer.itemTakerAt`): A9's fee on Sump and C5's log on Winnie still go to them. Held by `tests/full-game-browser.test.ts` (proved by putting the old rule back).
2. **A route aimed at a person's file, not their place in the room.** `tools/gauntlet/route.mjs` `targetRect` ignored `placements`, so Hob in the watchman's shack was aimed at his alley spot. It now takes the room's placement, as the runtime does. Held by the same test file.
3. **The rest were the harness learning to play, and are written into it**, because each is something a player does without thinking: point until the sentence line names the thing (the registrar's counter's centre is SUMP'S PEN); walk a wide room on ground the line names nothing on (a click on THE BOARDWALK looks at it); wait out a cutscene beat, an act card and a room fade, under which a click is spent on nothing; and click again after the listening chamber's seated rise, which spends the first click by design (doc 48 S5).

**D · The first clean run.** From NEW GAME to THE END on the title, all 145 steps at the game's own pace, no bypass: 0 breaks and nothing that looked wrong (no failed request, console error, unloaded asset, fallback figure, panel in the coffin or black frame), in 3,851 s -- 64 minutes. The coffin is the longest step (about four minutes), then the arrivals that walk Main Street's length.

**E · Not in CI.** It plays the coffin's minutes and the listening chamber's ninety seconds in real time, far over the gauntlet job's fifteen-minute limit. It is the manual run before a playthrough (doc 55 §8).

# 152 · LINES MOVE ON BY THEMSELVES, THE MONKEY ISLAND WAY; NO ARROW — TYLER, 2026-11-07

*Playing the opening on the live site, of the small triangle under "You've all got four.": "Why does the dialogue have that weird down arrow next to it?"*

The triangle was errata 126's continue mark. It is drawn under any line that waits for a click, and conversation lines waited under Tyler's click-to-read ruling of 2026-11-01 (`ui.json` `conversationWaitsForClick`). He was offered three choices: Monkey Island's way, where a line comes down after its reading time and a click skips ahead; waiting with no mark; or as it was. He chose **"Monkey Island way, no arrow (Recommended)"**.

- `conversationWaitsForClick` is now **false**. Every line, in conversation or not, comes down on doc 30 §4.1's reading hold, and a click skips ahead (`DialoguePerformance.skip`).
- Nothing waits, so no mark is drawn. The mark's code stays for a line that ever waits again.
- Text speed in OPTIONS scales the hold.
- Errata 147's echo rule is now the rule for every line. This reverses the 2026-11-01 ruling.

**What holds it:** `tests/speech-pacing.test.ts` and `tests/follow-ups.test.ts` now require the shipped game to read conversations on the hold. Every tree's first exchange must come down by the clock alone, and a click must move it one line on. Both fail with the flag back on. The two assertions they replace are recorded in `proofs/check-friction.json`.
