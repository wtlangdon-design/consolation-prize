> **Provenance.** Produced by ChatGPT from the Monkey Island manual, the ScummVM engine source, and an inspection of this repository, at Tyler's direction, 31 July 2026. Pushed substantially as received.
>
> **Status: binding.** See errata 45 for the one exception and for what it corrected.

---

IMPLEMENTATION FIELD GUIDE
Dialogue Presentation and Pacing
Monkey Island dialogue grammar for The Last Claim in Consolation
Prepared as a binding implementation, writing, and QA reference for Claude
Primary functional reference: The Secret of Monkey Island (1990), text-only VGA release
Scope: spoken text, choice presentation, sentence assembly, barks, reading time, comic beats, cutscenes, accessibility, and runtime implementation

# How to use this guide
Status  This document is binding for dialogue presentation and pacing. It does not replace the dialogue writing in docs/04-dialogue-trees.md, the LOOK/LISTEN doctrine in docs/05-examine-layer.md, or the errata. It defines how that authored material reaches the player.
Claude must inspect the current runtime before changing it, then implement one reusable utterance and exchange system. Room-specific timers are not an acceptable substitute.
The Secret of Monkey Island is the functional reference, not a content source. Copy the grammar: spatial speech, readable timing, option rhythm, and clear control boundaries. Do not copy its dialogue, characters, jokes, art, or exact palette.
Where this guide gives pixel distances or milliseconds, they are Consolation starting values to tune at native 320x200 resolution, not claims about exact historical measurements.
No voice acting is planned. Text is the performance. Reading time, empty time, actor reaction, and input behavior must therefore be authored and testable rather than incidental.

# 1. Executive specification
Every spoken line is a speaker-labelled Utterance. Speaker identity must survive from content through the runner to the renderer.
Speech appears over or near the speaker, clamped inside the playfield, in that speaker's authored text colour with a one-pixel dark outline.
Only one utterance owns the speech channel at a time. A new speaker clears the prior speaker's text; two people never speak simultaneously unless a scene explicitly authors an overlap mode, which this game presently does not need.
Dialogue choices occupy the lower interface. While an exchange plays, choices are hidden and cannot receive clicks. They return only after the exchange is complete.
Selecting a choice first makes Thad speak the selected wording, then plays the response exchange. The selected option is not merely a command sent silently to the NPC.
Reading duration and comic pause are different data. Text-speed settings change reading duration; they do not erase an authored deadpan beat.
A click, Space, or Enter skips one current utterance. Escape or the explicit cutscene-skip action skips an entire cutscene and must apply its canonical final state.
Spoken text wraps by measured pixel width, never by character count. A speech block may use at most three lines; longer writing must be split into multiple utterances.
Choice order is authored order. The viewport holds four physical text rows and scrolls when more are needed; wrapping consumes rows.
Errata 37 is preserved exactly: spent PROGRESS disappears; TOPIC and COMIC remain dim and selectable; EXIT remains available.
Ambient barks use the same speech channel and speaker presentation data. They defer to dialogue, cutscenes, and player-driven lines rather than drawing through them.
Interactive trees and cutscenes share the same utterance renderer and timing calculation. They differ only in who chooses the next beat and whether whole-sequence skipping is legal.

# 2. Evidence boundary: what the reference establishes
The original manual describes choices at the bottom of the screen, clicking a phrase for Guybrush to say, adjustable message speed, per-cutscene bypass, and the sentence line's verb/object assembly. The SCUMM implementation supplies the lower-level grammar: each actor has a talk colour and talk-text offset; overhead text follows and clamps around the talking actor; long strings are line-broken by measured width; delay begins with a base and increases per character; the current message can be advanced independently of a whole cutscene. [S1-S6]
The reference does not provide a semantic rule called PROGRESS, TOPIC, or COMIC, nor does it establish a universal four-choice scroller. Those are Consolation systems. They should feel native to the same interface language without being presented as historical facts.
Functional conclusion  The reference treats text as an actor performance, not a subtitle band. Consolation currently treats most dialogue as a top-centred string. The implementation target is therefore a speaker-aware performance queue.

# 3. The player-visible speech grammar

## 3.1 Placement, colour, and speaker changes
Anchor at the speaker's current screen-space head position plus an authored offset. The anchor follows actor position and scale; it is not a room-global SAY_TOP constant.
Centre each line around the speaker anchor. Clamp the finished block to six native pixels from the left/right edges and two pixels from the top. Keep it above the verb panel.
Use a speaker-specific palette role. Thad and the other participant must not share a colour in an ordinary two-person exchange. Preserve one-pixel dark outlining for contrast against any room.
Colour is not the only identity cue: the text is spatially anchored and the speaking actor performs a talk idle or authored reaction. An accessibility option may prefix a short speaker name, but names are off by default to retain the period presentation.
When speaker B begins, remove speaker A's text before the new line appears. Never stack consecutive speakers at the top of the frame.
A speaker who is offscreen must use an explicit fixed anchor or be staged onscreen. Do not silently fall back to top-centre.

## 

3.2 One line at a time
An utterance renders its complete text immediately; there is no typewriter reveal. It holds for reading, then clears. A multi-speaker response is a queue of utterances, not a paragraph containing dashes or a string array with speaker labels discarded.

# 

4. Reading duration and skip behavior

## **The reading hold below binds DIALOGUE ONLY. `GameScene.lineSeconds` is a separate, deliberately different constant for the opening and the examine layer — errata 61.**

4.1 Default hold calculation
Binding formula  readingHold = clamp(1.8s, 8.0s, 0.45s + visibleGlyphs x 0.055s). Count rendered glyphs, not markup or speaker IDs. Apply the user's text-speed multiplier after calculation, then clamp again.
The current 0.045 seconds per glyph and 1.6-second floor are useful beginnings, but only scripted Sequence lines use them. Interactive dialogue can remain indefinitely and barks use a fixed 2.6 seconds. One timing service must own all three.

## 4.2 Skipping
Render the whole line immediately. After a 150ms input guard, one primary click anywhere in the playfield, Space, or Enter advances exactly one utterance.
A click that advances speech must be consumed. It must not also select an option, click a hotspot, move Thad, or press the interface beneath the hidden list.
Skipping an utterance preserves its state writes and proceeds to the next authored pause or utterance. It does not jump to the end of the exchange.
Escape or the clickable SKIP SCENE action is reserved for non-interactive cutscenes. It executes the cutscene's skip-state transaction and places the game at the same stable state as watching it.
Interactive trees are never timed choices. Waiting cannot select or remove an option.

# 

5. Line breaking at 320 pixels
Measure with BitmapFont.measure(); do not estimate from string length. Spoken text uses a default maximum block width of 240 native pixels, reduced when the speaker is near an edge.
Respect explicit authored breaks. Otherwise wrap at whitespace. Never split a normal word. A genuinely unbreakable token may split only as a last-resort validation fallback and must be reported.
A speech block may be one to three lines at the 5x7 face, with ten native pixels between baselines. Position the entire block from its measured dimensions before clamping it.
Do not shrink the font, clip the line, scroll spoken text, or let it cross into the panel. If wrapping would exceed three lines, fail the content check and split the writing into two utterances at a rhetorical break.
Keep punctuation with the preceding word. Count the wrapped result for block geometry but count visible glyphs across all lines for reading time.
Choice text uses the same width measurement. Continuation lines indent to the option text, not to the dash or selection marker.
Authoring rule  A long sentence is not solved by making the interface smaller. Split it where the performance would breathe.

# 

6. Interactive option list

## 6.1 Position, order, and scrolling
Replace the verbs/inventory area while choosing. Keep the room image at full height. The list is bottom-anchored and may cover only the minimum additional playfield rows required by wrapped choices.
Preserve authored order after gating and exhaustion filtering. Do not sort by tag, novelty, or progress value.
The viewport budget is four physical text rows. A two-line option consumes two rows. When additional rows exist, show clickable up/down triangles at frame right and support mouse wheel, trackpad scroll, and keyboard up/down as conveniences.
Scroll by option, not by half a wrapped option. The top visible item always begins with its first line. Hitboxes use the actual wrapped height.
Dim scroll controls when they cannot move; do not hide them. Scrolling changes presentation only and must not mutate exhaustion or selection state.
Hover or keyboard focus uses optionPrefixSelected. Exhausted TOPIC/COMIC options remain dim even when focused, with a bright marker or outline so focus remains visible.
This four-row scrolling viewport is a Consolation requirement because authored nodes can contain six options, including HOB_A1. Do not claim it is a measured reproduction of a universal MI1 four-option limit.

## 6.2 Selected-option echo
The original manual's instruction is literal: the player selects what Guybrush says. Consolation must do the same. On selection, hide the list and enqueue a Thad utterance using option.echo when present, otherwise option.text. Use echo: false only for an explicitly nonverbal beat; the content validator must require a reason.
State writes may be reserved immediately in a DialogueTransaction, but the node must not visibly advance and EXIT must not hand control to the next sequence until the echo, reply, and post-beat finish. This prevents the coach from starting to depart under 'Wasn't for you.'

# 

7. Exhausted options: original rhythm and errata 37
In the 1990 game, conversation scripts commonly replace the available phrase array after a choice, and many asked questions disappear. This is authored script behavior, not an engine-level semantic tag system. Errata 37 correctly borrows the uncluttered rhythm for progress while deliberately diverging to protect Consolation's repeat comedy.
Critical current data gap  DialogueRunner tracks only a taken/not-taken set and DialogueOption.repeat is one string. It cannot represent Winnie's second, third, fourth, and fifth raccoon responses. Replace boolean exhaustion with per-option selection counts and repeat exchanges that clamp at the last authored variant.

# 

8. The sentence line
The sentence line is a live preview of what the next click will do. It is not dialogue and must not share the speech channel.
The current templates, icon-hover naming, held-item naming, and target-default preview are strong and should be preserved. Tighten item selection so it cannot produce nonsense such as 'Open tuning fork on door' merely because the hovered door's default verb is OPEN.

# 

9. Barks and ambient speech
Every bark is an Utterance with speaker, anchor, colour, text, priority, and timing. Do not maintain a second bark-only renderer with separate rules.
Priority is: cutscene exchange; interactive exchange; player-driven LOOK/LISTEN/action line; ambient bark. Only one owns the channel.
If a bark becomes eligible while a higher-priority line is active, defer it without marking it consumed. Retest after the channel clears and the NPC is still present. Do not release a burst of old barks after a conversation.
Queue at most one ambient bark. A newer bark may replace a deferred one only if the older NPC is no longer eligible.
Talking to the barking NPC cancels the visible bark and starts the tree. The bark does not layer with the greeting.
Barks wrap to a narrower default width of 150 native pixels and normally use the same hold formula with a 5.0-second maximum. A fixed 2.6 seconds is too short for some lines and too long for others.
Unprompted speech never sets a puzzle flag unless the content explicitly declares it. Reputation-state one-shot behavior remains.

# 

10. Comic timing is authored data
This game is dry and deadpan. The joke often lives between strings. The runtime must therefore represent silence and physical reaction as first-class beats instead of forcing writers to fake timing with ellipses, long strings, or arbitrary sleeps in room code.
A shrug is not a null say. Author { speaker, text: null, chore: 'shrug', silent: true, durationMs }. The validator rejects accidental empty utterances.
A beat before a punchline clears the setup line, holds empty space, then shows the payoff. Do not leave both lines visible as a two-line subtitle block.
Deadpan means stable actor, complete line, deliberate empty time. It does not mean reducing the player's reading time or making every exchange uniformly slow.
Fast exchanges reduce inter-speaker gaps, not the minimum readable hold. The player may still advance each line manually.
Talk animation loops while text is visible; it never determines line length. A chore may replace talk animation when silence is the performance.
Use named delivery profiles for defaults and explicit numeric overrides only when the writing calls for a specific beat. Do not scatter unlabelled waits through room scripts.

# 

11. Interactive trees versus cutscenes
A cutscene skip must apply flags, object states, actor placement, inventory mutations, and the final dialogue position exactly once. It must not replay jokes, leave a talk chore running, or return the player mid-sentence. Interactive exchanges commit at a stable decision point after the queue drains.

# 

12. Accessibility requirements
Never render spoken or option text smaller than the native 5x7 face. Integer scaling and fullscreen preserve legibility; fractional canvas scaling remains forbidden.
Use a one-pixel dark outline and palette roles validated against the outline. Do not rely on colour alone: anchor position and actor reaction identify the speaker; optional speaker labels provide an additional cue.
Provide Slow, Normal, Fast, and Manual text modes in the clickable OPTIONS menu. The game remains fully playable with a mouse; keyboard shortcuts are conveniences.
Reading-speed changes affect readingHold only. Authored comedy pauses remain unless a separate accessibility option explicitly reduces non-reading waits; if offered, preserve story-critical stated durations such as Hob's four seconds by default.
A click always advances one line, predictably. It never skips an unseen second line or activates the UI beneath it.
No option is time-limited. Scroll arrows have generous hitboxes and wheel/trackpad support. Focus remains visible on dim exhausted choices.
Provide a high-contrast text option if palette testing shows any speaker role becomes difficult against common room values. Do not solve contrast by moving all speech back to a universal subtitle band.

# 

13. Proposed data model
type Delivery = 'neutral' | 'fast' | 'deadpan' | 'punchline' |
  'longSilence' | 'choreOnly';

interface SpeakerPresentation {
  id: string;
  name: string;
  colorRole: string;
  anchor: 'actor' | 'fixed';
  textOffset?: [number, number];
  fixedAt?: [number, number];
  maxWidth?: number;       // default 240; barks may override to 150
  talkChore?: string;
}

interface Utterance {
  speaker: string;
  text: string | null;
  delivery?: Delivery;
  prePauseMs?: number;
  postPauseMs?: number;
  minHoldMs?: number;
  maxHoldMs?: number;
  chore?: string;
  silent?: boolean;        // required when text is null
  skippable?: boolean;     // default true per-line
}

interface DialogueOption {
  id: string;
  text: string;
  echo?: string | false;   // default text; false requires a reason
  tag: OptionTag;
  when?: Condition;
  first?: Utterance[];
  repeats?: Utterance[][]; // count 2, 3, ...; clamp to final variant
  beat?: SequenceBeat;
  set?: FlagWrites;
  add?: FlagAdds;
  goto?: string;
}

interface DialogueProgress {
  counts: Record<string, number>; // tree/node/option -> selections
  tree: string | null;
  node: string | null;
  optionScroll: number;
}

interface DialoguePresentation {
  visibleOptionRows: 4;
  speechMaxWidth: 240;
  speechMaxLines: 3;
  inputGuardMs: 150;
  timing: { base: 0.45; perGlyph: 0.055; min: 1.8; max: 8.0 };
  deliveryProfiles: Record<Delivery, { preMs: number; postMs: number }>;
}

# 

14. Runtime sequence
Start tree at a stable node. If the node has a greeting, enqueue it as a speaker-labelled utterance; do not draw node.prompt in the sentence line.
When the utterance queue empties, compute gated options in authored order. Use selection counts to remove spent PROGRESS and dim retained tags. Restore a valid scroll window.
Wrap option text, allocate the four-row viewport, draw scroll controls, and expose hitboxes matching the wrapped geometry.
On selection, consume the click, lock the choice UI, create a DialogueTransaction, increment that option's count, and choose first/repeat exchange without yet handing control elsewhere.
Enqueue Thad's echo, authored pre-reply pause, response utterances or explicit silent beat, and post-beat. Preserve speaker IDs throughout.
The SpeechController arbitrates one channel, resolves anchor and colour from SpeakerPresentation, wraps to pixel width, computes reading hold, starts the talk/chore animation, and accepts per-line skip.
After the queue drains, apply or finalize state writes exactly once. If EXIT, end the tree and invoke its continuation now; otherwise move to goto/current node and return to step 2.
Permit autosave only at the resulting decision point or stable post-cutscene state. Never serialize halfway through a joke unless the full utterance queue and transaction can be restored exactly.

# 

15. Current build audit

## 15.1 What is already right
DialogueRunner evaluates gates in authored order and serializes partial-tree progress.
Errata 37's PROGRESS removal and retained dim TOPIC/COMIC/EXIT presentation are implemented in presentOptions().
The exchange field represents multi-speaker responses as ordered records rather than punctuation inside one string.
GameScene consumes a click to advance pending multi-line exchanges before letting it reach the option list.
Scripted Sequence lines already use a content-driven per-glyph rate and minimum, and SequenceRunner understands that a line must hold rather than be overwritten in one tick.
Renderer keeps the room visible while options occupy the lower interface instead of replacing most of the picture with a fixed black dialogue field.
The sentence line uses content templates, names inventory icons on hover/selection, includes held item plus target, and reflects object-default click behavior.
Ambient barks are spatially anchored above their NPCs, wrap to a narrower width, and fire once per reputation state.
The options menu already names Text speed, so accessibility can be connected without inventing a new route.

## 

15.2 What does not yet satisfy this guide

# 

16. Binding Room 1 proof: the stage driver
Room 1 is the acceptance scene because its existing four-option tree includes progress, comic, exit, and a three-line two-speaker exchange.
The tree opens with four choices in the lower interface. No stale prompt is drawn in the sentence line.
Selecting 'Where am I supposed to sleep?' hides the choices. Thad first says that selected line over himself in Thad's colour.
After the default reply beat, the driver says 'Hotel's five dollars.' over the driver in the driver's colour.
The text clears; Thad says 'I have four.' over himself.
A short deadpan beat follows; the driver says 'You've all got four.' over himself. Only then do choices return.
The used PROGRESS option is gone. A used COMIC option would remain dim and selectable.
Selecting 'Thank you for the ride.' makes Thad speak it, then the driver replies 'Wasn't for you.' The tree closes only after that line and its post-beat. The coach departure begins afterward, not underneath it.
Every primary click during the exchange advances one line only and cannot accidentally select the next visible option because no option is visible or active.
Proof requirement  Claude must demonstrate this sequence in the executable game at native resolution. Passing a JSON/schema test is not sufficient.

# 

17. Authoring defaults

# 

18. Automated acceptance checks

## 18.1 Content and schema
Every utterance names an existing speaker; every speaker has colour and anchor data.
text: null requires silent: true plus chore or explicit duration. Accidental empty speech fails.
A spoken block measured in the real BitmapFont is at most 240px per line and at most three lines after wrapping, unless a named speaker override applies.
Options wrap without clipping; no option exceeds two lines without an explicit exception report.
Every node has EXIT or an authored unconditional route to another node; scrolling cannot hide the only exit permanently.
PROGRESS, TOPIC, COMIC, ASSAY, and EXIT each pass their errata policy tests.
Repeat arrays are reachable by persisted counts. Winnie's fifth raccoon selection produces the fifth authored response after save/load.
echo: false requires nonverbalReason; otherwise every selectable option produces a Thad echo.

## 

18.2 Runtime and frame tests
A two-speaker exchange produces alternating anchors and colours; only one speech block appears in every captured frame.
Options are absent and have no hitboxes while any utterance, pause, or chore in the exchange is active.
One click after the input guard advances exactly one utterance and is not delivered to the next layer.
Slow/Normal/Fast alter calculated reading holds; authored pre/post pauses remain identical. Manual never auto-advances.
The four-row viewport scrolls to all gated options, never starts on a continuation line, and restores valid focus after a PROGRESS option disappears.
Speaker blocks clamp within playfield bounds at left edge, right edge, top edge, near panel, and at near/far actor scales.
A bark eligible during dialogue is not drawn, not marked consumed, and appears at most once after the channel clears if still eligible.
Skipping a cutscene and watching it yield identical flags, inventory, object states, actor placement, active tree state, and pending speech state.
Saving at a decision point restores option counts, exhausted presentation, authored order, and scroll position without replaying the last response.
No audio asset or voice duration is consulted for text timing; the shipped game remains complete with zero voice files.

# 

19. Human playtest questions
Without speaker names, could the tester always tell who was speaking from placement, colour, and reaction?
Did a new line ever appear before the tester had a fair chance to read the prior one at Normal speed?
Did clicking to advance ever select a choice, move Thad, or trigger a hotspot underneath?
Did the selected wording feel like something Thad actually said, or like a silent menu command?
Could the tester find and select the fifth or sixth option without the room disappearing behind a giant dialogue field?
After revisiting a dim COMIC or TOPIC option, did it deliver intentional repeat writing rather than the same line by accident?
Did Winnie's fifth raccoon response survive leaving, saving, loading, and returning?
Did the pauses make the joke clearer, or did they merely make the game feel slow?
Could the tester distinguish deadpan timing from a fast exchange even after changing text speed?
Did a silent shrug or look read as an authored answer rather than a broken response?
Did ambient barks feel like the town reacting, without interrupting or piling up behind a conversation?
Could the tester comfortably read and advance the game using only the mouse?
After skipping a cutscene, was the next playable state coherent and identical in consequence to watching it?

# 

20. Copy-paste directive for Claude
Use this instruction with the repository  Treat this document as binding for dialogue presentation and pacing. Preserve the project's original writing, puzzle logic, character voices, errata, art, and no-voice-acting decision. Implement the functional grammar, not copied Monkey Island content.
Before changing dialogue content, inspect docs/04-dialogue-trees.md,
docs/05-examine-layer.md, docs/00-errata.md rulings 26, 29 and 37,
DialogueRunner.ts, GameScene.ts, Renderer.ts, Sequence.ts, Ambient.ts,
types.ts, and content/ui/ui.json. Produce a gap table against this guide.

Then implement one reusable speaker-aware Utterance/SpeechController system.
Required order:
1. Preserve speaker identity, actor anchor, colour, delivery and pause data
   from content through runner and renderer.
2. Replace taken/not-taken dialogue progress with per-option counts and
   repeat exchanges, while preserving errata 37 exactly.
3. Echo selected options as Thad, hide choices during exchanges, and return
   them only at stable decision points.
4. Add measured wrapping, a three-line speech cap, a four-row scrolling
   option viewport, and hitboxes derived from wrapped geometry.
5. Unify interactive lines, cutscene lines, LOOK/LISTEN responses and barks
   under one reading-time, skip and priority service.
6. Separate reading holds from authored comic pauses; implement named
   neutral, fast, deadpan, punchline, long-silence and chore-only delivery.
7. Implement Slow/Normal/Fast/Manual text modes in the clickable OPTIONS menu.
8. Convert the Stage Road driver exchange into the executable proof sequence
   in section 16, including deferred EXIT continuation.
9. Add every automated check in section 18 and run the human checks in 19.

Do not call the work complete because speaker fields or timers exist.
Demonstrate the changed dialogue in the running game at native resolution,
capture the observed order/placement/skip behavior, and report exactly what
was verified. Do not rewrite dialogue merely to fit an incomplete renderer.

# 

Sources
[S1] The Secret of Monkey Island original manual. Primary player-facing evidence for bottom-screen dialogue choices, selected phrases as Guybrush speech, sentence-line assembly, adjustable message speed, and cutscene bypass.
[S2] ScummVM SCUMM actor implementation. Executable engine evidence for per-actor talk colour, talk animation, and talking-actor state.
[S3] ScummVM SCUMM string implementation. Executable engine evidence for overhead actor anchoring, edge clamping, measured wrapping, base delay, and per-character timing.
[S4] ScummVM SCUMM input implementation. Executable engine evidence distinguishing current-message advance from whole-cutscene abort.
[S5] ScummVM SCUMM v5 script implementation. Executable engine evidence for actor talk-colour and print-to-actor operations.
[S6] ScummVM SCUMM verb implementation. Executable engine evidence for sentence construction and verb/object state.
[S7] Video Game History Foundation: The Secrets of Monkey Island's Source Code. Primary-source preservation context for SCUMM costumes, talk animation, authored rooms, and production decisions.
[R1] Consolation dialogue architecture. Binding tree rules, character voices, repeat arcs, and comic-option doctrine.
[R2] Consolation examine layer. Binding LOOK/LISTEN doctrine, repeat requirements, and no-emphasis rule.
[R3] Consolation errata. Rulings 26, 29 and 37 governing panel geometry, inventory naming, and exhausted choices.
[R4] Current DialogueRunner. Current gating, exhaustion, selection, response, and save-state implementation.
[R5] Current GameScene. Current line timing, exchange queue, sentence line, bark scheduling, and input routing.
[R6] Current Renderer. Current top-centred speech, spatial bark, dialogue-list, panel, and sentence rendering.
[R7] Current UI content. Current sentence templates, prefixes, and timing constants.
Evidence boundary: Sources establish interface and engine behavior; named milliseconds, row budgets, data structures, and accessibility settings are project implementation requirements, not claimed historical measurements.

**Table 1**

| Moment | What is visible | What accepts input |
|---|---|---|
| Choosing | Up to four option rows in the lower interface | Option rows and scroll controls |
| Thad echoes choice | Thad's text over Thad; options hidden | Skip-current-line only |
| Reply pause | No speech text; actor/chore may continue | Skip-current-line only after the input guard |
| NPC response | NPC text over NPC in NPC colour | Skip-current-line only |
| Exchange complete | No speech text; options return or tree closes | Options, or ordinary play after EXIT |

**Table 2**

| Setting | Multiplier | Behavior |
|---|---|---|
| Slow | 1.35x | More reading time; authored pauses unchanged |
| Normal | 1.00x | Default starting point |
| Fast | 0.75x | Less reading time; never below 1.8 seconds |
| Manual | No auto-advance | Every utterance remains until the player advances it |

**Table 3**

| Tag | Binding Consolation behavior | Reason |
|---|---|---|
| PROGRESS | Remove after first completed selection | The question has done its mechanical job; this matches the reference's uncluttered conversational rhythm |
| TOPIC | Keep, dim, selectable | Written repeat responses and optional characterization remain available |
| COMIC | Keep, dim, selectable | Persistence is sometimes the joke; these are product content, not dead code |
| ASSAY | Follow authored repeat policy; default keep and dim | Assay attempts may need counters and feedback rather than simple exhaustion |
| EXIT | Always visible whenever choices are visible | A conversation must never consume its way out |

**Table 4**

| State | Sentence line |
|---|---|
| Nothing hovered, no selected verb, no held item | Walk to |
| Object hovered, no selected verb | The object's click-default verb + display name, per errata 28b |
| Verb selected, nothing hovered | Verb label only |
| Verb selected, object hovered | {verb} {target} |
| Item held, nothing hovered | Use {item}; selecting an ordinary inventory item forces USE unless an authored GIVE flow says otherwise |
| Item held, target hovered | Use {item} on {target} |
| Inventory icon hovered | The item display name is included; the icon is never the only identifier, per errata 29 |
| Interactive dialogue choosing | Clear; choices occupy the dialogue interface |

**Table 5**

| Delivery | Starting pause values | Use |
|---|---|---|
| neutral | reply 180ms; post 120ms | Ordinary information exchange |
| fast | reply 60-100ms; post 40-80ms | Argument, correction, interruption; reading hold remains intact |
| deadpan | reply 350-550ms; post 220-350ms | A flat answer needs air before the line, not slower text |
| punchline | pre-line 450-700ms; post 250-400ms | Split setup and payoff into separate utterances |
| longSilence | 900-1400ms or explicit story value | Rare discomfort; Hob's authored four seconds remains exactly four seconds |
| choreOnly | Authored chore duration | Shrug, look, pen stop, laugh, continued walking; no invented spoken filler |

**Table 6**

| Property | Interactive tree | Non-interactive cutscene |
|---|---|---|
| Next beat | Player selects at a decision point | Sequence data selects it |
| Choice UI | Visible only when speech queue is empty | Never visible |
| Line advance | Auto by reading timer or one line per click | Same |
| Whole-sequence skip | Not allowed | Allowed; apply canonical skip state |
| Control | Locked during each exchange; restored at next decision | Locked until stable end state |
| Renderer/timing | Shared Utterance service | Shared Utterance service |
| Save boundary | Stable node/decision point | Stable post-cutscene state |

**Table 7**

| Gap | Current evidence | Required correction |
|---|---|---|
| Speaker identity is lost | SelectionResult.say is a bare string; GameScene maps rest to strings | Carry Utterance objects through the full queue |
| Universal top-centred speech | Renderer.drawSay uses SAY_TOP, screen centre, and inkBright | Resolve actor anchor, offset, clamp, and per-speaker colour |
| No choice echo | onDialogueClick immediately displays the response | Enqueue Thad's selected wording first |
| Options remain under speech | drawSay then drawDialogue on the same frame | Hide and disable choices while the speech channel is occupied |
| No option wrap/scroll | One fixed ten-pixel row per option; top grows upward by count | Measured wrapping plus a four-row scrolling viewport |
| Repeat arc cannot exist | taken is a Set; repeat is one string | Persist selection counts and repeat exchange arrays |
| Timing is fragmented | Sequence uses length timing; tree lines persist; barks are fixed 2.6s | One reading/skip service for all utterances |
| No maximum or long-line failure | Speech wraps at 308px with unlimited lines | 240px default, three-line cap, content validator |
| Barks can overlap | Separate sayLines and barkLines draw in one frame | Single prioritized speech channel |
| Prompt is not speech | node.prompt draws in the sentence slot | Make greetings speaker-labelled utterances |
| EXIT continues too early | Opening continuation begins when option is selected | Continue only after final reply and post-beat drain |
| Text-speed UI is inert | Menu row exists; no setting changes timing | Implement Slow/Normal/Fast/Manual and persist it |

**Table 8**

| Parameter | Starting default | Tune when |
|---|---|---|
| Speech width | 240 native pixels | Speaker is near an edge or a close-up intentionally allows more |
| Speech lines | 1-3 | Never exceed; split the utterance |
| Reading hold | 0.45 + glyphs x 0.055; 1.8-8.0s | User text-speed setting applies |
| Input guard | 150ms | Accidental double-clicks remain reproducible |
| Option viewport | 4 physical text rows | Wrapped options consume more than one row |
| Neutral reply gap | 180ms | Exchange is intentionally fast or deadpan |
| Deadpan reply gap | 350-550ms | The pause attracts more attention than the line |
| Punchline pre-beat | 450-700ms | A story-specific beat is explicitly authored |
| Bark width/max | 150px / 5.0s | A bark should be shortened before widening it |
| Speech outline | 1 native pixel, dark role | Never remove; change high-contrast role instead |