> **Provenance.** Produced by ChatGPT from the Monkey Island manual, ScummVM's save layer, the Web Storage and Fullscreen specifications, and an audit of this repository at `0dfd877`, at Tyler's direction, 1 August 2026. Pushed substantially as received.
>
> **Status: binding.** See errata 51.

---

BINDING IMPLEMENTATION FIELD GUIDE
Save, Options and the Game Shell
Monkey Island functional grammar for The Last Claim in Consolation
Prepared for Claude as a persistence, shell, accessibility, and QA contract
Functional reference: The Secret of Monkey Island (1990)
Repository audit: main at 0dfd87705a8f7b22f6f044fbb14cd56521c984d1
Scope: stable snapshots, transactions, slots, load, title, options, fullscreen, quit/restart, versioning, mouse access, and trust

# How to use this guide
Status  This guide is binding for save, load, options, title, pause, restart, and return-to-title behavior. It coordinates docs 29–32; it does not replace their movement, dialogue, puzzle, or animation rules. Errata remains authoritative where it is more specific.
Claude must implement the contract and preserve current foundations identified as correct. Passing today's tests is not proof: several tests currently codify pre-transaction behavior.
The Secret of Monkey Island is a functional reference, not a UI skin or source of names, art, wording, code, or save layout. Copy the grammar of a legible, optional bookmark and a direct player-facing shell—not protected expression.
[S] citations establish historical or platform facts. [R] citations identify repository evidence. Exact fields, slot count, labels, boundary rules, and tests below are original Consolation requirements.
Trust contract  A save is a bookmark at a stable, already-legible world state. It is never a defensive act, a hint, a rollback economy, or a serialization of whatever happens to be in memory this frame. A failed write or load leaves both the previous save and the running game untouched.

# 1. Executive contract
Persist durable game truth plus a stable actor anchor. Do not persist live presentation machinery: paths, animation frames, timers, text holds, pending barks, hover, menus, or half-transactions.
A central SaveCoordinator owns stability. No scene, dialogue runner, puzzle action, transition, chore, shortcut, or menu writes storage directly.
At a stable decision point, save immediately. During free walking, settle on the next foot plant. During an atomic exchange, chore, puzzle transaction, transition, or cutscene, queue the request and write only after its declared checkpoint or final settle.
Autosave only after a stable commit: opening/cutscene checkpoint, destination ingress settle, puzzle commit and settle, or story-bearing dialogue transaction settle. Never autosave an ordinary no-op, bark, idle, or incomplete route.
Load is validate-first and all-or-nothing. Parse, migrate, validate, resolve content IDs, construct a candidate world, and only then replace the live session. Never partly apply a corrupt save.
Provide one rolling autosave and six manual slots. Slots are mouse-navigable and identifiable by an authored place label, stable landmark, play time, and age; they never reveal objectives or hidden progress.
First launch always reaches the title. CONTINUE is dim only when there is no valid compatible candidate. NEW GAME preserves manual slots and clearly warns that it will replace the rolling autosave.
Options are machine preferences, stored separately from saves: text mode, fullscreen state/request, and palette cycling. There is no hint setting, difficulty setting, puzzle highlighting, completion percentage, or objective display.
Fullscreen and every other operation are reachable by a single left-button mouse path. Keyboard controls are conveniences only. Every resize uses centered integer scaling; fractional scaling is forbidden.
Save schemas migrate in explicit, sequential, tested steps. Unknown future versions and corrupt or unmigratable data remain intact and are named honestly; they never masquerade as EMPTY.

# 2. Reference grammar and limits
The 1990 manual defines saving as a way to turn the computer off and later continue in the same place, routes save/load through one callable screen, permits loading after the game is loaded, exposes restart, pause, message-speed adjustment, and cutscene skip, and requires a save description. It also frames conversation choices as safe to experiment with. [S1]
Those details establish the functional center: saving is player-controlled continuity; presentation settings adapt reading; restart and skip are explicit shell actions; and experimentation should not be punished. Consolation keeps that center while replacing keyboard-only access and typed names with mouse-complete controls and automatic, spoiler-free labels.
Modern ScummVM is supporting evidence, not a claim about literal 1990 internals. Its SCUMM save layer carries a format version and save name, rejects unsupported versions, writes play time/date metadata and thumbnails, pauses the engine around saving, and finalizes/checks output errors. [S2] This validates the need for versioned envelopes, recognizable metadata, paused capture, and honest errors.
The web platform adds two constraints. A Web Storage write can throw when persistence is denied or quota is exhausted, so success cannot be announced before the write returns and verifies. [S3] Fullscreen must be requested from a user event and may fail; the UI must reflect the actual fullscreen element rather than a wished-for preference. [S4]
Scope boundary  Consolation does not reproduce MI1's typed save names, F-key dependency, danger-oriented save advice, or any original visual layout. Its save is deliberately safer because this game has no death, timers, lose states, or unwinnable branches.

# 

3. What a save is

## 3.1 Durable payload
Actor position and facing are required because 'same place' means more than the correct room. Save only a planted, legal position. Store a named anchor when available and x/y as fallback; on changed geometry, prefer the migrated anchor, then nearest legal point.
Ownership supersedes the current taken[] shortcut. A suitcase on the coach, in Thad's possession, with an NPC, or removed from play must be unambiguous without deriving ownership from several unrelated collections.
Dialogue progress is a count map, not the current string[] taken set. This is required by doc 30's repeat/exhaustion contract and preserves greyed or absent options exactly at a stable decision point. [R3]
A save is data, not a screenshot. An optional tiny preview may be stored as replaceable metadata later, but no load decision or migration may depend on it.

## 3.2 Deliberately not saved
Default policy  The initial release has no resumable mid-transaction save. A future sequence may declare named stable checkpoints, but adding one requires explicit final-state semantics, migration, and tests. Never infer a checkpoint from a frame index or elapsed time.

# 

4. Stability and save timing

## 4.1 Stable boundary vocabulary
Only one pending manual request exists. If a second slot is chosen before the first writes, replace it only after an explicit mouse confirmation; otherwise keep the first request.
While queued, show SAVING AFTER THIS MOMENT. Do not close with SAVED until storage write, read-back, and validation succeed. If the player returns to title first, complete the current atomic boundary, perform the queued save, then leave.
Closing the tab or losing power during an unstable interval writes nothing. The prior verified autosave and manual slot remain the recovery point.
Line skip accelerates presentation but does not bypass the stable boundary. It completes required chore/transaction markers once, commits in canonical order, settles, then releases the queued save. [R3–R5]

## 4.2 Autosave policy
Maintain one rolling autosave/continue slot. It is read-only in the Save screen and visible first in Load.
Eligible events are: NEW GAME's opening-start checkpoint; a declared cutscene checkpoint/final state; completed opening; destination transition settle; successful puzzle transaction settle; and story-bearing dialogue commit at a stable choice/end point.
Do not autosave on ordinary walking, entering the pause menu, option changes, palette/idle updates, failed or comic no-op interactions, ambient barks, every dialogue line, or before a transaction's visible result.
Coalesce duplicate autosaves with the same semantic revision and location. A failed autosave leaves the prior autosave valid and shows a non-blocking SAVE FAILED notice once; it does not interrupt play or touch manual slots.
Doc 29's destination-settled autosave and doc 31's post-commit autosave are binding. Current enterRoom() writes during state change and must no longer own persistence. [R2, R4]

## 4.3 Stable snapshot coordinator
type Stability =
  | { kind: "stable"; checkpoint: StableCheckpoint }
  | { kind: "settlingWalk" }
  | { kind: "atomic"; owner: "dialogue" | "puzzle" | "chore" |
      "transition" | "cutscene"; next: string };

interface SaveCoordinator {
  stability(): Stability;
  requestManual(slot: number): SaveRequest;
  requestAutosave(reason: StableReason): SaveResult;
  publishStable(checkpoint: StableCheckpoint): void;
  cancelPending(reason: "newGame" | "load" | "storageUnavailable"): void;
}

type SaveRequest =
  | { status: "written"; saveId: string }
  | { status: "queued"; slot: number; after: string }
  | { status: "failed"; error: SaveError };
Architecture rule  GameState supplies durable state; Actor, DialogueRunner, transaction/sequence systems, and transition coordinator supply stable participants. SaveCoordinator is the only capture/write gate. Ctrl+S, menus, autosave hooks, and tests all call it.

# 

5. Slot presentation

## 5.1 Count and order
Provide six manual slots. Load displays CONTINUE/AUTOSAVE first, then slots 1–6. Save displays slots 1–6; the rolling autosave cannot be overwritten manually.
Six gives a modest bookmark history without turning save management into a game system. It fits a dedicated 320×200 shell screen with scrolling arrows if localized text increases row height.
A manual slot is selected with one click. An occupied slot opens an OVERWRITE? confirmation showing its existing summary; OVERWRITE and CANCEL are separate full hit targets. Empty slots save directly.
A Load click opens LOAD THIS BOOKMARK? unless the current session is still at its initial checkpoint. The dialog says that progress after that bookmark will be left behind; it never uses death/failure language.

## 5.2 Automatic names
Typing cannot be required because the game is mouse-only. Each room authors a short saveLabel and named stable anchors author a saveLandmark. The shell composes two compact lines:
1  MAIN STREET
BY THE HOTEL  ·  1H 42M  ·  20M AGO

CONTINUE  —  STAGE ROAD
AT THE COACH  ·  12M  ·  JUST NOW
Use the place the player can already see and an ordinary physical landmark, not an act title, chapter label, objective, puzzle percentage, inventory clue, flag name, or future location.
Every one of the 42 rooms must declare saveLabel. Large/revisited rooms declare stable saveLandmarks by anchor/zone. Validation rejects a reachable stable checkpoint with only an internal room id.
Show total play time and content-authored relative age. Current relative-time strings and dim empty rows are useful; preserve them. Do not rely on 'Main Street' alone. [R7, R8]
Empty rows remain visible and dim as EMPTY. Corrupt, unsupported-newer, and migration-failed rows remain visible with honest status and a DETAILS/BACK route; they are not labeled EMPTY and are not overwritten without confirmation.

## 5.3 Save recognition is not a hint
The label is captured from the stable location already rendered when the save was made. If an object later changes, the slot does not narrate that change.
No quest status, trial count, reputation interpretation, unresolved-object indicator, recommended route, or completion percentage appears anywhere in title, slot, pause, or options UI.
Optional thumbnails may be added only after the text design passes at 320×200. They are disposable display metadata, palette-safe, and cannot replace the authored label/landmark.

# 

6. Load contract

## 6.1 Validate before mutation
Freeze world input and deterministic clocks. Leave the current rendered session intact behind the shell.
Read the chosen raw envelope without altering or deleting it. Parse it into unknown data and classify: empty, valid, corrupt, incompatible-newer, migration-failed, or content-missing.
Run sequential pure migrations on a copy. Deep-validate scalar types, finite numbers, arrays, counts, ownership uniqueness, and every room/object/item/dialogue/flag/anchor id against current content.
Build a candidate GameState, DialogueProgress, actor placement, room participants, and stable sequence checkpoint off the live state. Preload required room assets.
Cancel live handles as a load-abandon operation without committing their pending transaction. Do not reuse the half-mutated actors, dialogue queue, menu, or transition objects.
Atomically swap in the validated candidate, place the actor at the migrated stable anchor/coordinates and facing, reset transient UI, render one complete frame, then unfreeze input.
Only after the first valid frame show RESTORED. On any error, keep the old session and Load screen exactly usable, show the classified error, and preserve the raw save.
No partial apply  The current load restores flags and dialogue before assigning the room and collections. That is not atomic. A later error or future participant failure could leave the running game half old and half loaded. Candidate construction plus one swap is mandatory. [R6]

## 6.2 Replays and partially seen cutscenes
A stable gameplay save loads directly into its settled room and actor pose. It does not replay the arrival walk, puzzle chore, successful line, item handoff, fade, or completed cutscene.
There is no save inside an undeclared cutscene interval. If the browser closes during it, Continue returns to the last checkpoint: usually cutscene start, so the seen portion may replay; or a specifically authored internal stable checkpoint, so replay begins there.
A manual save requested during a cutscene waits for its next checkpoint/final settle. Whole-cutscene skip executes the same must-run effects and lands on the same checkpoint before the save writes. [R3–R5]
The opening-start checkpoint is autosaved when NEW GAME begins. The opening-complete checkpoint replaces it after the handoff. If interrupted between them, Continue restarts the opening from its stable start; it never resumes over a half-visible line or act card.
A stable interactive dialogue choice point may load with the tree open and identical option counts/scroll. A completed exchange never replays its selected option or reply.

## 

6.3 Load failure language

# 

7. Save format and compatibility

## 7.1 Versioned envelope
interface SaveEnvelopeV2 {
  format: "the-last-claim-save";
  schemaVersion: 2;
  contentVersion: string;
  createdByBuild: string;
  saveId: string;
  kind: "autosave" | "manual";
  slot: number | null;
  savedAtEpochMs: number;
  playTimeMs: number;
  checksum: string;                 // integrity, not security
  display: {
    place: string;
    landmark: string;
  };
  checkpoint: {
    id: string;
    roomId: string;
    sequenceId?: string;
  };
  state: {
    flags: Record<string, boolean | number>;
    inventory: string[];
    reputation: number;
    objectStates: Record<string, string>;
    ownership: Record<string, string>;
    actor: {
      id: "thad";
      x: number; y: number;
      facing: "front" | "back" | "left" | "right";
      surface: "mud" | "boardwalk";
      anchorId?: string;
    };
    dialogue: {
      counts: Record<string, Record<string, number>>;
      treeId: string | null;
      nodeId: string | null;
      optionScroll: number;
    };
    gameSeed: number;
  };
}

## 7.2 Migration and integrity rules
Keep pure migrateV1ToV2, migrateV2ToV3, and so on. A migration accepts unknown parsed data, produces the next schema on a copy, records diagnostics, and never overwrites the source until the final candidate validates and writes successfully.
Exact current version equality is not migration. Replace the current reject-all-version-mismatch behavior with a registry. Unknown future versions are unsupported; old supported versions traverse every step in order. [R5]
Flag restore keeps its good forward pattern—reset new fields to canonical initial values and ignore removed unknowns—but it must validate every known flag's boolean/integer type. Renamed flags, rooms, objects, items, anchors, trees, nodes, and options require explicit maps. [R1]
Never guess a replacement for a missing semantic id. If no migration exists, preserve and classify the save as content-missing or migration-failed.
Compute the checksum over a canonical serialization of the envelope without checksum. It detects truncation/tampering but is not authentication. Deep structural/content validation is still required.
Write the complete JSON to a staging key, read it back, parse and validate it, then copy it to the target with the previous target retained as a backup. Report success only after target read-back. Catch quota/security errors. Web Storage's single setItem operation cannot partly change its one key on failure, but it is not required to prove bytes reached disk. [S3]
Keep one verified backup per target key and a small slot index. On load, offer the backup only after the target fails and label it OLDER BACKUP; never silently substitute it.

## 7.3 Settings are a separate schema
interface MachineSettingsV1 {
  format: "the-last-claim-settings";
  schemaVersion: 1;
  textMode: "slow" | "normal" | "fast" | "manual";
  paletteCycling: boolean;
  fullscreenPreferred: boolean;
  speakerLabels?: boolean;
  highContrastSpeech?: boolean;
}
Settings load before title and apply field-by-field with safe defaults. A corrupt setting must not block any save or game start.
FullscreenPreferred records intent only. Actual state comes from document.fullscreenElement/fullscreenchange; entering fullscreen still requires a fresh pointer event and may fail. [S4]
Do not place settings in a save envelope, and do not clear them on NEW GAME, restart, slot overwrite, or return to title.

# 

8. Title, pause, options, restart and quit

## 8.1 Boot and title
BootScene must stop auto-loading the autosave and starting GameScene. It loads content, settings, and slot metadata, then enters a real TitleScene/ShellScene. [R11, R15]
CONTINUE chooses the newest valid compatible autosave or manual slot by savedAt, with deterministic slot tie-break. If no autosave exists but a newer manual save does, Continue may use it because the displayed summary names the candidate before click.
NEW GAME when any save exists opens: START A NEW GAME? CONTINUE WILL BE REPLACED. MANUAL SAVES STAY. NEW GAME and CANCEL are clickable. It resets runtime world, not settings or manual slots, then writes opening-start autosave.
Do not expose chapter names: the game has none in the player shell. The title and save screen must not invent them.

## 8.2 Pause/game menu
MENU remains in the verb panel's fourth row. Opening it pauses world, actor, dialogue hold, chore/sequence, ambient, and palette-cycle clocks without changing their order. It blocks room input; shell input stays live.
Root order: RESUME, SAVE, LOAD, OPTIONS, RESTART FROM BOOKMARK, QUIT TO TITLE. SAVE may display WAITING FOR THIS MOMENT while an atomic owner is active; it must never pretend the unstable snapshot is available.
RESTART FROM BOOKMARK means load the current Continue candidate and requires confirmation. NEW GAME remains a title action so restart and reset are not ambiguous.
QUIT TO TITLE requires confirmation. It completes or safely abandons according to the same transaction rule, returns to title, preserves manual saves and settings, and never calls GameState.reset() as a substitute for navigation.
A browser build does not claim it can close the tab. There is no misleading QUIT GAME at title; leaving the page remains the browser's responsibility.

## 8.3 Options
Remove the current inert Window scale row. Windowed and fullscreen layouts both choose the largest centered integer zoom that fits; never stretch or fractionally resample. [R8, R10]
Add a FULL button to the unused third cell of the verb panel's fourth row as errata 39 requires. The Options row and panel button share one FullscreenController and actual-state event source. [R9]
Rename current Background motion to PALETTE CYCLING so players do not expect it to suppress actors, lamps, horses, or crowd idles.
No HINTS, DIFFICULTY, PUZZLE ASSIST, OBJECT HIGHLIGHT, QUEST LOG, TIMER, IRONMAN, or completion setting exists now or later without a new binding ruling.

## 8.4 Mouse-only and accessibility
Every title row, slot, scroll arrow, BACK, confirmation, settings value, MENU, FULL, and error-details route has a visible click target. No operation requires Escape, Enter, F5, Ctrl+S, Ctrl+L, wheel, hover-only discovery, or typing.
Single left-click activates. Right-click remains convenience per errata 28b and may not be required for the shell. A click never both dismisses a menu and acts on the room beneath it. [R9]
At 320×200 shell resolution, use the existing bitmap font at its tested legible size, generous row spacing, distinct selected/disabled/error colors, and arrows when rows exceed the panel. Do not shrink text to fit six slots.
Text mode is reachable from the title before any cutscene. Manual mode requires an explicit click to advance each utterance; line skip remains per utterance and transactions still complete safely. [R3]
Fullscreen failure and external exit are visible. Mouse users can always return to windowed mode through the same FULL/Options route when fullscreen is active.

# 

9. Runtime sequence

## 9.1 Manual save
Player opens MENU with the panel button; the shell pauses eligible clocks and takes exclusive pointer routing.
Player clicks SAVE, then an empty slot or confirms overwrite. MenuSystem emits a SaveIntent; it never emits SAVED itself.
SaveCoordinator asks every participant for Stability. If free-walking, request planted settle. If atomic, record one pending slot and show SAVING AFTER THIS MOMENT.
At the next published stable checkpoint, capture one immutable snapshot from all participants. Assert no live utterance, transaction, path, transition, chore, or uncommitted write.
Generate non-spoiler display metadata, envelope fields, canonical JSON, and checksum. Validate the candidate before storage.
Write staging, read/validate staging, retain previous target backup, write target, read/validate target, then clear staging. On any error, preserve old target and report failure.
Only now show SAVED and return to the prior shell/game state. If queued, do not steal control at the boundary; show a brief non-blocking confirmation.

## 9.2 Autosave
A canonical system publishes a stable event with semantic revision and reason after its final settle.
SaveCoordinator ignores ineligible reasons and coalesces an unchanged revision.
It captures through the same participant, validation, staging, verification, target and backup pipeline as manual save.
Failure preserves the last autosave and posts one non-blocking notice. Gameplay continues; no retry loop runs every frame.

## 9.3 Load
Player selects a valid compatible slot and confirms. LoadCoordinator freezes shell/world input and retains the live session.
Read, classify, copy, migrate, deep-validate and resolve content. Failure returns to the same Load page without changing live state or raw storage.
Construct candidate world/room/dialogue/actor state and preload assets. Verify stable checkpoint and legal position/facing.
Cancel the abandoned live runtime without committing its pending actions. Atomically swap candidate participants.
Reset transient UI, derive scale/ambient/music from stable state, render one complete frame, close shell, unfreeze input, then show RESTORED.
TITLE -> NEW GAME -> opening:start autosave -> CUTSCENE
  -> opening:done autosave -> FREE CONTROL

FREE CONTROL --manual--> WRITE NOW
FREE WALK --manual--> FOOT PLANT -> WRITE
AT DIALOGUE CHOICE --manual--> WRITE NOW
ATOMIC EXCHANGE / PUZZLE / CHORE / TRANSITION / CUTSCENE
  --manual--> QUEUED -> NEXT DECLARED STABLE -> WRITE

LOAD: RAW -> CLASSIFY -> MIGRATE COPY -> DEEP VALIDATE
  -> BUILD CANDIDATE -> ATOMIC SWAP -> FIRST FRAME -> RESTORED
  any failure ---------------------------------> LIVE GAME UNCHANGED

# 

10. Current-build audit

## 10.1 Already right—preserve these
FlagStore has a compact typed boolean/integer model and restore begins from canonical defaults, so newly added flags can receive their initial value while removed unknown keys disappear. Preserve that shape and add runtime value-type validation. [R1]
SaveManager already abstracts StorageLike, supports memory-backed tests, separates autosave from manual slot keys, records savedAt, and refuses malformed top-level JSON rather than throwing through rendering. [R5]
GameState already includes room, ordered inventory, reputation, object states, taken ownership, flag snapshot, dialogue progress and dialogue position. These are a useful subset of the required durable payload. [R6]
The current shell is data-driven: player-facing menu/title strings live in JSON, MenuSystem is renderer-independent, disabled rows stay visible and dim, relative time is content-authored, and every implemented route has a mouse path. Preserve this architecture. [R7, R8]
The title content already defines NEW GAME, CONTINUE, OPTIONS and CREDITS, including a disabled CONTINUE color. The missing part is a real title runtime, not a content rewrite. [R12]
main.ts already renders a 320×200 canvas with crisp pixels and computes an integer zoom on resize. Preserve the integer-only calculation and center/letterbox it in fullscreen. [R10]
Palette cycling is already decorative, default-on, toggleable in memory, and tested. Keep its semantics while persisting the setting separately and naming it precisely. [R7, R8]
At the audited commit, all 42 unit tests and all 24 content validators pass. They establish useful regression coverage, not transaction-safe persistence.

## 10.2 Failing the binding contract
Audit verdict  The current build has a promising small save core and an unusually good content-driven mouse menu. It is not yet safe under the transactional contracts introduced by docs 29–32, and the boot/title/quit path is still a placeholder.
Local TypeScript type checking was not independently completed because the workspace's installed dependencies did not provide a runnable tsc binary. The unit and validator results above are exact; no typecheck pass is implied.

# 11. What a naive implementation gets wrong

# 

12. Implementation order
Freeze and document current v1 fixtures before changing them. Add a load-status classifier so invalid no longer equals empty.
Introduce SaveEnvelopeV2, deep validators, content-ID validation, sequential migration registry, canonical serialization/checksum, staging/read-back/backup, and typed results. Keep raw v1 fixtures and migration tests permanently.
Replace taken[] with ownership while migrating old saves; replace dialogue taken arrays with per-option counts through doc 30's data model. Add stable checkpoint and actor placement participants.
Create SaveCoordinator and Stability publishers. Route manual, shortcut and autosave calls through it; remove persistence from GameState.enterRoom and pre-commit code.
Implement candidate-world loading and one swap. Make afterLoad consume saved actor pose rather than placeIn(room entrance). Reset only ephemeral UI.
Implement six-slot shell rows, autosave load row, automatic labels/landmarks/play time, overwrite/load confirmations, honest errors, pending-save notice and verified success notices.
Build TitleScene/ShellScene. Boot goes to title; Continue resolves valid candidate; New Game preserves manual saves/settings and replaces autosave only after confirmation; Quit to Title becomes navigation.
Add versioned machine settings. Wire doc 30 text modes, precise palette-cycling toggle, and one FullscreenController to Options and the verb-panel FULL button. Remove inert Window scale.
Make shell pause/input ownership explicit and mouse-complete. Add accessibility/status semantics and native-resolution capture tests.
Run all checks below, restore a complete TypeScript toolchain for typecheck, and perform migration/load interruption playtests before considering persistence shippable.

# 

13. Automated acceptance checks

## 13.1 Snapshot and boundary checks
A stable free-control manual save writes immediately; a free-walk request first reaches a planted legal coordinate and saves that coordinate/facing.
Save requested at every tick of selected-option echo, reply, pause, silent shrug, action chore, success line, object/flag/inventory commit, egress, threshold, fade, ingress and cutscene writes no unstable payload. It writes exactly once at the declared stable boundary.
Watching versus line-skipping or whole-sequence-skipping yields byte-equivalent durable state at the same checkpoint, apart from savedAt/playTime/saveId metadata.
Autosave event trace occurs only after opening/cutscene checkpoint, destination ingress settle, puzzle settle, or configured story-dialogue settle; no-op/comic action, bark, idle, menu, option and ordinary walking do not autosave.
A queued manual write failure preserves the previous target and backup and reports failure; it never emits SAVED.
Snapshots contain no live path, animation/talk/idle/palette timer, ChoreHandle, utterance queue, hover, held item, selected verb, menu page or uncommitted transaction field.

## 13.2 Round-trip and migration checks
Round-trip restores flags, room, ordered inventory, reputation, object states, unique ownership, actor planted x/y/facing/surface, stable checkpoint, dialogue per-option counts/tree/node/scroll, game seed and play time.
Load restores the actor at the saved legal anchor rather than the room entrance and does not replay the arrival, previous line, puzzle chore, item transfer or completed cutscene.
Loading from a stable dialogue choice reproduces exact visible option ordering, grey/exhausted state, counts and scroll; no selected-option echo or reply replays.
Every historical fixture migrates one version at a time and validates. New flags receive defaults; renamed semantic IDs use explicit maps; removed unknown fields do not leak into current state.
Unknown future version, corrupt JSON, wrong nested type, NaN/infinite number, duplicate inventory, duplicate ownership, unknown room/item/object/flag/tree/node/option/anchor and bad checksum are classified distinctly and never mutate or delete the current game/save.
If target is corrupt but verified backup is valid, the UI offers OLDER BACKUP explicitly; it never loads it silently.

## 13.3 Shell and settings checks
Fresh boot renders title, does not start GameScene/opening, and shows CONTINUE visible but dim. Returning boot renders title and does not auto-load.
CONTINUE enables only for a valid compatible candidate, displays its place/landmark, and deterministically selects the newest candidate. Invalid/incompatible rows remain visible with status.
NEW GAME confirmation preserves six manual slot byte strings and machine settings, replaces only autosave, and produces canonical starting state/opening checkpoint.
QUIT TO TITLE and RESTART FROM BOOKMARK are confirmed, clickable, and do not call reset/clear as navigation. Load failure returns to the same shell with live world unchanged.
Six manual rows plus autosave load row are reachable at 320×200 without shrinking the bitmap font; all scroll/back/confirm/error routes respond to left click.
Occupied manual slot requires overwrite confirmation; empty slot does not. SAVED appears only after verified write; RESTORED appears only after first valid loaded frame.
Text mode persists outside save slots and exactly matches doc 30. Palette cycling persists, defaults on, and changes only cycling. Loading another slot does not alter either setting.
Options fullscreen and panel FULL share actual state. requestFullscreen is invoked within the click handler; fullscreenchange updates both; denial leaves windowed state and shows an error. External Escape/exit is reflected.
At every viewport tested, zoom is an integer, nearest-neighbor pixels remain exact, canvas is centered/letterboxed, and no fractional CSS or backing-store scale is used.
Pointer routing proves a menu click cannot pass through to walk/interact/skip. With all keyboard events disabled, a player can title → new game → options → play → save → overwrite → load → restart → quit to title → continue.
Static/content scans reject hint, difficulty, quest, objective, completion and puzzle-status fields/rows, and reject slot labels derived from unseen flags or puzzle state.

## 13.4 Storage fault injection
Inject setItem failure at staging, backup, target and cleanup; inject quota/security exception, truncation, stale index and read-back mismatch. The previous verified target remains loadable or is offered as backup, never overwritten by a false success.
Refresh/close at every write stage and transaction tick. On restart, at least one previously verified save remains classified and loadable; no half-envelope is selected as Continue.
Run two-tab storage-event tests. A slot list may refresh metadata, but a running world never hot-loads another tab's save and never loses its pending confirmation.
Retain the current 42 unit tests and 24 validators, updating assertions that intentionally encode three slots, auto-boot load, immediate quit-reset, taken-option sets or pre-settle autosave. Add the new contract tests; do not merely delete old failures.
Run npm run typecheck in a complete dependency install before merge. The audit's missing tsc executable is not a waiver.

# 

14. Human playtest protocol
Test first launch, returning play, and intentionally damaged saves with only a mouse. Observe before explaining the rules.
On first launch, what did you expect NEW GAME and CONTINUE to do? Was it clear why CONTINUE was unavailable?
Looking at six saves from repeated visits to the same street, can you identify the one you want without chapter names, objectives, or screenshots? Which part of the label helped?
Did any slot label tell you what to do next or reveal progress you had not noticed? If yes, remove that information.
Click Save while Thad is walking. Did the small settle feel natural, and did loading return to that same visible place and facing?
Request Save during a dialogue reply, shrug, puzzle success, transition, and cutscene. Did SAVING AFTER THIS MOMENT explain the delay? Did SAVED appear at the moment you trusted?
Skip the line/scene after requesting Save, then load. Did you see exactly one coherent outcome, with no repeated line, missing item, duplicate item, or wrong object pose?
Overwrite a slot. Was the old target unmistakable, and could you cancel with the mouse without accidentally saving?
Load an older bookmark. Did the warning explain that later progress would be left behind without making experimentation feel dangerous?
Start NEW GAME with existing saves. Was it clear that Continue changes but manual saves remain? Verify that you can load the old game afterward.
Quit to title during ordinary play and after an atomic moment. Did any save disappear? Did the title feel like navigation rather than a reset?
Change text speed, palette cycling, and fullscreen; load several slots and start a new game. Did every preference remain yours rather than belonging to a slot?
Enter and exit fullscreen using only on-screen controls. When the browser denied/exited fullscreen, did the game tell the truth and remain usable?
With the keyboard unavailable, can you reach every title, save, load, overwrite, error, options, restart, and quit route? Did any hover-only or tiny target block you?
Open a deliberately corrupt, old, and newer-version save. Did the game distinguish them from EMPTY, preserve them, and leave the running game untouched?
After ten minutes of trying deliberately silly actions, did autosave behavior ever make you feel you should stop experimenting or manage saves defensively?
Pass standard  The player treats saving as a quiet bookmark: recognizable, mouse-complete, honest when delayed or broken, stable across updates, and irrelevant to puzzle strategy. No load can produce a hybrid world or erase the last trustworthy recovery point.

# 

15. Copy-paste directive for Claude
Use this instruction with the repository  Treat this document as binding for save, load, title, pause, options, restart, quit-to-title, versioning, fullscreen, and mouse access. Preserve canonical writing, puzzle recoverability, transactional ordering, procedural art, and the foundations named in section 10.1.
Before editing, inspect docs/29-movement.md,
docs/30-dialogue-presentation.md, docs/31-puzzle-feel.md,
docs/32-animation.md, docs/00-errata.md rulings 26, 28b, 29, 39,
45, 48 and 50, engine/core/FlagStore.ts, SaveManager.ts,
GameState.ts, DialogueRunner.ts, MenuSystem.ts, Sequence.ts, Actor.ts,
engine/scenes/BootScene.ts and GameScene.ts, engine/render/Renderer.ts,
engine/main.ts, content/ui/menu.json, content/ui/title.json, and the
existing save/interface tests.

Treat the Save, Options and Game Shell Bible as binding.

1. Produce a current-code gap table against sections 3-13 and preserve
   everything in section 10.1.
2. Implement SaveEnvelopeV2, deep/content validation, pure sequential
   migrations, typed load status, canonical checksum, staging/read-back,
   one verified backup, and honest error presentation. Preserve raw
   unreadable/newer saves; never call them EMPTY.
3. Introduce SaveCoordinator as the only write gate. Save immediately
   only at a stable checkpoint; settle free walking at a foot plant;
   queue during dialogue exchanges, chores, puzzle transactions,
   transitions and cutscenes until their next declared stable boundary.
4. Persist durable flags, room, ordered inventory, reputation, object
   states, general ownership, stable actor position/facing/surface/anchor,
   game seed, checkpoint, dialogue per-option counts/tree/node/scroll,
   saved time and play time. Persist none of the transient fields listed
   in section 3.2.
5. Make load parse, migrate, deep-validate, resolve content and build a
   candidate world before one atomic swap. On any failure, keep the live
   game and raw save unchanged. Restore a stable pose without replaying a
   line, chore, arrival, transaction or completed cutscene.
6. Route doc 29 destination-settled, doc 31 puzzle-settled and configured
   dialogue/cutscene checkpoints through the same autosave pipeline. Do
   not autosave no-ops, barks, idles, option changes or ordinary walking.
7. Provide one rolling autosave and six manual slots. Author room
   saveLabel and stable saveLandmark data. Show place, landmark, play
   time and age; require overwrite/load confirmation; never show
   chapters, objectives, hints, percentages or puzzle state.
8. Build a real TitleScene/ShellScene. Boot always reaches title.
   CONTINUE uses the newest valid compatible candidate. NEW GAME keeps
   manual saves/settings and replaces autosave only after confirmation.
   QUIT TO TITLE navigates and never resets/clears as a side effect.
9. Persist versioned machine settings separately: doc 30 text mode,
   palette cycling, fullscreen preference/actual-state handling, plus
   only approved accessibility fields. Remove inert Window scale and
   add the binding verb-panel FULL button.
10. Make the shell pause eligible clocks, own pointer routing, and expose
    every route by single left-click without any keyboard, hover, wheel
    or typing requirement. Preserve 320x200 UI, 320x144 scene, locked
    palette, nearest-neighbor drawing and integer scaling only.
11. Implement every automated check in section 13 and run section 14's
    mouse-only playtests, including fault injection and historical save
    fixtures. Run unit, validation and TypeScript checks in a complete
    install.

This game has no death, timers, lose states, unwinnable states, hint
system or difficulty setting. Saving is a bookmark, never defense or
puzzle information. Do not serialize live memory, write mid-transaction,
guess renamed IDs, announce success before verification, auto-load at
boot, auto-enter fullscreen, or let quit/reset destroy Continue.

Do not call the work complete because JSON parses or today's save tests
pass. Demonstrate the same durable result for watch versus skip at every
transaction phase; exact actor placement after load; zero live-state
mutation on every load failure; a v1-to-current migration; recoverable
storage failures; first-launch/title/new-game/continue/quit behavior;
and the complete mouse-only route.

# 

Sources
[S1] The Secret of Monkey Island original manual. Primary player-facing evidence for save/load continuity, named saves, restart, pause, message speed, cutscene skip, and safe dialogue experimentation.
[S2] ScummVM SCUMM save/load implementation. Executable preservation reference for versioned save headers, names, play-time/date metadata, thumbnails, engine pause, output finalization/error checks, and unsupported-version rejection.
[S3] WHATWG HTML: Web storage. Primary platform specification for setItem behavior and QuotaExceededError when a value cannot be stored.
[S4] MDN: Guide to the Fullscreen API. Platform guidance for event-handler activation, fullscreenchange/actual-state detection, exit, and failure handling.
[R1] Consolation FlagStore. Current typed flag definitions, snapshot, and reset-then-restore behavior.
[R2] Consolation movement bible. Binding transition state machine and destination-ingress-settled autosave.
[R3] Consolation dialogue presentation bible. Binding dialogue transactions, per-option counts/scroll, text modes, line skip, cutscene skip, and stable dialogue saves.
[R4] Consolation puzzle-feel bible. Binding successful-action transaction and post-commit/settle autosave.
[R5] Consolation animation bible. Binding ChoreHandle/checkpoint rule and stable-state requirement during atomic animation.
[R6] Consolation GameState. Current save payload, sequential live restore, reset behavior, and transition autosave ownership.
[R7] Consolation MenuSystem. Current data-driven mouse menu, slot display, volatile toggles, immediate notices, and quit action.
[R8] Consolation menu content. Current three-slot presentation, relative time strings, root/options rows, and mouse-only intent.
[R9] Consolation errata. Binding verb-panel, click-model, fullscreen/integer-scaling, and prior-bible rulings.
[R10] Consolation engine entry point. Current native 320×200 canvas and resize-time integer zoom.
[R11] Consolation BootScene. Current automatic load and direct GameScene start.
[R12] Consolation title content. Existing title choices and disabled-Continue color without a corresponding title runtime.
[R13] Consolation SaveManager. Current v1 envelope, storage abstraction, three manual slots, timestamps, shallow validation, and exact-version check.
[R14] Consolation DialogueRunner. Current taken-option progress, position restore, and early flag/item effects.
[R15] Consolation GameScene. Current shortcut/menu save-load paths, afterLoad entrance placement, autosaves, and reset-as-quit placeholder.
[R16] Consolation Renderer. Current menu rendering, disabled-row treatment, panel geometry, and unused fourth-row cell.
[R17] Consolation save/load tests. Current round-trip, corrupt-save refusal, transition autosave, and reset expectations.
[R18] Consolation interface tests. Current mouse-route, slot-room, palette-cycling, title/opening content, and menu expectations.
Evidence note: The historical and platform sources establish functional constraints. The stable-boundary policy, six-slot design, automatic landmark labels, schema, coordinator, migration rules, runtime order, and acceptance tests are original requirements for Consolation—not claims about literal 1990 source identifiers or UI.

**Table 1**

| Domain | Saved truth | Validation / restoration rule |
|---|---|---|
| Identity | format id, schema version, content version, build id, save id, kind/slot, timestamps, play time | Exact types; future schema is incompatible, not empty; build id is diagnostic, not a load gate |
| World | typed flag store, current room, stable sequence/cutscene checkpoint, world/game seed | Known IDs and declared value types; new flags receive canonical defaults through migration |
| Player | ordered inventory, reputation, actor x/y, facing, surface, stable anchor id with coordinate fallback | Position lies in room walkbox or resolves to safe anchor; derived scale is recomputed from room depth |
| Objects | object state and general ownership map | Owner is room, inventory/player, NPC, container, or removed; one object has one owner |
| Dialogue | per-option selection counts; stable tree/node decision point; option scroll index | No active utterance or queued reply; counts are finite non-negative integers; node/options exist after migration |
| Story | puzzle attempt counters and durable one-shot completion represented by typed flags/state | No separate mystery fields; semantic state has one authoritative owner |
| Recognition | authored save label/landmark snapshot plus last-seen room name | Display metadata is non-authoritative and may be regenerated; never contains unseen state or objectives |

**Table 2**

| Do not persist | On load |
|---|---|
| Current animation cell, tick, ChoreHandle, talk loop, idle phase/opportunity, lamp/horse phase, palette-cycle phase | Rebuild the room in a declared stable pose; deterministic ambient schedules restart or derive from game seed without signaling story state |
| Walking path, velocity, half-turn, transition threshold, fade alpha, camera tween | Place at stable saved actor anchor; no route or fade replays |
| Visible utterance, remaining text hold, reply pause, bark queue, pending selected-option echo | Restore a stable dialogue decision point or completed tree; no spoken line replays |
| Uncommitted puzzle/dialogue writes, reserved transaction, pending inventory mutation | They do not exist in a saved payload; the queued save waits for commit/settle |
| Hovered hotspot, sentence-line preview, selected verb, held item, inventory hover/scroll, pointer coordinates | Reset to Walk to, no held item, top inventory page, no hover; these are safe interaction defaults |
| Menu page, confirmation modal, notice timer, keyboard state, focus hover | Close shell overlays after successful load; keep the Load screen open on failure |
| Text speed, fullscreen preference/state, palette cycling | Read separately from versioned machine settings; one slot never changes another player's reading/display preference |
| Wall-clock timers, sound position, transient music cue, cache, dirty rectangles | Reconstruct from the stable room/story state; music begins at its room/cutscene policy |

**Table 3**

| Runtime condition | Stable? | Manual save request |
|---|---|---|
| Free control; actor planted; no live exchange/transaction/transition | Yes | Capture and write immediately |
| Ordinary free walking | Not yet | Request a foot-plant settle, discard remaining path, then capture |
| Dialogue option list awaiting choice | Yes | Save immediately, including tree/node, option counts and scroll |
| Selected-option echo, reply, pause, silent chore | No | Queue one request; write at next choice point or tree end after the dialogue transaction commits |
| Puzzle/action chore or success line | No | Queue; finish the exact doc 31 transaction and settle before capture |
| Room transition/ingress/egress/fade | No | Queue; write destination only after ingress settles |
| Non-interactive cutscene | No | Queue; write at the next declared checkpoint or final settled state |
| Pause/options overlay at a stable state | Yes | World clocks are paused; capture stable world, not overlay state |

**Table 4**

| State | Player-facing result |
|---|---|
| Corrupt | THIS BOOKMARK COULD NOT BE READ. IT WAS NOT CHANGED. |
| Newer schema | THIS BOOKMARK WAS MADE BY A NEWER BUILD. UPDATE THE GAME TO OPEN IT. |
| Migration failed | THIS OLDER BOOKMARK COULD NOT BE UPDATED. IT WAS NOT CHANGED. |
| Missing content id | THIS BOOKMARK REFERS TO CONTENT THIS BUILD DOES NOT HAVE. IT WAS NOT CHANGED. |
| Storage denied/quota | THE GAME COULD NOT WRITE THIS BOOKMARK. YOUR PREVIOUS SAVE IS STILL THERE. |

**Table 5**

| Situation | Binding presentation |
|---|---|
| First launch / no valid save | Title appears. NEW GAME enabled; CONTINUE visible and dim; OPTIONS and CREDITS enabled. |
| Valid compatible save exists | Title appears. CONTINUE enabled and shows the newest valid candidate's place/landmark in a small second line. |
| Only invalid/incompatible saves | CONTINUE dim; status says a bookmark needs attention; LOAD/DETAILS exposes honest classifications. |
| Returning to title | Title appears without resetting world or deleting any save. The last rendered room is torn down; settings remain. |

**Table 6**

| Option | Values / behavior |
|---|---|
| TEXT SPEED | SLOW / NORMAL / FAST / MANUAL using doc 30's 1.35× / 1× / 0.75× holds with 1.8-second minimum; MANUAL never advances a line automatically |
| FULLSCREEN | ENTER / EXIT based on actual state; call requestFullscreen/exitFullscreen directly from the click; show COULD NOT ENTER FULLSCREEN on failure |
| PALETTE CYCLING | ON / OFF; decorative palette-index cycling only. It does not stop character idles, necessary transitions, or any information-bearing state |
| SPEAKER LABELS | OFF / ON if doc 30's accessibility mode is shipped; labels remain compact and do not alter dialogue timing |
| HIGH-CONTRAST SPEECH | Expose only if palette/readability testing requires it; use the documented fixed readable color, not dynamic scene sampling |

**Table 7**

| Gap | Current evidence | Required correction |
|---|---|---|
| Boot bypasses shell | BootScene calls state.load() and starts GameScene | Always enter real TitleScene; load only after player clicks Continue/Load |
| Unstable capture | GameState.save serializes current memory; Ctrl+S/menu call it directly | Central SaveCoordinator and stability gate; settle/queue by section 4 |
| Autosave too early | enterRoom changes state and autosaves before transition choreography settles | Only transition coordinator publishes destination ingress-settled event |
| Missing actor truth | SaveFile has no x/y, facing, surface or stable anchor; afterLoad calls actor.placeIn(room) | Persist/validate stable actor placement and restore it exactly |
| Dialogue model stale | DialogueProgress is a taken-option string set and state may be written before exchange drains | Per-option counts; transactional commit; save only at decision/end boundary |
| Ownership underspecified | taken[] is actor ownership only | General one-owner map for room/player/NPC/container/removed |
| Load mutates live pieces | flags/dialogue/room/collections restore sequentially | Migrate/validate/build candidate, then one atomic swap |
| Validation shallow | Nested ids/types/counts, finite numbers, ownership and timestamps are unchecked | Deep schema plus content referential validation |
| Version mismatch disappears | version !== 1 returns null, same as empty | Sequential migrations and honest incompatible/corrupt statuses |
| False Continue/Load | anySlotUsed trusts raw autosave key existence | Enable from valid compatible candidate only; surface damaged saves separately |
| Three vague slots | Three rows show room name and relative age | Six manual + autosave; authored place/landmark, play time, age |
| Overwrite is immediate | overwriteNote exists but is not presented; menu posts SAVED before write | Mouse confirmation; notice only after verified success |
| Options incomplete | Only cycling toggles; text speed and Window scale do nothing; settings are volatile | Versioned machine settings; doc 30 text modes; real fullscreen; remove inert scale row |
| Fullscreen absent | No menu/controller/panel route despite errata 39 | Shared FullscreenController in Options and verb panel; actual-state events |
| Quit resets | GameScene quit calls reset because no title scene; reset clears autosave | Navigate to title; never clear a save as a routing side effect |
| Menu does not own time | GameScene update continues simulation while overlay is open | Pause eligible clocks and block world input behind shell |
| No safe write protocol | Single unverified setItem; exceptions/result not surfaced | Candidate validation, staging/read-back, backup, error classification |

**Table 8**

| Naive choice | Why trust breaks |
|---|---|
| JSON.stringify(GameState) anywhere | Captures half-effects, transient handles and missing participants; a technically parseable save becomes semantically corrupt |
| Disable Save with no explanation | Player thinks the click failed; repeated clicks or tab close follow. Queue with visible boundary language |
| Save at puzzle flag write | The line, inventory, object state and settle may disagree on load |
| Save actor room only | Load teleports to an entrance and no longer means 'same place' |
| Restore each subsystem in place | One late failure leaves a hybrid world and can overwrite good recovery data |
| Treat invalid as empty | Player overwrites the only damaged/incompatible bookmark without knowing |
| Exact-version equality forever | Every schema change strands all earlier players |
| Guess renamed IDs | A save loads plausibly into the wrong story state—the worst kind of corruption |
| Announce before setItem | Quota/security failure produces a false SAVED message |
| Automatic fullscreen on boot | Browser denies it without a user event; the displayed toggle lies |
| Options in each slot | Loading changes reading speed/display and makes preferences seem unreliable |
| Autosave every action | Comic experimentation becomes a stream of bookmarks and storage churn; saves start to feel punitive |
| Objective-like slot names | The shell becomes an accidental quest log/hint system |
| Keyboard confirmation | The advertised mouse-only game has inaccessible destructive actions |
| Quit means reset | Returning to title silently erases Continue and teaches the player not to trust menus |