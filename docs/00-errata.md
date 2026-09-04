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
> LOOK 1 "A stage coach, halted, with my case coming down off the back. It has come four hundred miles and it looks it." · 2 "The near wheel has been repaired twice with two different woods." · 3 "There is a great deal of dust on it and none of it is from here."
> LISTEN 1 "The team, shifting. The near axle is dry — it has been dry a long time." · 2 "Still dry. It will be heard from." · 3 "Somebody up top is rearranging the load and swearing about it."

**THE COACH — state B, departed** *(hotspot becomes THE ROAD WEST OUT)*
> LOOK 1 "Gone. It made very good time on the way out." · 2 "The next coach out of Consolation is in four days. I have checked twice and the answer did not improve." · 3 "The ruts are still filling in. That is the whole of my connection to the rest of the world, filling in."
> LISTEN 1 "The near axle, going away. It will fail on somebody else's stretch." · 2 "Faint now." · 3 "Nothing. It is a long way off."

**THE TEAM — state A only** *(new hotspot; see the wheel-pair art)*
> LOOK 1 "Two horses I can see and I am told there are four more. They have their heads down and they have earned it." · 2 "Nobody has unhitched them. We are not stopping long." · 3 "The near one has looked at me twice, which is twice more than the driver."
> LISTEN 1 "Breathing, and harness. It is the most contented sound on this road." · 2 "Shifting. One of them is bored." · 3 "Nothing. They have gone to sleep standing up, which I did not know was available."

**THE WATCHMAN'S LAMP — does not exist before beat 8.** Not a hotspot until Hob enters frame.
> **Crossing:** LOOK 1 "A lamp, crossing the road. There is a man behind it and he has not looked at me." · 2 "Still crossing. He is in no hurry and he is not lost." · 3 "The only lit thing on this road, and it is going the other way."
> LISTEN 1 "Footsteps. Even ones. He is counting them." · 2 "Still even." · 3 "He has not broken stride once. Not once, in the whole length of the road."
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
for Tyler's wording.

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
