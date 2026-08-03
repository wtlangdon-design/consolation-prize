# THE LAST CLAIM IN CONSOLATION
## Music & Sound Cue Sheet

**Status:** source-locked working draft for audio implementation and composition  
**Scope:** `28-audio.md`, `17-opening-sequence.md`, and `05-examine-layer.md` only  
**Doc number:** 45. **Subordinate to doc 28.**

**WRITTEN BEFORE BEAT 11 EXISTED IN THE FORM IT NOW HAS.** Doc 17 gained beat 11 — the departure through the fence gap, with the title over the mountains — after this was commissioned. Its beat 10 row correctly says the west exit *arms* beat 11 rather than travelling, but its title section (3.8) still treats the title as a screen. **Errata 55 voids doc 17 beat 1's separate title scene; the title plays over the walk.** Reconcile before implementation.

**Authority:** Doc 28 is authoritative. If this sheet disagrees with Doc 28, **Doc 28 wins**. Theme writing, musical character, and room-mix intent are incorporated by reference and are not redefined here.

---

# 0 · IMPLEMENTATION CONTRACT

## 0.1 Cue fields

Every cue below specifies: trigger; Doc 28 theme/stem; permitted musical instruments; start behavior; duration/end condition; handoff; and loop behavior. Non-musical effects are labelled **SFX** and do not count as additional score instruments.

## 0.2 Tuning gate

- Route **every musical stem**, including the title, room score, distant Nugget piano, and diegetic Nugget performance, through one shared `score_detune_cents` bus.
- Initial value: **−35 cents**. It remains there until the single F2 automation specified in Doc 28 Part Five.
- The automation reaches **0 cents once**. After it reaches zero, it never returns to −35.
- The tuning fork is SFX, not score: it bypasses the bus and remains exact A440.
- The flat church bell is SFX, not a fifth score instrument. It bypasses the bus and repeats the same fixed wrong pitch on every strike.
- The Nugget piano's C-sharp defect is additional to the shared score detune. Do not “correct” it merely because a room stem is transposed.
- WINNIE's authored correct-note/avoid-C-sharp rule remains in force, but the cue still passes through the shared −35-cent bus before F2. This is the only reading consistent with the project instruction that the score remains globally wrong until F2. If Doc 28 intended WINNIE to bypass the global bus at absolute concert pitch, resolve **OQ-06** before implementation.

No cue before F2 may use a zero-cent duplicate, a resolved tag, a cadence sweetener, or an in-tune menu layer.

## 0.3 Default transport rules

- Room-mix changes start at a **bar boundary**, per Doc 28 Part Three.
- Exact crossfade length is not supplied. Do not invent it; see **OQ-02**.
- A theme loop returns at its authored loop marker without adding an ending. CONSOLATION returns from its unresolved rollover to bar 1.
- THADDEUS uses an incomplete-fragment loop before Act IV; its fourth-bar completion must not play before then.
- THE STRIKE is a three-note one-shot unless a room mix explicitly embeds it.
- “Natural tail” means the complete delivered SFX asset, with no arbitrary truncation. Exact milliseconds belong in the asset manifest when files exist.
- “No object SFX” means exactly that. The current non-diegetic score and room-wide ambience continue unless the room is one of Doc 28's two deliberate music silences.

---

# 1 · OPENING SEQUENCE — BEAT BY BEAT

## 1.1 Source-state warning

Doc 17 v3.1 restores a four-option driver tree whose responses duplicate and reorder fixed beats 4–6 in the v3 beat table; Doc 17 later also says “four beats, no tree.” The cue logic below is therefore **semantic-event driven** for those actions. It does not choose a dialogue order that the source has not settled. Resolve **OQ-01** before locking dialogue timestamps.

## 1.2 Beat coverage

| Beat | What plays | Handoff |
|---|---|---|
| 1 · Title/menu | `O-01-M` only. No invented night ambience or title sting. | Start/Continue begins bar-boundary crossfade to `O-02-M`. |
| 2 · Coach arrives; Thad dismounts; driver reaches rack | `O-02-M`, `O-02-S1`, then `O-02-S2`. Mud footsteps follow Thad's actual steps. | Halt hands team movement to the halted-team bed. |
| 3 · Canonical Thad line / “Course you have” | `O-03-D`. THADDEUS fragment and halted-team bed continue; no voice audio and no duck. | Continue into the resolved driver-sequence state selected under OQ-01. |
| 4 · Four dollars exchange | `O-03-D`; no added sound for “Thad checks” because Doc 17 does not identify what he checks. | Continue dialogue state. |
| 5 · Ezra Pike / undertaker | `O-03-D`; no new music or sting. | Continue dialogue state. |
| 6 · Case in mud; hotel/four dollars; driver boards | `O-06-S1` at the case impact. `O-03-D` otherwise continues. | Driver-board action hands halted team to departure. |
| 6b · Coach departs | `O-06B-S`; `O-02-M` continues. | Team/coach sound pans and attenuates with the visible departure. |
| 7 · Coach recedes; flat piano; act card | `O-07-M` enters over `O-02-M`; departure tail continues. No act-card sting. | Both musical layers continue into control. |
| 8 · First control / verb panel | No new cue. `O-02-M` + `O-07-M` and the Room 1 night state continue. No panel-reveal sound is authorized. | Player-idle state. |
| 9 · Hob crosses and speaks | `O-09-M` once; `O-09-S` for his steps. Existing music continues. Text dialogue does not duck. | THE STRIKE tail returns to the unchanged Room 1 mix; footsteps end with Hob's crossing. |
| 10 · West exit selected | No exit-confirmation sound. Current Room 1 layers continue while the action arms beat 11. | `O-11-S` begins when Thad starts walking. |
| 11 · Thad walks toward town; title over mountains | `O-11-S`; existing Room 1 music continues under the title without a sting. | At the Main Street room boundary, incomplete THADDEUS is cut by the scene change and the music crossfades to `R02-M`. |

## 1.3 Opening cue detail

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `O-01-M` | Beat 1 title/menu becomes active | CONSOLATION, Title mix (Doc 28 Part Three) | Upright piano, fiddle, jaw harp | Cold over silence | Start/Continue, or title screen exits | `O-02-M` by bar-boundary crossfade | Yes: unresolved rollover → bar 1 |
| `O-02-M` | Beat 2 begins | THADDEUS, Room 1 sparse opening arrangement | Fiddle | Crossfaded from `O-01-M` at a bar boundary | Main Street replaces Room 1 at end of beat 11 | `R02-M`; `O-07-M` may coexist from beat 7 | Yes: incomplete fragment only; exact pre-completion markers are OQ-02 |
| `O-02-S1` | Beat 2 coach first moves into the shot | No theme | SFX: two-horse team breathing, harness, hooves in mud; wheels/coach movement | Cold over `O-02-M` | Coach halts within beat 2, approximately 8 seconds after beat start | `O-02-S2` | Hoof/wheel cycle loops only while the arrival animation is advancing; loop on matching stride/wheel phase |
| `O-02-S2` | Coach reaches full halt | Carry `O-02-M` | SFX: halted team breathing and light harness movement | Crossfaded from moving-team SFX as speed reaches zero | First departure stride in beat 6b | `O-06B-S` | Yes: delivered steady-state breath/harness loop markers |
| `O-02-S3` | Thad's actual dismount steps in beat 2 | Carry `O-02-M` | SFX: footsteps in mud | Cold, one event per foot plant | Final dismount foot plant | `O-02-S2` continues | No |
| `O-03-D` | Beat 3 begins; continues through fixed beats 4–6 or the v3.1 tree | THADDEUS carry | Fiddle; halted-team SFX carry | Already playing | Exit response / driver-board action finishes | `O-06B-S` for movement; music remains `O-02-M` | Music loop as `O-02-M`; no dialogue loop |
| `O-06-S1` | Beat 6 case hits the mud | Carry `O-02-M` | SFX: case impact in mud; faint tuning fork/clasp ring at exact A440 | Cold over current dialogue state | Impact and A440 natural tails end | `O-03-D` / `O-02-S2` carry | No |
| `O-06B-S` | Beat 6b first team stride | Carry `O-02-M` | SFX: hooves in mud, harness, wheels, near axle | Crossfaded from halted-team bed | Coach leaves frame right, approximately 3 seconds | Receding tail under beat 7, then Room 1 idle | Stride/wheel phase loop only while animation advances |
| `O-07-M` | Beat 7 first audible piano note from town | CONSOLATION, distant diegetic Nugget-piano layer | Upright piano only | Over `O-02-M`; no replacement of the Room 1 THADDEUS mix | Room 2 becomes active | `R02-M` by bar-boundary crossfade | Yes: same unresolved rollover; C-sharp defect retained |
| `O-09-M` | Beat 9 Hob begins crossing | THE STRIKE, once (Doc 28 Room 1 rule) | Harmonica | Cold over the current Room 1 layers, perceived at a distance | Three notes and natural tail | `O-02-M` + `O-07-M`, unchanged | No |
| `O-09-S` | Beat 9 Hob's first visible foot plant | Carry Room 1 music | SFX: even footsteps on the actual road surface | Cold, synchronized to animation | Hob's final foot plant / crossing ends | Room 1 idle | Per-stride loop, phase-locked to animation |
| `O-11-S` | Beat 10 exit flag causes beat 11 walk to begin | Carry `O-02-M` + `O-07-M` | SFX: Thad footsteps on the shown road surface | Cold on first foot plant | Main Street arrives | `R02-M`; destination surface footsteps take over only when shown | Per-stride loop, phase-locked |

### Opening actions with no authorized sound yet

- Driver climbing onto the wheel, handling the rack, and climbing aboard: physical actions exist, but no Foley source is specified. **OQ-09.**
- “Thad checks” during beat 4: the checked object is not identified. **OQ-09.**
- Title logo and act card: no stings. Existing music continues.
- Dialogue options and responses: no voice acting, typewriter chatter, character bleeps, or selection chimes are authorized.

---

# 2 · ROOMS — DOC 05 ORDER

## ROOM 1 · Stage Road & Coach Stop

Opening playback is in Section 1. This table covers interactive LISTEN states after control. Doc 17's Room 1 variants supersede Doc 05 where Doc 17 says they do.

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R01-M` | Beat 8 control; later idle in Room 1 | `O-02-M` plus `O-07-M` | Fiddle; distant upright piano | Already playing | Beat 11 room handoff | `R02-M` | Both loops as defined above |
| `R01-SIGN-1/2` | LISTEN to town sign, variants 1 or 2 | Carry `R01-M` | SFX: one wooden sign creak | Cold | Natural tail | `R01-M` | No |
| `R01-SIGN-3` | LISTEN to town sign, variant 3 | Carry `R01-M` | **No object SFX**; the sign has stopped | No new sound | Text response ends | `R01-M` | No |
| `R01-MUD` | LISTEN to mud, any supplied post-control variant | Carry `R01-M` | **No object SFX** | No new sound | Text response ends | `R01-M` | No |
| `R01-COACH-2` | LISTEN to departed coach while axle remains audible | Carry `R01-M` | SFX: receding near axle, spatially tied to coach direction | Continues/replays the documented departure tail, not a close foreground axle | Axle becomes inaudible | `R01-M` | No |
| `R01-COACH-3` | LISTEN to departed coach, variant 3 | Carry `R01-M` | **No object SFX** | No new sound | Text response ends | `R01-M` | No |
| `R01-CASE-A1/A2` | **UNARMED:** LISTEN to case on coach would require control during beats 1–5, but those beats are noninteractive | Carry opening state | **No object SFX** | Do not arm until OQ-15 | Text response ends if an interaction window is authorized | Current state | No |
| `R01-CASE-A3` | **UNARMED:** LISTEN variant 3 when driver shifts the case would require control during beats 1–5 | Carry opening state | SFX: faint fork against clasp, exact A440 | Do not arm until OQ-15 | Natural tail if authorized | Current state | No |
| `R01-CASE-B1/B3` | LISTEN to case in mud, variants 1 or 3 | Carry `R01-M` | **No object SFX** | No new sound | Text response ends | `R01-M` | No |
| `R01-CASE-B2` | LISTEN to case in mud, variant 2 | Carry `R01-M` | SFX: fork against clasp, exact A440 | Cold on selection | Natural tail | `R01-M` | No |
| `R01-LAMP` | LISTEN to watchman's lamp while Hob is crossing | Carry `R01-M` | Carry `O-09-S`; no lamp sound is added | Already playing | Hob exits crossing | `R01-M` | As `O-09-S` |
| `R01-EAST` | LISTEN to road east, any variant | Carry `R01-M` | **No object SFX** | No new sound | Text response ends | `R01-M` | No |
| `R01-WEST-1/2` | LISTEN to road west, variants 1 or 2 | Carry `R01-M` | Existing distant flat Nugget piano; no added cue | Already playing | Room exit | `R02-M` | As `O-07-M` |
| `R01-WEST-3` | LISTEN to road west, variant 3 | Carry `R01-M` | SFX: one distant human laugh from town; no intelligible words | Cold over room mix | Natural tail | `R01-M` | No |

**Open source issue:** Doc 17 says carried State C has no LOOK/LISTEN lines, then prints LISTEN variants immediately below. Do not attach case audio to inventory until **OQ-10** is resolved.

## ROOM 2 · Main Street

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R02-M` | Room 2 entry | CONSOLATION, Main Street full mix | Upright piano, fiddle, jaw harp | Bar-boundary crossfade from origin room; from beat 11 it replaces incomplete THADDEUS and absorbs the distant piano source into the full street mix | Room exit | Destination mix | Yes: unresolved rollover → bar 1 |
| `R02-A` | Room active, including idle | Carry `R02-M` | SFX bed: wind through false fronts; posted paper in wind; localized dog breathing while dog is present | Crossfaded in with room | Room exit or source state ends | Destination ambience | Yes: wind/paper steady-state markers; dog breath markers |
| `R02-BOARD` | Thad steps on the documented loose board | Carry `R02-M` | SFX: loose-board movement/creak | Cold on foot plant | Natural tail | `R02-A` | No |
| `R02-BELL` | LISTEN to church steeple | Carry `R02-M` | SFX: one distant hand-struck church bell, fixed half-step-flat pitch | Cold | Full bell decay | `R02-A` | No |
| `R02-TROUGH` | LISTEN to water trough | Carry `R02-M` | No implementable source is named beyond “something is living in it” | No invented sound | Text response ends | `R02-A` | No; exact audible evidence is OQ-11 |
| `R02-CO-SIGN` | LISTEN to Improvement Company sign | Carry `R02-M` | **No object SFX** | No new sound | Text response ends | `R02-A` | No |
| `R02-MUD` | LISTEN to mud | Carry `R02-M` | **No object SFX** | No new sound | Text response ends | `R02-A` | No |
| `R02-HILLS` | LISTEN to hills | Carry `R02-M` | **No object SFX** | No new sound | Text response ends | `R02-A` | No |

False-front wind, posted-paper movement, and dog breathing are already present in `R02-A`; LISTEN does not add a sting or isolate them. Player footsteps select boardwalk or mud SFX from the actual navigation surface.

## ROOM 3 · The Bountiful Nugget

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R03-M` | Room 3 entry while piano is in its documented untuned state | CONSOLATION, diegetic Nugget performance | Upright piano only | Bar-boundary crossfade from origin; spatially anchored to visible piano | Room exit or a documented piano-state change | Destination mix / changed piano state | Yes: unresolved rollover; C-sharp-specific defect retained |
| `R03-A` | Room active, including idle | Carry `R03-M` | SFX bed: glasses and indistinct talk; intermittent chandelier cooling ticks | Crossfaded in with room | Room exit | Destination ambience | Crowd/glass bed loops at delivered markers; tick clusters do not loop |
| `R03-HANDBILL` | LISTEN to handbill | Carry `R03-M` | SFX: one light paper movement | Cold | Natural tail | `R03-A` | No |
| `R03-PIANO` | LISTEN to piano | Carry `R03-M` | No new cue; the audible performance itself must expose the defective C-sharp | Already playing | Selection ends | `R03-M` | As `R03-M` |
| `R03-DOOR` | Nugget batwings begin moving on passage through the doorway | Carry `R03-M` | SFX: batwing-door swing for each visible oscillation | Cold on first swing | Final visible swing comes to rest | `R03-A` | No generic loop; each return swing is tied to the door animation |
| `R03-MIRROR` | LISTEN to mirror | Carry `R03-M` | **No object SFX** | No new sound | Text response ends | `R03-A` | No |
| `R03-SPITTOON` | LISTEN to spittoon | Carry `R03-M` | SFX: one restrained wet spittoon sound; exact source/action not supplied | Cold | Natural tail | `R03-A` | No; exact asset is OQ-11 |

The six working-script hotspots omitted from Doc 05 cannot be cued yet. The later piano-tuning state change is mentioned but not described in the supplied documents; its trigger and resulting room mix are **OQ-12**.

## ROOM 5 · Assay Office, Front

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R05-M1` | Room 5 entry, Thad not at counter | WINNIE | Upright piano, fiddle | Bar-boundary crossfade from origin | Thad enters counter state or exits room | `R05-M2` or destination | Yes: end bar 4 → bar 1; no added cadence |
| `R05-M2` | `thad_at_counter = true` | WINNIE + THE ASSAY | Upright piano, fiddle, jaw harp | THE ASSAY enters at next bar boundary over WINNIE | Counter state ends | `R05-M1` at next bar boundary | Shared-cycle loop; THE ASSAY exact cycle is OQ-02 |
| `R05-QUEUE` | LISTEN to queue book | Carry current `R05-M1` or `R05-M2` | SFX: one paper movement | Cold | Natural tail | Current room state | No |
| `R05-FLOOR` | LISTEN to proud floorboard | Carry current `R05-M1` or `R05-M2` | SFX: one loose-plank movement with audible hollow beneath; no music change | Cold | Natural tail | Current room state | No |
| `R05/06-LATCH` | Any documented assay-office door latch opens or closes | Carry current Room 5/6 mix | SFX: assay-office latch, synchronized to the latch animation | Cold | Natural tail / latch animation ends | Current room state | No |
| `R05-WINDOW` | LISTEN to window sign | Carry current `R05-M1` or `R05-M2` | **No object SFX** | No new sound | Text response ends | Current room state | No |
| `R05-SCALES` | LISTEN to scales | Carry current `R05-M1` or `R05-M2` | **No object SFX** | No new sound | Text response ends | Current room state | No |

Four hotspot LISTEN lines are absent from the supplied Doc 05 text. Do not invent them or their sounds.

## ROOM 7 · Claims Registrar

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R07-M` | Room 7 entry | THE ASSAY, registrar mix | Jaw harp only | Bar-boundary crossfade from origin | Room exit | Destination mix | Yes: authored THE ASSAY cycle; exact markers OQ-02 |
| `R07-A` | Room active, including idle | Carry `R07-M` | SFX bed: patient shuffling, paper settling, Sump's clock ticking | Crossfaded in with room | Room exit | Destination ambience | Shuffling/paper/clock beds at delivered loop markers |
| `R07-NUMBER` | LISTEN to number spindle | Carry `R07-M` | **No object SFX** | No new sound | Text response ends | `R07-A` | No |
| `R07-ARCHIVE` | LISTEN to sealed archive door | Carry `R07-M` | **No object SFX** | No new sound | Text response ends | `R07-A` | No |
| `R07/08-LOCK` | Player tries to open the sealed archive door while locked | Carry `R07-M` | SFX: locked latch/door resistance; the sound itself must communicate that it did not open | Cold | Natural tail / failed-open animation ends | `R07-A` | No |

The clock is offset by eleven minutes; Doc 05 does not say its tick rate is fast. Do not accelerate the tick. Five working-script hotspot lines remain unavailable.

## ROOM 11 · Fanshawe's Office

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R11-M` | Room 11 entry | THE COMPANY | **OPEN: Doc 28 does not assign instruments** | Bar-boundary crossfade from origin | Room exit | Destination mix | Yes, but exact form/markers are OQ-03 |
| `R11-CHAIRS` | LISTEN to chairs | Carry `R11-M` | SFX: one leather-settling sound | Cold | Natural tail | `R11-M` | No |
| `R11-PORTRAIT` | LISTEN to portrait | Carry `R11-M` | **No object SFX** | No new sound | Text response ends | `R11-M` | No |
| `R11-SABRE` | LISTEN to sabre | Carry `R11-M` | **No object SFX** | No new sound | Text response ends | `R11-M` | No |
| `R11-MAP` | LISTEN to map wall | Carry `R11-M` | **No object SFX** | No new sound | Text response ends | `R11-M` | No |
| `R11-DECANTER` | LISTEN to decanter | Carry `R11-M` | No sound is named; do not add a slosh | No new sound | Text response ends | `R11-M` | No |

Seven working-script hotspot lines remain unavailable.

## ROOMS 23 & 24 · Prosperity and the Hole

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R23/24-M` | Entry to Room 23 or 24 before the F2 resolution | THADDEUS + THE STRIKE, quiet | Fiddle, harmonica | Bar-boundary crossfade from origin | Exit from the Room 23/24 group | Destination mix | Yes: incomplete THADDEUS fragment plus embedded STRIKE cycle; exact shared markers OQ-02 |
| `R23/24-A` | Room active, including idle | Carry `R23/24-M` | SFX bed: wind; localized warm moving air at hole; slow raccoon breathing while present | Crossfaded in with room | Exit or source state ends | Destination ambience | Wind/air/breath at delivered steady-state markers |
| `R23/24-MARKER` | LISTEN to claim marker | Carry `R23/24-M` | Existing wind only; no new response cue | Already playing | Room exit | `R23/24-A` | As wind bed |
| `R23/24-MUD` | LISTEN to mud | Carry `R23/24-M` | SFX: localized wet working/squelch texture | Already present only if authored into bed; otherwise cold on selection | Text response ends / natural tail | `R23/24-A` | No one-shot loop |
| `R23/24-HOLE` | LISTEN to hole | Carry `R23/24-M` | Existing localized warm airflow only; **no sting, gain lift, or theme change** | Already playing | Room exit | `R23/24-A` | As airflow bed |
| `R23/24-RACCOON` | LISTEN to raccoon while present | Carry `R23/24-M` | Existing slow breathing only | Already playing | Raccoon state ends / room exit | `R23/24-A` | As breath bed |
| `R23/24-BOUNDARY` | LISTEN to Claim One's boundary after A9 | Carry `R23/24-M` | No new source and no sonic differentiation from Prosperity | No new sound | Text response ends | `R23/24-A` | No |

The hole's line is load-bearing. It receives no selection sting and no special mix behavior.

## ROOM 21 · Watchman's Shack

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R21-M` | Room 21 entry | **OPEN: no Doc 28 room assignment** | **OPEN; must be a subset of Doc 28's four** | Do not implement a silent fallback | Room exit | Destination mix | OQ-04 |
| `R21-LOCAL` | Room active, including idle | Carry `R21-M` once assigned | **No room-local SFX** from cot, marks, lamp, coat, or stove | No new sound | Room exit | Destination ambience | No |
| `R21-WINDOW` | LISTEN to window | Carry `R21-M` | SFX: distant Main Street room tone, “all of it” | Cold or crossfaded only while window listen is active; exact perspective duration OQ-11 | Text response ends | `R21-LOCAL` | If longer than asset, use delivered room-tone loop markers |

Do not interpret this quiet room as a third score silence. Doc 28 reserves that function for the undertaker's and coffin.

## ROOM 14 · Boot Hill

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R14-M` | Room 14 entry | **OPEN: no Doc 28 room assignment** | **OPEN** | Do not implement a silent fallback | Room exit | Destination mix | OQ-04 |
| `R14-MARKERS` | LISTEN to Mott's marker, any of the nineteen markers, Ezra Pike's marker, or the fresh plot | Carry `R14-M` once assigned | **No object SFX**; “nothing” and “nothing yet” remain literal | No new sound | Text response ends | `R14-M` | No |

THE STRIKE's global Mott rule must not create an object-local sound “under” Mott's marker. Any non-diegetic handling must follow Section 3.6.

## ROOM 9 · Clarion Office

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R09-M` | Room 9 entry | **OPEN: no Doc 28 room assignment** | **OPEN** | Do not implement a silent fallback | Room exit | Destination mix | OQ-04 |
| `R09-PRESS` | Press is in its documented operating state | Carry `R09-M` once assigned | SFX: press mechanism with knock on return stroke | Cold when mechanism starts | Mechanism stops / room exits | Room ambience | Yes: full mechanical cycle, loop boundary at identical carriage position |
| `R09-PAPER` | LISTEN to back editions | Carry `R09-M` | SFX: one substantial paper movement | Cold | Natural tail | Room ambience | No |
| `R09-TYPE` | LISTEN to type case | Carry `R09-M` | **No object SFX** | No new sound | Text response ends | Room ambience | No |
| `R09-PHOTO` | LISTEN to Mott photograph | Carry `R09-M` | **No object SFX** | No new sound | Text response ends | Room ambience | No |

Doc 05 does not state whether the press is operating on every visit. Resolve its state trigger under OQ-11. Five working-script hotspot lines remain unavailable.

## ROOM 32 · Inside the Coffin

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R32-MUTE` | **The lid closes: the nail specified by Doc 28** | No audible stem; retain the pre-coffin score playhead invisibly | No musical instruments audible | **Hard stop, not a fade** | Hob begins digging Thad out after the documented three minutes | `R32-RETURN` | Silent transport continues through the same phrase/loop logic so elapsed position is preserved |
| `R32-DIRT` | First dirt reaches the closed coffin lid | No theme | SFX: dirt on coffin lid | Cold over score silence | The three-minute coffin interval ends / Hob dig-out begins | `R32-RETURN` | Use the authored event pattern; do not create a generic ambience loop unless the burial choreography requires it |
| `R32-RETURN` | Hob begins digging Thad out | Resume the exact pre-coffin score state | Same instruments as the suspended state | **Hard return mid-phrase at the playhead position the score would have reached** | Next documented room/mix transition | Destination mix | Resume existing loop; do not restart |

The coffin interval timer starts on the same lid-close nail as `R32-MUTE` and lasts **180,000 ms of active, unpaused game time**. Dirt events occupy that interval; they do not delay or extend it.

During the three minutes: no other music, ambience, narration, aside, LISTEN response, UI cue, or dialogue sound. The verb panel returns before the art finishes resolving, but that UI event has no added audio cue.

## ROOM 33 · Listening Chamber

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Hands over to | Loop |
|---|---|---|---|---|---|---|---|
| `R33-M` | Room 33 entry | **OPEN: Doc 28 Part Five specifies the tuning behavior but not the theme/stem mix** | **OPEN** | Crossfaded from origin at a bar boundary | Room exit | Destination mix | OQ-06 |
| `R33-TAP` | Each LISTEN action on a rock surface | Carry `R33-M` | SFX synthesis: solid-rock high damped knock ↔ void low long-tail response, with continuous spatial gradient | Cold on Thad's tap | Each synthesized tail reaches silence | Existing `R33-M` | No; each tap is a one-shot |
| `R33-RIPPLE` | Same event and same calculated tail value as `R33-TAP` | No audio | Visual accessibility event; duration equals audible tail exactly | Simultaneous with tap | Simultaneous with audible tail end | Ready for next tap | No |
| `R33-TUNE` | **OPEN trigger: room entry or first valid tap is not specified** | Global score detune automation, not a new theme | All active score instruments | Starts at −35 cents without a jump | Exactly 90 active, unpaused seconds later: 0 cents | Remains at 0 for the rest of the game | No repeat; one-shot automation |
| `R33-VOID` | LISTEN on correct spot after the mechanic permits discovery | Carry `R33-M`; no sting | SFX: correct low void response and long tail | Cold on tap | Tail ends; prose line displays | Next documented puzzle state | No |

The score mix and the automation start/early-find behavior are blocking **OQ-06** items. Do not gate the correct spot, snap tuning to zero, or choose a Room 33 theme without an answer.

## Manifest rooms not fully scripted in Doc 05

These remain in Doc 05's manifest order. A row marked **OPEN** is a build blocker, not permission to use silence or copy a neighboring room.

| Room cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Handoff | Loop / source status |
|---|---|---|---|---|---|---|---|
| `R04-M` · Nugget back room | Room 4 entry, outside an Assay duel | **OPEN** | **OPEN** | Bar-boundary room transition | Duel begins or room exits | `R04-DUEL` / destination | OQ-04; LISTEN lines unavailable |
| `R04-DUEL` | Any Liar's Assay duel begins in Room 4 | THE ASSAY | Jaw harp, upright piano | At next bar boundary over/replacing baseline as composition requires | Duel state ends | `R04-M` | Authored cycle; exact marker OQ-02 |
| `R06-M` · Assay records room | Room 6 entry | WINNIE | Upright piano, fiddle | Bar-boundary crossfade | Room exit | Destination | End bar 4 → bar 1; LISTEN lines unavailable |
| `R08-M` · Registrar archive | Room 8 entry | THE ASSAY, registrar mix | Jaw harp only | Bar-boundary crossfade | Room exit | Destination | Authored cycle; LISTEN lines unavailable except timesheet |
| `R08-TIME` | LISTEN to timesheet | Carry `R08-M` | SFX: one ordinary paper movement; no sting, no gain change, no special music | Cold | Natural tail / text end | `R08-M` | No |
| `R10-M` · Improvement Co. lobby | Room 10 entry | THE COMPANY | **OPEN: Doc 28 does not assign instruments** | Bar-boundary crossfade | Room exit | Destination | OQ-03; LISTEN lines unavailable |
| `R12-M` · Mercantile | Room 12 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; all 16 hotspot LISTEN lines unavailable |
| `R13-SILENCE` · Undertaker's | First frame Room 13 is active | **No stems** | No score instruments | Outgoing room mix must reach inaudible during the transition so Room 13 itself begins with zero music | First frame the destination room becomes active after exit | Destination mix | No music loop; object SFX await missing LISTEN lines |
| `R15-M` · Livery stable | Room 15 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R16-M` · Ozymandia's tent | Room 16 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R17-M` · Church & meeting hall | Room 17 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R17-BELL` | Player action on bell rope actually strikes the bell | Carry `R17-M` | SFX: same fixed half-step-flat hand-struck bell used elsewhere | Cold | Full decay | `R17-M` | No; exact action/flag OQ-11 |
| `R18-M` · Hotel lobby | Room 18 entry | CONSOLATION through-wall mix | Upright piano, fiddle, jaw harp, filtered/distant as one inherited street source | Bar-boundary crossfade | Room exit | Destination | Unresolved rollover → bar 1; LISTEN lines unavailable |
| `R19-M` · Thad's room | Room 19 entry, letters closed | CONSOLATION through-wall mix | Upright piano, fiddle, jaw harp, filtered/distant | Bar-boundary crossfade | Letter opens or room exits | `R19-LETTER` / destination | Unresolved rollover → bar 1 |
| `R19-LETTER` | Any supplied “letter home” presentation opens | THADDEUS under letter | Fiddle | Bar-boundary crossfade from `R19-M` | Letter presentation closes | `R19-M` | Incomplete fragment before Act IV; exact markers OQ-02 |
| `R20-M` · Back alley | Room 20 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; do not assume this is Doc 28's “Lane” without OQ-05 mapping |
| `R22-M` · Road to claims | Room 22 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R25-M` · Pratt's claim | Room 25 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R26-M` · Creek & sluice | Room 26 entry | **OPEN** | **OPEN; creek sound cannot be authored without its LISTEN/state text** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04/OQ-07 |
| `R27-M` · Abandoned claim row | Room 27 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R28-M` · Sheng's laundry | Room 28 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R29-M` · High ridge | Room 29 entry | **OPEN** | **OPEN** | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R29-NOTHING` | LISTEN to the high-ridge target referenced in Doc 17 note 3 | Carry `R29-M` | **No object SFX**: “Nothing coming.” | No new sound | Text response ends | `R29-M` | No; hotspot identity OQ-07 |
| `R30-M` · Mott's supposed site | Room 30 entry | **OPEN baseline**; THE STRIKE applies on documented Mott interactions | Harmonica for THE STRIKE; baseline instruments OPEN | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN/action lines unavailable |
| `R31-M` · Funeral | Room 31 entry | CONSOLATION, slow funeral arrangement on flat church-bell pitch | **OPEN subset of the four score instruments**; bell remains SFX unless Doc 28 is amended | Bar-boundary crossfade | Funeral room exits | Destination | Arrangement-cycle markers OQ-08 |
| `R34-M` · Under Prosperity | Room 34 entry after F2 resolution | **OPEN** | **OPEN**; any assigned score is now at 0 cents | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R35-M` · Company vault | Room 35 entry | **OPEN** | **OPEN**; score remains at 0 cents | Bar-boundary transition after assignment | Room exit | Destination | OQ-04; LISTEN lines unavailable |
| `R36-M` · Main Street, dawn | Room 36 entry | CONSOLATION, in-tune thin ending mix | **OPEN: Doc 28 says one instrument but does not name it** | Bar-boundary crossfade; global bus is already 0 cents | Credits handoff or game end, neither specified | `CREDITS-M` once resolved | Yes: unresolved rollover → bar 1; OQ-08 |

### Required Doc 28 SFX whose narrative trigger is absent from the supplied documents

These sounds are required, but placing them in a room or inventing an action would exceed the source. They remain unarmed cues until the missing action/state text is supplied.

| Cue | Trigger | Theme / stem | Instruments / SFX | Begins | Runs until | Handoff | Loop |
|---|---|---|---|---|---|---|---|
| `U-STAMP` | **OPEN: the documented paperwork-stamp action** | Carry active room mix | SFX: stamp landing on paper | Cold on physical contact | Natural tail | Active room mix | No |
| `U-ASSAY-PENCIL` | **OPEN: each documented Assay judge pencil action** | Carry THE ASSAY duel state | SFX: pencil mark on paper | Cold on pencil contact | Natural tail | Duel state | No |

### Required Doc 28 musical appearances whose exact narrative trigger is absent

| Cue | Trigger | Theme / stem | Instruments | Begins | Runs until | Handoff | Loop |
|---|---|---|---|---|---|---|---|
| `U-WINNIE-DEATH` | The death-certificate scene named by Doc 28 begins | WINNIE | Upright piano, fiddle | Bar-boundary crossfade from active state | Scene ends | Prior/current destination state | End bar 4 → bar 1; location/timing OQ-16 |
| `U-IMPROVEMENT-ASSAY` | The Improvement Company moment meant to carry THE ASSAY begins | THE ASSAY over or in place of THE COMPANY, **relationship OPEN** | Jaw harp, upright piano; THE COMPANY instruments OQ-03 if layered | Bar boundary | Qualifying institutional moment ends | THE COMPANY room mix | Authored THE ASSAY cycle; trigger/layering OQ-16 |
| `U-FINAL-DUEL` | Final Liar's Assay duel begins | THE ASSAY + THE COMPANY | Jaw harp, upright piano, plus THE COMPANY instruments OQ-03 | Bar-boundary transition from the active room state | Final duel ends | Outcome/ending mix, not supplied | Shared cycle OQ-02; room and layering OQ-14 |

**Room 19 ambiguity:** Doc 28's room table assigns the through-wall CONSOLATION mix to Rooms 18/19, while its THADDEUS theme list separately names “Thad's room” and the letters home. This sheet uses CONSOLATION for the room and THADDEUS for the letter presentation only; do not treat that split as final until OQ-16 is answered.

### Undertaker's silence boundary

- **Starts:** the first frame Room 13 is active. The outgoing room mix must already be inaudible by that frame.
- **During:** no music under dialogue, idle, LOOK, LISTEN, or re-entry. Object/room SFX are allowed only when the missing Room 13 LISTEN/action text authorizes them.
- **Ends:** the first frame the destination room becomes active after leaving Room 13. Destination music may crossfade during the transition but must not be audible while Room 13 remains the active room.
- **Re-entry:** repeats the same zero-stem state. No first-visit exception.

---

# 3 · GLOBAL RULES

## 3.1 Dialogue and text

| Situation | Music | SFX | Ducking |
|---|---|---|---|
| Ordinary text dialogue | Current room/state mix continues | Only physical actions explicitly cued | **No duck.** There is no voice audio to clear space for. |
| Driver opening dialogue | `O-02-M`; halted team bed; `O-07-M` only after beat 7 | Semantic action cues only | No duck |
| Hob exchange | Room 1 mix plus one `O-09-M` statement | Hob footsteps continue | No duck |
| Liar's Assay duel | THE ASSAY for the full duel state | Pencil sound only on documented pencil actions; exact actions missing | No duck |
| Letter home | `R19-LETTER` | Paper SFX only if the letter action text authorizes it | No duck |
| Room 13 dialogue | No music | Authorized room/action SFX only | Not applicable |
| Coffin | No dialogue exists | Dirt only | Not applicable |

No voice acting, character bleeps, syllable ticks, or generic dialogue-open/close sounds.

## 3.2 Player idle

- The active room/state music loops at its declared loop point.
- Only the explicit room ambience beds in this sheet continue while the player does nothing.
- Do not add generic wind, birds, insects, saloon walla, mine drips, or “western” texture to rooms whose LISTEN text is absent.
- A room with an unresolved music assignment is blocked. It must not fall back to silence, because that would dilute Doc 28's two deliberate silences.
- Idle does not advance any narrative audio state except continuous playback and the F2 detune automation while F2 is actively running.

## 3.3 Room entry, re-entry, and exit

- First entry and re-entry use the same current puzzle-state mix. There are no first-entry stingers unless a cue above explicitly names one.
- Crossfade from origin mix to destination mix at a bar boundary. Exact fade length is OQ-02.
- Re-entry does not restart a theme at bar 1. Use the shared transport position and destination stem markers so the score feels continuous.
- Diegetic Nugget piano remains spatially anchored to the visible piano. When outside the Nugget but explicitly within earshot, use the documented distant/through-wall rendering rather than a second performance.
- State sources do not resurrect on re-entry: departed coach stays gone; removed raccoon stays removed; tuned/untuned piano state follows its unresolved puzzle flag; Room 13 stays music-silent on every visit.

## 3.4 Footsteps and movement

- Select only the five Doc 28 surfaces: boardwalk, mud, plank floor, dirt, and the documented surface under the moving character.
- One step event per animation foot plant. Loop points must coincide with the same gait phase; stop on the final planted frame.
- Do not let a surface loop continue across a room transition unless the new frame visibly continues the same walk and surface.

## 3.5 LISTEN behavior

- LISTEN has no generic activation sound.
- A named physical sound is either already present in the room bed or fires as the one-shot specified above.
- “Nothing,” “nothing yet,” and equivalent lines produce no object-local SFX.
- The current score is not muted merely because an object is silent. The only score silences are Room 13 and Room 32.
- The three load-bearing LISTEN lines receive no sting, gain change, isolation, achievement sound, or unique musical response.
- Room 33 is the exception in interface form: LISTEN triggers the tap synthesis and returns pitch instead of ordinary prose until the correct spot.

## 3.6 THE STRIKE interaction rule

Doc 28 requires THE STRIKE whenever Mott, Claim One, or the fraud is touched. Implement it as a distant harmonica statement only on an interaction/state explicitly identified as such in the narrative source. Do not infer fraud from an object before the story does.

- If THE STRIKE is already embedded in the room mix, do not retrigger it on selection.
- Do not add it to the hole LISTEN, timesheet LISTEN, or any other load-bearing LISTEN as a special response.
- For a silent object such as Mott's marker, THE STRIKE remains non-diegetic score; it is never presented as sound coming from the object.
- Exact qualifying interaction flags beyond those supplied in these three documents are **OQ-07**.

## 3.7 Save, load, and pause

No separate save/load/pause music or SFX is authorized.

| Action | Required behavior |
|---|---|
| Pause menu opens | Suspend the audio transport and the F2 automation at the exact sample/automation position. Do not start menu music. |
| Pause menu closes | Resume sample-accurately from the suspended position; no fade-in cue or restart. |
| Save | Emit no sound. Save room/state mix IDs, shared bar/loop position, `score_detune_cents`, F2 automation elapsed time, active silence state, and active diegetic source states. |
| Load begins | Suspend current audio; do not allow the outgoing room to continue under the load. |
| Load completes | Restore the saved room/state audio. If saved during the coffin, remain silent with the invisible score playhead and three-minute timer restored. If saved during F2, restore the exact detune value and remaining active time. |
| Return to title | **OPEN.** The supplied documents do not say whether this is a cold title restart or a room-to-title crossfade. See OQ-13. |

## 3.8 Title and credits

- Beat 1 title/menu: `O-01-M`.
- Beat 7 act card: current Room 1 score plus the distant piano layer; no sting.
- Beat 11 title over the mountains: current Room 1 score; no sting; handoff to Main Street at the room boundary.
- Credits: **not specified**. Do not assume Room 36 continues, do not replay full title music, and do not compose a seventh theme. See **OQ-08**.

## 3.9 F2 persistence and the once-only resolution

- The 90-second automation counts **active, unpaused F2 time**, not wall-clock time in pause/save menus.
- Save/load restores rather than restarts it.
- Once zero is reached, persist a permanent completion flag. Every later musical cue reads 0 cents.
- No UI or SFX announces zero. The correct void tap and its visual ripple remain the only immediate player-facing event.
- Do not retune the A440 fork, church bell, or rock-tap synthesis with the score bus.

---

# 4 · OPEN QUESTIONS / REQUIRED SOURCE INPUT

| ID | Blocking question | Needed answer | Blocks |
|---|---|---|---|
| `OQ-01` | What is the final opening dialogue state machine? | Whether beats 4–6 remain fixed, are absorbed by the v3.1 options, or are replaced; exact point at which the case drops and driver boards | Opening dialogue timestamps and action synchronization |
| `OQ-02` | What are the delivered stem lengths, bar counts, loop sample markers, and crossfade duration? | `LOOP_IN`, `LOOP_OUT`, tempo/bar grid, incomplete THADDEUS cutoff, and crossfade bars for each arrangement | Every looping/crossfading music cue |
| `OQ-03` | What instruments perform THE COMPANY? | One or more of upright piano, fiddle, jaw harp, harmonica; no other answer is valid | Rooms 10/11 and final-duel implementation |
| `OQ-04` | What are the missing room-mix assignments? | Theme/stem and permitted instrumentation for Rooms 4 baseline, 9, 12, 14–17, 20–22, 25–30, 34, and 35 | Those rooms; silence is not an acceptable placeholder |
| `OQ-05` | How do Doc 28's street labels 2/2b/2c map to Doc 05 room IDs? | Exact IDs for Main Street, Lower Street, and the Lane; confirmation whether Room 20 is unrelated | Street orchestration/re-entry |
| `OQ-06` | What exactly starts F2's 90-second automation, what score plays in Room 33, and what if the correct void is selected early or late? | Start event; theme/stems/instruments; automation curve; early/late completion rule; whether WINNIE ever bypasses global detune | Central tuning resolution and Room 33 |
| `OQ-07` | Where are the omitted LISTEN/action lines and qualifying Mott/Claim One/fraud flags? | Full working-script text and puzzle-state map, including the stamp and Assay-pencil actions | Missing SFX, THE STRIKE triggers, high-ridge hotspot, creek/room action cues, `U-STAMP`, and `U-ASSAY-PENCIL` |
| `OQ-08` | What instruments/loop form are used at the funeral and dawn, and what is the credits handoff? | Room 31 allowed instrumentation; Room 36's single instrument; credits scene, theme, duration, and end trigger | Rooms 31/36 and credits |
| `OQ-09` | What Foley is intended for the opening's unspecified physical actions? | Driver wheel/rack/boarding sounds and what Thad checks at beat 4 | Opening Foley completeness |
| `OQ-10` | Does the carried case have LISTEN variants? | Resolve Doc 17 State C's “no lines” statement versus the variants printed beneath it | Inventory case SFX |
| `OQ-11` | What are the exact sources/states for ambiguous named sounds? | Trough creature sound, window-listen perspective length, spittoon action, Clarion press operating flag, bell-rope action flag | Several localized SFX cues |
| `OQ-12` | When and how is the Nugget piano tuned? | Puzzle trigger; whether only C-sharp changes; resulting diegetic and distant/through-wall variants | Nugget and all distant piano cues after tuning |
| `OQ-13` | How does returning to title behave? | Cold restart, bar-boundary crossfade, or another documented transition | Title from pause/load/end menus |
| `OQ-14` | Where does the final duel occur and how do THE ASSAY and THE COMPANY combine there? | Room/event ID; layering or replacement rule; instruments after OQ-03 | Final-duel cue |
| `OQ-15` | Are any Room 1 hotspots interactive before beat 8? | Resolve the beat table's “no” interactivity against the case's beats 1–5 LISTEN/LOOK/PICK UP content and the lamp override that applies only before beat 8 | On-coach case cues and any pre-control hotspot audio |
| `OQ-16` | Where and how do Doc 28's theme-list appearances enter when its room table names another mix or no scene location? | THADDEUS in Room 19 outside letters; THE ASSAY inside the Improvement Company; location/handoff for the death-certificate scene | `R19-M`, `U-WINNIE-DEATH`, and `U-IMPROVEMENT-ASSAY` |

---

# 5 · COMPOSER / ASSET DELIVERY FIELDS

The cue logic above can be wired before assets exist. Each delivered music or looping SFX file must add these values without changing narrative triggers:

| Field | Required value |
|---|---|
| Asset ID / filename | Stable engine identifier |
| Sample rate / channel layout | Exact technical format |
| Tempo and metre | Including THE ASSAY's changing-bar structure |
| Bar-1 sample | Shared synchronization reference |
| Loop-in / loop-out samples | Exact sample positions; no approximate timecodes |
| Natural-tail end sample | For one-shots and non-looping theme statements |
| Nominal gain | Relative to the room mix, not mastering loudness |
| Spatial anchor | For visible/distant/diegetic sources only |
| Detune routing | `score_detune_cents`, bypass A440, bypass fixed bell, or SFX synthesis |
| State variants | Untuned/tuned piano, near/distant/through-wall, active/inactive mechanism |

No asset is approved if it produces a comfortable resolved ending before F2, even when its loop plays by itself.
