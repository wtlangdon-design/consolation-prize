# THE LAST CLAIM IN CONSOLATION
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

**A contaminated sample is indistinguishable from a real result.** It fails and passes with equal confidence, and both directions are dangerous — Room 5 lost time chasing failures that were not real, Room 1 nearly lost the lamp's status as the uniquely brightest object in the only night exterior in the game.

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
> LOOK 1 "Gone. It made very good time on the way out." · 2 "Not another one for four days. I have checked twice and the answer did not improve." · 3 "The ruts are still filling in. That is the whole of my connection to the rest of the world, filling in."
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
