> **Provenance.** Produced by ChatGPT as a cross-system audit of docs 29–33, the errata through ruling 51, and the repository at `01f59ea`, at Tyler's direction, 2 August 2026.
>
> **Status: binding, and it governs the seams between the five guides.** See errata 52.
>
> **Its headline verdict — do not implement docs 29–33 in sequence — is adopted.**
>
> **Conversion note, 2 August:** the first upload of this file appended all eleven tables in a block at the end, leaving six sections — 1.2, 2.1, 3.1, 4.3, 4.4 and 4.6 — reading as empty headings. That was a fault in my conversion, not in the source. This version places every table under its own heading in document order. §4.6's sixteen assertions are here.

CROSS-SYSTEM DECISION MEMO
Architecture Audit and Reconciliation
The Last Claim in Consolation
What breaks when movement, dialogue, puzzles, animation, and saving are all true at once
Repository audit: main at 01f59ea · 2 August 2026
Prepared for Claude Code before sequential implementation of docs 29–33

# Decision first
Verdict — do not implement the five guides in sequence yet  They are directionally strong and mostly compatible, but they do not compose safely. The project needs one cross-system operation contract before Claude changes any of the five domains. Without it, implementation order will decide semantics accidentally: dialogue will commit before puzzles, saving will pause the clock it is waiting on, loading will cancel work that another guide says is irreversible, and transitions will autosave before arrival exists.
This is not a recommendation for another broad design pass. It is a recommendation for one narrow integration ruling, followed immediately by a vertical implementation slice. The biggest remaining risk is no longer knowing what Monkey Island did. It is allowing five correct local systems to own the same moment independently.

| Severity | Meaning | Required response |
|---|---|---|
| P0 · trust/data | Can corrupt a save, double-commit state, or create an unrecoverable hybrid world | Resolve before any guide implementation |
| P1 · architecture | Forces rework across two or more systems or makes a canonical scene impossible | Resolve in the integration ruling |
| P2 · production | Feature is specified but lacks content, assets, runtime capability, or cost | Gate and phase; do not pretend it is implementation-ready |
| P3 · refinement | Real quality issue, but it does not block a coherent playable build | Defer; stop creating rulings for it |


## Ranked findings

| Rank | Severity | Finding | What breaks |
|---|---|---|---|
| 1 | P0 | No single root transaction owner | DialogueTransaction, PuzzleTransaction, ChoreHandle and transition commitment can each believe they own state, skip and completion. Double writes and impossible nesting follow. |
| 2 | P0 | Save/menu pause can deadlock an atomic operation | Doc 33 pauses all clocks when the menu opens, then asks an in-flight exchange/chore/transition to reach a checkpoint before saving. |
| 3 | P0 | The current resolver mutates before performance | DialogueRunner and VerbSystem write flags during selection/resolution; GameState changes objects and inventory before the line. A skip, error or save sees half a story. |
| 4 | P0 | Load is not atomic | The live world is mutated participant by participant. A late validation or participant failure can leave a hybrid old/new session. |
| 5 | P1 | The canon has two town graphs and two screen counts | Errata 43 says 44 screens and three walked streets; doc 20, doc 14, doc 33 and current content still encode 42 and the old map/direct-claims route. |
| 6 | P1 | Skip/cancel/leave policies disagree | A committed transition must finish; a room unload cancels handles; load abandons; quit may complete or abandon. No command policy selects which. |
| 7 | P1 | The coffin cannot satisfy all current rules | No interface conflicts with visible mouse-only skip/menu access; three versus four minutes conflicts; total silence conflicts with dirt and hidden music transport. |
| 8 | P1 | F2 and Room 33 contradict motion-never-information | The ripple duration is explicitly information and the lamp stops because a puzzle state changes, while errata 35e forbids both literally. |
| 9 | P1 | Audio and the Act IV arc are not implementable from the repo | There is no audio runtime, no commissioned MIDI, no loop/grid contract, and no defined driver for the 90-second tuning automation. |
| 10 | P1 | The Liar's Assay is prose, not a runtime contract | Scoring, counter sampling, opponent sequencing, mid-duel save, skip, acquired-pair persistence and 72 wrong answers remain absent or incomplete. |
| 11 | P2 | The 45-puzzle manifest is empty | The graph validator honestly traverses nothing; five tagged combinations are not a game-wide puzzle implementation. |
| 12 | P2 | Uniform Room-2 content density is the scope bomb | Forty-four screens at roughly 9,800 hand-written lines, four-direction performance, ambient motion and save landmarks will dominate production before Act I exists. |

Recommended governing decision  Adopt the integration contract in section 4 as Errata 52. Then implement one end-to-end proof: one held-item success that contains walk, foot plant, chore/contact sound, line and commit; allows per-line skip; permits a queued manual save; optionally triggers a room transition; and restores identically after load. Do not implement five horizontal frameworks first.

# 

1. Audit basis and current evidence
The repository was pulled from GitHub main and audited at commit 01f59eabd603faf6f9510330e76eaef33ea5b2c8. The five binding guides are docs 29–33. The governing canon reviewed was docs 01–28 plus docs/00-errata.md through ruling 51. Citations in this memo use Dxx for a numbered design document, Exx for an errata ruling, and C:path for current code.

## 1.1 What the green checks prove—and do not prove
The current suite passes 42 unit tests and all 24 validators. That is real evidence for the panel geometry, one-click model, content extraction, deterministic art, basic walk routing, response precedence, save round-trips and several Room 1/2 details.
TypeScript verification did not run in this checkout because the local dependency installation contains no runnable tsc binary. This is an environment gap, not a typecheck pass.
The validators report 16 room records, 106 targets, nine dialogue trees and 45 options. Only one room is converted to walk boxes; 15 still use the zone model. Nine objects declare staging points.
The puzzle manifest is an empty array. The combination table has 13 authored pairs, only five tagged to puzzles. The graph check prints that it traversed nothing, correctly refusing to claim game-wide reachability.
The art directory contains ten room-background files plus a title image, but several corresponding rooms are stubs or incomplete. Asset existence is not room completion.
No audio implementation or score assets exist in the runtime. The title JSON explicitly states that its music hook plays nothing.

## 1.2 Defects present on main

| Current behavior | Evidence | Binding violation |
|---|---|---|
| Dialogue option selection immediately writes flags/additions and may end/change node | C:engine/core/DialogueRunner.ts select() | D30 requires reservation and commit only after echo/reply/post-beat drain |
| Item/verb resolution writes flags during resolveWith()/resolve() | C:engine/core/VerbSystem.ts | D31 requires pure resolution and a reserved immutable commit bundle |
| Object state/take/room change occurs before the response line finishes | C:engine/core/GameState.ts interact() | D31 success order is chore → sound → line → state → flags → inventory |
| enterRoom() applies onEnter and autosaves immediately | C:engine/core/GameState.ts enterRoom() | D29/D33 permit autosave only after destination ingress settles |
| Sequence chore returns guessed seconds; cancel clears only runner state | C:engine/core/Sequence.ts; C:engine/core/Actor.ts | D32 requires ChoreHandle/markers and propagated settle/cancel |
| Missing actor clip can still fall through to size.clips[0] | C:engine/render/ActorSprite.ts clipOf() | E50/D32 make missing required coverage a build error |
| Dialogue intercepts pointer input before MENU | C:engine/scenes/GameScene.ts onPointerDown() | D33 says saving/options are mouse reachable during atomic moments; D30 says only line-skip owns playfield input |
| Menu opens without pausing GameScene clocks | C:engine/scenes/GameScene.ts update/menu paths | D33 requires world, actor, dialogue, chore, ambient and palette clocks paused |
| Save writes live memory directly; load restores live participants sequentially | C:engine/core/GameState.ts; SaveManager.ts | D33 requires stability gating and candidate-world atomic swap |
| Boot auto-loads and starts GameScene; quit resets and clears autosave | C:engine/scenes/BootScene.ts; GameScene.ts | E51/D33 require a real title and navigation without destructive reset |
| Main Street east leads directly to stub_claims_road; no Lane exit exists | C:content/rooms/main-street.json | E43 requires east to Lower Street and the alley to the Lane |


# 

2. Contradictions among the five binding guides
Most apparent contradictions are ownership ambiguities rather than incompatible creative intent. They are still dangerous: Claude must choose an implementation, and that choice will silently make one guide subordinate to another unless the seam is ruled now.

## 2.1 P0/P1 contradictions

| ID | Collision | Why both cannot stand literally | Resolution |
|---|---|---|---|
| G1 | DialogueTransaction inside PuzzleTransaction | D30 lets dialogue reserve writes; D31 gives a puzzle transaction the commit bundle. A puzzle response presented as dialogue would have two commit owners. | Exactly one root ActionTransaction owns durable effects. Dialogue inside it is a presentation child and owns no puzzle writes. |
| G2 | Chore as owner versus child | D32 gives ChoreHandle cancellation/markers/final pose; D33 lists chore as an atomic owner beside puzzle/dialogue. A successful puzzle chore cannot be a second root operation. | A chore is always a child handle of the current root operation unless it is a standalone cosmetic reaction, in which case the standalone reaction is the root. |
| G3 | Committed transition versus unload/load cancellation | D29 forbids cancellation after threshold; D32 cancels handles on room unload; D33 load abandons live handles without commit and quit may complete or abandon. | Player-world cancellation is forbidden after commit. Session-replacement commands may abandon the entire unsaved live world. Transition-owned handles settle before ordinary unload. |
| G4 | Atomic save queue versus paused shell | D33 pauses every relevant clock while the menu is open, but queued Save requires those clocks to advance to the next checkpoint. | Selecting Save during an atomic operation queues the request, closes the shell, resumes the same logical clocks, and writes at settle. The Save page must not remain a modal pause while it waits. |
| G5 | Only skip input versus shell input | D30's exchange table allows skip-current-line only; D33 requires mouse-only MENU/SAVE/LOAD/OPTIONS availability and explicitly tests save during dialogue. | The playfield accepts only line skip; a reserved shell-control region remains active and consumes its click before speech. Current GameScene has the order backwards. |
| G6 | Player-skippable transition | D29 acceptance says skipping a transition yields equivalent state; D30 reserves whole-sequence skip for non-interactive cutscenes. | Ordinary room transitions are not player-skippable. The D29 check is an internal force-complete test. Scripted vehicle/cutscene transitions may expose whole-scene skip. |
| G7 | Ambient bark deferred versus dropped | D30 says one eligible bark is deferred and re-tested; D32 says ambient opportunities may defer or drop and never backlog. | No FIFO backlog. SpeechChannel keeps at most one candidate token and re-evaluates eligibility on release; an invalid or superseded candidate is dropped. |
| G8 | Story pose saved versus animation state not saved | D32 says room unload serializes story-relevant stable pose/state; D33 excludes animation state and NPC pose machinery. | Persist semantic world pose only when it changes story blocking/ownership. Never persist frame, phase, handle or cosmetic NPC idle pose. Thad's stable anchor/facing remains saved. |
| G9 | Manual text and silent beats | D30 Manual holds utterances until click, while D32 silent chore-only utterances finish on handle completion. Neither says whether Manual adds another click after a silent performance. | Manual affects readable text only. A silent chore advances on settle unless its content explicitly declares awaitAdvance. |


## 2.2 Same requirement, specified twice
Skip equivalence appears in D29, D30, D31, D32 and D33 with different state lists. Replace five local implementations with one canonical stable-state comparator used by all tests.
Cancellation appears in SequenceRunner, actor animation, dialogue, transition and load. Replace boolean cancel with a reasoned finish(reason) policy routed by the root coordinator.
Stable checkpoint is named in D29, D30, D31, D32 and D33 but has no shared type or publisher. Define it once; SaveCoordinator observes it rather than asking each subsystem to invent stability.
Sound is required by D31 and marker-driven by D32. Animation emits a semantic marker; AudioDirector plays the cue; the transaction records causality. None should directly own the others.

# 

3. Conflicts with errata and docs 01–28
Precedence defect  The errata begins with a global 'errata always wins' rule, while E44, E45, E48, E50 and E51 explicitly adopt later guides and make each guide win within its domain. A single linear 'latest document wins' rule is unsafe. Use the domain matrix below; a future cross-system ruling should govern seams only.

## 3.1 Live conflict matrix and winner

| Conflict | Live sources | Winner / required amendment |
|---|---|---|
| 42 versus 44 screens; 41 versus 43 produced backgrounds | E6, E43, D33 §5.2/E51 | E43 wins: 44 screens. With Room 32 still post-produced, the production background count becomes 43. Replace every literal 42/41 in active requirements with 'all reachable screens' or the new totals. |
| One town street/map menu versus three walked streets | D20, D14, current room data versus E43 | E43 wins. Rewrite D20's graph and Main Street exits; add Lower Street and the Lane before further room-link validation. |
| Main Street east goes to claims road | D14/current main-street.json versus E43 | E43 wins: east goes to Lower Street. Long-distance claims travel remains on Room 0. |
| Main Street alley may be atmosphere | D29 §13.2 versus E43/E44b | E44b wins: it is a real exit to the Lane with walk lane, threshold, paired entrance and far-scale coverage. |
| Runtime camera struck versus optional cameraAnchor/wide rooms | E27c versus D29 §§5/9; E44 | No runtime camera in release one. Treat D29 cameraAnchor as dormant schema until a specifically approved wider-than-viewport room exists. E34 'camera relationship' means composed viewpoint, not a moving camera. |
| Six sequence kinds only; no sound/parallel/state steps | E28a/E30a/E38 versus D31/D32 | Keep the public sequence language small. Do not reintroduce arbitrary parallel or sound steps. Allow chore-internal synchronized tracks; emit markers to AudioDirector/TransactionJournal. This is layering, not a seventh sequence step. |
| Older interaction order runs script before response | D22 §6/E28a/current Sequence interact-say versus D31/E48 | D31/E48 win: pure resolve first; visible chore/sound/line; then state/flags/inventory. Remove mutating 'interact' from say-step resolution. |
| Three sizes/three views versus two drawn sizes/four facings | D15 versus E24/D32/E50 | E24/D32 win. Require full coverage only at reachable call sites; do not generate unused views to satisfy stale prose. |
| Text inventory versus icon inventory | E26 versus E29 | E29 wins: icon grid with textual identification in sentence/accessibility paths. D30 already assumes that result. |
| Dialogue COMIC versus puzzle COMIC_NOOP | D04 Hob C1 option 4 versus D31 permission rules | Both survive only as separate namespaces. DialogueOptionTag.COMIC may set a critical flag; PuzzleFeedback.COMIC_NOOP may not. Never infer puzzle permissions from a dialogue tag. |
| Trials are 'fully independent' versus intentional interlocks | D02 graph rules versus B6 and shared C3/D4 funeral; E2 | The rows win. Amend the rule to 'independently pursuable, not independently completable.' B6 may depend on guaranteed cross-lane knowledge; one funeral may serve two lanes. |
| Motion never carries information versus F2 visual ripple | E35e/D32 versus D28/D31 F2 | Narrow E35e to ambient/relevance motion. Direct action feedback may carry the sensory information it represents. The ripple is allowed and required. |
| Lamp stops when F2 succeeds | D18/D28 versus E35e/D32 | Strike the lamp-stop automation. It is cosmetic, puzzle-gated salience and unavailable when palette cycling is disabled. Keep the sound/ripple feedback and tuning arc. |
| Every room has an animated sprite versus coffin black frame | E35a/D32 versus D01/D02/D05/D06 Room 32 | Room 32 is an explicit exception. A black held frame with authored dirt events is the performance; do not add a twitching sprite to satisfy a quota. |
| Coffin duration: 2–3, exactly 3, Hob says 4 | D01/D02/D04/D28 | Adopt a precise beat sheet: four minutes sealed total; the Room 32 black hold is exactly three minutes, preceded by roughly one minute of lid/nail/lower/dirt blocking. Hob's line remains true. |
| No coffin interface versus mouse-visible skip/menu | D01/D02/D06 versus D30/D33 | Accessibility and control honesty win. Normal resting frame has no verb panel; pointer movement/click reveals a minimal MENU / SKIP SCENE overlay. Without this exception, the requirements are impossible. |
| No timers versus timed coffin | D02/D31 project covenant versus D02 E7 | E7 remains the named exception because it cannot cause failure. Call it a timed cutscene, not a timed puzzle or failure state. |
| Old map knowledge list as navigation/soft quest log | D20/E30c/E31c versus no-hint doctrine | Keep map discovery only for travel destinations. Do not list unresolved tasks, trials or locations reachable on foot. E43's reduction is the correct boundary. |
| Speaker/hold defaults versus authored story pauses | D30 numeric defaults versus Hob's four-second beat and D04 | Authored story timing wins; reading-speed settings never scale declared non-reading beats unless a future accessibility ruling explicitly says so. |


## 3.2 Canonical domain matrix

| Domain | Controlling source | What it may not change |
|---|---|---|
| Story, character voice, exact lines, puzzle solutions | Latest applicable errata + docs 01–28 | Presentation guides may not rewrite content to fit runtime |
| Town topology and counts | E43, then amended D20 | Movement feel cannot invent destinations |
| Movement/transitions | E44 + D29 | Does not own dialogue, puzzle effects or persistence writes |
| Dialogue presentation | E45 + D30 | Dialogue tags do not define puzzle-effect permissions |
| Puzzle feedback/commit order | E48 + D31 | Does not own actor animation playback or storage |
| Animation/performance | E50 + D32 | Chores emit markers; they do not write story state |
| Audio build method | E49 + D28 as amended | Audio cannot be the only accessibility channel |
| Persistence/shell | E51 + D33 | SaveCoordinator observes stability; it does not decide story transaction semantics |
| Cross-system seams | Proposed integration ruling in section 4 | Only resolves ownership, clocks, input, command priority and stable checkpoints |

Editorial warning: the errata numbering skips 40. The file is described as 51 rulings, but a reader cannot safely use number order as a complete precedence mechanism. This is not a gameplay defect; it is a governance defect. Add a small supersession index instead of relying on prose archaeology.

# 

4. When all five are true at once
Key correction  A chore handle held by a dialogue transaction inside a room transition during an autosave request should not be supported as four nested owners. That shape is itself illegal. There is one root operation, optional child presentation/performance handles, and a save request observing the next stable checkpoint.

## 4.1 One root operation
type RootOperation =
  | { kind: "stable" }
  | { kind: "freeWalk"; cancellable: true }
  | { kind: "dialogue"; tx: DialogueTransaction }
  | { kind: "action"; tx: ActionTransaction }
  | { kind: "transition"; tx: TransitionTransaction }
  | { kind: "cutscene"; tx: CutsceneTransaction };

interface ActionTransaction {
  id: string;
  phase: "reserved" | "staging" | "chore" | "line" |
         "worldState" | "flags" | "inventory" | "settling";
  effects: ImmutableCommitBundle;
  dialogue?: PresentationLease;   // no durable puzzle writes
  chore?: ChoreHandle;            // child of this action
  journal: TransactionJournal;    // idempotent phase markers
}

interface RuntimeCoordinator {
  root: RootOperation;
  inputMode: "world" | "speechSkip" | "choice" | "shell" | "none";
  checkpoint(): StableCheckpoint | null;
  request(intent: PlayerIntent | ShellIntent): IntentResult;
  finish(reason: FinishReason): void;
}

// SaveCoordinator is a subscriber and write gate, not the root arbitrator.
RuntimeCoordinator.publishStable(checkpoint)
  -> SaveCoordinator.releaseQueuedRequest(checkpoint)
  -> verified storage write

## 4.2 Ownership rules
RuntimeCoordinator owns exactly one root operation and all input-mode changes. No scene class may start a second atomic root directly.
TransactionJournal owns the immutable durable commit bundle and exactly-once phase markers. Resolver code is pure. Animation, dialogue and audio receive presentation commands and cannot write story state.
AnimationController owns body/prop playback. A ChoreHandle is a child resource of the root transaction and emits semantic markers; it is never a competing commit owner.
SpeechController owns one utterance channel. A dialogue tree transaction owns dialogue counts/node movement. When speech presents a puzzle action, it is a child lease and does not also own the puzzle effects.
TransitionCoordinator is the root only after the threshold commit. A dialogue exchange must drain before a transition begins unless the dialogue is authored as non-interactive cutscene speech owned by that transition/cutscene.
SaveCoordinator is the only storage writer. It never decides whether a transaction commits or cancels; it waits for RuntimeCoordinator to publish a stable checkpoint.
LoadCoordinator constructs and validates a candidate session. The live coordinator is disposed only at the atomic swap boundary.

## 4.3 The concrete collision named in the request

| Moment | Legal owner/state | Autosave result |
|---|---|---|
| Player selects a dialogue option during the coach arrival | Dialogue root. Driver/Thad utterances and gestures are child leases. No room transition exists yet. | Manual save queues; autosave does not fire. |
| EXIT exchange drains | Dialogue commits counts/writes and settles. Its continuation requests a transition; it does not start under the last line. | A configured story-dialogue checkpoint may save here, or transition can begin immediately and save later—not both for the same revision. |
| Coach departure begins | Transition or cutscene root owns coach movement, actor blocking, child chores and non-interactive utterances. | Save remains queued. Ordinary world clicks are locked; shell control remains reachable. |
| Threshold/room switch | Committed transition. Source is no longer cancellable. Destination candidate room is prepared; no save is captured in the middle. | No write. |
| Destination ingress settles | Transition publishes stable destination checkpoint and releases root ownership. | One queued manual save writes; one eligible autosave may coalesce behind it using the same snapshot/revision. |


## 4.4 Shell command policy

| Command during atomic work | Policy |
|---|---|
| SAVE | Queue one slot request, close shell, resume the paused logical clocks, write at next declared stable checkpoint. Never leave a modal waiting screen that prevents progress. |
| OPTIONS / FULLSCREEN | Pause while open; apply machine setting; close and resume exactly. No story transaction change. |
| LOAD / RESTART | After confirmation, validate candidate first, then abandon the entire unsaved live session at atomic swap. Do not complete its pending story effects into the candidate. |
| NEW GAME | Title-only. After confirmation, abandon live session, preserve manual saves/settings, create canonical new session and new opening-start autosave. |
| QUIT TO TITLE | If a manual save is queued, show FINISH & SAVE / LEAVE WITHOUT SAVING / CANCEL. Otherwise abandon the unsaved live session and navigate to title; do not mutate or clear saves. |
| Close tab/power loss | No emergency mid-transaction write. Last verified save remains recovery. |


## 4.5 Clock policy
Wall clock: timestamps/relative save age only. Never drives gameplay state.
Simulation clock: walking, transitions and authored sequence timing. Pauses under shell.
Presentation clock: speech holds, comedy pauses and chore timelines. Pauses under shell; text speed scales reading holds only.
Ambient clock: idles and palette cycling. Pauses under shell and never changes story state.
Audio transport: room/grid position. Usually pauses under shell. During the coffin it continues silently so the score can resume mid-phrase; the entire coffin sequence and hidden transport pause together if the shell overlay is invoked.
Save files persist none of these live clock positions unless a future named checkpoint explicitly requires a semantic phase. Stable room music restarts from its room policy after load.

## 4.6 Illegal states—make these assertions

| Illegal state | Assertion |
|---|---|
| Two atomic roots | rootAtomicCount <= 1 |
| Puzzle and dialogue both own the same effect | every durable effect id has one transaction owner |
| Stable checkpoint with live path/chore/utterance/uncommitted journal | checkpoint() returns null while any participant is unstable |
| Transition active before interactive exchange drain | no committed transition while DialogueTransaction phase != settled |
| Room unload with live non-transition ChoreHandle | all handles settled/cancelled with explicit reason before participant disposal |
| Body has walk + talk/chore/idle advancing together | one body owner; prop tracks share its clock only |
| Resolver changed flags/state/inventory | deep state snapshot equal before/after resolve |
| State/flag/inventory phase emitted twice | journal phase marker unique and monotonic |
| Save while checkpoint null | SaveCoordinator may queue, never capture |
| Autosave on room id change before ingress | transition autosave reason accepted only from destination-settled event |
| Menu waiting for a checkpoint while clocks remain paused | queued Save must close shell/resume or be cancellable |
| Shell click also advances speech/world | input route consumes event at exactly one layer |
| Load validation mutates live session | live revision/state hash unchanged on every pre-swap failure |
| Clip fallback hides missing coverage | required ChoreVariant lookup fails explicitly |
| Map/exit points at pre-E43 topology | canonical route validator rejects direct Main Street → claims and missing 2b/2c |


# 

5. What remains genuinely unspecified
The five guides found five missing system contracts. The combined review finds more. These are not polish requests; an implementer must invent an answer, and two competent implementers could produce incompatible games.

| Undefined contract | Why it matters | Minimum decision needed |
|---|---|---|
| Root operation/arbitration | Every cross-system collision depends on it. | Adopt section 4 before implementation. |
| Transaction error/rollback | A runtime/content error after visible object state but before flags/inventory leaves live memory inconsistent even if no save was written. | Journal phases, idempotence, fatal-action recovery to last stable snapshot, and error reporting. |
| Input layer priority | Speech, choices, panel shell, fullscreen, map and world clicks currently compete. | One ordered router and event-consumption matrix for every mode. |
| Logical clocks | Pause, manual text, hidden coffin transport, palette cycling and save age require different time semantics. | Name clocks and define pause ownership; forbid raw wall time in gameplay. |
| Cutscene checkpoint/skip recipe | Opening, funeral, coffin, final duel and ending lack canonical skip-state bundles. | Per-cutscene start/final checkpoint and must-run semantic effects. |
| Asset/load failure during transition | A committed threshold cannot return to source, but destination asset failure is possible. | Preload before commit where possible; otherwise fail to a recoverable shell state using last stable checkpoint. |
| AudioDirector contract | Room stems, bar boundaries, SFX markers, mute, detune and hidden transport have no owner. | Mixer buses, transport/grid, cue IDs, marker API, mute/volume policy and room lifecycle. |
| F2 sampling mathematics | No mapping exists from tap coordinate to pitch/tail/ripple or from gradient to solved state. | Authored field/curve, sample spacing, threshold, success zone, feedback extrema and muted-audio equivalence. |
| Act IV tuning trigger | 'Across ninety seconds as Thad narrows in' could mean elapsed time, proximity, best sample or post-solve automation. | Choose one. Recommendation: search uses only tap/ripple gradient; the 90-second score resolution begins on confirmed void and plays through the reveal. |
| Liar's Assay state machine | The prose does not define option sampling, score/tie flow, opponent sequence, persistence or skip. | A DuelDefinition schema, deterministic round order, acquired-pair set, score, save boundary and final-duel exception. |
| Coffin interaction/accessibility | No interface and mouse-visible skip cannot both be literal. | Adopt the reveal-on-intent overlay, exact timing, pause/skip final state and checkpoint. |
| NPC durable location/ownership | D33 saves Thad and world objects, while some story scenes move NPCs/props across rooms. | Persist semantic presence/location/attachments as object/actor state; never idle frames. |
| Dialogue during walking | D32 says walk owns the body while text may remain; D30 anchors speech to moving actors, but interruption and next-speaker staging are not specified. | Declare which utterances permit locomotion and whether clicks skip line or redirect walk. |
| Manual-mode silent beats | A silent shrug could complete automatically or wait forever for a click. | Manual affects visible text only unless awaitAdvance is explicit. |
| Content migration governance | D33 requires ID migrations for months of changes, but no registry owner or deprecation process exists. | Stable semantic IDs, migration manifest, fixture retention policy and release-version bump rules. |
| Canonical room identity at dawn | Room 36 replaces Room 2, but saves/map/exits/landmarks may treat it as a separate place or state variant. | Choose room alias/variant semantics and migration behavior. |


# 

6. What cannot be built as written today

## 6.1 Audio and F2
E49 settles a plausible build method—offline-rendered stems, live synthesis only for continuous F2—but the repository contains no AudioDirector, transport, score stems, commissioned MIDI or SFX library. This is an external-content dependency, not an engine ticket Claude can complete alone.
D28 does not specify tempo, bar length, compatible loop lengths, harmonic grid, stem start points or transition tails. 'Crossfade at bar boundaries' cannot be implemented deterministically until the commissioned material obeys a delivery contract.
F2's input/output field is absent. A live oscillator is not a puzzle. The coordinate-to-resonance mapping, visual ripple curve, success tolerance and test fixtures must be authored.
The 90-second tuning arc has no deterministic trigger. Implementing elapsed time would make waiting advance the dramatic state; implementing proximity would turn music into a hidden meter. Move the arc to the confirmed-void reveal unless the designer explicitly chooses another contract.

## 6.2 The 45 puzzles
The 45 rows in D02 are a story dependency outline, not 45 executable PuzzleAction records. D31 now requires each success to name a problem advertisement, action, performance, commit bundle, visible confirmation and recovery contract. Most of that material does not yet exist.
Current content has no puzzle manifest and only five puzzle-tagged item combinations. Several target rooms are stubs or absent. Populating the graph now would create the false completeness E48 explicitly forbids.
Many puzzle steps are dialogue, travel, institution or cutscene beats rather than item-target actions. The manifest must model heterogeneous actions without forcing all 45 through the item-combination schema.
Each successful action now implies animation and sound content. The 45-puzzle count therefore carries an uncosted chore/SFX burden well beyond the high-level graph.

## 6.3 The town map and streets
D20 is no longer buildable as the active connectivity specification because E43 changes its central premise. Current content still implements the obsolete version. Rewrite the graph first; do not patch individual exits while two topologies remain live.
Lower Street and the Lane have no room records, backgrounds, walk boxes, entrances or exits. The Main Street approved art promises both. Until they exist, movement and map validators certify the wrong town.

## 6.4 The Liar's Assay
The design supplies 24 correct pairs and only the first pair's three authored wrong answers. D15 correctly lists the remaining 72 wrong answers as unwritten. Those are declared product content and cannot be generated as filler without violating the voice rule.
There is no duel engine, persistence model, option sampler, score UI, acquired-counter state or final-duel override. A dialogue tree alone cannot represent learn-by-losing plus deterministic first-to-five rounds safely.
E4 corrects the event count to three duels and two sparrings, but D03 still labels the final event Duel Four and its header says four duels. Runtime IDs and player-facing labels need one canonical migration before implementation.

## 6.5 The coffin
A three-minute no-interface scene cannot also provide a visible mouse-only skip/menu route. This is a requirements impossibility, not an engine limitation. The proposed reveal-on-intent overlay is the smallest honest exception.
The current sequence language can wait, but it has no cutscene skip-state bundle, hidden audio transport, checkpoint policy, or final actor/room placement for E8. A raw 180-second wait would be the naive implementation every guide warns against.
The duration only reconciles if total sealed time and the black-screen segment are defined separately. Without that beat sheet, Hob's 'four minutes' and the exact three-minute screen disagree.

## 6.6 Performance volume
D32's Room 1 proof requires a clean plate plus separate driver, Hob/body/lamp/light, two horses and coach/prop transition. Current shipping art paints several of those elements into the background; the preview GIF is explicitly non-shipping.
A moving lamp pool is not supported by the compositor. D15's polish note already identifies the missing radial background-light pass. D32 nevertheless requires coherent moving body/lamp/light cells. That capability must be costed or Hob's path constrained to the precomposed pool.
Four facings, two drawn sizes, surfaces, talk, reusable use heights and special reactions across roughly 30 characters is not a small extension of the current actor. It is a production program.

# 

7. What is over-specified—and what to cut
Blunt scope finding  The project has enough specification to build the same two proof rooms several more times on paper. It does not yet have Act I. From this point, more global rules are more likely to create conflicts than quality.

| Simplify / defer / strike | Recommendation | Keep |
|---|---|---|
| Uniform Room-2 writing standard across 44 screens | Overturn the no-tiering decision. Use hero standard for hubs/story rooms, authored-light standard for ancillary rooms, and no repeat matrix where the room is never revisited. | Distinct LOOK/LISTEN, no generated Thad voice, critical content hand-written. |
| All 44 rooms before an Act I proof | Freeze new room production. Finish canonical streets needed by Act I, then make Act I playable and testable before Acts II–IV bulk work. | The room graph and procedural component library. |
| D29 four bespoke coordinates on every exit | Provide approach/threshold/egress/settle defaults by exit archetype; require overrides only when visible blocking needs them. | Physical egress/ingress and reciprocal continuity. |
| D30 six named delivery profiles plus optional accessibility variants | Implement reading hold, pre/post pause, Manual mode and explicit silent chore first. Defer speaker labels/high-contrast option until native tests prove need. | Speaker anchor/color, option echo, per-line skip, measured wrap. |
| D31 six runtime outcome classes everywhere | Keep six authoring/QA tags, but runtime may share a smaller presentation path. Do not turn every generic pool response into PuzzleAction metadata. | Pure resolution, specific success/near-miss content, canonical commit order. |
| Puzzle advertisement records for all 45 immediately | Author them during puzzle conversion. Do A5 and one Act II lane before populating the full manifest. | The invariant that critical problems remain perceivable without a hint UI. |
| D32 maximal chore schema for every two-frame idle | Start with timeline cells/holds, one contact marker, settle, interrupt/skip policy and child prop tracks only where needed. Adapt cheap idles without forcing every optional field. | One body owner, foot plant, explicit missing-clip failure, handle-based completion. |
| Universal four-direction coverage for all NPC actions | Validate actual call sites. Fixed NPCs/crowds use only staged facing/size; reusable Thad actions cover all reachable facings. | No runtime mirroring and honest directional assets where visible. |
| D33 six manual slots | Use three manual slots plus autosave for the first production build; revisit after mouse-only layout playtest. | Recognizable labels, overwrite confirmation and honest load errors. |
| D33 checksum + staging + per-slot backup + index + two-tab suite | Phase it. First ship deep validation, atomic candidate load, schema migration, stable save gate and one recoverable backup. Add checksum/two-tab hardening before public release, not before the integration slice. | Never mutate live state on load failure; never announce a failed write as saved. |
| Save landmark on every room | Room saveLabel required; landmark optional and derived from a stable named anchor only in large/revisited rooms. Do not author dozens of decorative labels. | No objective/progress text in slots. |
| Runtime camera schema | Strike from release-one implementation until a wider room is approved. | Fixed composed viewpoints and D29 depth/continuity. |
| Room 33 lamp ramp-to-zero | Strike outright. | The accessible tap/ripple gradient and score resolution. |
| Every room has an animated sprite | Treat as a composition review goal with explicit exceptions, not a validator. Coffin, map/title and deliberately held frames need not twitch. | Calm ambient life in ordinary inhabited rooms; motion never signals relevance. |
| Errata measurement rulings 41/42/46/47 as daily canon | Move them to art-tool reference notes. They solved real Room 1 palette failures but should not govern engine work or every future review conversation. | Locked palette, native-scale visual review, reference-family validation where a reference exists. |
| Obsolete docs 11/12/15/20 as coequal binding specs | Mark superseded sections in-file or archive snapshots. D11/12's generated-art path, D15's stale counts/status and D20's old topology should not remain silently active. | Useful historical rationale and content not superseded. |


## 7.1 The minimum production program
Adopt the cross-system integration ruling and add invariant tests before implementing any one bible deeply.
Fix the P0 current defects: pure resolution, one transaction journal, atomic candidate load, real title route, stable save gate and propagated animation cancellation.
Reconcile town topology: add Lower Street/Lane contracts and update Main Street/map validators.
Build one integrated proof action and the Stage Road → Main Street transition with queued save and skip equivalence.
Finish Act I only. Include A5 as puzzle proof, one real dialogue repeat arc, one reversible item transfer, one cutscene checkpoint and one save migration fixture.
Commission/approve a tiny audio proof before promising F2: one MIDI theme, one rendered stem loop, one bar transition, tuning-fork A440, and one live tap gradient auditioned by a human.
Only after a naive player completes Act I without a walkthrough should the 45-puzzle/44-screen bulk plan resume.

# 

8. What is already right—stop refining it
The title, setting and central filing payoff are distinctive. The game has moved beyond 'Monkey Island clone' into an original bureaucratic western comedy. Stop renaming and re-premising it.
The no-death, no-lose, no-unwinnable and no-hint covenant is coherent. It fits the comedy and protects experimentation. Do not reopen it.
The wasted-option doctrine is a real product choice, not inefficiency. Keep the roughly forty-percent non-progress material and the specific-pair → item-pool → global-pool precedence.
Text-only dialogue, speaker-aware spatial presentation, option echo, per-line skip and authored deadpan pauses are the correct performance target. No voice acting is needed.
The 320×200 interface with a 320×144 playfield, locked palette, crisp integer scaling and icon-plus-text inventory identity is settled. Stop revisiting resolution and general UI era.
Walk boxes, feet anchoring, continuous decimation with one measured snap, clip planes, staging marks and reciprocal entrances are the right movement foundation. Finish the lifecycle; do not redesign pathfinding.
The procedural art pipeline, deterministic seeds and native-scale checks are valuable. The current failure is insufficient playable integration, not a lack of more palette metrics.
The validators' honesty is excellent: the puzzle graph check says it traversed nothing instead of manufacturing a pass. Preserve that attitude across new tests.
Main Street's spatial premise—three depths, receding right road, real alley, frontal false fronts—is settled enough. Build Lower Street and the Lane; stop re-rendering Main Street while the exits remain wrong.
Room 1's dramatic beats are known: visible coach association, option echo, delayed departure, Hob crossing, late act card, suitcase ownership. The remaining work is runtime performance, not more concept art.
Stop condition  No new global design ruling until the integrated proof action, canonical street loop and safe save/load/title flow are executable. New findings should enter a finite issue list unless they expose data loss, unwinnability, inaccessible control or a direct canon contradiction.

# 

9. Acceptance checks for the integration contract

## 9.1 Automated
Resolver purity: every dialogue/puzzle/verb resolution leaves flags, room, objects, inventory, ownership and dialogue counts byte-identical until a transaction is reserved.
Root exclusivity: property-based intent sequences never create more than one root atomic operation or more than one body owner per actor.
Exactly-once trace: stage → chore/contact → sound → chore settle → line → line settle/skip → world state → flags → inventory → stable. Every phase marker appears once.
Save sweep: request Save at every tick of echo, pause, silent chore, puzzle action, commit phase, egress, fade and ingress. No unstable snapshot writes; exactly one queued write appears at settle.
Menu liveness: selecting Save during atomic work closes the shell and lets the operation reach its checkpoint. No test can remain paused waiting for itself.
Command policy: Load/Restart candidate failure leaves the live hash unchanged; success swaps once. Quit-to-title does not clear saves. Pending-save choices follow the declared confirmation result.
Watch/skip equivalence compares canonical durable state and final actor/world pose, not transient presentation traces.
Canonical topology rejects all obsolete routes and requires Main Street ↔ Lower Street, Main Street ↔ Lane and Lane ↔ Lower Street reciprocal contracts.
Coffin proof: untouched presentation shows no verb panel; mouse intent reveals accessible controls; watch and skip reach the same E8 checkpoint; menu pause freezes both black-scene and hidden audio transport.
F2 proof with audio muted: sample tail/ripple is monotonic toward the authored void and only the success zone commits. Ambient motion rules do not reject this direct action feedback.
Historical saves: v1 fixtures migrate or fail honestly; unknown IDs never guess; no failed load mutates the live session.
Current 42 unit tests and 24 validators remain, but tests encoding early autosave, immediate mutations, auto-boot load, three vague slots or runner-only cancellation are rewritten—not treated as sacred behavior.

## 9.2 Human proof
Can a naive player perform one full successful action, skip its line, save during it, load afterward and explain exactly what changed without seeing a duplicated/missing beat?
Can the player walk the three-street loop without opening the map and describe where Main Street, Lower Street and the Lane are relative to one another?
Can the player always reach MENU with only the mouse during speech, cutscene and ordinary play without the click also skipping or acting underneath?
Does the save screen behave like a bookmark rather than a puzzle dashboard?
Does the coffin remain unsettling when untouched but immediately become controllable when the player asks for control?
With audio muted, is F2 solvable from direct response without making unrelated scenery wiggle or glow?
After a deliberately failed load and a storage-write failure, does the player still trust the previous bookmark?
After Act I, did the player need a walkthrough because a problem was not advertised, or because a solution was genuinely difficult? Only the first is a design failure.

# 

10. Copy-paste directive for Claude Code
Do not implement docs 29–33 sequentially yet. First implement one
cross-system RuntimeCoordinator and make it the only owner of root operation,
input mode, transaction phase and stable-checkpoint publication.

Binding integration rules:

1. Exactly one root operation exists: stable, freeWalk, dialogue, action,
   transition or cutscene. ChoreHandle, SpeechController, prop tracks and
   AudioDirector cues are children, never competing transaction owners.
2. Resolver code is pure. One immutable TransactionJournal owns every
   durable effect and emits stage -> chore/contact -> sound -> chore settle
   -> line -> world state -> flags -> inventory -> stable exactly once.
3. A dialogue tree owns dialogue counts/node movement. Dialogue presented
   inside a puzzle action owns no puzzle effects. Dialogue tag COMIC and
   PuzzleFeedback COMIC_NOOP are separate namespaces.
4. SaveCoordinator is the only storage writer and only observes published
   StableCheckpoint values. Save during atomic work queues, closes the shell,
   resumes clocks and writes at settle. enterRoom(), dialogue, puzzle,
   sequence and menu code never write storage directly.
5. Load/Restart validate and build a candidate session before one atomic
   swap; they may abandon the entire unsaved live session. Ordinary world
   input cannot cancel a transition after threshold commit. Quit-to-title
   never resets or clears saves.
6. Keep the public sequence language small. Chore-internal body/prop/effect
   tracks may synchronize on one clock; animation emits semantic markers,
   AudioDirector plays sound, and TransactionJournal applies state.
7. Route input in this order: confirmation/shell, active dialogue choice,
   current-line skip, map/panel, world. One event is consumed by one layer.
   The playfield is skip-only during speech, but a reserved mouse-visible
   shell control remains reachable.
8. Adopt errata 43 topology now: 44 screens, Main Street east to Lower
   Street, Main Street alley to the Lane, Lane connected to Lower Street,
   map limited to long-distance travel. Replace stale 42/41 literals.
9. Narrow motion-never-information to ambient/relevance motion. Direct
   action feedback such as F2's sound-equivalent ripple is legal. Strike
   Room 33's puzzle-gated lamp stop. Room 32 is exempt from the animated-
   sprite floor.
10. Coffin contract: four minutes sealed total, with an exact three-minute
    Room 32 black hold after approximately one minute of burial blocking.
    No verb panel. Mouse intent reveals minimal MENU / SKIP SCENE controls.
    Watch and skip land at one E8 checkpoint. Hidden score transport continues
    silently and pauses with the scene if the shell opens.

Implementation order:

A. Add RuntimeCoordinator, TransactionJournal, one input router and clock
   domains, plus illegal-state assertions.
B. Make dialogue/verb resolution pure; move all effects to journal phases.
C. Add ChoreHandle cancellation/settle and remove required-clip fallback.
D. Add stable SaveCoordinator and candidate-world load; wire real title and
   quit navigation.
E. Convert one held-item puzzle success plus Stage Road -> Main Street into
   the integrated proof, including line skip and queued save.
F. Correct the three-street topology and its validators.
G. Finish Act I before populating the full 45-puzzle manifest or building
   horizontal frameworks for Acts II-IV.

Preserve the current strengths: content-driven text, one-click behavior,
specific combination precedence, walk boxes, feet anchoring, decimation,
occlusion, locked palette, integer scaling, no hints/death/timers/lose states,
and authored comic no-ops. Do not rewrite dialogue or puzzle solutions to fit
the current engine.

Report completion only with: root-operation traces; save requests at every
transaction phase; watch/skip byte-equivalent durable state; atomic-load
failure tests; one v1 migration; native-resolution runtime captures; and a
mouse-only title -> play -> save -> load -> quit -> continue route.

# 

Sources and audit trace
[A1] Errata and reconciliation. All rulings through 51, including the guide-adoption and precedence statements.
[A2] Movement and transitions. Binding movement lifecycle, transition commitment and destination-settled autosave.
[A3] Dialogue presentation. Binding speech channel, option echo, transactions, timing, input and dialogue save boundaries.
[A4] Puzzle feel. Binding response classes, success order, PuzzleTransaction and recovery contract.
[A5] Character animation. Binding ChoreHandle, arbitration, skip/cancel, idles and performance coverage.
[A6] Save and shell. Binding stable snapshots, SaveCoordinator, load, title/options and mouse access.
[A7] Puzzle graph. Canonical 45-puzzle outline, Act II interlocks, coffin and F2.
[A8] Liar's Assay. Twenty-four pairs, duel prose, learning and unwritten wrong-answer obligation.
[A9] Room map. Pre-E43 town topology and map rules requiring reconciliation.
[A10] SCUMM deep dive. Earlier object/sequence/camera model and production gate.
[A11] Road to done. Scope inventory, audio risk, content volume and stale status claims.
[A12] Audio design. Themes, room mixes, coffin transport, F2 gradient and tuning arc.
[C1] Sequence runtime. Current six-step duration-based runner and runner-only cancellation.
[C2] Actor runtime. Current walking, special timer, turn and idle redraw behavior.
[C3] Dialogue runtime. Current early writes, boolean exhaustion and immediate node/end movement.
[C4] Verb resolver. Current response precedence and mutation during resolution.
[C5] Game state. Current interaction order, room autosave, save payload and sequential load.
[C6] Game scene. Current input priority, staging, menu/save paths and opening handoff.
[C7] Boot scene. Current auto-load/direct-game startup.
[C8] Save manager. Current v1 schema, shallow validation and three slots.
[C9] Main Street content. Current obsolete east route and missing Lane exit.
[C10] Manifest. Current 16 room entries and empty puzzle manifest.
[T1] Unit tests. Current interface and runtime expectations.
[T2] Save/load tests. Current round-trip and pre-transaction save assumptions.
Audit execution: npm test passed 42/42. npm run validate passed 24/24 and explicitly reported an empty puzzle manifest. npm run typecheck could not start because tsc was not installed in the checkout. No repository files were changed by this audit.
Evidence boundary: This memo audits the repository and its own governing documents. It does not introduce copied Monkey Island content. The proposed integration contract is an original engineering resolution for Consolation and becomes binding only if adopted by the project owner.