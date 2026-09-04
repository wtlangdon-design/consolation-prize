# ROOM 5 — TIME-OF-DAY STATE AUDIT (report only)

Audited at `ad9c2df`, clean tree. Nothing generated, spent, altered, rerun,
promoted or set. Read-only.

## The finding that reframes the question

**The shipping Main Street plate is a night scene, and Room 5 is entered from it.**

| Asset | Hash | Size | What it shows |
|---|---|---|---|
| `art/backgrounds/room-02-main-street.png` (Room 2, shipping) | `5e7a8f59d51b` | 3700×864 | starry blue sky, every window lamplit, lanterns on the posts, blue puddle reflections |
| `reference/room-02/west-act3-master.png` (Room 2, Act III state) | `1fee153e32ff` | 1920×864 | the same street, the same night, one notice added |
| `art/backgrounds/room-03-nugget.png` (Room 3, the approved comparable interior; baseline slot D) | `fb406da01393` | 1920×864 | chandelier and wall lamps lit; **night sky with stars through the batwing doors and both windows** |
| `art/staging/room-05/plate-02/candidate-1920x864.png` (Room 5 candidate) | `c0afe61efcf6` | 1920×864 | bright daylight through the glazed door and the ajar window; a warm sun-wash across the floorboards from the left |
| `art/backgrounds/room-36-main-street-dawn.png` (Room 36) | `61c17dcd53a6` | 320×144 | legacy indexed placeholder; Room 36 is not in `content/manifest.json` |

`renders/proofs/main-street/contact-sheet.webp` shows the live game on that
night street, and `tools/gauntlet/routes/assay-office.json` walks Room 5's own
four-panel proof from that night street through `to_assay_office` into the
daylight candidate. The built game, today, goes night → day through one door.

The built night is not an accident of generation. `content/rooms/main-street.json`
declares three `lamps` (the saloon doorway "the brightest thing on the street",
the map seller's lantern, the Company's windows), and its `onEnter.note` reads
"AMENDED AFTER TYLER CHECKED IT AGAINST THE PLATE … the hotel beside it is
genuinely two storeys with lit windows … The plate is signed off, so the
writing yields." Room 3's retired composer says the same in its comments
(`tools/pixelart/room03_nugget.py`: "Behind an open door is outside, at night"),
and Room 18's ("a lobby at night … the street door, shut on night",
`tools/pixelart/rooms_batch_a.py`, errata 40 block).

The pilot chose daylight from `docs/13-room-02-content.md::PART TWO` (THE MUD ·
PICK UP, "in daylight") and errata 43 ("both exteriors, both day"). Both are
real canon. Both are contradicted by the plate Tyler signed off and by the
lines below. The pilot cited the half of a split canon that the shipping art
does not follow. That is the defect this audit exists to surface.

## 1 · When can the player enter Room 5?

Every act, ungated, from Main Street. There is no door state, no hours gate and no flag on the exit anywhere.

| Act / state | Source | Notes |
|---|---|---|
| Act I, from first arrival on Main Street | `docs/20-room-map.md::Direct, from Main Street (Room 2)` (The assay office → 5); `docs/14-room-02-exits.md::THE ASSAY OFFICE → Room 5` (no gate; PUSH "It opens inward, and it opens easily"); `docs/04-dialogue-trees.md::ACT I — Root: \`WIN_A1\``, `…::ACT I — \`WIN_A2\`: the book` | Built: `content/rooms/main-street.json` exit `to_assay_office`, unconditional |
| Act II — C1, C5, C6 | `docs/02-puzzle-graph.md::TRIAL TWO — Assay of Record (Document B)`; `docs/04-dialogue-trees.md::ACT II — Root: \`WIN_B1\`…`, `WIN_B2`, `WIN_B3` | |
| Act III — E4 | `docs/02-puzzle-graph.md::ACT III` row E4; `docs/04-dialogue-trees.md::ACT III — \`WIN_C1\`: the death certificate (E4)` | |
| Acts II–IV bench variant | `docs/05-examine-layer.md::ROOM 5 — ASSAY OFFICE, FRONT#2` (THE QUEUE BENCH, act 2–4) | the room's only authored state variation |
| Act IV — WIN_F1, before F5 | `docs/04-dialogue-trees.md::ACT IV — grown to nodes *(W1)*` (after `T_STRIKE_FOUND`); `docs/02-puzzle-graph.md::ACT IV` row F5 ("Requires … Winnie's signature") | |
| After F5 | `docs/48-act-turn-beats.md::S7 · MAIN STREET, DAWN (the close)`: "The one exit is the coach stop, east"; `docs/20-room-map.md::Act III and IV`: Room 36 "replaces Room 2 · after F5" | **Not reachable** — Room 36 writes no assay-office exit (`docs/05-examine-layer.md::ROOM 36 — MAIN STREET, DAWN`, `docs/08-examine-batch-1.md::ROOM 36 — MAIN STREET, DAWN`, `docs/49-wrong-answers.md::ROOM 36 — MAIN STREET, DAWN`). Tension with `docs/20-room-map.md::RULES` rule 4 ("No location is ever removed, including after Act IV"), which reads as a map rule; doc 48 is the later document |
| Free revisit | `docs/06-technical-spec.md::Ambient object rules` rule 2 ("Every ambient NPC is TALK TO-able in every act"); no gate exists on the exit in any document or in the built room | Yes, at any time in Acts I–IV |

## 2 · What exterior state exists at each of those times?

**Canon text is split on Main Street's own time, and nothing reconciles it.**

Day: `docs/13-room-02-content.md::PART TWO` ("in a street, in daylight");
`docs/16-room-03-content.md::THE FRONT DOORS → Room 2` ("Daylight past them");
`docs/26-batch-a.md` hotel STREET DOOR LOOK 3 ("Daylight, past it");
`docs/12-art-prompts.md` row 35 (Room 36 "cool pale dawn light instead of warm
low sun" — implying Main Street's day is warm low sun); `docs/00-errata.md::43 ·
CONSOLATION GETS THREE STREET SCREENS, NOT ONE` ("both exteriors, both day …
same time of day"); `docs/00-errata.md` lines 302 and 953 (Room 1 is "the only
night exterior in the game").

Night: `docs/17-opening-sequence.md` beat 11 ("he is still walking when Main
Street arrives" — no time passes between Room 1 and Room 2); Room 1's THE ROAD
WEST → Room 2 (`docs/17-opening-sequence.md`): LOOK 1 "Consolation. There are
lamps on in about a third of it.", LISTEN 1 "A town, at night, half of it
asleep. A piano, flat, some distance off."; `docs/00-errata.md::58 · MAIN
STREET IS INTO DEPTH` ("toward the town lights"); `docs/35-room-gate.md::2a ·
ROOM 2'S GATE, AS RUN` — the closed-door ruling is premised on Room 2 being
"the town performing prosperity at itself, at night, to nobody" (attributed to
doc 05; **doc 05 does not contain the phrase** — the first half is doc 28's
theme note — so the ruling rests on a misquotation, but it is the ruling the
plate was made under); and the signed-off plate itself.

Per act, therefore:

| Visit | Exterior state | Basis |
|---|---|---|
| Act I | **Night in the built game**; day in half the canon text | above |
| Act II | **Unspecified.** Main Street has no time variant for Act II (`docs/05-examine-layer.md::ROOM 2 — MAIN STREET#2` changes only what he says); Room 22 carries a 6 a.m. hotspot and a 7 p.m. hotspot on one screen (`docs/10-examine-batch-3.md::ROOM 22 — THE ROAD TO THE CLAIMS`; errata crowd table calls them "the morning screen" and "the evening screen") | |
| Act III | Funeral in daylight (`docs/48-act-turn-beats.md::S2 · THE FUNERAL` beat 3, "planted in daylight"); the confession at night, "Outside, dawn is starting" at its end (`…::S4 · THE CONFESSION`, beats 1 and 3; "dawn grade variant of the exterior (art)") | E4's own hour unspecified |
| Act IV | Opens at a dawn (S4 beat 3); F1–F4 and WIN_F1 unspecified; F5 → Room 36 dawn | |

## 3 · Is there a persistent time-of-day state?

**No.** `content/flags/flags.json` declares ACT and topic flags only; no time
flag, no room-substitution mechanism (Room 36 is absent from the manifest, and
`docs/34-architecture-audit.md` "Canonical room identity at dawn" records the
alias/variant semantics as undecided). Time is represented by particular rooms
and scenes: Room 1's plate (night), Room 36's plate (dawn), Room 22's paired
hotspots, and doc 48's scripted beats. `docs/06-technical-spec.md::Ambient
object rules` rule 3 ("The town has a clock … Ambient NPCs occupy different
positions in day and night states") asserts day and night states of the town
exist; `docs/07-ambient-layer.md::PART FOUR — ACCOUNTING` budgets "~60"
day-night lines for it and writes none. Unbuilt, unwritten, but canon.

## 4 · Can Thad stand on Main Street at night and then enter Room 5?

**YES in the built game** (`art/backgrounds/room-02-main-street.png`, hash
above; `content/rooms/main-street.json` exit `to_assay_office`, ungated;
`renders/proofs/assay-office/proof.json` route). **UNSPECIFIED in canon text**,
which asserts both day (doc 13, errata 43) and night (doc 17, Room 1's lines,
doc 35's ruling) for the same street with nothing that overrides.

## 5 · Does any office-hours rule prevent entry after dark?

**No.** THIS WINDOW CLOSES AT FOUR (`docs/05-examine-layer.md::ROOM 5 — ASSAY
OFFICE, FRONT#1`) is a sign about the service window. `WIN_A1`'s opening
("The window's closed." / "The window is *ajar*. The window is closed.")
has Winnie serving him regardless. Four o'clock appears elsewhere as colour
only (`docs/26-batch-a.md` hotel STREET DOOR LISTEN 3 "gone quiet out there,
which happens about four"; `docs/14-room-02-exits.md` the Clarion's "in print
by four o'clock"). The street door's overrides open freely; the records room
has a cot ("There is a cot in there", `docs/25-rooms-05-07.md::Exits`), so she
is on the premises at any hour. No document closes the building.

## 6 · Does Room 5 have authored day/night/dawn variation?

**No.** Its only state variation is the act-gated bench. THE STOVE's LISTEN 3
("It has been let go out") is a repeat variant, not a time state. Doc 25's
Room 5, doc 12's Room 5 prompt and doc 49's Room 5 carry no time-of-day word.
`docs/35-room-gate.md::5 · LIGHT` asks "What time of day, and does any other
version of this room exist at another hour?" — never answered for Room 5;
`proofs/room-05/gate-matrix.md` has no time-of-day row.

## 7 · Is the daylight candidate sufficient for every canonical visit?

**No, and not for the first one.** As built, Thad enters it from a night
street, and the approved comparable interior the candidate was anchored to
(the Nugget, baseline slot D) shows night outside its doors. If Tyler rules
the town is night, the candidate is wrong for Act I. If he rules the town is
day, Acts III–IV still pass through a scripted night and dawn (S4) before
Room 5's Act IV visit, at an unspecified hour, and the canon's day/night NPC
clock (doc 06 rule 3) remains unresolved.

## Visual-state rule — what would have to become stateful

Read off `plate-02/candidate-1920x864.png`:

- **Exterior through the glazing** — the glazed upper door panel (frame left) and the ajar sash window both show a daylit street (buildings, blue sky, fence). Plate content; any second state repaints both openings.
- **Direct sunlight / floor beam** — a warm wash crosses the floorboards from the door and window, brightest bottom-left, falling off toward the counter. **This is baked into the floor**, not a window colour. A night state cannot be reached by turning the glass blue; the whole floor and the lower wainscot re-grade.
- **Ambient illumination** — the room is keyed from the left by daylight; the right wall and records door sit in soft shade. A night state inverts the key: the only warm sources authored are the stove ("A small stove, lit") and, by implication, nothing else — Room 5 has **no authored lamp** (no hotspot, no line in doc 05, 25 or 49). Adding one is invention and needs a ruling.
- **Cast shadows** — soft, daylight-direction shadows behind the stove, under the counter lip and the bench. They change direction and hardness under a lamp.
- **Winnie / Thad local lighting** — Winnie's sheet was relit against the daylight plate (`match-local.py` at 1010,624 → `winnie-sheet-lit.png`). A night plate re-lights her. Thad's clips are global and read against whatever the room is.
- **Light sources** — the stove's fire is not visible in the daylight plate. At night it would be the room's brightest object and would need a dark collar (errata 33a). The candle/lamp question above.

**Consequence:** because the sun is baked into the floor and the key light is
directional, a second exterior state is a **separate plate/state treatment**,
not an overlay on the daylight base. The daylight plate could only remain the
base if the ruling is "day, always" for every visit.

## CONCLUSION

**C. `ROOM 5 TIME-OF-DAY CONTINUITY UNSPECIFIED — OWNER RULING REQUIRED`**

The documents do not determine Main Street's own time of day: doc 13, doc 16,
doc 26, doc 12 and errata 43 say day; doc 17, Room 1's lines about the town,
errata 58 and doc 35's ruling say night; and the plate Tyler signed off is
night. Until that is ruled, whether Room 5 is visited during another time
state cannot be answered from canon, and the candidate's daylight rests on the
half of the canon the shipping art does not follow.

The ruling needed, in one line: **is Consolation's Act I Main Street day or
night?** Then: does time pass within acts, and at what hour is Room 5's Act IV
visit? If night: the current candidate is not Room 5's Act I state and a
night treatment is a separate plate (baked sun). If day: the shipping Main
Street plate and the Nugget's doors are the things out of continuity, not
Room 5, and errata 43's "same time of day" becomes enforceable.

Not done here: no art, no API call, no geometry, no proof rerun, no promotion,
no `visual_accepted`, no Room 6, no change to Q22/Q23 or to the readiness gate.
