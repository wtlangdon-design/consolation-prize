# ROOM 5 · GATE MATRIX AND OBJECT CLASSIFICATION

*Derived from CURRENT canon before any art or geometry was made. Every row cites its source. No rule below was invented to fill a gap; gaps are named as gaps.*

## Part one — what is in the room, and what class it is (ruling 12)

`tools/room-gate.mjs 5` is the minimum and its parse is crude (it reads only doc 05's first section, so it misses doc 25's four subjects, and it reads "window sign" as an opening). This table is the audit.

| Subject | Source | Can it change / be operated? | Class | Why |
|---|---|---|---|---|
| THE WINDOW SIGN | `docs/05-examine-layer.md::ROOM 5 — ASSAY OFFICE, FRONT#1` | No. A handwritten card, "the same thing for six years" | **PLATE** | Invariant |
| THE SCALES | doc 05 #1; `docs/25-rooms-05-07.md::ROOM 5 · ASSAY OFFICE, FRONT` (USE, PICK UP refused) | Not by Thad. Winnie runs an assay on them in Act IV (`docs/04-dialogue-trees.md::ACT IV — grown to nodes *(W1)*`), a scripted scene in doc 48 S6 | **PLATE** | Under a glass dome, never moved. Her Act IV use is a scripted performance outside this pilot; her ambient work performance deliberately does not touch them (see part three) |
| THE QUEUE BOOK | doc 05 #1; doc 25 (PICK UP refused); `docs/04-dialogue-trees.md::ACT I — \`WIN_A2\`: the book *(W1 growth)*` ("chained to the sill") | Thad enters the queue by printing his name (A2). No visible change is written | **PLATE** | Nothing canonical changes its appearance |
| THE FLOORBOARD | doc 05 #1 ("critical, unmarked"); doc 25 (PULL "gives, and stops", OPEN refused) | Winnie produces the second ledger from under it in Act II (`WIN_B3`), a dialogue scene. No durable visual state is written | **PLATE** | Must stay visually ordinary. Never a hotspot highlight, never ambient business |
| THE SAMPLE SHELVES | doc 25 (written in full); doc 05 names it | No. PICK UP refused | **PLATE** | Invariant |
| HER PEN | doc 25 (written in full); doc 05 names it | **Operated by Winnie.** Canon has her writing constantly (`WIN_B1` opt 3: "She stops writing. It is the first time she has stopped writing."; opt 5 fifth: "She puts down the pen … picks the pen back up") | **PART OF THE WINNIE MOVER** | Ruling 12: an object Winnie operates is not baked into the plate. It lives in her canonical design — in the stand in her rest frames, in her hand in her writing frames — so both states derive from ONE generation and the player sees the same pen. Its hotspot rect sits on the stand |
| THE CERTIFICATE ON THE WALL | doc 25 (written in full) | No. "screwed to the wall" | **PLATE** | Invariant |
| THE STOVE | doc 25 (written in full) | LISTEN variant 3 says "It has been let go out" — a repeat-selection line, not an authored state change | **PLATE** | No canon says the fire visibly dies. Not animated: ruling 18 names light flicker as not room life. Recorded in part four as a canon note |
| THE QUEUE BENCH | `docs/05-examine-layer.md::ROOM 5 — ASSAY OFFICE, FRONT#2` (LOOK, act 2–4); `docs/49-wrong-answers.md::ROOM 5 — ASSAY OFFICE, FRONT` (USE, PUSH) | The bench itself never moves. Its HOTSPOT exists in acts 2–4 with a LOOK line; no LISTEN is written | **PLATE + act-gated hotspot** | Physical bench invariant; the hotspot is the act variation. See part four for the doc 49 tension |
| THE WINDOW (AJAR) | doc 49 only (OPEN, CLOSE refused) | Stays ajar; refusals say so | **PLATE, no hotspot** | No LOOK/LISTEN exists anywhere, so it cannot be a hotspot without invention. Its two refusals have no home — part four |
| THE BRASS PLAQUE | doc 49 only (PULL refused) | No | **PLATE, no hotspot** | Same as the window |
| THE STREET DOOR → Room 2 | doc 25 exits | Transit. Room 2's convention: doors are plate, transit walks to the door and fades | **PLATE + exit** | Approved-room convention. Door-open animation recorded as deferred debt |
| THE RECORDS ROOM DOOR → Room 6 | doc 25 exits | Transit to `stub_assay_records`. "It is shut and it is not locked" | **PLATE + exit** | As above |
| WINNIE | doc 04; doc 25 overrides ("Not with her at the counter") | A person | **MOVER — never in the plate** | Ambient NPC with authored breaks; masked by the counter plane |
| THAD | — | The player | **MOVER** | — |
| The counter | doc 12 §4 art prompt; doc 25 ("at the counter") | Architecture | **PLATE + occlusion plane 1** | Winnie stands behind it; the mask is cut from the candidate plate |

**Companion plate requirement:** the clean plate contains no person and nothing from the MOVER rows. The pen AND its stand travel with Winnie's frames (rest: pen in the stand; writing: pen in hand, stand empty) -- they come from one generation, so the two states align; a stand painted into the plate could never meet a pen painted into a sprite.

## Part two — the gate matrix (rulings 25–30)

Room 5's puzzles are C1–C6 (`docs/02-puzzle-graph.md::TRIAL TWO — Assay of Record (Document B)`), and the audit is which of them ACTUALLY happen in this screen.

| Element | Blocked when | Available when | Visible / world change | Exact source |
|---|---|---|---|---|
| Street exit `back_to_street` | never | always | transit | doc 25 exits |
| Records exit `to_records` | never (door "not locked") | always | transit to stub | doc 25 exits; `content/rooms/assay-office.json` |
| Walkable floor | never; Winnie's side of the counter is not walkable at all | — | — | geometry, part three |
| Behind the counter | always, for Thad | never | "Not with her at the counter" (FLOORBOARD · OPEN) | doc 25 overrides |
| TALK TO Winnie, Act I root `WIN_A1` | — | ACT 1 | dialogue | doc 04 `ACT I — Root: \`WIN_A1\`` |
| `WIN_A1` opt 3 "I tune pianos" | `T_TUNES_PIANOS` false | `T_TUNES_PIANOS` true | counted-repeat | doc 04 (req `T_TUNES_PIANOS`) |
| `WIN_A1` opt 4 "Ezra Pike" | `T_PIKE_DEAD` false | `T_PIKE_DEAD` true | — | doc 04 (req `T_PIKE_DEAD`) |
| `WIN_A1` opt 1 → `WIN_A2` | — | always in Act I | opens the book node | doc 04 |
| `WIN_A2` opt 1 "Where do I sign?" | — | — | "enters the queue; A2" — **no flag is named in doc 04, and doc 02's A2 is the HOTEL puzzle.** No visible change written | doc 04; doc 02 row A2. **Gap, part four** |
| `WIN_A2` opt 2 rephrase | before C5 | after C5 ("rephrases after C5") | text changes | doc 04; errata 57 `rephrase` |
| Act II root `WIN_B1` | before `T_BORDERS_MOTT` | `T_BORDERS_MOTT` | dialogue | doc 04 |
| `WIN_B1` opt 1 | — | Act II | sets `T_ASSAY_QUEUE` | doc 04 |
| `WIN_B1` opt 3 "Mott gold" | — | Act II | "flags her interest; required for C5" — **flag unnamed** | doc 04. Gap, part four |
| `WIN_B1` opt 5 raccoon | `T_RACCOON_NAMED` false | true | counted-repeat, five deep | doc 04 |
| `WIN_B2` (C5) | before the padded log is shown | after C4 | grants assay; sets `T_NO_MOTT_GOLD`, `T_SECOND_LEDGER` | doc 04; doc 02 C5 |
| `WIN_B3` | `T_SECOND_LEDGER` false | true | scene; one COMIC option only | doc 04 |
| `WIN_C1` (E4) | before E3 | Act III | signs the certificate | doc 04; doc 02 E4 |
| `WIN_F1` (F3) | before `T_STRIKE_FOUND` | true | she runs the assay at the window | doc 04 |
| QUEUE BENCH hotspot | ACT < 2 | ACT 2–4 | hotspot present; LOOK line | doc 05 #2 |
| Any Room 5 hotspot state change | — | — | **none is authored** | part one |

**What this pilot implements from the matrix:** the Act I trees (`WIN_A1`, `WIN_A2`) with their flag-gated options; the act-gated bench; both exits; the behind-the-counter obstruction; every override. Act II–IV nodes are EXTRACTED where their structure satisfies the validators, so the gating exists in data, but they are unreachable from a fresh game until other rooms set their flags — which is the puzzle graph, not a gap.

**Negative-gate tests owed (ruling 29):** `WIN_A1` opt 3 absent without `T_TUNES_PIANOS` and present with it; the bench hotspot absent at ACT 1 and present at ACT 2; Thad cannot reach the counter's far side by clicking there; the records exit transits.

## Part three — Winnie's occupational performance (rulings 17–19)

**She writes.** That is the one occupation canon states outright: "She stops writing. It is the first time she has stopped writing." Everything else Tyler's category list allows (weighing, resetting scales, handling the queue book) would put her hands on objects canon gives the player as hotspots, and two of those — the scales and the floorboard — are load-bearing enough that ambient business near them would telegraph. Writing touches only her own pen and her own ledger, both hers.

Rest state: pen in its stand, hands on the counter, looking at the page. Breaks (ambient `breaks`, chosen from a pool on an irregular timer): pick up the pen and write; look up from the page and back; set the pen down. Interruptible by construction — the ambient frame is a pure function of the clock, and dialogue holds her on the rest frame (an engine addition recorded in the pilot report).

Nothing here adds a fact, a joke, a clue or a puzzle step.

## Part four — canon findings, reported rather than resolved

1. **THE WINDOW (AJAR) and THE BRASS PLAQUE** (doc 49) have no LOOK or LISTEN anywhere, so they cannot be hotspots — `check-examine-lines` requires both. Their three refusals are unhoused. The compiler will be told so explicitly rather than failing silently. **RULED 2026-09-04 (Tyler): not hotspot subjects; the three refusals are struck from doc 49, nothing mapped elsewhere.**
2. **THE QUEUE BENCH**: doc 05 writes its LOOK for acts 2–4 only; doc 49 writes USE and PUSH refusals in Act I voice ("I have been all nine, on different days"). No LISTEN exists. Implemented as an act 2–4 hotspot; in Act I the bench is scenery. The doc 49 lines therefore play only in acts 2–4. **RULED 2026-09-04 (Tyler): the bench stays; its LISTEN and LOOK/LISTEN 2–3 are now authored in docs 05 and 25.**
3. **`WIN_A2` "enters the queue; A2"** names no flag, and doc 02's A2 is the hotel-key puzzle, so the reference is either to a different table or a stale label. No flag is invented; the option is extracted with its line and nothing set.
4. **`WIN_B1` opt 3 "flags her interest; required for C5"** names no flag. Same treatment.
5. **`WIN_B3`** is a scene with ONE option; **`WIN_C1`** has four options and no `[COMIC]`. Both fail `check-dialogue-nodes` as written. Neither is extracted in this pilot; both are Acts II–III.
6. **Errata 60's act sugar was never implemented**: no compiler emits `when: { ACT: … }` and `ACT` is declared in no flag file. Room 5's only authored state variation depends on it, so ACT is declared here per the ruling (numeric, initial 1) and the compiler learns `act:`. Main Street's Panel D depended on the same thing and remains that room's own debt to re-prove.
7. **THE STOVE** LISTEN 3 implies the fire has gone out; no visual state is written. Left static.
