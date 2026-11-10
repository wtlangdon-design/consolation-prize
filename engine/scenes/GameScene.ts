import { counterReading, priceText } from '../core/NodeCounter.ts';
import Phaser from 'phaser';

import type { GameState } from '../core/GameState.ts';
import type { AmbientFile, Cutaway, Exit, Facing, Interactable, CombinationPair, RoomTimelineStep, SoundsFile,
} from '../core/types.ts';
import { Actor } from '../core/Actor.ts';
import { ArrivalHold } from '../core/ArrivalHold.ts';
import { personLines } from '../core/PersonLines.ts';
import { planCut, planRoom } from '../core/BootAssets.ts';
import { MapWalk, homeLocation, mapPath, placePoint } from '../core/MapWalk.ts';
import { Music } from '../core/Music.ts';
import { ambienceFor } from '../core/Ambience.ts';
import { RoomActors } from '../core/RoomActors.ts';
import type { Controls, FrameReport, MoverReport } from '../dev/Probe.ts';
import { BodyOwners, SequenceWorld } from '../core/SequenceWorld.ts';
import { assertRequiredClip } from '../core/Assertions.ts';
import { AmbientLayer, SaidLately, spokenBreakKey } from '../core/Ambient.ts';
import { watch } from '../dev/Watch.ts';
import { actOf, heldThrough, performedLine, performersWith, shownText, type HeldPose } from '../core/ActedDirections.ts';
import { StepTriggers, type StepEvent } from '../core/StepTriggers.ts';
import { DialoguePerformance, barkHold, holdTimingFor, readingHold, type HoldTiming, type Utterance } from '../core/DialoguePerformance.ts';
import { liveCycling, mappingAt, resolve, sameMapping } from '../core/PaletteCycling.ts';
import { BitmapFont, GLYPH_SCALE, type Face } from '../render/BitmapFont.ts';
import { appliedCandidates, askedCandidates, resolveAssetPath } from '../dev/CandidateArt.ts';
import { askedFixture, idFromQuery } from '../dev/Fixture.ts';
import { askedObjectStates } from '../dev/ObjectStates.ts';
import { askedFont, PreviewFont } from '../render/PreviewFont.ts';
import { CyclingBackground } from '../render/CyclingBackground.ts';
import { IdleLayer } from '../render/IdleLayer.ts';
import { CHOICE_ARROW_X, Renderer, ambientFrameAt, choiceLines, panelShows, type ChoiceView, type ShotFrame } from '../render/Renderer.ts';
import {
  NATIVE_HEIGHT,
  NATIVE_WIDTH,
  PanelLayout,
  PLAY_HEIGHT,
  Screen,
  pointInRect,
} from '../render/Screen.ts';
import { SequenceRunner, type SequenceStep } from '../core/Sequence.ts';
import { CarriedBeats } from '../core/CarriedBeats.ts';
import { RoomTimeline } from '../core/RoomTimeline.ts';
import { Sfx } from '../core/Sfx.ts';
import {
  actCardOf, playfieldClick, segmentsOf, stepsFor, writesOf, type Segment,
} from '../core/Opening.ts';
import { tapAt, tuneAt } from '../core/Listening.ts';
import { clickOnSpeech, holdOver, isRest, waitsForClick } from '../core/SpeechPolicy.ts';
import { bootsToBeginCard, endingAt, titleItems, type TitleItem } from '../core/Bookends.ts';
import { clearOfFigures, hiddenClick } from '../core/Standing.ts';
import {
  CYCLING_OPTION,
  MUSIC_OPTION,
  GAME_SCENE,
  KEY_LOAD_MODIFIED,
  KEY_ADVANCE_LINE,
  KEY_MENU,
  KEY_SAVE_MODIFIED,
  QUICK_SLOT,
  REGISTRY_STATE,
  SCREEN_TEXTURE,
} from './keys.ts';

const NOTICE_MS = 1200;
// Glyph pixels, like the renderer's copy: x GLYPH_SCALE with the face.

/**
 * A line waiting its turn on the speech channel. An acted direction's beats
 * (doc 95; errata 141) are queued as `silent` lines: nothing shown, figures
 * holding `poses` for `rest` seconds, a `cue` sounding as it starts.
 */
interface QueuedLine {
  speaker: string | null;
  line: string;
  overBlack?: boolean;
  direction?: boolean;
  silent?: boolean;
  rest?: number;
  poses?: HeldPose[];
  cue?: string;
  /** His frame while this (spoken) line is up (ResponseRule.holds). */
  pose?: HeldPose;
  /** Frames kept once this acted beat is over, through the rest of the lines (doc 95 Holds). */
  holdsAfter?: HeldPose[];
  /** An acted beat in which he walks to a hotspot's stand (doc 54 A5's retreat; ActStep.walk). */
  walk?: { id: string; to: string };
}

/**
 * Draws the whole 320x200 frame into one canvas texture and routes input.
 * Redrawing everything on change is cheap at this size, which keeps the
 * renderer stateless and the pixel grid exact.
 */
export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private screen!: Screen;
  private font!: Face;
  private view!: Renderer;
  private actor!: Actor;
  /**
   * EVERYTHING THE CONTROLS DID TO THE GAME, IN ORDER.
   *
   * A proof panel reached by playing and a proof panel reached by injection
   * are both legitimate evidence and they are not the SAME evidence, and the
   * difference is invisible in the picture. So it is written down, and the
   * proof manifest carries it beside the frame.
   */
  private readonly controlWrites: string[] = [];
  /** Every named mover in the room, the player among them. Issue X4 defect 3. */
  private actors!: RoomActors;
  /** The room bed's clock this frame and last, for a figure that keeps time with it (errata 118). */
  private musicNow = 0;
  private musicBefore = 0;
  /** The score. Options › Music switches it, and only it (errata 156: Tyler, "Music only"). */
  private readonly music = new Music(() => this.state.menu.toggle(MUSIC_OPTION));
  /** Errata 70 G: one-shots, under the beds' unlock. Not under the Music switch: footsteps are not music (errata 156). */
  /** The performed line whose sound has been played, so it plays once. */
  private soundedLine: Utterance | null = null;
  private readonly sfx = new Sfx(() => true, () => this.music.isUnlocked);
  /**
   * DOC 45'S ROOM BACKGROUNDS (`R02-A`, `R07-A`; errata 105): a second bed
   * player beside the score. It is never detuned -- wind is not the score --
   * and it is silent wherever the score is suspended. Not under the Music
   * switch: wind and a crowd are the room's sound, not its music (errata 156).
   */
  private readonly ambience = new Music(() => true);
  /** A cue's held sound -- the standing team in the opening -- until a cue or the room ends it (errata 106). */
  private readonly cueBed = new Music(() => true);
  /** The judges' mark beat already sounded, so a redraw does not write the point twice. */
  private markedLine: Utterance | null = null;
  /** The pencil has gone down for the exchange being performed, so the slate shows its point (errata 136 A). */
  private pointWritten = false;
  /** The line whose cue has sounded, so a redraw does not sound it twice. */
  private cuedLine: Utterance | null = null;
  /** A held silence has stopped the music (errata 131 D), and the room is still. */
  private hushed = false;
  /** Everyone holds still for the silence, until the street erupts (errata 131 D, E). */
  private stilled = false;
  /** The duel whose music is playing, so a duel's start and end each choose the bed once. */
  private duelPlaying: string | null = null;
  /** The words on screen when they last sounded, so a redraw does not stamp twice. */
  private soundedWords: string | null = null;
  /** The last foot to come down (Actor.gait, in half-cycles), so each plant sounds once. */
  private lastFoot = -1;
  /** The take each footstep surface played last, so a walk never repeats a foot. */
  private readonly lastTake = new Map<string, number>();
  /** Errata 70 G: a room that is its own cutscene (Room 32). */
  private readonly timeline = new RoomTimeline();
  /** True while a timeline room keeps the verb panel away. */
  private panelHidden = false;
  /** Set when a suspending room's timeline has brought the bed back. */
  private musicResumed = false;
  /** Which of the room's `plates` is showing; null is its `background`. */
  private plate: string | null = null;
  /** The scene clock at the last timeline tick, in ms; null before the first. */
  private timelineAt: number | null = null;
  /**
   * ERRATA 71 B (doc 34's coffin contract, adopted by errata 52): while a
   * timeline room keeps the panel away, pointer intent reveals MENU and SKIP
   * SCENE for a few seconds. The scene-clock time they hide again, or null.
   */
  private sceneControlsUntil: number | null = null;
  private static readonly SCENE_CONTROLS_MS = 3000;
  /** Doc 34 assertion 6's register. Step E swaps a RuntimeCoordinator in. */
  private readonly bodies = new BodyOwners();
  /** The one thing allowed to drive a mover from a script. Issue X4 defect 1. */
  private world!: SequenceWorld;
  private ambient!: AmbientLayer;
  private panel!: PanelLayout;
  private texture!: Phaser.Textures.CanvasTexture;

  private hovered: Interactable | null = null;
  private hoveredName: string | null = null;
  /**
   * Doc 30 §5's block width, translated rather than copied.
   *
   * The document says "240 native pixels" and was written when the play area
   * was 320 wide -- three quarters of the screen. Errata 54 made the play area
   * 1920, so the SPEC IS THE FRACTION, not the number: 240 out of 320. Copying
   * 240 forward would have given a block the width of a postage stamp; reading
   * it as a fraction gives 1440, which is what the rule always meant.
   */
  private static readonly SPEECH_BLOCK_WIDTH = Math.round(NATIVE_WIDTH * (240 / 320));
  /**
   * Doc 30's bark width, "150 native pixels", read the same way: a fraction
   * of the 320 play area, not a pixel count. Left as 150 at 1920 wide it held
   * five glyphs a line, and the card sharp's "Sit down. Lose something." came
   * out as a column of four one-word lines (Tyler, 2026-10-31). Captions -- a
   * sound written over the thing that made it -- use the bark's face and its
   * width, and had the same fault.
   */
  /** A bark's gap above the head, as a fraction of height -- speech's SPEECH_GAP. */
  private static readonly BARK_GAP = 0.12;
  private static readonly BARK_BLOCK_WIDTH = Math.round(NATIVE_WIDTH * (150 / 320));
  /** How long a bark stays over a head. */
  /** A scripted line's hold under Text speed MANUAL: until its click releases it. */
  private static readonly HELD_FOR_CLICK = 24 * 60 * 60;

  private sayLines: string[] = [];
  /**
   * THE CHOICE LIST'S WINDOW AND THE ROW UNDER THE POINTER (errata 143).
   * `optionScroll` is the first option in view; it goes back to the top
   * whenever the list is rebuilt -- a new tree, a new node, or the return
   * after an answer -- as a SCUMM list did. `optionListKey` is what tells a
   * rebuilt list from the same one redrawn. `pointerAt` is where the pointer
   * last was, in native pixels, so a list that comes back under a resting
   * pointer lights the row it is on without waiting for the pointer to move.
   */
  private optionScroll = 0;
  private optionListKey: string | null = null;
  private pointerAt: { x: number; y: number } | null = null;
  /** The row lit on the last frame drawn, so a pointer move redraws only when it changes. */
  private lastHoveredOption: string | null = null;
  /** Whether a conversation held the interface on the last tick. */
  private wasTalking = false;
  /** Whether the verb panel was drawn in the last frame composed. For the probe. */
  private panelDrawn = false;
  /** When the line on screen has been up long enough. Null while none is. */
  private sayUntil: number | null = null;
  /** The line on screen waits for a click (a conversation's, under click-to-read), and shows that it does. */
  private sayWaiting = false;
  /** THE TITLE SCREEN, while it is up: its items (errata 128). Null in play. */
  private titleMenu: TitleItem[] | null = null;
  /** Errata 155: "Click to begin" is up, in front of the title, until the first click. */
  private beginCard = false;
  private titleHover: string | null = null;
  /** The title was reached through the close: THE END is under it (Tyler, 2026-11-06). */
  private titleTheEnd = false;
  /** THE LETTER'S PAGE: the lines said over black in a room that ends the game (errata 128). */
  private page: string[] = [];
  private pageAlpha = 1;
  /** A room handing on by a fade (errata 133): when it began, and whether the new room is in. */
  private roomFade: { after: { goto: string }; from: number; enteredAt: number | null; upFrom: number | null } | null = null;
  private fadeBlack = 0;
  /**
   * EVERY ARRIVAL WAITS FOR ITS ROOM (errata 223): an exit, the map, a goto or
   * a load onto a room still arriving holds black until it is whole, and the
   * room does not run until it is seen. `accostAfterHold` is the arrival's
   * accost, armed when the room is shown (null: none owed). `loadingUp` is
   * whether "Loading…" is over the black this frame.
   */
  private readonly arrivalHold = new ArrivalHold();
  private accostAfterHold: boolean | null = null;
  private loadingUp = false;
  /**
   * NEW GAME'S WAY IN (errata 157): the title fades to black ('out'), the
   * screen holds black until Room 1 has arrived whole ('black'), and then the
   * opening begins as the black lifts ('up'). Null otherwise.
   */
  private entry: { phase: 'out' | 'black' | 'up'; at: number } | null = null;
  /** Errata 157's pan down from the sky: when it began and how long it runs. */
  private panning: { from: number | null; seconds: number } | null = null;
  /**
   * ERRATA 158: a cut-away in progress -- out to black, the other room held
   * in black until it is whole, its lines, out again, back to where he stood,
   * held until that room is whole, and up. Null otherwise.
   */
  private cut: { cutaway: Cutaway; phase: 'out' | 'black' | 'establish' | 'show' | 'leave' | 'back' | 'up'; at: number;
    back?: { x: number; y: number; facing: Facing }; closeup?: boolean; cutIn?: boolean; showFrom?: number } | null = null;
  /** Assets the loader could not fetch: a room waits for each to arrive OR fail, never for ever. */
  private readonly loadFailed = new Set<string>();
  /** Sheets reported once as wanted with nothing bringing them (sheetFor). */
  private readonly stranded = new Set<string>();
  /** One figure, one line, once a walk past (errata 242). */
  private readonly saidLately = new SaidLately();
  /** Scene seconds when the close's last line came down; null until it has. */
  private endingFrom: number | null = null;
  /** The close's bed is playing out to its end; the title does not start another over it. */
  private musicFinishing = false;
  /** Lines still to come in a multi-speaker response, in order. */
  private pendingSay: QueuedLine[] = [];
  /** A person's lines staged for a walk-up, and who answers after them (core/PersonLines.ts; errata 192). */
  private personTarget: ReturnType<typeof personLines> = null;
  /** The frames an acted direction holds while it plays from the queue (doc 95; errata 141). */
  private queuedPoses: HeldPose[] | null = null;
  /** An acted beat's walk is under way, and the beat waits for it (ActStep.walk). */
  private actWalking = false;
  /** His frame while a line of a rule that `holds` is up (ResponseRule.holds). */
  private spokenPose: HeldPose | null = null;
  /** Frames an acted beat left held, kept until the queued lines are over (doc 95 Holds; errata 197). */
  private lingering: HeldPose[] | null = null;
  /** The accost's seat he is walking to, and the state he is in once he sits (errata 197). */
  private seatedState: string | null = null;
  /** Where he stood before he was set down at the table, and goes back to when he rises. */
  private seatedFrom: { x: number; y: number } | null = null;
  /** A line `overBlack` has blacked out the play area until the room changes (doc 57 B3). */
  private overBlack = false;
  /** A scene's destination, travelled to once its lines have been read (GameState.resolveInteraction). */
  private travelAfterSay: string | null = null;
  /** Where the last click in the room landed, in world pixels: Room 33's taps are placed by it. */
  private lastClick: { x: number; y: number } | null = null;
  /** Room 33's ripples, each from its tap to the end of its tail (scene ms). */
  private ripples: { x: number; y: number; start: number; end: number; tail: number }[] = [];
  /** Scene ms at Room 33's confirmed void: the score's ninety seconds run from here, control away. */
  private tuneStart: number | null = null;
  private readonly tuneCuesFired = new Set<string>();
  /**
   * DOC 48 S5 BEAT 3: "He sits down in the dark and listens to it." Set at the
   * void; once its line has been read he turns to the void and sits. Seated is
   * his mover state (`seated`), so it saves with the room and a load finds him
   * where he was; the first click after the ninety seconds stands him up.
   */
  private sitDue = false;
  /** When he came into this room (scene seconds): a figure's `onArrival` frames count from it (errata 121 B). */
  private arrivedAt: number | undefined;
  /** An exit's beat played where it goes: its first line waits until this (scene seconds; errata 121 B). */
  private sayAt: number | null = null;
  /**
   * THE ACT CARDS AFTER THE OPENING (errata 84 C). ACT is the one fact; when it
   * rises in play, that act's card (content/act-cards.json, from doc 57) is
   * shown once the scene's last line has been read and no conversation is
   * open, and holds the opening card's time. A load or a fixture is not a
   * turn: `lastAct` is re-read from the state then, so no card plays.
   */
  private lastAct: number | null = null;
  private pendingActCard: string | null = null;
  private actCardUntil: number | null = null;
  /** Lines to speak once the arrival walk finishes, not during it. */
  private linesOnArrival: { speaker: string; line: string; direction?: boolean }[] | null = null;
  /** An arrival scene's outcome, owed when its lines have all been read (onEnter.sayAfter). */
  private afterArrival: { set?: Record<string, boolean | number>; gives?: string[]; completes?: string }[] | null = null;

  /** A tree to open, and who to turn to, when the walk started for it ends. */
  /**
   * A conversation Thad is walking to. `greeted` turns true on arrival, when
   * the node's opening exchange (if it has one) is queued on the speech
   * channel; the tree itself opens once that has been said.
   */
  private pendingTree: {
    tree: string; at: { x: number; y: number }; greeted: boolean;
    /**
     * The accost's chair (errata 197): taken as this conversation opens. It belongs to the conversation, so
     * a click that cancels it, or leaving the room, drops the seat with it (Codex on #279: a stale seat
     * had sat him down at the next conversation, wherever it was).
     */
    seat?: { facing: Facing; state: string; sitAt?: { x: number; y: number }; from: { x: number; y: number } };
    /** A duel he calls on Thad (an accost's `duel`): its intro is the greeting. */
    duel?: string;
    /** The ambient character the conversation is with, when it is one. */
    npc?: string;
    /**
     * AN EVIDENCE ACTION ON THE WAY TO A PERSON (errata 66 A-C): the pair it
     * carries, the beat it holds at contact before the puzzle lands, and
     * whether it has landed. Cancelled with the walk; committed once, at
     * contact, after the beat; its tree's opening is then the action's.
     */
    evidence?: { pair: CombinationPair; beatUntil: number | null; committed: boolean };
    /**
     * A TIMELINE STEP THAT IS THE ACTION (errata 71 C): the puzzle it gates on
     * has just completed, so the entry's opening is the action's, performed
     * once -- Room 32's lid into HOB_C1.
     */
    viaAction?: boolean;
    /**
     * OWED BY A RESPONSE (errata 239): a verb's answer opens this tree when its lines have been read. He is where
     * he was when he acted, so nobody is turned to face anything as it opens.
     */
    owed?: boolean;
  } | null = null;
  /** How long the evidence is held before her before it lands: contact, then the line. */
  private static readonly EVIDENCE_BEAT_SECONDS = 1.1;
  /** How often a room with lamps redraws for their flicker, per second. */
  private static readonly LAMP_TICKS = 10;
  /** The selection being performed, or null while choices are up. */
  private performance: DialoguePerformance | null = null;
  /**
   * Who is saying the line on screen, when the line records it.
   *
   * Doc 44's probe reports this so the gauntlet can assert that beat 3's
   * first line is Thad's and its second is the driver's -- WITHOUT either
   * file quoting the words, which live in doc 17 and are extracted from it.
   * Null for a line that carries no attribution; never inferred.
   */
  private sayingActor: string | null = null;
  /** The line on the speech channel is a stage direction, not speech. */
  private sayIsDirection = false;
  private notice: string | null = null;
  private barkLines: string[] = [];
  /** The last break that spoke, so a clock-derived break fires its line once. */
  private spokenBreak: string | null = null;
  private soundedBreak: string | null = null;
  /** Errata 163: the map's Thad on his way to a place; travel happens when he arrives. */
  private mapWalk: { walk: MapWalk; startedAt: number; location: import('../core/types.ts').MapLocation } | null = null;
  private barkAt: { x: number; y: number } | null = null;
  /** Errata 169: who said the bark, so it is drawn in his colour. */
  private barkBy: string | null = null;
  private barkTimer?: Phaser.Time.TimerEvent;
  private barkChain?: Phaser.Time.TimerEvent;
  /** A sound written in the world, over the thing that made it. See `showCaption`. */
  private captionLines: string[] = [];
  private captionAt: { x: number; y: number } | null = null;
  private captionTimer?: Phaser.Time.TimerEvent;
  /**
   * Boards that answer a foot, for the current room, and where the feet were
   * last tick so a crossing can be swept rather than sampled.
   */
  private steps: StepTriggers | null = null;
  private feetBefore: { x: number; y: number; walking: boolean } | null = null;
  /** Doc 45 cues this scene has fired: ids only. Playback is the audio layer's when one exists. */
  private cuesFired: { last: string | null; count: number } = { last: null, count: 0 };
  private noticeTimer?: Phaser.Time.TimerEvent;
  private dirty = true;
  /** Drawn frames, for the probe. Counted here because the scene decides. */
  private frameCount = 0;
  private readonly cyclers = new Map<string, CyclingBackground>();
  private lastCycle: Map<number, number> | null = null;
  private lastFrameAt = 0;
  /** Doc 22 section 7's choreography. One performance at a time. */
  private readonly sequence = new SequenceRunner();

  /**
   * Doc 17's opening, as segments. Null once it has handed over control, and
   * null from the start in any room it is not the opening of.
   *
   * NOTHING HERE MAY ANNOUNCE ITSELF AS INSTRUCTION. Doc 17 v3.1 makes the
   * whole opening the tutorial -- receive a destination, walk there, examine
   * something, open a door, talk to someone, navigate a tree, get an
   * objective -- and the constraint that goes with it is that no part of it
   * says so. No tips, no prompts, no highlighted first target, no tutorial
   * text. That is why this plays lines and hides the panel and does nothing
   * else: every affordance the player learns, they learn by using it.
   */
  private opening: Segment[] | null = null;
  private openingAt = 0;
  private openingDoneFlag: string | null = null;
  /**
   * Doc 17 beat 9's carrier, and the beats after it. Issue X4's fourth
   * finding: "beat 9 additionally has no carrier".
   *
   * It is a SECOND runner, deliberately. The opening runner plays instead of
   * the player; this one plays alongside him. Hob crosses the road while the
   * panel is up and the player may walk, look and listen throughout -- which
   * is what doc 17 means by putting `yes` in beat 9's interactive column.
   */
  private readonly carried = new CarriedBeats(
    (writes) => this.state.flags.applyWrites(writes),
    (flag) => this.state.flags.get(flag));
  private actCard: string | null = null;
  private hoveredLocation: string | null = null;

  constructor() {
    super(GAME_SCENE);
  }

  create(): void {
    this.state = this.registry.get(REGISTRY_STATE) as GameState;

    const texture = this.textures.createCanvas(SCREEN_TEXTURE, NATIVE_WIDTH, NATIVE_HEIGHT);
    if (!texture) {
      throw new Error('Could not create the screen texture');
    }
    this.texture = texture;
    this.add.image(0, 0, SCREEN_TEXTURE).setOrigin(0, 0);

    const context = this.texture.getContext();
    context.imageSmoothingEnabled = false;
    this.screen = new Screen(context, this.state.content.palette);
    // THE PLAY AREA'S FACE. `?font=Family` in a DEV build swaps a candidate in
    // so Q16 can be ruled on by looking at the real UI; with no parameter this
    // constructs exactly what it always did.
    const candidate = askedFont();
    this.font = candidate
      ? new PreviewFont(this.state.content.font, candidate.family, candidate.px, candidate.weight)
      : new BitmapFont(this.state.content.font);
    // The protagonist's id comes from content. No .ts file names him, and
    // the registry does not know which of its movers he is beyond holding it.
    this.actor = new Actor(this.state, this.state.content.actor.id,
      NATIVE_WIDTH / 2, PLAY_HEIGHT - 14 * GLYPH_SCALE, {
        // NO `hasIdleBreak` HERE ANY MORE, and its absence is the fix. This
        // was the only place it was ever set, so the protagonist was the only
        // mover that could break -- every other one arrives through
        // RoomActors.place() with no options. Hob and the coach declare the
        // clip and could not reach it. Actor asks each record for itself now.
        routed: true,
      });
    this.actor.placeIn(this.state.roomId);
    this.actors = new RoomActors(this.state, this.actor);
    this.world = new SequenceWorld({
      actors: this.actors,
      bodies: this.bodies,
      choreSeconds: (mover, clip) => this.choreSeconds(mover, clip),
      choreLands: (mover, clip) => this.choreLands(mover, clip),
      say: (step) => this.saySequenceStep(step),
      cue: (id) => this.fireCue(id),
      paths: this.state.content.paths,
      // THE TRAVEL, NAMED BY ITS EXIT. The scene owns the room change because
      // it owns the bookkeeping around one -- the autosave and the actor
      // registry -- exactly as it does for a transit the player causes.
      travel: (through) => {
        const exit = (this.state.room.exits ?? []).find((each) => each.id === through);
        if (!exit) throw new Error(`No exit "${through}" in ${this.state.room.id}`);
        this.state.enterRoom(exit.to);
        // AND THE ROOM MUST BE ENTERED, NOT MERELY SET. `enterRoom` changes
        // which room the state points at; `enterRoomPerformance` is what
        // clears the previous room's cast, cancels its sequences, abandons its
        // world and places the actor. Every other way into a room calls both.
        // This one called only the first, so beat 11 walked Thad into Main
        // Street and the STAGE ROAD CAME WITH HIM -- the coach, its horses,
        // the driver and Hob all standing in the middle of town, on a street
        // that declares none of them.
        this.enterRoomPerformance();
        this.setSay(null);
        this.markDirty();
      },
      // The view, which is state and not a drawing. A `to` cuts immediately; a
      // `follow` takes effect on the next tick's `followCamera`, which is
      // where the mover's position is known.
      camera: (to, follow) => {
        this.state.moveCamera(to, follow);
        this.markDirty();
      },
      // ERRATA 157: the first shot starts in the sky and glides down.
      pan: (seconds) => {
        this.panning = { from: this.time.now / 1000, seconds };
        this.markDirty();
      },
      // ERRATA 157: held at the top of the sky, the voices in the dark, until the pan.
      sky: () => {
        this.panning = { from: null, seconds: 0 };
        this.markDirty();
      },
    });
    this.load.on('loaderror', (file: { key: string }) => { this.loadFailed.add(file.key); this.markDirty(); });
    this.ambient = new AmbientLayer(this.state);
    this.panel = new PanelLayout(this.state.content.panel);
    this.view = new Renderer(this.screen, this.font, this.state, this.actors, this.ambient,
      (roomId) => this.backgroundFor(roomId),
      (roomId) => this.foregroundFor(roomId),
      (roomId) => this.imageFor(roomId, 'idle', this.state.content.rooms.get(roomId)?.idles?.sheet),
      (path) => this.sheetFor(path));

    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    // A TAP IS NOT A GESTURE UNTIL IT LIFTS (Tyler's Chromebook, 2026-11-07: "The music on the main screen still
    // isn't working"). Chrome grants a touch its user activation on touchend/pointerup, not on pointerdown, so a
    // finger on "Click to begin" asked for the title's music a moment too early and was refused. Sound is
    // unlocked again, from the browser's own events, on every lift, click and key: each retries a bed that is
    // wanted and silent (Music.unlock), and costs nothing when the music is already playing.
    if (typeof window !== 'undefined') {
      const retry = (): void => {
        this.music.unlock();
        this.ambience.unlock();
        this.cueBed.unlock();
      };
      for (const event of ['pointerup', 'touchend', 'click', 'keydown']) window.addEventListener(event, retry, { passive: true });
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        for (const event of ['pointerup', 'touchend', 'click', 'keydown']) window.removeEventListener(event, retry);
      });
    }
    // DOC 30 SECTION 6.1's CONVENIENCE: the wheel or a trackpad scrolls a long
    // choice list, one option a notch. The arrows remain the way to do it.
    this.input.on(Phaser.Input.Events.POINTER_WHEEL,
      (_pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
        if (dy !== 0 && !this.state.menu.isOpen) this.scrollChoices(Math.sign(dy));
      }, this);
    this.input.keyboard?.on(`keydown-${KEY_MENU}`, this.onMenuKey, this);
    // Doc 30 section 4.2. The same one-utterance advance a click gives, so a
    // player who is reading rather than clicking is not stuck at the mouse.
    for (const key of KEY_ADVANCE_LINE) {
      this.input.keyboard?.on(`keydown-${key}`, this.onAdvanceKey, this);
    }
    // Ctrl+S and Ctrl+L, both preventDefault so the browser does not take
    // them. Convenience only -- everything they do is on the menu.
    this.input.keyboard?.on('keydown', this.onModifiedKey, this);

    // The warp happens BEFORE beginOpening, which is what makes it skip the
    // opening rather than fight it: the opening declines to run anywhere but
    // the manifest's start room.
    // A PLAYTEST FIXTURE FIRST, THEN THE WARP. The fixture is a restored
    // save, so it decides the room; `?room=` on top of it is allowed and
    // moves out of that room with the fixture's state intact.
    const fixtureId = askedFixture();
    if (fixtureId) {
      const fixture = this.state.content.fixtures.get(fixtureId);
      if (!fixture) {
        console.warn(`?fixture=${fixtureId} is not a fixture. Known: `
          + [...this.state.content.fixtures.keys()].join(', '));
      } else if (this.state.applyFixture(fixture)) {
        this.enterRoomPerformance(null);
      }
    }
    const warp = this.warpRoom();
    if (warp) {
      this.state.enterRoom(warp);
      this.enterRoomPerformance(null);
    }
    // `?objects=stove=out`: named objects in named states, for review (doc 36 Q117).
    for (const [id, wanted] of Object.entries(askedObjectStates())) {
      const target = this.state.targets.find((candidate) => candidate.id === id);
      if (!target || !target.states?.[wanted]) {
        console.warn(`?objects: ${id}=${wanted} names no such object state in ${this.state.roomId}`);
        continue;
      }
      this.state.setState(target, wanted);
    }

    // THE TITLE FIRST (errata 128), on a plain boot: NEW GAME is the click
    // that unlocks audio, so the opening then plays with sound from its first
    // frame. A `?room=` warp or a `?fixture=` is a review link and goes
    // straight into the game, as it always has.
    if (!fixtureId && !warp && this.state.content.title) {
      this.toTitle();
      // ERRATA 155: sound is still locked on a fresh page, so the title waits
      // behind "Click to begin" and that click is the one that starts its bed.
      this.beginCard = bootsToBeginCard(this.state.content.title, this.music.isUnlocked);
    } else this.beginOpening();
    this.markDirty();
    this.loadNear();
  }

  /**
   * THE ROOM HE IS IN, WHO IS IN IT, AND THE ROOMS NEXT DOOR -- fetched while
   * the game is already on screen, and nothing further. `planNear` decides the
   * list and its order; this half asks for what is not here yet and lets go
   * of the room art that has fallen off it, so a Chromebook is never holding
   * every plate in the game at once (Tyler, 2026-11-05: a black screen).
   *
   * Called on every entry. Only what this method asked for is ever let go,
   * and only once it has arrived: boot's own images, the ambient sheets and
   * the icons stay for the session.
   *
   * Each arrival marks the frame dirty, because the renderer redraws on change
   * and a texture appearing is a change it cannot otherwise see. Until a frame
   * arrives the renderer draws the graybox it already falls back to for an
   * absent texture -- Q20's rule: a missing sprite looks missing, and nothing
   * is quietly substituted for it.
   */
  private readonly nearAsked = new Set<string>();

  private loadNear(heading: string | null = null): void {
    // The room a cut-away left is kept until it is come back to (planCut, errata 242).
    const near = planCut(this.state.content, this.state.roomId, this.state.cutawayHome, heading);
    const keep = new Set(near.map((asset) => asset.key));
    for (const key of [...this.nearAsked]) {
      if (keep.has(key) || !this.textures.exists(key)) continue;
      this.textures.remove(key);
      this.nearAsked.delete(key);
    }
    let queued = 0;
    const swaps = askedCandidates();
    for (const { key, path } of near) {
      if (this.textures.exists(key) || this.nearAsked.has(key)) continue;
      this.load.image(key, new URL(resolveAssetPath(path, swaps), document.baseURI).toString());
      this.load.once(`filecomplete-image-${key}`, () => this.markDirty());
      this.nearAsked.add(key);
      queued += 1;
    }
    if (queued > 0) this.load.start();
  }

  update(): void {
    const now = this.time.now / 1000;
    // Ruling 20's idles are a function of the clock and nothing else, so the
    // only state needed is what the last drawn frame showed.
    const before = this.lastFrameAt;
    if (IdleLayer.changed(this.state.room, before, now)) this.markDirty();
    this.lastFrameAt = now;

    // THE TITLE IS UP (errata 128): the game behind it does not run -- no
    // scene, no act turn, no accost -- and only the title is drawn.
    if (this.titleMenu) {
      if (this.entry?.phase === 'out') this.tickEntry(now);
    }
    if (this.titleMenu) {
      if (!this.dirty) return;
      this.dirty = false;
      this.frameCount += 1;
      this.view.drawFrame({ hoveredTarget: null, hoveredTargetName: null, sayLines: [], notice: this.notice,
        barkLines: [], barkAt: null, captionLines: [], captionAt: null, fadeBlack: this.fadeBlack,
        title: { items: this.titleMenu, hovered: this.titleHover, theEnd: this.titleTheEnd, begin: this.beginCard } });
      this.texture.refresh();
      return;
    }

    // AN ARRIVAL ON A ROOM STILL ARRIVING (errata 223): black, and nothing of
    // the room runs -- no line, walk, scene or clock -- until it is whole.
    if (this.holdsArrival(now)) {
      this.showLoading(now);
      this.present();
      return;
    }

    // THADDEUS ACTS IN A CLIP (doc 95; errata 148): while a beat holds a frame
    // of his, the actor draws it; when the beat is over he is let go.
    this.actor.hold(this.heldPoses()?.find((pose) => pose.id === this.actor.id && pose.clip) as
      { clip: string; frame: number; facing?: Facing } | undefined ?? null);

    // A LINE THAT HAS BEEN READ COMES DOWN. Its hold is doc 30 section 4.1's,
    // computed by lineSeconds from the rate in ui.json -- the same number a
    // cutscene already waits out before its next step, now also the number
    // after which the words leave the screen rather than sitting there until
    // something else happens to move them.
    if (this.actWalking && !this.actor.isWalking) this.actWalking = false;
    if (this.sayUntil !== null && now >= this.sayUntil && !this.actWalking) {
      // A GREETING RUNS ON ITS OWN: the next line of a conversation's opening
      // follows when the last has been read, as a performed exchange's lines
      // do. So does an arrival scene with an outcome (onEnter.sayAfter, doc 57
      // D6): several voices in turn, and nothing for the player to answer.
      // AND SO DOES EVERY OTHER QUEUED LINE (the bookends audit, finding 1):
      // a verb's `then`, a first sight, a door's beat, the filing, the close.
      // They used to come down and wait, blank, for a click nobody was asked
      // for -- and the click that came was spent on them. SpeechPolicy.
      if (holdOver(this.pendingSay.length) === 'next') {
        this.advanceSay();
      } else {
        // Empty: settles an arrival scene's outcome, if one is owed.
        this.advanceSay();
        this.setSay(null);
      }
      this.markDirty();
    }
    // THE SCENE'S LAST LINE HAS BEEN READ: now the room changes.
    if (this.travelAfterSay !== null && this.sayingActor === null && this.pendingSay.length === 0) {
      const destination = this.travelAfterSay;
      this.travelAfterSay = null;
      this.state.enterRoom(destination);
      this.hovered = null;
      this.hoveredName = null;
      this.enterRoomPerformance();
      this.markDirty();
    }
    // A TIMELINE ROOM THAT IS OVER HANDS ON (RoomFile.afterTimeline). Room 32:
    // the lid has opened, HOB_C1 has been talked through, and Thad is out on
    // the hill (doc 57 E8). Nothing is cut short: no line is up, nothing waits
    // to be said or chosen.
    const after = this.state.room.afterTimeline;
    // Or any room that is over once a flag says so (Room 7: the filing, doc 57 F5).
    if (after && (!this.state.room.timeline?.length || !this.timeline.isRunning)
      && !this.state.dialogue.isActive && !this.pendingTree && this.performance === null
      && this.sayingActor === null && this.pendingSay.length === 0 && this.travelAfterSay === null
      && this.state.flags.test(after.when) && this.roomFade === null) {
      // BY A FADE, where the room says so (errata 133; doc 48 S7 beat 1:
      // "Fade up on the street"): to black, a held beat, then up on the next.
      if (after.fade) {
        this.roomFade = { after, from: now, enteredAt: null, upFrom: null };
        this.hovered = null;
        this.hoveredName = null;
      } else {
        this.state.handOn(after);
        this.hovered = null;
        this.hoveredName = null;
        this.enterRoomPerformance();
      }
      this.markDirty();
    }
    this.tickRoomFade(now);
    this.tickEntry(now);
    this.tickCutaway(now);
    if (this.panning) this.markDirty();
    this.tickListening();
    this.tickEnding(now);
    // AN EXIT'S BEAT, PLAYED WHERE IT WENT (errata 121 B): its first line once the pause is over.
    if (this.sayAt !== null && now >= this.sayAt) {
      this.sayAt = null;
      this.advanceSay();
    }
    this.watchActTurn(now);
    this.openActWhenQuiet();
    this.view.setClock(now);
    this.musicBefore = this.musicNow;
    this.musicNow = this.music.position() ?? now;
    this.view.setMusicClock(this.musicNow, this.bedTempo());
    if (this.cycleChanged()) this.markDirty();
    // THE WORLD MOVES, THEN SETTLES, THEN THE SCRIPT DECIDES. This order is
    // load-bearing and it used to be the other way round.
    //
    // A chore's end is computed twice: the runner waits `now + duration` from
    // the tick it issued one, and the Actor ends it from its OWN clock. With
    // the sequence first, the actor's clock was a frame behind the runner's,
    // so the actor finished at `now(N-1) + d` against the runner's
    // `now(N) + d` -- and the release, which happened at the END of the tick,
    // normally landed a frame before the next claim, at the START of one.
    //
    // ON A LONG FRAME BOTH DEADLINES FALL IN THE SAME TICK. The runner then
    // advanced and claimed the body while the chore still held it and had not
    // been settled: `BODY_ONE_OWNER: thad@chore+walk`, reproducible at 5 Mbps
    // and under anything else that stretches a frame. It is a race, so it
    // looked like an instrument artefact the first time it appeared.
    //
    // Advancing and settling FIRST puts the two clocks in phase -- a chore
    // issued now records the same `now` the runner waits from -- and
    // guarantees that whatever finished has let go before anything asks.
    // A LINE CLEARS ITSELF. Doc 30 section 4.1's reading hold, and the build
    // had none: interactive dialogue waited for a click forever, which is what
    // made a conversation read as a menu of prompts rather than a performance.
    this.tickTimeline();
    if (this.performance?.tick(now)) this.showPerformance();
    if (this.actors.update(now)) this.markDirty();
    this.sweepSteps(now);
    // Where he is standing is state, and this is the only place that knows it.
    this.state.rememberStanding(this.actor.x, this.actor.y);
    // And where the FOLLOWED mover is, which is usually but not always him.
    // Resolved through the registry rather than assumed to be the player: a
    // beat may hand the view to the coach, and a camera that silently tracked
    // the protagonist instead would be issue X4's defect again -- an id that
    // arrives on every call and is thrown away.
    const followed = this.state.cameraFollowing;
    const tracked = followed ? this.actors.get(followed) : undefined;
    if (tracked) this.state.followCamera(tracked.id, tracked.x);
    // Every body whose walk or chore has finished is handed back HERE, once a
    // tick and in one place. A claim that outlives its motion is what makes
    // the next one trip assertion 6.
    this.world.settleBodies();
    const wasRunning = this.sequence.isRunning;
    if (this.sequence.update(now, this.world)) this.markDirty();
    // Beat 9's carrier runs alongside the player rather than instead of him,
    // so it is ticked whether or not the opening runner is.
    if (this.carried.update(now, this.world)) this.markDirty();
    // A character walking out (AmbientFile.exit) moves every frame he walks.
    // An acted beat still to play holds its figures (doc 54 A5): whoever it sends away goes after his part.
    this.ambient.holdLeavers = new Set([...(this.queuedPoses ?? []), ...this.pendingSay.flatMap((line) => line.poses ?? [])
      .concat(this.pendingSay.flatMap((line) => line.direction && !line.silent
        ? (actOf([...this.ambient.present, ...this.ambient.leaving], line.line) ?? []).flatMap((step) => step.poses) : []))]
      .map((pose) => pose.id));
    if (this.ambient.noteDepartures(now)) this.markDirty();
    // A FIGURE WHO HAS FADED OUT may owe a sound (AmbientFile.leaves): Fanshawe's door.
    for (const cue of this.ambient.takeCues()) this.fireCue(cue);
    if (this.sequence.isRunning || this.carried.isRunning) this.markDirty();
    // The opening's automatic segment has played out. Bank its flag writes
    // and move on -- to the driver's tree, or to control.
    if (this.opening && wasRunning && !this.sequence.isRunning) this.advanceOpening();
    // Ambient idles are two-frame and slow, so the scene redraws on the frame
    // one of them turns over rather than every frame. Same rule as ruling
    // 20's crowds: the room is still, and then it is very slightly not.
    if (this.ambientChanged(before, now)) this.markDirty();
    // A LAMP FLICKERS CONTINUOUSLY, so a lit room redraws on a slow tick
    // rather than never: before this, the glow only moved when something else
    // happened to cause a frame. Ten a second is enough for a two-sine wobble
    // of a few per cent and far below the per-frame cost of walking.
    if (this.state.room.lamps?.length
      && Math.floor(before * GameScene.LAMP_TICKS) !== Math.floor(now * GameScene.LAMP_TICKS)) {
      this.markDirty();
    }
    // A DUEL BEGINS OR ENDS: its music comes in or goes (errata 109).
    if (this.state.dialogue.duelSounding !== this.duelPlaying) {
      this.duelPlaying = this.state.dialogue.duelSounding;
      this.applyMusic();
    }
    if (this.actor.isWalking) {
      this.markDirty();
      this.footsteps();
      // A WALK TO A CONVERSATION HEARS ONLY THE PERSON IT IS GOING TO. Barks
      // are the town noticing Thad in passing; on the way to talk to somebody
      // a BYSTANDER's remark lands on top of the greeting that follows (the
      // one-strike man, two stools from the card sharp, did exactly that).
      // The person being approached still calls out as before, if Thad comes
      // within her radius -- unless he greets with that bark, in which case
      // he says it to Thad's face.
      // Nothing a bystander had to say is consumed: he says it next time.
      const going = this.pendingTree;
      const host = going?.npc ? this.ambient.present.find((each) => each.id === going.npc) : undefined;
      const fired = this.cut !== null ? null
        : !going ? this.ambient.checkApproach(this.actor.x, this.actor.y)
        : host && !host.greetsWithBark ? this.ambient.checkApproach(this.actor.x, this.actor.y, host.id)
          : null;
      if (fired?.cue) this.fireCue(fired.cue);
      if (fired?.exchange) this.showBarkExchange(fired.exchange);
      else if (fired?.line && this.mayCallOut(fired.npc.id, fired.line)) {
        this.showBark(fired.npc.id, fired.line, fired.npc.x, this.barkFoot(fired.npc));
      }
    }
    // The tree opens when the walk that was started for it finishes.
    if (this.linesOnArrival && !this.actor.isWalking) {
      const lines = this.linesOnArrival;
      this.linesOnArrival = null;
      this.pendingSay.push(...lines);
      this.advanceSay();
      this.markDirty();
    }
    if (this.pendingTree && !this.actor.isWalking) {
      const { tree, at, evidence } = this.pendingTree;
      if (!this.pendingTree.greeted) {
        this.pendingTree.greeted = true;
        // HE TURNS TO WHOEVER HE IS TALKING TO. Walking to a point beside the
        // map seller left Thad facing whichever way the walk happened to end --
        // in Tyler's screenshot, squarely at the building behind him. A man
        // stops, turns, and then speaks.
        // UNLESS THE STAGING SAYS WHICH WAY. `faceToward` takes the dominant
        // axis, so a seated drinker whose feet are well above Thad's turned
        // him to face the bar with his back to the room. A declared stand's
        // `facing` is the authored answer, honoured when he is standing on it.
        const talker = this.pendingTree.npc
          ? this.ambient.present.find((each) => each.id === this.pendingTree?.npc) : undefined;
        const declared = talker?.walkTo;
        if (declared?.facing && Math.abs(this.actor.x - declared.x) < 8 && Math.abs(this.actor.y - declared.y) < 8) {
          this.actor.setFacing(declared.facing);
        } else {
          this.actor.faceToward(at.x, at.y);
        }
        // AND SITS, when the accost gave him a chair (errata 197): his seated clips until it ends.
        const seatDue = this.pendingTree.seat;
        if (seatDue) {
          // ON THE CHAIR AT THE TABLE'S END (Tyler, 2026-11-08: "his hands out on nothing"): set down where
          // his forearms meet the cloth, off the walked floor, and put back on it when he rises.
          if (seatDue.sitAt) { this.actor.placeAt(seatDue.sitAt.x, seatDue.sitAt.y); this.seatedFrom = seatDue.from; }
          this.actor.setFacing(seatDue.facing);
          this.state.setMoverState(this.actor.id, seatDue.state);
          this.seatedState = seatDue.state;
        }
        if (evidence) {
          // CONTACT. She looks up from the ledger now (the greeting state
          // holds her talk frame) and the evidence is held before her for a
          // beat before it lands. The beat is where a show-evidence chore
          // would play; no Family-A chore exists (doc 36 Q113), so the
          // accepted stand facing her is the presentation.
          evidence.beatUntil = this.lastFrameAt + GameScene.EVIDENCE_BEAT_SECONDS;
        } else {
          // THE GREETING IS SAID BEFORE THE LIST IS OFFERED. Doc 04 opens each
          // act root on a short exchange; it is spoken here, line by line on
          // the ordinary speech channel, each line by the speaker it names,
          // and only when it has drained does the tree open. Tyler's Room 5
          // playthrough (2026-09-04): the exchange had never played -- the
          // node's last line stood as a caption over the options, which read
          // as a non sequitur when TALK TO was chosen.
          let greeting: { speaker: string; line: string; direction?: boolean }[] = this.pendingTree.duel
            ? this.state.dialogue.duelIntro(this.pendingTree.duel)
            : this.state.dialogue.openingOf(tree, this.pendingTree.viaAction === true);
          const host = this.pendingTree.npc
            ? this.ambient.present.find((each) => each.id === this.pendingTree?.npc) : undefined;
          // A PAIR GREETS IN BOTH VOICES (errata 110): the boundary men's bark
          // is an exchange, each line over the man who says it.
          const remark = host?.greetsWithBark ? this.ambient.barkLinesFor(host) : [];
          if (greeting.length === 0 && host && remark.length) {
            greeting = remark.map((one) => ({ speaker: one.speaker, line: one.line }));
            this.ambient.markBarked(host);
          }
          if (greeting.length > 0) {
            this.pendingSay.push(...greeting.map((spoken) => ({ speaker: spoken.speaker, line: spoken.line,
              ...(spoken.direction ? { direction: true } : {}) })));
            this.advanceSay();
          }
        }
      }
      const holdingEvidence = evidence !== undefined && !evidence.committed;
      if (holdingEvidence && !(evidence.beatUntil !== null && this.lastFrameAt < evidence.beatUntil)) {
        // THE ACTION LANDS: the puzzle completes through the journal, and the
        // tree's opening -- the action's, performed once -- is spoken. No
        // control returns between the two (errata 66 C).
        evidence.committed = true;
        this.state.commitEvidence(evidence.pair);
        const opening = this.state.dialogue.openingOf(tree, true);
        if (opening.length > 0) {
          this.pendingSay.push(...opening.map((spoken) => ({ speaker: spoken.speaker, line: spoken.line })));
          this.advanceSay();
        }
        this.markDirty();
      }
      if (!(evidence && !evidence.committed) && this.sayLines.length === 0 && this.pendingSay.length === 0) {
        const called = this.pendingTree.duel;
        const owedByAction = this.pendingTree.owed === true;
        this.pendingTree = null;
        if (!owedByAction) this.actor.faceToward(at.x, at.y);
        if (called) this.state.dialogue.startDuel(tree, called);
        else this.state.dialogue.start(tree);
        this.markDirty();
      }
    }

    this.speakingBreaks();
    this.soundingBreaks();
    // Errata 163: the map's Thad walking. Redrawn every frame he moves; travel when he arrives.
    if (this.mapWalk) {
      if (!this.state.isMap) this.mapWalk = null;
      else if (this.time.now / 1000 - this.mapWalk.startedAt >= this.mapWalk.walk.seconds) this.arriveByMap();
      else this.markDirty();
    }

    // A CONVERSATION THAT CLOSES HANDS THE POINTER BACK TO THE ROOM (errata
    // 143): the sentence line names what is under it now, not what it named
    // before the conversation opened, and not nothing until the pointer moves.
    const talking = this.conversationOpen();
    // THE DINNER IS OVER: he stands from the chair as the conversation closes (errata 197).
    if (this.wasTalking && !talking && this.seatedState !== null) {
      if (this.state.moverState(this.actor.id) === this.seatedState) this.state.setMoverState(this.actor.id, undefined);
      this.seatedState = null;
      if (this.seatedFrom) { this.actor.placeAt(this.seatedFrom.x, this.seatedFrom.y); this.seatedFrom = null; }
      this.markDirty();
    }
    if (this.wasTalking && !talking && !this.panelHidden) {
      this.onPointerMove(this.input.activePointer);
      this.markDirty();
    }
    this.wasTalking = talking;

    this.showLoading(now);
    this.present();
  }

  /** The frame, drawn if anything changed since the last one. */
  private present(): void {
    if (!this.dirty) return;
    this.dirty = false;
    this.frameCount += 1;
    this.view.drawFrame({
      hoveredTarget: this.hovered,
      hoveredTargetName: this.hoveredName,
      sayLines: this.sayLines,
      notice: this.notice,
      barkLines: this.barkLines,
      barkAt: this.barkAt,
      barkBy: this.barkBy,
      captionLines: this.captionLines,
      captionAt: this.captionAt,
      actCard: this.actCard,
      overBlack: this.overBlack,
      // Doc 17 beat 8: the panel appears when control does, and not before.
      // DOC 30 SECTION 88: "Replace the verbs/inventory area while choosing."
      // REPLACE, and the engine was drawing both. DIALOGUE_BOTTOM is 1062 and
      // the play area ends at 864, so a three-option list runs 882 to 1062 --
      // entirely inside the panel. The result is what Tyler photographed: "What
      // is in the pie?" printed across "Talk to THE PIE WOMAN", two layers
      // writing the same band.
      //
      // The router was already right -- `choicesActive` is tested before
      // `panel`, so the clicks were going to the list all along. This was
      // never a hit-testing bug; it only looked like one because the thing
      // underneath was still visible and invited the click.
      // AND NOT DURING A CUTSCENE BEAT AFTER CONTROL (errata 133): doc 17 beat
      // 11, the walk away under the title, is control `none` like beats 2-7.
      // AND NOT FOR ANY OF A CONVERSATION (errata 143). The panel came back
      // for every line performed between choices -- the verbs, the inventory
      // and a sentence line still reading "Talk to THE LIVERY MAN" -- and went
      // again when the list returned: a flash of an interface nobody could
      // use, since a click then only reads the line on. In both SCUMM games
      // the area stays the conversation's from the greeting to the last word.
      showPanel: this.panelDrawn = panelShows({ opening: this.opening !== null, conversation: this.conversationOpen(),
        panelHidden: this.panelHidden, cutscene: this.carriedCutscene() }),
      hoveredLocation: this.hoveredLocation,
      mapToken: this.mapTokenPose(),
      ripples: this.ripples.map((one) => ({ x: one.x, y: one.y, tail: one.tail,
        age: Math.max(0, Math.min(1, (this.time.now - one.start) / Math.max(1, one.end - one.start))) })),
      lampStill: this.lampStillness(),
      // Doc 44: the beat travels with the frame so a violation recorded
      // while it is drawn can name it. Undefined outside a performance.
      beat: this.playingBeat(),
      // Doc 43 line 97: the driver's head answers to who is speaking. Null
      // when nobody is, which selects the overlay's default.
      speaker: this.sayLines.length > 0 ? this.sayingActor : null,
      // THE LINE IS WAITING FOR A CLICK, and says so with a small mark (finding 11).
      awaitingClick: this.sayLines.length > 0 && this.sayWaiting,
      direction: this.sayLines.length > 0 && this.sayIsDirection,
      pose: this.performingPose(),
      poses: this.heldPoses(),
      still: this.stilled,
      tally: this.slateTally(),
      nodeCounter: this.nodeCounterLines(),
      performing: this.performance !== null,
      choiceView: this.choicesShowing() ? this.choiceViewNow() : {},
      // Whose greeting is being said, so they hold still for it as they do
      // for their open tree.
      greeting: this.pendingTree?.greeted ? this.pendingTree.tree : null,
      sceneControls: this.sceneControlsShowing() && !this.state.menu.isOpen,
      title: this.titleMenu ? { items: this.titleMenu, hovered: this.titleHover, theEnd: this.titleTheEnd, begin: this.beginCard } : null,
      // ROOM 33'S NINETY SECONDS: the panel inert and dim, the sentence blank (errata 133).
      panelDim: this.tuneStart !== null,
      fadeBlack: this.fadeBlack,
      // ERRATA 223: "Loading…" over a black that has waited on its room past the threshold.
      loading: this.loadingUp ? this.state.content.ui.loading?.label ?? null : null,
      pan: this.panFrame(),
      // ERRATA 158: in a cut-away's room he is not there, nor anyone who moves with him.
      moversHidden: this.state.inCutaway,
      shot: this.cutawayShot(),
      page: this.overBlack && this.page.length ? this.page : null,
      pageAlpha: this.pageAlpha,
    });
    this.texture.refresh();
  }

  /**
   * Whether the cycling bands have moved since the last drawn frame.
   *
   * The scene only redraws when something changed, which is what keeps 60fps
   * on a Chromebook affordable -- so a room that animates has to say so. At
   * 0.25 and 0.6 Hz this is true a handful of times a minute and false on
   * every other frame, which is the point: the room is still, and then it
   * is very slightly not.
   */
  private cycleChanged(): boolean {
    const elements = liveCycling(this.state.room);
    if (!elements.length) return false;
    const on = this.state.menu.toggle(CYCLING_OPTION);
    const mapping = on
      ? mappingAt(elements.map((element) => resolve(this.state.content.palette, element)),
        this.time.now / 1000)
      : new Map<number, number>();
    if (this.lastCycle && sameMapping(this.lastCycle, mapping)) return false;
    this.lastCycle = mapping;
    return true;
  }

  /**
   * The background for a room, cycled if it declares any elements. Doc 18.
   *
   * Wrapped once per room and cached, because the wrapper scans the whole
   * image for the reserved bands when it is built. Rooms that declare no
   * cycling get the loaded texture straight through and pay nothing.
   */
  private backgroundFor(roomId: string): CanvasImageSource | null {
    const room = this.state.content.rooms.get(roomId);
    if (!room?.background) return null;
    if (this.plate && roomId === this.state.roomId) {
      const plateKey = `plate:${roomId}:${this.plate}`;
      if (this.textures.exists(plateKey)) return this.textures.get(plateKey).getSourceImage() as CanvasImageSource;
    }
    // A PLATE CHOSEN BY STATE (RoomFile.plateWhen): Room 31's hill at night.
    const byState = room.plateWhen?.find((entry) => this.state.flags.test(entry.when));
    if (byState) {
      const stateKey = `plate:${roomId}:${byState.plate}`;
      if (this.textures.exists(stateKey)) return this.textures.get(stateKey).getSourceImage() as CanvasImageSource;
    }
    // WHOLE-PLATE FRAMES, if the room declares them. Frame zero is
    // `background` itself, so a room with no extra frames is unchanged.
    let key = `bg:${roomId}`;
    const extra = room.backgroundFrames ?? [];
    if (extra.length) {
      const rate = room.backgroundRate ?? 0.5;
      const step = Math.floor(this.time.now / 1000 * rate * (extra.length + 1))
        % (extra.length + 1);
      if (step > 0) {
        const frameKey = `bgf:${roomId}:${step - 1}`;
        if (this.textures.exists(frameKey)) key = frameKey;
      }
    }
    if (!this.textures.exists(key)) return null;
    const source = this.textures.get(key).getSourceImage() as CanvasImageSource;
    if (liveCycling(room).length === 0) return source;

    let cycler = this.cyclers.get(roomId);
    if (!cycler) {
      cycler = new CyclingBackground(source, room, this.state.content.palette,
        NATIVE_WIDTH, PLAY_HEIGHT);
      this.cyclers.set(roomId, cycler);
    }
    return cycler.frameAt(this.time.now / 1000, this.state.menu.toggle(CYCLING_OPTION));
  }

  /** Ruling 21a's near plane. Straight through -- it never cycles. */
  private foregroundFor(roomId: string): CanvasImageSource | null {
    return this.imageFor(roomId, 'fg', this.state.content.rooms.get(roomId)?.foreground);
  }

  /** A loaded character sheet, keyed by the content path that named it. */
  private sheetFor(path: string): CanvasImageSource | null {
    // A PICTURE WANTED THAT NOTHING IS BRINGING (errata 243). A sheet still on its way is ordinary on arrival; one that is
    // not here while the loader is idle will never come, and says so once, with what is known of it, so a played run
    // that draws nothing where a prop should be can say why (two did on 2026-11-09, and could not).
    if (!this.textures.exists(path) && !this.load.isLoading() && !this.stranded.has(path)) {
      this.stranded.add(path);
      watch.record('graybox:not-loaded', path, `wanted with the loader idle: ${this.loadFailed.has(path) ? 'its load failed' : this.nearAsked.has(path) ? 'asked for and never arrived' : 'never asked for'}`);
    }
    return this.textures.exists(path)
      ? (this.textures.get(path).getSourceImage() as CanvasImageSource)
      : null;
  }

  /** A loaded room image, or null if the room does not declare one. */
  private imageFor(roomId: string, prefix: string, declared?: string): CanvasImageSource | null {
    if (!declared) return null;
    const key = `${prefix}:${roomId}`;
    return this.textures.exists(key)
      ? (this.textures.get(key).getSourceImage() as CanvasImageSource)
      : null;
  }

  private markDirty(): void {
    this.dirty = true;
  }

  /**
   * The person under the pointer, or undefined when an object there takes it.
   * One rule for the hover and the click, so the sentence line never names
   * one target and the click reaches another.
   *
   * A SMALL OBJECT BESIDE A PERSON IS STILL AN OBJECT: Winnie's pen stand sits
   * inside her hit box, and PICK UP on it must reach the pen. But A PERSON IN
   * FRONT OF SCENERY IS STILL A PERSON. Tyler, 2026-10-31, hovering the card
   * sharp with the default verb: "Look at THE PATRONS" -- the table's rect is
   * three times his size and swallowed him for every verb but TALK TO, so
   * nothing on screen said he was anyone. So: TALK TO always finds the person;
   * otherwise a person who speaks (has a tree) wins over a hotspot LARGER than
   * his own hit box, and loses to one smaller. A figure with no tree never
   * takes a hotspot's place, so THE PATRONS' authored LOOK and LISTEN still
   * play on the generic men.
   */
  /** The person under a point with a verb selected (AmbientLayer.personAt: the sentence line's and the click's one rule). */
  private personAt(wx: number, y: number, verb: string | null): AmbientFile | undefined {
    return this.ambient.personAt(wx, y, verb);
  }

  /**
   * Whether any ambient character's frame changed: sway, break or beat. Asked
   * with the renderer's own rule (ambientFrameAt), so a figure can never move
   * in the drawing code and stand still on screen for want of a redraw.
   */
  private ambientChanged(before: number, after: number): boolean {
    const tempo = this.bedTempo();
    return this.ambient.present.some((npc) => {
      const sprite = npc.sprite;
      if (!sprite) return false;
      // One who keeps time with the bed turns over on the bed's beat.
      if (sprite.keepsTime === 'music' && tempo) {
        const timed = { ...sprite, rate: tempo / 120, phase: 0 };
        return ambientFrameAt(timed, 0, this.musicBefore) !== ambientFrameAt(timed, 0, this.musicNow);
      }
      const phase = sprite.phase ?? 0;
      return ambientFrameAt(sprite, phase, before, this.arrivedAt)
        !== ambientFrameAt(sprite, phase, after, this.arrivedAt);
    });
  }

  /**
   * The tempo of the bed this room plays, or null: what a figure that keeps
   * time with the music reads (errata 118). The room's own entry, or the
   * variant its flags select, which plays at the entry's tempo unless it says.
   */
  private bedTempo(): number | null {
    if (this.state.room.music === 'suspend' || this.state.dialogue.duelSounding) return null;
    const entry = this.state.content.manifest.music?.rooms?.[this.state.room.id];
    if (!entry) return null;
    const variant = entry.variants?.find((one) => this.state.flags.test(one.when));
    return variant?.tempo ?? entry.tempo ?? null;
  }

  /** A carried beat with control `none` is playing: doc 17 beat 11 (errata 133). */
  private carriedCutscene(): boolean {
    return this.carried.isRunning && this.carried.current?.control === 'none';
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    // Nothing to name while the ninety seconds run or a room fades (errata 133).
    if (this.tuneStart !== null || this.roomFade !== null || this.entry !== null || this.cut !== null
      || this.arrivalHold.holding) return;
    if (this.beginCard) return;
    if (this.titleMenu && !this.state.menu.isOpen) {
      const { x, y } = this.nativePoint(pointer);
      const hit = this.view.titleHitboxes(this.titleMenu).find((box) => pointInRect(x, y, box));
      const id = hit && this.titleMenu.find((item) => item.id === hit.id)?.enabled ? hit.id : null;
      if (id !== this.titleHover) { this.titleHover = id; this.markDirty(); }
      return;
    }
    // THE ROW UNDER THE POINTER LIGHTS (errata 143; MI's highlight). Only
    // the pointer's place is kept here; which row that is, is worked out when
    // the frame is drawn, from the same layout the list is drawn from.
    this.pointerAt = this.nativePoint(pointer);
    if (this.state.dialogue.isActive && !this.state.menu.isOpen) {
      // NOTHING IN THE ROOM IS UNDER THE POINTER WHILE IT IS ON THE LIST, so
      // the sentence line cannot come back naming what was hovered before the
      // conversation opened.
      this.hovered = null;
      this.hoveredName = null;
      if (this.choicesShowing() && this.optionUnderPointer() !== this.lastHoveredOption) this.markDirty();
      return;
    }
    if (this.state.dialogue.isActive || this.state.menu.isOpen) return;
    if (this.panelHidden) {
      this.revealSceneControls();
      return;
    }
    const { x, y } = this.nativePoint(pointer);

    // ERRATA 29 CONDITION 1. An icon must never be the only way an item is
    // identified, so hovering one puts its authored display name in the
    // sentence line -- the same line, the same templates, the same names
    // ruling 26 had drawn in the panel itself.
    if (y >= PLAY_HEIGHT) {
      const slot = this.view.inventoryHitboxes().find((box) => pointInRect(x, y, box));
      const item = slot ? this.state.itemTarget(slot.id) : undefined;
      if ((item?.id ?? null) !== (this.hovered?.id ?? null)) {
        this.hovered = item ?? null;
        this.hoveredName = item ? this.state.itemLabel(item.id) : null;
        this.markDirty();
      }
      return;
    }
    // On the map the sentence line names the destination under the pointer,
    // for the same reason an icon does: a marker must never be the only way a
    // place is identified.
    if (this.state.isMap) {
      const hit = this.view.mapHitAt(x, y);
      const id = hit?.built ? hit.id : null;
      if (id !== this.hoveredLocation) {
        this.hoveredLocation = id;
        const known = this.state.mapLocations.find((entry) => entry.location.id === id);
        this.hoveredName = known?.label ?? null;
        this.hovered = null;
        this.markDirty();
      }
      return;
    }
    // WORLD SPACE FROM HERE DOWN. Everything above this line is furniture of
    // the window -- the panel, the inventory, the map -- and is hit-tested
    // where it is drawn, which is where it always was. The street is drawn
    // shifted by the camera, so it is asked in its own coordinates.
    const wx = this.state.toWorld(x);
    // Ambient characters stand in front of the scenery, so they take the
    // pointer first -- exactly as they take the click. Reading one name and
    // clicking another is worse than either alone.
    // THE SAME PRECEDENCE THE CLICK USES: a hotspot rect under the pointer
    // names the hotspot, not the person standing over it, unless the verb
    // is TALK TO -- otherwise the sentence line promised "Pick up WINNIE
    // LEDGER" for a click that picked up her pen.
    const npc = y < PLAY_HEIGHT ? this.personAt(wx, y, this.state.verbs.selectedVerb) : undefined;
    const found = npc
      ? { id: npc.id, name: this.state.nameOf(npc),
          defaultVerb: this.state.content.verbs.npcVerb }
      : y < PLAY_HEIGHT
        ? (this.targetUnder(wx, y) ?? null)
        : null;
    const changed = (found?.id ?? null) !== (this.hovered?.id ?? null);
    if (changed) {
      this.hoveredName = found ? this.state.nameOf(found) : null;
      this.hovered = (found as Interactable | null) ?? null;
      this.markDirty();
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    // A BROWSER WILL NOT PLAY AUDIO BEFORE A GESTURE, so every click is one,
    // and this runs before any of the early returns below -- a click that
    // opens the menu unlocks as well as a click on the road.
    this.music.unlock();
    this.ambience.unlock();
    this.cueBed.unlock();
    // THE BEGIN CARD TAKES THE FIRST CLICK WHOLE (errata 155): it has just
    // unlocked sound, above, and the title comes up with its bed playing. The
    // click goes no further, so it cannot also land on a title item.
    if (this.beginCard) {
      this.beginCard = false;
      this.applyMusic();
      this.markDirty();
      return;
    }
    const { x, y } = this.nativePoint(pointer);
    // THE TITLE TAKES ITS OWN CLICKS (errata 128), and chooses the music
    // after the click has decided where the game is going: NEW GAME's bed is
    // Room 1's, not the title's for a frame first.
    if (this.titleMenu && !this.state.menu.isOpen) {
      this.onTitleClick(x, y);
      this.applyMusic();
      return;
    }
    this.applyMusic();
    const secondary = pointer.rightButtonDown();

    // DOC 48 S5 BEAT 3: the ninety seconds are not his. He sits in the dark
    // and listens; no click moves him, opens the panel or cuts it short.
    if (this.tuneStart !== null) return;
    if (this.riseIfSeated()) return;

    // TEXT SPEED MANUAL (errata 154 A): a scripted line holding its scene is
    // released by the click, one line a click, and the click does nothing else.
    if (this.readsManually && this.sayWaiting && (this.sequence.isRunning || this.carried.isRunning)) {
      this.setSay(null);
      this.sequence.releaseLine();
      this.carried.releaseLine();
      this.markDirty();
      return;
    }

    // An act card holds the screen for its time; a click does not cut it.
    if (this.actCardUntil !== null) return;
    // A fade between rooms, and a cutscene beat after control, are not the player's (errata 133).
    // AND AN ARRIVAL HELD IN BLACK (errata 223): the room is not there to click on yet.
    if (this.roomFade !== null || this.entry !== null || this.cut !== null || this.carriedCutscene()
      || this.arrivalHold.holding) return;

    // The menu takes every click while it is open, including clicks on the
    // verb panel behind it.
    if (this.state.menu.isOpen) {
      this.onMenuClick(y);
      return;
    }

    // ERRATA 70 G / INVARIANT 2: while a timeline room keeps the panel away
    // there is nothing to click but the two controls errata 52 adopted from
    // doc 34 -- MENU and SKIP SCENE, revealed by intent (errata 71 B). A
    // click on neither reveals them. The click above still unlocked audio.
    if (this.panelHidden) {
      if (this.sceneControlsShowing()) {
        if (pointInRect(x, y, this.panel.menuButton)) {
          this.sceneControlsUntil = null;
          this.state.menu.open();
          this.markDirty();
          return;
        }
        const skip = this.state.room.timeline?.length ? this.panel.mapButton : null;
        if (skip && pointInRect(x, y, skip)) {
          this.sceneControlsUntil = null;
          this.skipScene();
          return;
        }
      }
      this.revealSceneControls();
      return;
    }

    // Ahead of the panel buttons, because the options are drawn over them.
    // A click on a conversation must never reach the MENU or MAP button
    // underneath it.
    if (this.state.dialogue.isActive) {
      // A PERFORMANCE OWNS EVERY CLICK IN THE PLAYFIELD WHILE IT PLAYS. Doc 30
      // section 4.2: "A click that advances speech must be consumed. It must
      // not also select an option, click a hotspot, move Thad, or press the
      // interface beneath the hidden list."
      //
      // THE WHOLE PARAGRAPH THAT USED TO BE HERE IS GONE, and it is worth
      // recording what it defended. The reply was drawn ABOVE the option list
      // rather than instead of it, so the list sat under the pointer while the
      // answer played and a player reading a multi-line answer re-selected the
      // same question the instant it ran out -- conversations looping back to
      // the beginning. The fix was to spend the last click. Doc 30 step 2
      // removes the cause instead: the list is not drawn and has no hitboxes
      // while an exchange plays, so there is nothing under the pointer to hit
      // by accident and no click to spend.
      if (this.performance) {
        if (this.performance.skip(this.lastFrameAt)) this.showPerformance();
        return;
      }
      if (this.advanceSay()) return;
      this.onDialogueClick(x, y);
      return;
    }

    // A GREETING BEING READ TAKES THE CLICK: the next line, or, after the
    // last, nothing -- which lets the conversation's list open. ONLY A LINE
    // THAT IS WAITING FOR ONE takes a click (SpeechPolicy.clickOnSpeech); any
    // other line keeps playing on its hold while the click walks, acts or travels.
    if (this.sayLines.length > 0 && !this.performance
      && clickOnSpeech({ waiting: this.sayWaiting || this.pendingTree?.greeted === true }) === 'advance') {
      if (!this.advanceSay()) this.setSay(null);
      this.markDirty();
      return;
    }

    if (pointInRect(x, y, this.panel.menuButton)) {
      this.state.menu.open();
      this.markDirty();
      return;
    }

    // The map button, and BACK while it is open. Not gated on the opening
    // being over, because the panel is not drawn until it is.
    const mapButton = this.panel.mapButton;
    if (mapButton && pointInRect(x, y, mapButton)) {
      this.toggleMap();
      return;
    }

    // NO `advanceSay()` HERE ANY MORE. It took the click for the next queued
    // line before the map, the panel or the room could have it -- Main Street's
    // first click did not walk him, and the map's undertaker went nowhere.

    // Doc 20 rule 5: the map is a menu that looks like a place. A click on a
    // location travels, instantly, whatever verb happens to be selected --
    // there is nothing on this screen to look at, pull or open.
    if (this.state.isMap) {
      if (y < PLAY_HEIGHT) this.onMapClick(x, y);
      else this.onPanelClick(x, y);
      return;
    }

    if (y >= PLAY_HEIGHT) {
      if (!this.onInventoryClick(x, y)) this.onPanelClick(x, y);
      return;
    }

    // A click in the play area abandons whatever performance is running. A
    // staged interaction the player has changed their mind about should stop
    // where it is rather than finish walking somewhere they no longer want to
    // be -- doc 22's deterministic cancellation, applied to ordinary play.
    //
    // UNLESS AN OPENING IS RUNNING, which is Q25 as ruled. `cancel()` clears
    // `started`, so this made `isRunning` false inside the click handler; the
    // next tick's `wasRunning` then read false, the transition that calls
    // `advanceOpening` was never observed, and the opening froze forever with
    // no error and nothing on screen to say so. The verdict is decided in
    // `playfieldClick` rather than here, because a decision with a name has a
    // test and an `if` in an event handler does not.
    const verdict = playfieldClick({
      sequenceRunning: this.sequence.isRunning,
      openingActive: this.opening !== null,
      greeting: this.pendingTree?.greeted === true,
    });
    // A cutscene beat is playing. Any pending line was taken by `advanceSay`
    // above; with none left the click is spent, and it must not fall through
    // to the walk and interact code either -- control is `none` during an
    // automatic beat and a click cannot start the player moving under it.
    if (verdict === 'consume') return;
    // A CHANGE OF MIND ABOUT A CONVERSATION. He was walking to talk and the
    // player clicked elsewhere: doc 22's deterministic cancellation, the
    // interaction stops where it is. Without this the walk was redirected
    // and the greeting still fired wherever he came to rest -- a conversation
    // opened from across the room.
    if (this.pendingTree && !this.pendingTree.greeted) this.pendingTree = null;
    if (verdict === 'cancel') {
      this.sequence.cancel();
      // The PLAYER's performance, and nobody else's: beat 9's carrier is
      // running Hob across the road on its own runner and a change of mind
      // about a trough is not a change of mind about him.
      this.world.abandonActor(this.actors.playerId);
    }

    // WORLD SPACE FROM HERE DOWN, for the reason given in `onPointerMove`:
    // the street is drawn shifted by the camera and is asked in its own
    // coordinates, so a hotspot is clicked exactly where it is drawn.
    const wx = this.state.toWorld(x);

    // HE IS HIDDEN, AND STAYS WHERE HE IS (RoomFile.actorHiddenWhen; errata 239): under the table's cloth nobody
    // walks him about. A verb on a subject is answered from where he is; everything that would move him is not.
    if (this.state.playerStays) {
      const under = this.targetUnder(wx, y);
      const asked = this.state.verbs.verbFor(under, secondary);
      const verdict = hiddenClick({
        target: under !== undefined,
        walk: asked === this.state.verbs.walkVerbId,
        transit: under !== undefined && (under as Partial<Exit>).to !== undefined && this.state.verbs.isTransit(asked),
        person: this.personAt(wx, y, this.state.verbs.selectedVerb) !== undefined,
      });
      if (verdict === 'answer' && under) {
        this.lastClick = { x: wx, y };
        this.applyInteraction(under, asked);
      }
      return;
    }

    // An ambient character is talked to, never examined -- they are not
    // hotspots and doc 07 is clear that none of them gates anything.
    // AN AMBIENT CHARACTER WITH A TREE IS TALKED TO -- AND WALKED TO FIRST.
    //
    // Two faults Tyler found in one line. The dog is ambient and has NO tree,
    // so clicking him started nothing and the click never reached his hotspot:
    // he has LOOK, LISTEN and doc 13's TALK TO ("Good morning.") and none of
    // them could be used. A character without a tree now falls through to the
    // hotspot path, which is where his words live.
    //
    // And nobody walked. Doc 22's staged chain walks Thad to an object before
    // acting on it, and this path bypassed it entirely -- he shouted at the
    // pie woman from wherever he was standing. He now walks to the edge of
    // her own approachRadius and the tree opens when he arrives.
    // A SMALL OBJECT BESIDE A PERSON IS STILL AN OBJECT. The NPC hit box is a
    // fifth of the drawn height each side of the feet, and Room 5's Winnie is
    // 445 rows tall: her box swallowed the pen stand at her right hand, so
    // PICK UP on HER PEN reached the people pool and her authored refusal
    // never played. When the click lands on a hotspot's own rect, the
    // hotspot wins for every verb but TALK TO -- talking is the one thing a
    // person is for and an object is not.
    const npc = y < PLAY_HEIGHT ? this.personAt(wx, y, this.state.verbs.selectedVerb) : undefined;

    // A PERSON IS NOT A LEVER. Every verb pointed at an ambient character used
    // to open their tree, so Tyler clicked PUSH on the letter-writer and got a
    // conversation. Only TALK_TO -- and a bare click, whose default verb for a
    // person is TALK_TO -- starts one. Everything else gets doc 07's people
    // pool: Thad's own lines, shared across everyone, because "I am not going
    // to push a stranger" is the same sentiment whichever stranger it is.
    const chosen = this.state.verbs.selectedVerb;
    // AN ITEM SHOWN TO A PERSON. Doc 24's table pairs an item with a target;
    // when the target is the room's ambient character and the pair is live
    // (its puzzles complete, its own not yet), the action walks Thad to the
    // character's declared dialogue point exactly as TALK TO does, and lands
    // at contact. Nothing about it is this item's or this room's: the pair
    // and the tree it opens are content. With no live pair the click falls
    // through to the people pool below, as any verb on a person does.
    // THE PERSON UNDER THE CLICK, whatever scenery stands behind her: the
    // shelves' rect covers Winnie's shoulders, and a hotspot wins over a
    // character for every verb but TALK TO -- except this one, where a live
    // pair says the item is for her.
    const held = this.state.heldItem;
    const person = held && chosen !== null && this.state.verbs.carries(chosen) ? this.ambient.npcAt(wx, y) : undefined;
    if (person?.tree && held && chosen !== null) {
      const pair = this.state.evidencePairFor(held, person.id);
      if (pair && pair.opens === person.tree) {
        const npc = person;
        const stand = npc.walkTo ?? { x: npc.x, y: npc.y };
        this.pendingTree = {
          tree: pair.opens, at: { x: npc.x, y: npc.y }, greeted: false,
          evidence: { pair, beatUntil: null, committed: false },
        };
        // The verb and the held selection are spent; the item stays held in
        // the inventory (errata 66 A: showing is not surrendering).
        this.state.holdItem(null);
        this.state.verbs.resetToDefault();
        this.actor.walkTo(stand.x, stand.y);
        this.markDirty();
        return;
      }
    }
    // AN ITEM USED ON A PERSON WITH A WRITTEN PAIR THAT OPENS NO TREE. Doc 57
    // A9: THE FILING FEE on Registrar Sump is a pair with its own cases (the
    // money last; then the read-back). It resolves through GameState.interact
    // like an item on any object -- the pair names the person's id as its
    // target -- instead of falling through to the people pool.
    //
    // AND AN ITEM USED ON A PERSON WITH NO PAIR AT ALL IS STILL AN ITEM USED.
    // Doc 24's tiers -- the pair, then this item's own pool, then the global
    // pool -- are for "this item on anything unhandled". This once resolved
    // only when a pair existed and otherwise fell to the people pool, which is
    // written for USE on a person with nothing in hand: THE TUNING FORK on
    // Winnie said "I would not know where to begin" (the items audit, errata
    // 137). VerbSystem.resolveWith answers every case, a spent evidence pair
    // included.
    // THE PERSON THE SENTENCE LINE NAMED, or one the item has a written pair
    // with (AmbientLayer.itemTakerAt, errata 151): the fiddler in front of
    // the Nugget's piano does not take the fork meant for the piano.
    const taker = person && held && chosen !== null ? this.ambient.itemTakerAt(wx, y, chosen, held) : undefined;
    if (taker && held && chosen !== null) {
      const person = taker;
      const [hx, hy, hw, hh] = this.ambient.hitBox(person);
      this.applyInteraction({
        id: person.id, name: person.name, rect: [hx, hy, hw, hh], colour: 0, responses: {},
        // He walks to where a conversation with this person stands, as TALK TO does.
        ...(person.walkTo ? { walkTo: person.walkTo } : {}),
      } as Interactable, chosen);
      this.markDirty();
      return;
    }
    // THE ROOM'S LINES FOR THIS PERSON FIRST (doc 54's per-room overrides):
    // any verb, and TALK TO too for a person with no tree to open. Only a
    // rule whose condition holds answers; otherwise the person's own layer
    // and the people pool below, as before.
    // Errata 192: he walks to where a conversation with her stands first, and a person with no tree answers
    // TALK TO with her bark (core/PersonLines.ts).
    const personal = npc && chosen !== null
      ? personLines(this.state.room, npc, chosen, (when) => this.state.flags.test(when), this.ambient.hitBox(npc),
        (one) => this.ambient.barkLinesFor(one))
      : null;
    if (personal && chosen !== null) {
      // Only TALK TO walks over first (the brief's step 3); every other verb a room writes for a person answers
      // from where he stands, as it always has.
      this.personTarget = personal;
      if (chosen === 'TALK_TO') this.beginInteraction(personal.target, chosen);
      else this.applyInteraction(personal.target, chosen);
      this.markDirty();
      return;
    }
    if (npc && chosen !== null && chosen !== 'TALK_TO') {
      // HIS OWN LINES FIRST. A character with an examine layer (doc 27's three)
      // is examined like an object: the lines live on his tree file and play
      // through applyInteraction, so the second LISTEN is "Still talking."
      // because the count is kept where every object's is.
      const layer = npc.tree ? this.state.content.dialogue.get(npc.tree)?.examine : undefined;
      if (layer?.[chosen]?.length) {
        const [hx, hy, hw, hh] = this.ambient.hitBox(npc);
        this.applyInteraction({
          id: npc.id, name: npc.name, rect: [hx, hy, hw, hh], colour: 0, responses: layer,
        } as Interactable, chosen);
        this.markDirty();
        return;
      }
      const pool = this.state.content.verbFallbacks?.people?.[chosen];
      if (Array.isArray(pool) && pool.length) {
        this.pendingSay = [];
        this.setSay(pool[0]!, this.state.content.actor.id);
        this.state.verbs.resetToDefault();
        this.markDirty();
        return;
      }
    }

    if (npc?.tree) {
      // A CONVERSATIONAL DISTANCE, NOT THE APPROACH RADIUS. `approachRadius`
      // is 40 world pixels and exists to decide when a bark fires; used as a
      // stopping distance it walks Thad until the two figures touch, which
      // Tyler called correctly -- nobody stands that close to a stranger
      // selling maps. Two thirds of the character's own drawn height is about
      // a metre at any depth, and scales with the room's curve for free.
      const gap = Math.round(this.state.heightForZone(npc.zone) * 0.66);
      const from = npc.x + (this.actor.x < npc.x ? -gap : gap);
      // UNLESS THE PERSON SAYS WHERE. Room 5's Winnie is behind a counter:
      // her baseline is not floor, the walk snapped to the counter's base
      // line, and Thad loomed over her ledger. Her file declares where a
      // conversation with her stands.
      const stand = npc.walkTo ?? { x: from, y: npc.y };
      this.pendingTree = { tree: npc.tree, at: { x: npc.x, y: npc.y }, greeted: false, npc: npc.id };
      // THE VERB IS SPENT. Errata 28b: a verb used on a thing resets. Every
      // other path resets through GameState.interact; this one never reached
      // it, so TALK TO stayed selected through the whole conversation and the
      // first click afterwards -- Room 5's back-room door -- was "talk to the
      // door" instead of a transit. Found by the life proof.
      this.state.verbs.resetToDefault();
      this.actor.walkTo(stand.x, stand.y);
      this.markDirty();
      return;
    }

    // ERRATA 28b, the whole table:
    //
    //   ground, any selection      -> walk
    //   object + selected verb     -> that verb
    //   object, nothing selected   -> the object's own defaultVerb
    //   right button on an object  -> its defaultVerb, whatever is selected
    //
    // Double-click is gone entirely, along with the click tracker it needed.
    const target = this.targetUnder(wx, y);
    this.lastClick = { x: wx, y };
    const verb = this.state.verbs.verbFor(target, secondary);

    // A doorway asked for with a transit verb is walked through -- checked
    // BEFORE the walk shortcut, because the road out of town declares WALK TO
    // as its default and would otherwise be walked TO and never down.
    if (target && (target as Partial<Exit>).to !== undefined
        && this.state.verbs.isTransit(verb)) {
      this.beginInteraction(target, verb);
      return;
    }

    // WALK TO resolved against an object still walks: THE MUD covers the
    // whole street and declares WALK TO as its default, so clicking the road
    // moves the player rather than examining the ground they are standing on.
    if (!target || verb === this.state.verbs.walkVerbId) {
      // NEVER ONTO SOMEBODY (errata 129): the floor under a click may be where
      // a figure stands -- Room 1's gap in the fence is Hob's spot.
      const floor = this.state.nearestFloor(Math.round(wx), Math.round(y)) ?? { x: wx, y };
      const clear = this.clearOfStanding(floor);
      if (this.world.walkPlayer(wx, y, clear)) this.markDirty();
      return;
    }

    this.beginInteraction(target, verb);
  }

  /**
   * Doc 22 section 6, as data. An object that declares where to stand gets
   * the full staged chain; one that does not answers where the player stands.
   *
   *   walk -> waitForActor -> face -> waitForActor -> [chore] -> say
   *
   * The chore step is only present when the object declares a reaction for
   * this verb, so the chain is as short as the object needs and no shorter.
   */
  private beginInteraction(target: Interactable, verb: string): void {
    const staging = target.walkTo ?? this.approachPoint(target, verb);
    if (!staging) {
      this.faceTarget(target);
      this.applyInteraction(target, verb);
      return;
    }
    const actor = this.state.content.actor.id;
    const steps: SequenceStep[] = [
      { kind: 'walk', actor, x: staging.x, y: staging.y },
      { kind: 'waitForActor', actor },
      { kind: 'face', actor, facing: staging.facing },
      { kind: 'waitForActor', actor },
    ];
    // A reaction belongs to the LINE it was written for. USE on the trough
    // is a recoil because "I am not drinking from that" is a flinch; USE THE
    // TUNING FORK ON THE TROUGH is a different sentence with a different
    // answer, and playing the recoil against it would be an animation
    // performing a line nobody said.
    const chore = this.state.heldItem ? undefined : target.reactions?.[verb];
    if (chore) steps.push({ kind: 'chore', actor, chore });
    steps.push({ kind: 'say', actor, interact: { target: target.id, verb } });
    this.sequence.start(steps);
    this.markDirty();
  }

  /**
   * He looks at what he is talking about. A man who describes a trough while
   * facing away from it is reading a label -- and this is the dossier's
   * face-direction-change-without-walking doing its job rather than sitting
   * in an animation list.
   */
  /**
   * Where he has to stand before this verb may answer, or null if he is close
   * enough already -- or if the object says distance is meaningless.
   *
   * HE WAS READING A SIGN FROM ACROSS THE ROOM. The staged chain that walks a
   * man to a thing has existed since doc 22 and only fired for objects
   * declaring a `walkTo`; in Room 1 that was the case and nothing else, so
   * every other verb resolved from wherever he happened to be standing.
   *
   * AN AUTHORED walkTo STILL WINS -- the caller prefers it and only falls here
   * when there is none. This is the floor, not the rule: geometry will stand
   * him behind a fence post, and where the spot matters somebody should say
   * so.
   *
   * THE RADIUS IS IN BODY HEIGHTS, resolved against his DRAWN height, so it
   * means the same thing at the front of the band and at the back of it. See
   * approachNote in content/ui/verbs.json.
   */
  private approachPoint(target: Interactable, verb: string):
      { x: number; y: number; facing: Facing } | null {
    if (target.distant) return null;
    const ui = this.state.content.verbs;
    const rules = ui.approach;
    if (!rules) return null;
    // WALK TO is the walk. Routing it through an approach radius would ask him
    // to walk closer before he is allowed to walk.
    if (verb === ui.walkVerb.id) return null;

    const examine = new Set([...(ui.examineVerbs ?? []), ...(rules.conversationVerbs ?? [])]);
    const heights = examine.has(verb) ? rules.examineHeights : rules.handsOnHeights;
    const radius = heights * this.actor.height;

    // TO THE NEAREST EDGE, NOT THE CENTRE. THE MUD is 1920 wide and the town
    // sign is not; a centre measurement would send him to the middle of the
    // road to look at the road.
    const [tx, ty, tw, th] = target.rect;
    if (tw <= 0 || th <= 0) return null;
    const nearX = Math.min(Math.max(this.actor.x, tx), tx + tw);
    const nearY = Math.min(Math.max(this.actor.y, ty), ty + th);
    const gap = Math.hypot(nearX - this.actor.x, nearY - this.actor.y);
    if (gap <= radius) return null;

    // Straight at it, stopping a radius short, then snapped to ground he can
    // actually stand on -- doc 22 step 1's rule for a click, applied to a
    // destination the engine chose rather than the player.
    const travel = gap - radius;
    const wantX = this.actor.x + ((nearX - this.actor.x) / gap) * travel;
    const wantY = this.actor.y + ((nearY - this.actor.y) / gap) * travel;
    const floor = this.state.nearestFloor(Math.round(wantX), Math.round(wantY));
    if (!floor) return null;
    // Not on whoever is standing there: the lamp is in Hob's hand (errata 129).
    const stand = this.clearOfStanding(floor);
    return { x: stand.x, y: stand.y, facing: this.actor.facingToward(nearX, nearY) };
  }

  /** A walk's end, moved off any mover standing on it (engine/core/Standing.ts; errata 129). */
  private clearOfStanding(to: { x: number; y: number }): { x: number; y: number } {
    const standing = this.actors.all()
      .filter((mover) => mover.id !== this.actors.playerId && !mover.isWalking)
      .map((mover) => ({ x: mover.x, y: mover.y, height: mover.height }));
    return clearOfFigures(to, { x: this.actor.x, y: this.actor.y }, standing, this.actor.height);
  }

  /**
   * THE TARGET UNDER A POINT, the figure who carries one included (errata 129;
   * the bookends audit, finding 4). Hob has no rect -- movers are not targets
   * (doc 36 Q60) -- so LOOK and TALK TO on his body did nothing at all, and
   * his written TALK TO override could not be reached. A hotspot that names
   * him in `heldBy` answers for his drawn figure; he wins over scenery larger
   * than himself (the mud he stands in), as a person does in `personAt`.
   */
  private targetUnder(wx: number, y: number): Interactable | undefined {
    const plain = this.state.targetAt(wx, y);
    for (const target of this.state.targets) {
      if (!target.heldBy) continue;
      const figure = this.actors.all().find((mover) => mover.id === target.heldBy);
      if (!figure) continue;
      // HIS BODY, from his feet and drawn height: a quarter of his height each
      // side, as the people's hit box is reckoned (AmbientLayer.hitBox). The
      // renderer's own rectangles are kept only while the dev watch runs.
      const bw = Math.round(figure.height * 0.5);
      const bh = Math.round(figure.height);
      const bx = Math.round(figure.x - bw / 2);
      const by = Math.round(figure.y - bh);
      if (wx < bx || wx >= bx + bw || y < by || y >= by + bh) continue;
      if (!plain || plain === target) return target;
      const [, , pw, ph] = this.state.presentation(plain)?.bounds ?? plain.rect;
      return pw * ph > bw * bh ? target : plain;
    }
    return plain;
  }

  private faceTarget(target: Interactable): void {
    const [tx, ty, tw, th] = target.rect;
    if (tw > 0 && th > 0) this.actor.faceToward(tx + tw / 2, ty + th / 2);
  }

  private applyInteraction(target: Interactable, verb: string): void {
    if (this.listenAt(target, verb)) return;
    const sounding = this.soundsFor(target, verb);
    const result = this.state.interact(target, verb);
    for (const rule of sounding) {
      if (rule.variants && !rule.variants.includes(result.variant ?? 0)) continue;
      this.fireCue(rule.cue);
    }
    // A verb can change what the room plays -- the Nugget's piano, tuned -- so
    // the bed is chosen again now rather than on the next click.
    this.applyMusic();
    // ERRATA 28b AS AMENDED (Q74): A VERB CLEARS ON USE.
    //
    // 28b used to say "a selected verb persists until another is chosen. It is
    // not cleared by use", and that sentence is void. Persisting is what made
    // the mud problem permanent: `resetToDefault` ran only on a new game and
    // no deselect existed, so the no-verb state could be left exactly once per
    // playthrough and never returned to -- taking a third of 28b's own table
    // with it, and with that every object's `defaultVerb`, "the verb a player
    // would try first", live for one click each.
    //
    // HERE BECAUSE THIS IS THE ONE PLACE A VERB IS ACTUALLY USED. The
    // immediate branch, the tail of a staged chain (`say` + `interact`), and
    // an inventory click all arrive at this line, and nothing else resolves a
    // verb against a target.
    //
    // A BARE WALK STILL CONSUMES NOTHING, which is 28b row 1 and is untouched:
    // a click on ground never reaches here.
    //
    // AND THE TWO-CLICK SENTENCE SURVIVES. USE on an inventory item HOLDS it
    // rather than resolving it -- `carryVerbs`, doc 24's USE X ON Y -- and
    // that path returns before this one, so the verb is still selected for the
    // second click. It clears when the sentence finishes, not halfway through.
    //
    // THE CLEAR ITSELF IS IN `GameState.interact`, not here. A rule about what
    // the game does when a verb is used is a rule about the game, and putting
    // it in the scene put it where no test could reach it: the change passed
    // 132 tests without one of them being able to see it.
    // SPOKEN AS THAD. A verb's line -- an examine line, an authored refusal,
    // a fallback -- is his, and the renderer's fallback ink already assumed
    // so; the probe did not, and reported the LAST speaker it had seen, which
    // in Room 5 made an override of Winnie's read as the stage driver's.
    // A PAIR RULE NAMES ITS SPEAKER (doc 57 A9: Sump's refusals); every other
    // verb line is his, as before. Two branches rather than a fallback: a line
    // with no speaker is Thad's by definition, not by default.
    // A RULE THAT IS ALL DIRECTION (doc 58: Room 33's third swing) is
    // performed as one, in parentheses, in the quieter ink.
    // A BEAT PLAYED WHERE THE EXIT GOES (errata 121 B): he arrives first, and every line -- the first
    // after `pause` -- is said there. Doc 48 S7 beat 3: the man on the ladder nods, then "Leave the mud."
    if (result.arrives && result.changedRoom) {
      this.hovered = null;
      this.hoveredName = null;
      this.enterRoomPerformance();
      // Its writes have landed (the close's T_CLOSE_SAID), but this is the arrival that says it: the
      // picture stays until a line over black takes it. `blackWhen` is for a load after the close.
      this.overBlack = false;
      const who = this.state.content.actor.id;
      // A rule's `say` with no `by` is Thad's by definition, as everywhere else (doc 57 A9), not by default.
      if (result.say) this.pendingSay.push({ speaker: result.by !== undefined ? result.by : who, line: result.say });
      this.pendingSay.push(...(result.then ?? []).map((line) => (typeof line === 'string'
        ? { speaker: who, line } : { speaker: line.speaker, line: line.line, ...(line.overBlack ? { overBlack: true } : {}) })));
      this.sayAt = this.time.now / 1000 + (result.pause ?? 0);
      this.markDirty();
      return;
    }
    // A NEW ANSWER REPLACES WHAT WAS STILL TO BE SAID of the last one, as a
    // new action interrupts the old in SCUMM: with the queue now playing on
    // its own, the old lines would otherwise follow the new answer.
    if (result.say || result.then?.length) this.pendingSay = [];
    // THE TREE IT OPENS IS OWED UNTIL ITS LINES ARE READ (errata 239; GameState.owesTree). It is held as a greeting
    // is -- the conversation has the interface, each line is read as a conversation's line is, and the list opens
    // when the last comes down -- and it is set before the first line goes up, so that line is read the same way.
    // The node's own opening (THE SÉANCE, heard once) is said after the response's words.
    const owed = result.opens && this.state.content.dialogue.has(result.opens) ? result.opens : null;
    if (owed) this.pendingTree = { tree: owed, at: { x: this.actor.x, y: this.actor.y }, greeted: true, owed: true };
    // A RULE THAT IS ALL DIRECTION AND IS ACTED (doc 95) plays from the queue, where acting is done.
    if (result.direction && result.say && actOf(this.performers(), result.say)) {
      this.setSay(null);
      // A rule's `say` with no `by` is his by definition (doc 57 A9), as below.
      const who = this.state.content.actor.id;
      this.pendingSay.push({ speaker: result.by !== undefined ? result.by : who, line: result.say, direction: true });
      this.advanceSay();
    } else if (result.direction && result.say && result.by) this.setSay(GameScene.asDirection(result.say), result.by, true);
    else if (result.direction && result.say) this.setSay(GameScene.asDirection(result.say), this.state.content.actor.id, true);
    else if (result.by) this.setSay(result.say, result.by);
    else this.setSay(result.say, this.state.content.actor.id);
    // DOC 30 §5's SPLIT UTTERANCES. The setup goes up now and the rest queue
    // behind it on their own reading holds, which is the 1990 rhythm the
    // presentation borrows: setup, beat, punchline.
    // HIS PICTURE OVER THE LINES (ResponseRule.holds): the nth frame of his clip on the nth line.
    const holds = result.holds;
    // In the facing the clip is drawn in: the deed is held facing us, whichever way he walked to the door.
    const facing = holds ? this.state.content.actor.clips.find((clip) => clip.id === holds.clip)?.facing : undefined;
    const poseAt = (n: number): HeldPose | undefined => holds?.frames.length
      ? { id: this.state.content.actor.id, clip: holds.clip, frame: holds.frames[Math.min(n, holds.frames.length - 1)]!,
        ...(facing ? { facing } : {}) } : undefined;
    if (holds && result.say) this.spokenPose = poseAt(0) ?? null;
    if (result.then?.length) {
      const who = this.state.content.actor.id;
      // A bare line is his; a line with a speaker is theirs (doc 57 A9's read-back).
      this.pendingSay.push(...result.then.map((line, index) => {
        const pose = poseAt(index + 1);
        return { ...(typeof line === 'string'
          ? { speaker: who, line } : { speaker: line.speaker, line: line.line, ...(line.overBlack ? { overBlack: true } : {}),
            ...(line.direction ? { direction: true } : {}) }), ...(pose ? { pose } : {}) };
      }));
    }
    if (owed) {
      this.pendingSay.push(...this.state.dialogue.openingOf(owed, true).map((spoken) => ({ speaker: spoken.speaker,
        line: spoken.line, ...(spoken.direction ? { direction: true } : {}) })));
      // Nothing of its own on screen (a response that only opens a tree with an opening to hear): the first goes up now.
      if (this.sayLines.length === 0 && this.sayingActor === null) this.advanceSay();
    }
    // SHE ANSWERS, AFTER HIS LINE, EVERY TIME (errata 192): her bark, in her voice, over her head.
    if (this.personTarget?.target.id === target.id) {
      if (result.say) this.pendingSay.push(...this.personTarget.answer);
      this.personTarget = null;
    }
    if (result.changedRoom) {
      this.hovered = null;
      this.hoveredName = null;
      this.enterRoomPerformance();
    }
    if (result.goesTo) this.travelAfterSay = result.goesTo;
    this.markDirty();
  }

  /**
   * Everything a change of room does to what is performing in it.
   *
   * Doc 22's deterministic cancellation, and it now has more to cancel: both
   * runners stop, every body claim is handed back, and every mover but the
   * player is dropped. A mover surviving a transition would be a coach
   * standing in an assay office, and a body claim surviving one would trip
   * assertion 6 on the first thing the next room tried to animate.
   */
  /**
   * ERRATA 70 G: advances the room's timeline by ACTIVE time -- nothing while
   * the menu is open, which is doc 45's "active, unpaused" -- and does each
   * step that came due. The scene's own clock is used rather than the frame
   * delta so a backgrounded tab (which stops the frame loop) adds nothing.
   */
  private tickTimeline(): void {
    if (!this.timeline.isRunning) return;
    const nowMs = this.time.now;
    const last = this.timelineAt ?? nowMs;
    this.timelineAt = nowMs;
    // A frame longer than a quarter of a second is a stall or a hidden tab,
    // not time the player spent in the coffin.
    const step = this.state.menu.isOpen ? 0 : Math.min(250, Math.max(0, nowMs - last));
    for (const due of this.timeline.advance(step)) this.applyTimelineStep(due, false);
    if (this.sceneControlsUntil !== null && nowMs >= this.sceneControlsUntil) {
      this.sceneControlsUntil = null;
      this.markDirty();
    }
  }

  /**
   * One timeline step's effect. `silent` is SKIP SCENE's and a resumed
   * checkpoint's: a skipped step's STATE lands (the plate, the panel, the
   * returned bed) and its sound does not -- forty shovelfuls in one frame is
   * not the scene, it is noise.
   */
  private applyTimelineStep(due: RoomTimelineStep, silent: boolean): void {
    switch (due.do) {
      case 'plate': this.plate = due.plate; break;
      case 'sound': if (!silent) this.sfx.play(due.src, (due.gain ?? 1) * this.roomSoundGain()); break;
      case 'panel': this.panelHidden = !due.show; break;
      case 'music': this.music.resume(this.timeline.elapsed / 1000); this.musicResumed = true; break;
      case 'dialogue': {
        const action = due.completes !== undefined && !this.state.puzzleComplete(due.completes);
        if (due.completes) this.state.completeByTimeline(due.completes);
        this.openTimelineTree(due.tree, action);
        break;
      }
    }
    this.markDirty();
  }

  /** Whether MENU and SKIP SCENE are drawn and clickable right now. */
  private sceneControlsShowing(): boolean {
    return this.panelHidden && this.sceneControlsUntil !== null && this.time.now < this.sceneControlsUntil;
  }

  private revealSceneControls(): void {
    const was = this.sceneControlsShowing();
    this.sceneControlsUntil = this.time.now + GameScene.SCENE_CONTROLS_MS;
    if (!was) this.markDirty();
  }

  /**
   * SKIP SCENE: to the checkpoint WATCH reaches, with the same state -- the
   * plate, the panel, the bed at the playhead it would have reached -- and
   * the same action at the end of it (errata 71 B). Sounds still ringing are
   * cut; the ones skipped are never played.
   */
  private skipScene(): void {
    this.sfx.stopAll();
    for (const due of this.timeline.skipToCheckpoint()) this.applyTimelineStep(due, due.checkpoint !== true);
    this.markDirty();
  }

  /**
   * A conversation a timeline opens (Room 32's lid opening on Hob, into
   * HOB_C1). Routed as an accost is -- the tree's own opening line, through
   * the greeting -- with nobody to walk to. A tree the content does not have
   * yet is a silent no-op; the content check is what reports it.
   */
  private openTimelineTree(tree: string, viaAction = false): void {
    if (!this.state.content.dialogue.has(tree) || this.state.dialogue.isActive) return;
    this.pendingTree = { tree, at: { x: this.actor.x, y: this.actor.y }, greeted: false, viaAction };
  }

  /**
   * The bed for wherever he is now. Doc 45's O-01-M while the title menu is
   * up, the room's own track otherwise, and silence for a room that names
   * none -- which is every room today, because THADDEUS has not been written.
   */
  private applyMusic(): void {
    // THE TITLE'S BED is O-01-M, detuned like the rest of the score
    // (invariant 5) -- unless the close's bed is still playing out to its end,
    // which nothing may cut or extend (doc 45; errata 128).
    if (this.titleMenu) {
      this.ambience.play(null);
      this.cueBed.play(null);
      if (this.musicFinishing) return;
      this.music.setTune(0);
      this.music.play(this.state.content.manifest.music?.title ?? null);
      return;
    }
    this.applyAmbience();
    // DOC 45 R32-MUTE: the coffin stops the score dead and carries its place.
    if (this.state.room.music === 'suspend') {
      // Until the timeline's resume; after it the returned bed plays on, and
      // a click that calls this must not stop it again.
      if (!this.musicResumed) this.music.suspend();
      return;
    }
    // ERRATA 160: A CUT-AWAY MAY HAVE ITS OWN MUSIC, for as long as its room is showing.
    const scored = this.state.inCutaway ? this.cut?.cutaway.music : undefined;
    if (scored) {
      this.music.play({ src: scored.src, gain: scored.gain, rate: scored.rate });
      return;
    }
    const declared = this.state.content.manifest.music;
    if (!declared) return;
    // A DUEL HAS ITS OWN MUSIC (doc 45 R04-DUEL; U-FINAL-DUEL), for as long as it lasts.
    const duel = this.state.dialogue.duelSounding;
    const duelBed = duel ? declared.duels?.[duel] ?? declared.duels?.['default'] : undefined;
    if (duelBed) {
      this.music.play({ src: duelBed.src, gain: duelBed.gain });
      return;
    }
    const entry = declared.rooms?.[this.state.room.id];
    // ERRATA 103: null is a room's deliberate silence; no entry is the title bed.
    if (entry === null) {
      this.music.play(null);
    } else if (entry === undefined) {
      this.music.play(declared.title ?? null);
    } else {
      const state = entry.variants?.find((variant) => this.state.flags.test(variant.when)) ?? entry;
      // A LAYER THAT IS SOMEBODY'S PLAYING plays while he is here (errata 116).
      const here = new Set(this.ambient.present.map((each) => each.id));
      const layers = (state.layers ?? []).filter((layer) => !layer.whenPresent || here.has(layer.whenPresent))
        .map((layer) => ({ src: layer.src, gain: layer.gain }));
      this.music.play({ src: state.src, gain: state.gain, layers });
    }
    // INVARIANT 5: -35 cents until Room 33's ninety seconds, 0 after them.
    if (this.tuneStart === null) {
      this.music.setTune(declared.tunedFlag && this.state.flags.test({ [declared.tunedFlag]: true }) ? 1 : 0);
    }
  }

  /**
   * ROOM 33: A LISTEN ON THE ROCK IS A TAP (doc 28 Part Five; doc 45 R33-TAP,
   * R33-RIPPLE, R33-VOID). Where the click landed picks the knock and its
   * ripple, and no line is said; on the void its line is said once, and the
   * score's ninety seconds begin (errata 71 E). Returns true when it answered.
   */
  private listenAt(target: Interactable, verb: string): boolean {
    const listening = this.state.room.listening;
    if (!listening || target.id !== listening.surface || verb !== 'LISTEN_TO' || !this.lastClick) return false;
    const at = this.lastClick;
    const tap = tapAt(listening, at.x, at.y);
    this.sfx.play(tap.src, this.roomSoundGain());
    const now = this.time.now;
    this.ripples.push({ x: at.x, y: at.y, start: now, end: now + tap.tail * 1000, tail: tap.tail });
    this.state.verbs.resetToDefault();
    if (tap.void && !this.state.flags.test({ [listening.foundFlag]: true })) {
      // The void's one line, through the ordinary path so it is said, set and
      // completed as any rule is -- under its own name, never the hotspot's.
      this.applyInteraction({ id: `${listening.surface}#void`, name: target.name, rect: target.rect, colour: 0,
        distant: true, responses: { LISTEN_TO: [listening.found] } } as Interactable, verb);
      this.tuneStart = now;
      this.sitDue = true;
    }
    this.markDirty();
    return true;
  }

  /** Room 33's clock: ripples run out, and the ninety seconds tune the score and still the lamp. */
  private tickListening(): void {
    const now = this.time.now;
    if (this.ripples.length) {
      this.ripples = this.ripples.filter((one) => now < one.end);
      this.markDirty();
    }
    const listening = this.state.room.listening;
    if (listening) this.sitWhenSaid(listening.void.at[0]);
    if (this.tuneStart === null || !listening) return;
    const fraction = tuneAt(listening, now - this.tuneStart);
    this.music.setTune(fraction);
    // THE ARC'S OWN SOUNDS, each once, on its clock (errata 116).
    const elapsed = (now - this.tuneStart) / 1000;
    for (const one of listening.tune.cues ?? []) {
      if (elapsed >= one.at && !this.tuneCuesFired.has(one.cue)) {
        this.tuneCuesFired.add(one.cue);
        this.fireCue(one.cue);
      }
    }
    this.markDirty();
    if (fraction >= 1) {
      this.tuneStart = null;
      this.state.flags.applyWrites({ [listening.tune.doneFlag]: true });
    }
  }

  /**
   * He sits once the void's line has come down: a turn to face it, then `sit`.
   * The state is set as the clip starts -- `sit` has no seated variant, so it
   * plays through (partialStates), and the frame after it is already the held
   * seated one rather than a frame of him standing.
   */
  private sitWhenSaid(voidX: number): void {
    if (!this.sitDue || this.sayingActor !== null || this.pendingSay.length > 0) return;
    const toward = voidX < this.actor.x ? 'left' : 'right';
    if (this.actor.facing !== toward) { this.actor.setFacing(toward); return; }
    if (this.actor.isBusy || this.actor.isWalking) return;
    this.sitDue = false;
    this.actor.react('sit', this.choreSeconds(this.actor, 'sit'));
    this.state.setMoverState(this.actor.id, 'seated');
    this.markDirty();
  }

  /** Seated and the ninety seconds over: the click stands him up, and is spent doing it. */
  private riseIfSeated(): boolean {
    if (this.state.moverState(this.actor.id) !== 'seated' || this.sitDue || this.actor.isBusy) return false;
    this.state.setMoverState(this.actor.id, undefined);
    this.actor.react('rise', this.choreSeconds(this.actor, 'rise'));
    this.markDirty();
    return true;
  }

  /** How still the room's lamps are: Room 33's, on the score's clock (invariant 8). */
  private lampStillness(): number {
    const listening = this.state.room.listening;
    if (!listening) return 0;
    if (this.tuneStart !== null) return tuneAt(listening, this.time.now - this.tuneStart);
    return this.state.flags.test({ [listening.tune.doneFlag]: true }) ? 1 : 0;
  }

  private enterRoomPerformance(from: string | null = this.state.previousRoomId): void {
    this.leaveLines();
    // A picture held over a beat's lines stays in the room it was said in (ResponseRule.holds).
    if (this.spokenPose) this.actor.hold(null);
    this.spokenPose = null;
    this.lingering = null;
    this.loadNear();
    // A room over once its ending is said stays over black, after a load too (errata 121 B).
    const black = this.state.room.blackWhen;
    this.overBlack = black !== undefined && this.state.flags.test(black);
    this.arrivedAt = this.time.now / 1000;
    this.view.setArrivedAt(this.arrivedAt);
    this.sayAt = null;
    // Who is in the room is decided now, as he arrives (AmbientLayer.present).
    this.ambient.arrived();
    this.musicResumed = false;
    this.applyMusic();
    // A cue's held sound belongs to the room it was started in.
    this.cueBed.play(null);
    this.soundForTransit(from);
    this.lastFoot = -1;
    // ERRATA 70 G. A timeline room starts its clock on entry; any other room
    // stops whatever timeline was running and gives the panel back.
    this.timeline.stop();
    this.timelineAt = null;
    this.plate = null;
    this.panelHidden = this.state.room.interface === 'none';
    this.sceneControlsUntil = null;
    if (this.state.room.timeline?.length) {
      this.timeline.start(this.state.room.timeline);
      // A ROOM WHOSE CHECKPOINT IS BEHIND THE PLAYER STARTS THERE (errata 71
      // B). A save made at or after Room 32's lid -- E8 is complete -- loads
      // onto the lantern with the panel back, not under four minutes of earth.
      const checkpoint = this.timeline.checkpoint;
      if (checkpoint?.do === 'dialogue' && checkpoint.completes && this.state.puzzleComplete(checkpoint.completes)) {
        for (const due of this.timeline.skipToCheckpoint()) this.applyTimelineStep(due, true);
      }
    }
    this.sequence.cancel();
    this.carried.cancel();
    this.world.abandon();
    this.actors.clearRoom();
    // A RETURN PUTS HIM BACK; AN ARRIVAL USES THE DOOR. Coming back from the
    // map or from a load resumes where he stood, which is what stops opening a
    // menu being a move; walking through an exit is an arrival and still lands
    // on the entrance, because that is what an entrance is for.
    const resume = this.state.resumeStanding(from);
    if (resume) this.actor.placeAt(resume[0], resume[1]);
    else this.actor.placeIn(this.state.roomId, from);
    this.armSteps();
    this.ripples = [];
    this.tuneStart = null;
    this.sitDue = false;
    const listening = this.state.room.listening;
    if (listening) {
      // A save made inside the ninety seconds loads with them over: the
      // tuning is not replayed and never snaps back (errata 70 C3).
      if (this.state.flags.test({ [listening.foundFlag]: true })
        && !this.state.flags.test({ [listening.tune.doneFlag]: true })) {
        this.state.flags.applyWrites({ [listening.tune.doneFlag]: true });
      }
      // DOC 48 S5 BEAT 1: the fork, unbidden, once. A, 440.
      if (listening.fork && !this.state.flags.test({ [listening.fork.onceFlag]: true })) {
        this.sfx.play(listening.fork.src, this.roomSoundGain());
        this.state.flags.applyWrites({ [listening.fork.onceFlag]: true });
      }
    }
    // HERE, BECAUSE EVERY WAY INTO A ROOM COMES THROUGH THIS. The arrival
    // routine was called from inside the scripted-travel callback only, so a
    // room entered by walking through an exit, by warping, or by loading got
    // neither its walk-in nor its lines -- which is why Main Street's three
    // arrival lines looked as though they had been lost. They were written,
    // compiled and loaded, and nothing was calling for them.
    //
    // A RESUME IS NOT AN ARRIVAL: coming back from the map or a load puts him
    // where he stood, and a man does not remark on a town he is standing in.
    if (!resume) this.arrivalLines();
    // ERRATA 223: AN ARRIVAL ON A ROOM STILL ARRIVING IS HELD IN BLACK. A room
    // that is already whole -- the usual case, its neighbours fetched ahead --
    // is not held at all. NEW GAME, a fade and a cut-away hold for themselves.
    const resumed = resume !== null && resume !== undefined;
    const wasHolding = this.arrivalHold.holding;
    const otherHold = this.entry !== null || this.roomFade !== null || this.cut !== null;
    if (this.arrivalHold.arrive(this.time.now / 1000, this.roomWhole(), otherHold)) {
      this.fadeBlack = 1;
      // Its accost is timed from when the room is seen, not from the black.
      this.accostTimer?.remove();
      this.accostTimer = undefined;
      this.accostAfterHold = resumed;
    } else {
      if (wasHolding && !otherHold) this.fadeBlack = 0;
      this.accostAfterHold = null;
      this.armAccost(resumed);
    }
  }

  /**
   * ONE FRAME OF AN ARRIVAL'S HOLD (errata 223). True while it holds: the
   * screen is black and the room is not run. On the frame the room is whole
   * (or the limit has passed, errata 157's `roomReadyLimitSeconds`) the black
   * goes at once, as the cut it replaces did, and the room begins from that
   * frame: what was started on arrival is moved on by the time it was held,
   * so a line's reading hold is spent where it can be read.
   */
  private holdsArrival(now: number): boolean {
    const limit = this.state.content.ui.timing?.roomReadyLimitSeconds ?? 12;
    const hold = this.arrivalHold.tick(now, this.roomWhole(), limit);
    if (!hold) return false;
    if (!hold.released) {
      this.fadeBlack = 1;
      return true;
    }
    this.fadeBlack = 0;
    if (this.sayUntil !== null) this.sayUntil += hold.heldFor;
    if (this.sayAt !== null) this.sayAt += hold.heldFor;
    this.arrivedAt = now;
    this.view.setArrivedAt(now);
    this.timelineAt = null;
    if (this.accostAfterHold !== null) {
      const resumed = this.accostAfterHold;
      this.accostAfterHold = null;
      this.armAccost(resumed);
    }
    this.markDirty();
    return false;
  }

  /**
   * "LOADING…" (errata 223; Tyler, 2026-11-09). Up over any black that is
   * waiting on its room -- an arrival's hold, NEW GAME's, a fade's, a
   * cut-away's -- once the wait has lasted `ui.json`'s `loading.afterSeconds`;
   * never on an ordinary arrival, and gone the frame the room is whole.
   */
  private showLoading(now: number): void {
    const words = this.state.content.ui.loading;
    const up = words !== undefined && this.arrivalHold.label(now, this.fadeBlack,
      this.fadeBlack >= 1 ? this.roomWhole() : true, words.afterSeconds ?? 0.5);
    if (up !== this.loadingUp) {
      this.loadingUp = up;
      this.markDirty();
    }
  }

  /** The pending accost's timer, cancelled by leaving the room. */
  private accostTimer?: Phaser.Time.TimerEvent;

  /**
   * Doc 35's auto-open: a character in this room who opens on Thad. The room
   * says who, when and how long he waits; the tree's own opening line is what
   * he says, through the same greeting route TALK TO takes -- only Thad does
   * not walk to him. A resume (the map, a load) is not an arrival and does not
   * re-arm it; the `set` flags make it once only in any case.
   */
  private armAccost(resumed: boolean): void {
    this.accostTimer?.remove();
    this.accostTimer = undefined;
    const accost = this.state.room.onEnter?.accost;
    // `whenAny`: he opens on Thad in any of several states (errata 84 F --
    // Fanshawe at the dinner and at the offer); the tree's entries say which node.
    const holds = () => Boolean(accost) && this.state.flags.test(accost!.when)
      && (!accost!.whenAny || accost!.whenAny.some((when) => this.state.flags.test(when)))
      && !(accost!.completes && this.state.puzzleComplete(accost!.completes));
    if (!accost || resumed || !holds()) return;
    const room = this.state.roomId;
    this.accostTimer = this.time.delayedCall((accost.afterSeconds ?? 0) * 1000, () => {
      this.accostTimer = undefined;
      if (this.state.roomId !== room || this.state.dialogue.isActive || this.pendingTree) return;
      if (!holds()) return;
      const npc = this.ambient.present.find((each) => each.id === accost.npc);
      if (!npc?.tree) return;
      for (const [id, value] of Object.entries(accost.set ?? {})) this.state.flags.set(id, value);
      // An accost that completes a puzzle is that puzzle's action: the puzzle
      // completes here, and the opening its entry gates is performed once.
      if (accost.completes) this.state.completeByTimeline(accost.completes);
      this.actor.faceToward(npc.x, npc.y);
      // `seat`: to the chair instead, and he sits as the conversation opens (doc 48 S1 beat 1).
      const seat = accost.seat && this.state.flags.test(accost.seat.when) ? accost.seat : null;
      this.pendingTree = { tree: npc.tree, at: { x: npc.x, y: npc.y }, greeted: false, npc: npc.id,
        ...(accost.completes ? { viaAction: true } : {}), ...(accost.duel ? { duel: accost.duel } : {}),
        ...(seat ? { seat: { facing: seat.facing, state: seat.state, ...(seat.sitAt ? { sitAt: seat.sitAt } : {}),
          from: { x: seat.x, y: seat.y } } } : {}) };
      // `approach`: he walks to the caller's stand first; the tree opens on arrival.
      if (seat) {
        this.actor.walkTo(seat.x, seat.y);
      } else if (accost.approach && npc.walkTo) this.actor.walkTo(npc.walkTo.x, npc.walkTo.y);
      this.markDirty();
    });
  }

  /**
   * A line, or the interaction that produces one. Handed to `SequenceWorld`,
   * which owns everything the runner may do to a BODY; this owns the words.
   */
  private saySequenceStep(step: Extract<SequenceStep, { kind: 'say' }>): number {
    if (step.interact) {
      // A PERSON'S LINES ARE NOT ONE OF THE ROOM'S HOTSPOTS (errata 192): the target staged for her is kept here.
      const target = this.personTarget?.target.id === step.interact.target
        ? this.personTarget.target : this.state.findTarget(step.interact.target);
      if (target) this.applyInteraction(target, step.interact.verb);
      return 0;
    }
    this.setSay(step.line ?? null, step.actor ?? null);
    // UNDER MANUAL A SCRIPTED LINE HOLDS ITS SCENE UNTIL IT IS CLICKED
    // (errata 154 A): the runner waits on it until the click releases it.
    if (this.readsManually && step.line && !isRest(step.line)) return GameScene.HELD_FOR_CLICK;
    return this.lineSeconds(step.line ?? '');
  }

  /**
   * How long a line stays on screen. ONE FORMULA, AND THIS IS THE OTHER HALF
   * OF ITS ONLY CALLER LIST.
   *
   * There were two. `max(1.6, glyphs x 0.045)` held a scripted line and
   * `clamp(1.8, 8.0, 0.45 + glyphs x 0.055)` held a dialogue utterance, and
   * errata 61 recorded the split as deliberate: a line in a scene nobody is
   * talking in is a different question from a line between two people who
   * are. That errata also said what merging them would cost -- "a retune of
   * the opening, watched, not a refactor" -- and the ruling is to merge.
   *
   * IT IS A RETIME AND HERE IS ITS SIZE. Every one of the opening's fifteen
   * lines gets longer, and none gets shorter: 25.9 seconds of speech becomes
   * 31.2, a fifth again. The longest line in it is 73 glyphs, which is 3.28
   * seconds under the old rate and 4.46 under this one -- nowhere near the
   * 8-second ceiling, so the clamp changes nothing about the opening and the
   * whole difference is the base and the rate. Somebody has to watch it.
   *
   * Doc 17 states seconds for BEATS and never for lines, which is correct --
   * a line's duration is a property of the line. The constants live in
   * content/ui/ui.json because menu.json declares an unimplemented OPTIONS
   * item called "Text speed": when it is built, these are the values it
   * scales, and a rate written into this file could not be. Doc 30 section
   * 4.1 asks for one timing service owning scripted, dialogue and bark alike,
   * and this is now the whole of it.
   */
  private lineSeconds(line: string): number {
    return readingHold(line, this.holdTiming());
  }

  /**
   * How long a clip runs on this mover, from its own frame count.
   *
   * THERE IS NO FALLBACK, AND A MISSING CLIP IS NAMED. It used to end
   * `?? 1`, so a chore nobody had drawn ran for one frame's worth of time and
   * the actor played whatever `ActorSprite` fell through to -- coverage that
   * did not exist, reported as working.
   *
   * Two things are missing today and both are named rather than papered over:
   * only the protagonist has an actor record at all, so any chore naming
   * another mover throws with its id in the message; and doc 40 lists
   * `recoil`, `pickup` and `reach` as undrawn, so a chore naming one of those
   * throws with the clip in the message. Assertion 14 fires first in dev with
   * the code doc 34 gave it.
   */
  private choreSeconds(mover: Actor, clip: string): number {
    // HIS OWN RECORD AND HIS OWN RATE. This read `content.actor` -- the
    // protagonist -- and guarded it with `mover.id === record.id`, so a chore
    // staged for anyone else resolved to `undefined` and threw. That guard was
    // right when he was the only record and is wrong now that Hob and the
    // coach have their own: it would refuse a clip Hob genuinely declares, and
    // the duration would have come off Thad's reactRate if it had not.
    //
    // The lookup is keyed by the MOVER'S id, so the answer traces to the thing
    // being asked about. A mover with no record still throws, by name.
    const record = this.state.content.actors.get(mover.id);
    const facing = mover.facing;
    const surface = mover.surfaceHere();
    const found = record?.clips.find(
      (candidate) => candidate.id === clip && candidate.facing === facing);
    assertRequiredClip(found, clip, facing, surface);
    if (!found || !record) {
      throw new Error(`No declared clip "${clip}" (${facing}) for mover "${mover.id}"`);
    }
    return found.frames.length / record.reactRate;
  }

  /** When the step after this chore may start: its clip's `landsAt` frame, if it declares one. */
  private choreLands(mover: Actor, clip: string): number | undefined {
    const record = this.state.content.actors.get(mover.id);
    const found = record?.clips.find((candidate) => candidate.id === clip && candidate.facing === mover.facing);
    return found?.landsAt === undefined || !record ? undefined : found.landsAt / record.reactRate;
  }

  /**
   * A click in the inventory strip.
   *
   * LOOK and LISTEN examine the item where it is. Every other verb picks it
   * up as the thing the next click applies WITH -- which is the whole of
   * item-on-target, and it needs no second verb and no second click mode.
   */
  private onInventoryClick(x: number, y: number): boolean {
    const arrow = this.view.arrowHitboxes().find((box) => pointInRect(x, y, box));
    if (arrow) {
      this.state.scrollInventory(arrow.direction === 'up' ? -1 : 1, this.panel.visibleRows, this.panel.perRow);
      this.markDirty();
      return true;
    }
    const slot = this.view.inventoryHitboxes().find((box) => pointInRect(x, y, box));
    if (!slot) return false;
    const target = this.state.itemTarget(slot.id);
    const verb = this.state.verbs.selectedVerb;
    // AN ITEM-DIRECTED VERB RESOLVES WHERE IT STANDS. Only the verbs content
    // names as CARRYING an item -- doc 24's USE -- pick it up to apply to
    // something else; the other eight are complete sentences about the item
    // alone and must answer here.
    //
    // THIS ASKED `examines` AND HELD THE ITEM FOR EVERY OTHER ANSWER, so OPEN
    // THE LETTER produced nothing at all: no line, no flag, no refusal. The
    // only way to get a response out of an item was to click it and then click
    // Thad, which is the interface reading as broken. The question was
    // inverted -- the small named set is the one that carries.
    //
    // AND IT WENT THROUGH `verbs.resolve(...).say` RATHER THAN `interact`,
    // WHICH IS Q13. That call returns the line and the effects side by side
    // and this took only the line, so an item response's flag writes and state
    // changes were dropped on the floor -- silently, because the line still
    // appeared and nothing downstream could tell. `interact` is the same path
    // a room object takes: resolve, reserve, perform, commit, in errata 48's
    // order. Q13 was filed as a dropped write; it was also a missing response.
    //
    // ITEM ON ITEM (GameState.inventoryClick, errata 140): with USE selected
    // and another item in hand, the click finishes "Use X on Y" through doc
    // 24's tiers rather than swapping what is held.
    const action = this.state.inventoryClick(slot.id);
    if (target && verb && action !== 'hold') {
      this.applyInteraction(target, verb);
      this.markDirty();
      return true;
    }
    this.state.holdItem(slot.id);
    this.markDirty();
    return true;
  }

  /**
   * Opens the map, or leaves it by the way it was opened.
   *
   * Doc 20 rule 5 -- travel is instant -- cuts both ways: coming back is a
   * screen change and not a walk, and a player who opens the map to look at
   * it must be able to close it without going anywhere.
   */
  private toggleMap(): void {
    // Not from under the table (RoomFile.actorHiddenWhen; errata 239): the map is a way out of the room.
    if (!this.state.isMap && this.state.playerStays) return;
    this.mapWalk = null;
    const target = this.state.isMap ? this.state.previousRoomId : this.mapRoomId();
    if (!target || !this.state.content.rooms.has(target)) return;
    this.state.enterRoom(target);
    this.hovered = null;
    this.hoveredName = null;
    this.hoveredLocation = null;
    this.setSay(null);
    this.enterRoomPerformance();
    this.markDirty();
  }

  /** The one room declaring itself a map. Found, not named. */
  private mapRoomId(): string | null {
    for (const [id, room] of this.state.content.rooms) {
      if (room.kind === 'map') return id;
    }
    return null;
  }

  /**
   * ERRATA 163: where the map's Thad is drawn, and in which frame. Walking, he
   * is wherever his walk has reached; otherwise he stands at the place of the
   * room the map was opened from.
   */
  private mapTokenPose(): { x: number; y: number; frame: number; left: boolean } | null {
    const map = this.state.room;
    if (!this.state.isMap || !map.mapToken) return null;
    if (this.mapWalk) {
      const pose = this.mapWalk.walk.at(this.time.now / 1000 - this.mapWalk.startedAt);
      return { x: pose.x, y: pose.y, frame: pose.frame, left: pose.left };
    }
    const home = homeLocation(map, this.state.previousRoomId);
    if (!home) return null;
    const [x, y] = placePoint(map, home);
    return { x, y, frame: map.mapToken.rest, left: false };
  }

  /** The walk ends, or is skipped by a click: the travel the click asked for. */
  private arriveByMap(): void {
    const location = this.mapWalk?.location;
    this.mapWalk = null;
    if (!location || !this.state.travelTo(location)) return;
    this.hovered = null;
    this.hoveredName = null;
    this.hoveredLocation = null;
    this.setSay(null);
    this.enterRoomPerformance();
    this.markDirty();
  }

  private onMapClick(x: number, y: number): void {
    // A CLICK WHILE HE WALKS SKIPS THE WALK (errata 163): a player who is
    // backtracking never waits on a road he has walked before.
    if (this.mapWalk) {
      this.arriveByMap();
      return;
    }
    const hit = this.view.mapHitAt(x, y);
    // An unbuilt destination is drawn and does not travel. Silently: doc 17
    // v3.1's constraint is that nothing announces itself, and a notice saying
    // "not implemented" is the loudest possible announcement.
    if (!hit?.built) return;
    const location = (this.state.room.locations ?? []).find((entry) => entry.id === hit.id);
    if (!location) return;
    // ERRATA 163: Thad walks the roads there first, when the map has him.
    const map = this.state.room;
    const home = map.mapToken ? homeLocation(map, this.state.previousRoomId) : undefined;
    if (map.mapToken && home && home.id !== location.id && this.state.content.rooms.has(location.room)) {
      const walk = new MapWalk(mapPath(map, home, location), map.mapToken);
      if (walk.seconds > 0) {
        // THE PLACE IS FETCHED WHILE HE WALKS THERE: the map has no exits, so
        // nothing on it is next door (BootAssets.planNear, `heading`).
        this.loadNear(location.room);
        this.mapWalk = { walk, startedAt: this.time.now / 1000, location };
        this.markDirty();
        return;
      }
    }
    if (!this.state.travelTo(location)) return;
    this.hovered = null;
    this.hoveredName = null;
    this.hoveredLocation = null;
    this.setSay(null);
    this.enterRoomPerformance();
    this.markDirty();
  }

  private onPanelClick(x: number, y: number): void {
    // ERRATA 39's toggle, checked BEFORE the verbs: it shares the verb grid's
    // geometry and a cell that answered both would select a verb underneath it.
    const full = this.panel.fullscreenButton;
    if (full && pointInRect(x, y, full)) {
      this.toggleFullscreen();
      return;
    }
    for (const verb of this.state.content.verbs.verbs) {
      if (pointInRect(x, y, this.panel.verbButton(verb.col, verb.row))) {
        this.state.verbs.selectVerb(verb.id);
        this.markDirty();
        return;
      }
    }
  }

  /**
   * ERRATA 39, as ruled. Fullscreen is better and never required -- the game
   * stays correct windowed, and errata 54 superseded the integer rule that
   * once made a fractionally scaled window wrong.
   *
   * Driven from a CLICK and nowhere else, because browsers only grant
   * fullscreen inside a user gesture. A call from a timer or from restored
   * save state is refused, silently, which is why this is not something the
   * menu remembers and reapplies.
   */
  private toggleFullscreen(): void {
    if (this.scale.isFullscreen) this.scale.stopFullscreen();
    else this.scale.startFullscreen();
    this.markDirty();
  }

  /**
   * A choice was clicked. Doc 30 section 6.2: hide the list, and make Thad
   * speak the wording he was just made to choose.
   *
   * IT USED TO CALL `select()`, which is `beginSelection` + advance + advance +
   * settle in one statement. Every phase boundary the exchange exists to
   * create was crossed inside it, including the one named `echo`, and the
   * player never heard Thad say a word he chose. R5o at the largest scale in
   * this project: doc 30 specified it, errata 45 corrected it,
   * `DialogueExchange` implements it, and the caller fast-forwarded.
   */
  private onDialogueClick(x: number, y: number): void {
    const options = this.state.dialogue.presentOptions();
    const scroll = this.choiceScroll(options);
    // THE ARROWS FIRST: they sit in their own column beside the rows.
    const arrow = this.view.dialogueArrows(options, scroll).find((box) => pointInRect(x, y, box));
    if (arrow) {
      this.scrollChoices(arrow.direction === 'up' ? -1 : 1);
      return;
    }
    if (x >= CHOICE_ARROW_X && this.view.dialogueArrows(options, scroll).length > 0) return;
    const hit = this.view
      .dialogueHitboxes(options, scroll)
      .find((box) => box.shown && y >= box.y && y < box.y + box.height);
    if (!hit) return;
    // The list that comes back after the answer starts from its top again.
    this.optionScroll = 0;
    this.optionListKey = null;
    const chosen = options.find((each) => each.option.id === hit.id);
    if (!chosen) return;

    const exchange = this.state.dialogue.beginSelection(hit.id);
    const said = exchange.presentation;
    // THE ECHO IS THE OPTION'S OWN WORDING. Doc 30 section 6.2: "using
    // option.echo when present, otherwise option.text". Spoken by whoever the
    // manifest says the protagonist is -- no .ts file names him.
    // THE WORDING AS DRAWN, which is the option's own or its rephrase.
    // DOC 30 §6.2's `option.echo when present`: the letters home name a
    // version in the list and speak the letter (doc 04 Part Three).
    const echo = { speaker: this.state.content.actor.id, line: chosen.option.echo ?? chosen.text };
    // A REPLY AS IT IS PERFORMED: a stage direction printed in parentheses
    // (doc 58), or acted by a figure in the room with nothing printed (doc 95).
    const present = this.ambient.present;
    const act = (spoken: Utterance) => performedLine(this.performers(), spoken, GameScene.asDirection);
    const replies = heldThrough(present, [
      ...(said.say ? act({
        speaker: said.sayer,
        line: said.say,
        direction: said.direction,
      }) : []),
      ...said.rest.flatMap((spoken) => act({
        speaker: spoken.speaker,
        line: spoken.line,
        direction: spoken.direction === true,
        ...((spoken as { sound?: Utterance['sound'] }).sound ? { sound: (spoken as { sound?: Utterance['sound'] }).sound } : {}),
        // A duel's held beats (errata 130): a silence, and the judges' pencil in it.
        ...(spoken.rest !== undefined ? { rest: spoken.rest } : {}),
        ...(spoken.mark ? { mark: true } : {}),
        // Duel Three's release (errata 131 D, E): the music cut, and the street erupting.
        ...(spoken.quiet ? { quiet: true } : {}),
        ...(spoken.cue ? { cue: spoken.cue } : {}),
      })),
    ]);
    this.performance = new DialoguePerformance(
      exchange, echo, replies, this.holdTiming(), this.lastFrameAt);
    this.showPerformance();
  }

  /** Doc 30 section 4.1's constants, from content. */
  private holdTiming(): HoldTiming {
    // TEXT SPEED (errata 154 A): the player's Options choice, a machine
    // setting, scales every reading hold, and MANUAL makes every line wait.
    return holdTimingFor(this.state.content.ui.timing, this.state.menu.choice('textSpeed'));
  }

  /** How long a bark stays up: ui.json barkSeconds, scaled by Text speed (errata 154 A). */
  private barkMs(): number {
    return barkHold(this.state.content.ui.timing, this.state.menu.choice('textSpeed')) * 1000;
  }

  /** Text speed is MANUAL: every line waits for its click (errata 154 A). */
  private get readsManually(): boolean {
    return this.holdTiming().manual === true;
  }

  /**
   * Puts the performance's current utterance on the speech channel, and closes
   * the exchange out when it has none left.
   *
   * THE TREE'S CONSEQUENCES LAND HERE AND NOT SOONER, which is step 7 and is
   * also errata 45: the exchange settles on EXIT from its last reply, inside
   * `DialoguePerformance.finish`, so by the time this sees `done` the writes
   * have committed and `ended` is true if the tree closed.
   */
  private showPerformance(): void {
    const live = this.performance;
    if (!live) return;
    const line = live.current;
    // AN ACTED DIRECTION (errata 131 B, 141) shows nothing on the speech channel.
    this.setSay(line ? shownText(line) : null, line?.speaker ?? null, line?.direction ?? false, live.echoing);
    // THE MUSIC STOPS FOR A HELD SILENCE (errata 131 D: "Silence on Main
    // Street. Long.") and stays down until the exchange is over; everyone holds
    // still until the line that sounds a cue -- the street erupting (131 E).
    if (line?.quiet && !this.hushed) {
      this.hushed = true;
      this.stilled = true;
      if (!this.music.isSuspended) this.music.suspend();
    }
    if (line?.cue && this.cuedLine !== line) {
      this.cuedLine = line;
      this.stilled = false;
      this.fireCue(line.cue);
    }
    // A LINE THAT MAKES A SOUND makes it once, as it is shown; the score rests
    // under it and comes back where it stopped (doc 48 S6 beat 3).
    if (line?.sound && this.soundedLine !== line) {
      this.soundedLine = line;
      this.sfx.play(line.sound.src, line.sound.gain ?? 1);
      if (line.sound.rest && !this.music.isSuspended) {
        this.music.suspend();
        this.time.delayedCall(line.sound.rest * 1000, () => { if (this.music.isSuspended) this.music.resume(0); });
      }
    }
    // A POINT WRITTEN DOWN (doc 45 U-ASSAY-PENCIL; errata 130 B): the judges'
    // pencil, in the beat after the line that won it and before the next boast.
    if (line?.mark && this.markedLine !== line) {
      this.markedLine = line;
      this.pointWritten = true;
      // A duel that scores another way sounds its own (doc 109's pebbles on the bar).
      const cue = line.markCue ?? this.state.content.sounds?.events?.duelMark;
      if (cue) this.fireCue(cue);
    }
    if (!live.done) { this.markDirty(); return; }
    this.performance = null;
    this.pointWritten = false;
    this.stilled = false;
    if (this.hushed) {
      this.hushed = false;
      if (this.music.isSuspended) this.music.resume(0);
      // The duel is over: the room's own music comes straight back, not the duel's bed for a frame.
      if (this.state.dialogue.duelSounding !== this.duelPlaying) {
        this.duelPlaying = this.state.dialogue.duelSounding;
        this.applyMusic();
      }
    }
    if (!this.state.dialogue.isActive) {
      this.state.autosave();
      // A tree that was carrying a run of beats hands the sheet back when it
      // closes. Doc 17's EXIT option is "Thank you for the ride." -- the
      // coach goes, and beat 7 follows it.
      if (this.opening) this.advanceOpening();
    }
    this.markDirty();
  }

  /**
   * Starts doc 17's opening, if this is a fresh game standing in the room it
   * opens in.
   *
   * Gated on the flags rather than on "have we been here before", so a save
   * restored mid-opening does not replay it and a player who has already been
   * told the undertaker's name is not told again.
   */
  /**
   * `?room=<id>` — start in a room instead of at the beginning.
   *
   * Tyler: "give me links to test rooms room by room, otherwise I have to play
   * the whole game every time." He is right, and it had been true for every
   * judgement made about Room 2 — which is a long way behind an opening that
   * now runs 31 seconds, a dialogue tree, a case to pick up and a mud beat.
   *
   * Everything else already works: `beginOpening` declines when the room is
   * not the manifest's start room, so warping skips the opening for free, and
   * `enterRoomPerformance` places the actor at the room's own entrance.
   *
   * LIVE IN THE PUBLISHED BUILD, DELIBERATELY, AND IT MUST NOT SHIP THAT WAY.
   * The point of it is links Tyler can open on the deployed site from a
   * Chromebook, and a dev-only warp gives him links that do nothing. The game
   * is unreleased and he is its only player, so the cost is nil today and the
   * benefit is that every room becomes reviewable in one click.
   *
   * Doc 36 Q12 records the debt: before release this returns to
   * import.meta.env.DEV, or the first act is optional.
   */
  private warpRoom(): string | null {
    // The leading id, as `?fixture=` takes it: a link from prose may carry the
    // next character with it (engine/dev/Fixture.ts idFromQuery).
    const asked = idFromQuery(window.location.search, 'room');
    if (!asked) return null;
    if (!this.state.content.rooms.has(asked)) {
      console.warn(`?room=${asked} is not a room. Known: `
        + [...this.state.content.rooms.keys()].join(', '));
      return null;
    }
    return asked;
  }

  private beginOpening(): void {
    // Which sequence is the opening, and which flag records that it has run,
    // are both content. No .ts file names either.
    const id = this.state.content.manifest.openingSequence;
    const file = id ? this.state.content.sequences.get(id) : undefined;
    if (!file) return;
    this.openingDoneFlag = file.doneFlag ?? null;
    if (this.openingDoneFlag && this.state.flags.get(this.openingDoneFlag) === true) return;
    if (this.state.roomId !== this.state.content.manifest.startRoom) return;
    // Beat 1 is the title screen, which is its own scene and has already
    // happened by the time anyone is standing on a road.
    this.opening = segmentsOf(file).filter((segment) => segment.kind !== 'menu');
    this.openingAt = 0;
    this.playOpeningSegment();
  }

  /**
   * Plays segments until it reaches one somebody else has to carry.
   *
   * An automatic segment becomes steps. A player segment does not: beats 4 to
   * 6 are the driver's tree (errata 30b), so this opens the tree and stops,
   * and the tree's EXIT option is what brings it back.
   */
  private playOpeningSegment(): void {
    while (this.opening && this.openingAt < this.opening.length) {
      const segment = this.opening[this.openingAt] as Segment;
      if (segment.kind === 'automatic') {
        // A new beat clears the last one's line. Without this the act card
        // lands underneath whatever the driver said on his way out.
        this.setSay(null);
        this.pendingSay = [];
        // The card holds for doc 17's stated beat duration PLUS its own
        // reading time. The ~3s in the beat sheet is how long the beat lasts;
        // how long two lines of a 5x7 font take to read is interface timing
        // of the same class as lineSecondsPerGlyph, and it lives in content
        // beside it. Legal under errata 30a -- this segment's control is
        // `none`, which is the only place a wait may be added at all.
        const card = actCardOf(segment);
        this.actCard = card;
        const steps = stepsFor(segment);
        const extra = this.state.content.ui.timing?.actCardExtraSeconds ?? 0;
        if (card && extra > 0) {
          // TAGGED WITH THE BEAT THAT RAISED THE CARD. Doc 44: a step with no
          // beat makes the runner report no beat, so the four seconds the
          // card holds read as time belonging to nothing -- the gauntlet
          // timed beat 7 at a tenth of a second and the card's own hold
          // vanished from the record.
          const holder = segment.beats.find((entry) => entry.actCard)?.beat;
          steps.push({ kind: 'wait', seconds: extra, beat: holder } as SequenceStep);
        }
        this.sequence.start(steps);
        this.markDirty();
        return;
      }
      if (segment.carriedBy) {
        this.state.dialogue.start(segment.carriedBy);
        this.markDirty();
        return;
      }
      // A player segment nobody carries is beat 8 onwards: control, Hob's
      // crossing, and the walk west. The opening is over and the game has
      // started; there is no announcement, per doc 17 v3.1.
      //
      // IT USED TO END HERE AND THAT WAS THE FOURTH X4 FINDING. Beats 8, 9
      // and 10 are one uncarried player segment, so reaching beat 8 dropped
      // beat 9 with it: Hob's three lines were never delivered, his flag was
      // never written, and the watchman's lamp hotspot that flag gates could
      // not appear in the game at all. Control is handed over AND the rest of
      // the segment is armed, which is what doc 17's `yes` in beat 9's
      // interactive column actually means.
      //
      // CONTROL FIRST, THEN THE CROSSING: `finishOpening` autosaves, and that
      // save should record a game that has just begun rather than one three
      // words into a conversation with a man who is not in the save file.
      // TAKEN BEFORE `finishOpening`, WHICH SETS `this.opening` TO NULL. Reading
      // it afterwards threw on the null and killed the scene at the moment
      // control was handed over -- every check and every test passed, because
      // nothing outside a browser reaches this line. The gauntlet found it on
      // the next run.
      const remaining = this.opening.slice(this.openingAt).flatMap((rest) => rest.beats);
      this.finishOpening();
      // EVERY REMAINING BEAT, NOT THIS SEGMENT'S. `segmentsOf` splits on a
      // change of control, so a `control: none` beat after the hand-over is a
      // SEPARATE segment -- and `finishOpening` has just set `this.opening` to
      // null, so the loop exits and that segment is never reached. It would
      // never play at all.
      //
      // The carrier is what runs alongside the player, so it carries the whole
      // remainder. Each beat keeps its own control, which is what the lowering
      // now tests: an interactive beat still refuses cutscene movement, and a
      // `control: none` beat held on a flag is a cutscene the player started.
      this.carried.arm(remaining);
      this.markDirty();
      return;
    }
    this.finishOpening();
  }

  /** The automatic segment that just ran, banked, and on to the next. */
  private advanceOpening(): void {
    if (!this.opening) return;
    const segment = this.opening[this.openingAt] as Segment;
    this.state.flags.applyWrites(writesOf(segment));
    this.actCard = null;
    this.openingAt += 1;
    this.playOpeningSegment();
  }

  private finishOpening(): void {
    this.opening = null;
    this.actCard = null;
    if (this.openingDoneFlag) this.state.flags.applyWrites({ [this.openingDoneFlag]: true });
    this.state.autosave();
    this.markDirty();
  }

  /**
   * Shows the next line of a multi-speaker response, and reports whether it
   * took the click.
   *
   * Doc 17 v3.1's second driver option is three lines across two people, and
   * they have to land one at a time or the joke's timing is gone -- the
   * player has to see "Hotel's five." before "I have four." lands, and both
   * before "You've all got four." The queue takes the click ahead of the
   * option list so a click meant to advance the exchange cannot select the
   * next option instead.
   */
  /**
   * What he says on walking into a room for the first time.
   *
   * Read BEFORE the room's onEnter writes land -- `sayOnce` names the flag
   * onEnter sets, so testing it after would always be false and the lines
   * would never play. Queued rather than spoken, so several arrive one after
   * another on their own reading holds.
   */
  private arrivalLines(): void {
    const entry = this.state.room.onEnter;
    if (!entry?.say?.length && !entry?.scenes?.length && !entry?.walkTo) return;
    const who = this.state.content.actor.id;
    // The lines and scenes as he walks in, before the room's own writes land
    // (GameState.arrivalOf: read after them, Main Street's first sight never played).
    const { held, scenes } = this.state.arrivalOf();
    const lines: { speaker: string; line: string; direction?: boolean }[] = [
      ...(held ? [] : (entry.say ?? []).map((line) => ({ speaker: who, line }))),
      ...scenes.flatMap((scene) => scene.lines)];
    if (entry.sayWhen !== undefined && !held && lines.length && entry.sayOnce) {
      this.state.flags.set(entry.sayOnce, true);
    }
    if (!held && entry.say?.length && entry.saySet) this.state.flags.applyWrites(entry.saySet);
    // The scenes' outcomes wait for the last line (doc 57 D6).
    const owed = scenes.map((scene) => scene.after).filter((after) => after !== undefined);
    if (owed.length) this.afterArrival = owed;

    // HE WALKS IN AND THEN SPEAKS, not both at once. Arriving already standing
    // there read as having come down out of the hills, so he now walks in from
    // the street's edge -- but firing his arrival lines at the same moment had
    // him remarking on the town while still crossing it. He stops, looks, and
    // then says it.
    //
    // AND ONLY ONCE. The walk is the first-sight staging (Room 2's annotation:
    // "where a man stands when he has just walked into a town he has never
    // seen"), gated by the same flag as the lines. It used to run on every
    // entry, so coming back out of the assay office put him at its door and
    // then marched him into the middle of the road. Room 5's Act I pass.
    if (entry.walkTo && !held) {
      this.actor.walkTo(entry.walkTo[0], entry.walkTo[1]);
      this.markDirty();
      if (lines.length) this.linesOnArrival = lines;
      return;
    }
    if (!lines.length) return;
    this.pendingSay.push(...lines);
    this.advanceSay();
  }

  /**
   * A ROOM CHANGE DROPS WHAT WAS STILL TO BE SAID IN THE ROOM LEFT (the
   * bookends audit, finding 1): a line queued on Main Street was carried onto
   * the map, drawn nowhere, and spent the next click there. What a scene OWES
   * is not dropped with its words -- an arrival scene's outcome lands now, so
   * leaving mid-scene can never lose a flag, an item or a puzzle.
   */
  private leaveLines(): void {
    if (this.afterArrival) {
      const owed = this.afterArrival;
      this.afterArrival = null;
      for (const done of owed) this.state.afterArrival(done);
    }
    this.pendingSay = [];
    this.linesOnArrival = null;
    this.travelAfterSay = null;
    this.setSay(null);
  }

  private advanceSay(): boolean {
    const next = this.pendingSay.shift();
    if (next === undefined) {
      // The last line is down: a picture held over the lines is let go (ResponseRule.holds), and so is
      // whatever an acted beat left held.
      if (this.spokenPose) this.actor.hold(null);
      this.spokenPose = null;
      this.lingering = null;
      // AN ARRIVAL SCENE IS OVER when its last line comes off: only now does
      // it hand over, complete, and write (so a figure in it walks out after).
      if (this.afterArrival) {
        const owed = this.afterArrival;
        this.afterArrival = null;
        for (const done of owed) this.state.afterArrival(done);
        this.markDirty();
      }
      return false;
    }
    if (next.overBlack) this.overBlack = true;
    // THE LETTER BUILDS ON ONE PAGE in a room that ends the game (errata 128).
    if (next.overBlack && this.state.room.endsGame) this.page.push(next.line);
    // A DIRECTION A FIGURE ACTS (doc 95; errata 141): Sump stamps the deed
    // rather than "(Stamp.)" being printed over him. Its beats go to the front
    // of the queue, each held for its time, with nothing on the speech channel.
    const steps = next.direction && !next.silent ? actOf(this.performers(), next.line) : null;
    if (steps) {
      this.pendingSay.unshift(...steps.map((step) => ({
        speaker: next.speaker, line: next.line, direction: true, silent: true,
        rest: step.seconds, poses: step.poses, ...(step.cue ? { cue: step.cue } : {}),
        ...(step.walk ? { walk: step.walk } : {}),
        ...(step.holds ? { holdsAfter: step.holds } : {}),
      })));
      return this.advanceSay();
    }
    if (next.silent) {
      this.setSay(null);
      this.sayingActor = next.speaker;
      this.queuedPoses = next.poses ?? null;
      // AND WHAT IT LEAVES HELD (doc 95 Holds): Grievance out of her stall through "Twelve years." (errata 197).
      if (next.holdsAfter) this.lingering = next.holdsAfter;
      this.sayUntil = this.time.now / 1000 + (next.rest ?? 0);
      // HE RETREATS (ActStep.walk): to the hotspot's own stand, and the beat holds until he is there.
      if (next.walk && next.walk.id === this.actor.id) {
        const spot = this.state.room.hotspots.find((one) => one.id === next.walk!.to);
        const stand = spot?.walkTo ?? (spot ? { x: spot.rect[0] + spot.rect[2] / 2, y: spot.rect[1] + spot.rect[3] } : null);
        if (stand && this.actor.walkTo(stand.x, stand.y)) this.actWalking = true;
      }
      if (next.cue) this.fireCue(next.cue);
      this.markDirty();
      return true;
    }
    this.setSay(next.direction ? GameScene.asDirection(next.line) : next.line, next.speaker, next.direction === true);
    this.spokenPose = next.pose ?? null;
    this.markDirty();
    return true;
  }

  /**
   * Puts a line on screen, and decides when it comes off again.
   *
   * A LINE USED TO STAY UNTIL SOMETHING ELSE MOVED IT -- a room change or the
   * next line, and nothing else. So the last line of any beat sat there for
   * the whole of what followed: "A firm welcome" was still on screen while he
   * walked up the road, competing with the title coming up over the mountains,
   * and every examine response in the game held until the player looked at
   * something else.
   *
   * `lineSeconds` already existed and already computed the right number --
   * doc 30 section 4.1's reading hold, from the rate and floor in ui.json --
   * and it was used ONLY to tell a cutscene how long to wait before its next
   * step. Nobody used it to take the words down. R5o: the calculation was
   * written, correct, and reached by one of its two consumers.
   *
   * A DIALOGUE LINE IS EXEMPT and that is not an oversight -- BUT NO LONGER
   * FOR THE REASON THIS COMMENT GAVE. It said an exchange holds its line until
   * the player clicks, which was true when it was written and is not now:
   * `DialoguePerformance` expires each utterance on doc 30 section 4.1's own
   * formula, which is the 0.055/1.8 pair rather than the 0.045/1.6 this file
   * uses. The exemption stands because the PERFORMANCE OWNS THE CLOCK during
   * an exchange, and two timers on one line would race -- not because a
   * dialogue line waits forever. R5k, in prose: a comment that went on
   * describing behaviour after it moved.
   */
  /**
   * Whether the choice list is on screen, which is not the same as the tree
   * being open: doc 30 step 2 hides the rows for the whole of an exchange, so
   * the panel must come back while a line performs and go again after.
   */
  private choicesShowing(): boolean {
    return this.state.dialogue.isActive && this.performance === null;
  }

  /** A conversation holds the interface: its greeting being said, its list up, or an answer being performed. */
  private conversationOpen(): boolean {
    return this.state.dialogue.isActive || this.pendingTree?.greeted === true;
  }

  /**
   * A stage direction as the documents print it: in parentheses. Doc 07 kept
   * its brackets through extraction and docs 04 and 27 lost theirs, so the
   * brackets are restored here, where it is presentation, rather than in the
   * content, where it would be retyping.
   */
  private static asDirection(text: string): string {
    const trimmed = text.trim();
    return trimmed.startsWith('(') ? trimmed : '(' + trimmed + ')';
  }

  private setSay(text: string | null, speaker: string | null = null, direction = false, echo = false): void {
    // A LINE THAT SOUNDS (errata 106): "He notarizes it. He stamps it." Matched
    // on the words as the document wrote them, without the parentheses a
    // direction is shown in.
    const words = text && direction && text.startsWith('(') && text.endsWith(')') ? text.slice(1, -1) : text;
    if (words && words !== this.soundedWords) {
      for (const rule of this.state.content.sounds?.lines ?? []) if (rule.line === words) this.fireCue(rule.cue);
    }
    // Once per showing: a line redrawn is not a line said again.
    this.soundedWords = words;
    // Whatever is said next, an acted beat from the queue is over, and so is a held picture.
    this.queuedPoses = null;
    this.spokenPose = null;
    this.sayIsDirection = text !== null && direction;
    // DOC 30 SECTION 5'S BLOCK WIDTH, WHICH NOTHING HAD EVER USED. "Spoken
    // text uses a default maximum block width of 240 native pixels." This
    // wrapped at NATIVE_WIDTH minus the margins -- 1856 -- so a two-line block
    // was seventeen hundred pixels wide, and once the speech was anchored over
    // the speaker the clamp had nowhere to put it but the middle of the
    // screen. Anchoring only reads as anchoring if the block is narrow enough
    // to sit somewhere. 240 native pixels is 240 x GLYPH_SCALE drawn.
    this.sayLines = text ? this.font.wrap(text, GameScene.SPEECH_BLOCK_WIDTH) : [];
    // A BARK GIVES WAY TO SPEECH. A remark thrown at Thad on arrival is over
    // the moment somebody actually speaks; left up, it sat on top of Thad's
    // first line of the conversation the arrival opened.
    if (text && this.barkAt) {
      this.barkTimer?.remove();
      this.barkLines = [];
      this.barkAt = null;
    }
    this.sayingActor = text ? speaker : null;
    // A CONVERSATION'S LINE -- its greeting too -- WAITS FOR ITS CLICK when
    // conversations do (ui.json), and stays up while it waits. Every other
    // line comes down on its hold, and the next follows (SpeechPolicy).
    const waits = text !== null && waitsForClick({
      conversation: this.state.dialogue.isActive || this.pendingTree?.greeted === true,
      clickToRead: this.state.content.ui.timing?.conversationWaitsForClick === true,
      rest: isRest(text),
      // THAD'S ECHO OF THE CHOICE MOVES ON BY ITSELF (errata 147), so it shows no waiting mark.
      echo,
      // Unless Text speed is MANUAL, when every line waits (errata 154 A).
      manual: this.readsManually,
    });
    this.sayWaiting = waits;
    this.sayUntil = text && !this.state.dialogue.isActive && !waits
      ? this.time.now / 1000 + this.lineSeconds(text)
      : null;
  }

  /** Space or Enter: one utterance, exactly as a click gives. Doc 30 4.2. */
  private onAdvanceKey(): void {
    if (!this.performance) return;
    if (this.performance.skip(this.lastFrameAt)) this.showPerformance();
  }

  private onMenuKey(): void {
    if (this.state.dialogue.isActive || this.beginCard || this.cut !== null || this.arrivalHold.holding) return;
    this.state.menu.escape();
    this.afterMenu();
  }

  private onModifiedKey(event: KeyboardEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toUpperCase();
    if (key !== KEY_SAVE_MODIFIED && key !== KEY_LOAD_MODIFIED) return;
    // The browser's own Save Page and Location Bar are not what the player
    // meant. Taking the event is the whole reason these are worth binding.
    event.preventDefault();
    if (key === KEY_SAVE_MODIFIED) {
      this.state.save(QUICK_SLOT);
      this.showNotice(this.state.content.menu.notices.saved);
      return;
    }
    if (this.state.load(QUICK_SLOT)) {
      this.afterLoad();
      this.showNotice(this.state.content.menu.notices.restored);
    } else {
      this.showNotice(this.state.content.menu.notices.noSave);
    }
  }

  /**
   * Which beat is playing, from whichever runner is playing it.
   *
   * TWO RUNNERS, ONE ANSWER. The opening runner plays instead of the player
   * and the carrier plays alongside him, and only one of them is ever running
   * -- but a caller that asked the wrong one would get null and report "no
   * beat" through the whole of Hob's crossing.
   *
   * BEAT 10 CANNOT BE SEEN HERE and doc 44 says so rather than pretending
   * otherwise: it stages nothing, deliberately, so no runner ever holds it
   * and the carrier has emptied its list by the time it is reached. What is
   * observable is that beat 9 finished and control is the player's, which is
   * `handedOver` in the probe.
   */
  private playingBeat(): string | null {
    return this.sequence.beat ?? this.carried.current?.beat ?? null;
  }

  /**
   * Doc 44's frame report. Everything the gauntlet compares against a script.
   *
   * Assembled on demand, never per frame: the harness asks about twenty times
   * a second and the game draws sixty, so building this in `update` would put
   * the instrument's cost into every frame whether or not anybody was
   * reading it. R5h -- an instrument can change the system, not only report
   * on it.
   */
  get probeReady(): boolean {
    return this.view !== undefined && this.actors !== undefined;
  }

  /** See Probeable.snapshot: the offscreen 2D canvas the renderer draws into. */
  snapshot(): string | null {
    const canvas = (this.texture as unknown as { canvas?: HTMLCanvasElement }).canvas;
    return canvas ? canvas.toDataURL('image/png') : null;
  }

  report(): FrameReport {
    const drawn = this.view.lastDrawn();
    const records = this.view.lastDrawRecords();
    const movers: Record<string, MoverReport> = {};
    for (const mover of this.actors.all()) {
      // NO INVENTED DEFAULTS FOR THE DRAW RECORD. A mover the renderer did not
      // reach has no order, no bounds and no file, and saying `order: 0` there
      // would put it first in a draw order it never joined. -1 and null are
      // the honest answers and every consumer has to handle them.
      const record = records[mover.id];
      movers[mover.id] = {
        at: [Math.round(mover.x), Math.round(mover.y)],
        facing: mover.facing,
        clip: mover.clip,
        height: Math.round(mover.height),
        moving: mover.isWalking,
        drawn: drawn[mover.id] ?? 'not-drawn',
        from: record?.from ?? null,
        bounds: record?.bounds ?? null,
        order: record?.order ?? -1,
        clipLevel: record?.clipLevel ?? 0,
        fallback: record?.fallback ?? false,
      };
    }
    return {
      // WHICH ROOM, AND IT WAS MISSING. A route that waits for a room could
      // never match: `waitFor: { room: 'main_street' }` compared against
      // undefined and timed out every time, sixty seconds after the game had
      // already arrived. The harness reported 'room stage_road' from its own
      // fallback and looked like a routing failure rather than a probe gap.
      room: this.state.roomId,
      walkers: this.view.lastWalkerBounds(),
      frame: this.frameCount,
      // ALREADY SECONDS. `lastFrameAt` is `time.now / 1000` and dividing again
      // reported 0.002 for a scene two seconds old -- which nothing would have
      // failed on, because every consumer compares it against itself.
      clock: this.lastFrameAt,
      beat: this.playingBeat(),
      waitingBeat: this.carried.waiting?.beat ?? null,
      control: this.openingControl(),
      movers,
      // What each overlay actually DREW in, not what the rule says it should
      // -- an overlay whose image had not loaded drew nothing, and reporting
      // the intended state there would tell the gauntlet a head was on screen
      // that was not.
      overlays: this.view.shownOverlayStates(),
      states: Object.fromEntries(this.state.targets
        .filter((target) => this.state.stateOf(target) !== undefined)
        .map((target) => [target.id, this.state.stateOf(target) as string])),
      caption: this.captionAt !== null,
      cues: { ...this.cuesFired },
      steps: this.steps?.report() ?? {},
      says: this.sayLines.length > 0 ? this.sayingActor : null,
      options: this.state.dialogue.isActive
        ? this.state.dialogue.presentOptions().length : 0,
      // Exactly the renderer's own condition: the list is hidden while an
      // exchange performs, so nothing is drawn and nothing is counted.
      choiceLines: this.state.dialogue.isActive && this.performance === null
        ? choiceLines(this.state.dialogue.presentOptions(), this.state.content.ui.dialogue).lines.length : 0,
      assets: this.roomAssets(),
      flags: this.state.flags.trueIds(),
      counters: this.state.flags.counters(),
      inventory: this.state.carried,
      held: this.state.heldItem,
      dialogueAt: this.state.dialogue.positionSnapshot(),
      selections: this.state.dialogue.selectionsHere(),
      puzzlesComplete: this.state.puzzlesComplete(),
      puzzles: this.state.puzzleProgress(),
      camera: Math.round(this.state.cameraX),
      pending: this.pendingSay.length,
      waiting: this.sayLines.length > 0 && this.sayWaiting,
      title: this.titleMenu !== null,
      begin: this.beginCard,
      entering: this.entry?.phase ?? null,
      black: this.fadeBlack,
      whole: this.roomWhole(),
      unarrived: planRoom(this.state.content, this.state.roomId)
        .filter((asset) => !this.textures.exists(asset.key) && !this.loadFailed.has(asset.key)).map((asset) => asset.key),
      cutaway: this.cut ? { id: this.cut.cutaway.id, phase: this.cut.phase } : null,
      // Due AND the scene would let it start (bar the arrival's settle): never true inside a conversation.
      cutawayDue: !this.cut && this.quietForCutaway(Number.MAX_SAFE_INTEGER) && this.state.content.cutaways.some((one) => one.room !== this.state.roomId
        && this.state.flags.test(one.when) && !this.state.flags.test({ [one.done]: true })),
      mapWalk: this.mapWalk ? { to: this.mapWalk.location.id, seconds: this.mapWalk.walk.seconds } : null,
      pan: this.panning ? this.panFrame()?.offset ?? null : null,
      bed: this.music.bed,
      ending: this.endingFrom === null ? null
        : endingAt(this.lastFrameAt - this.endingFrom, this.endingTiming()).phase,
      performing: this.performance !== null,
      panel: this.panelDrawn,
      optionsShown: this.state.dialogue.isActive && this.performance === null
        ? this.view.dialogueHitboxes(this.state.dialogue.presentOptions(), this.choiceScroll()).filter((box) => box.shown).length : 0,
      handedOver: this.opening === null,
      verb: this.state.verbs.selectedVerb,
      present: this.ambient.present.map((npc) => npc.id),
      targets: this.state.targets.map((target) => target.id),
      duel: this.state.dialogue.inDuel,
      theEnd: this.titleMenu !== null && this.titleTheEnd,
      hovered: this.hovered?.id ?? null,
      card: this.actCard !== null || this.actCardUntil !== null,
      fading: this.roomFade !== null || this.arrivalHold.holding,
      holding: this.arrivalHold.holding,
      loading: this.loadingUp,
      segment: this.playingSegment(),
    };
  }

  /**
   * The room's shipping assets, and whether the RUNTIME has each one.
   *
   * GATE 7. The path half a harness could read out of the room file itself;
   * `loaded` is the half it could not, and it is the half that matters -- a
   * plate that failed to arrive leaves a room drawn out of whatever the
   * renderer falls back to, with the correct path still sitting in the
   * content file saying nothing is wrong.
   *
   * Keyed the way the loader keys them, because the question is whether THAT
   * texture is present, not whether a file of that name exists on a disk the
   * browser cannot see.
   */
  private roomAssets(): { key: string; path: string; drawn: string; candidate: boolean;
    loaded: boolean }[] {
    const room = this.state.room;
    const id = this.state.roomId;
    const out: { key: string; path: string; drawn: string; candidate: boolean;
      loaded: boolean }[] = [];
    // `path` is what the ROOM DECLARES and `drawn` is what was actually
    // loaded. They differ exactly when ruling 10's candidate override is in
    // force, and the proof records the second -- a proof that recorded the
    // declared path while a candidate was on screen would name the wrong
    // picture in its own manifest.
    const swaps = appliedCandidates();
    const add = (key: string, path: string | undefined) => {
      if (!path) return;
      const swap = swaps.find((entry) => entry.from === path);
      out.push({
        key,
        path,
        drawn: swap ? swap.to : path,
        candidate: Boolean(swap),
        loaded: this.textures.exists(key),
      });
    };
    add(`bg:${id}`, room.background);
    add(`fg:${id}`, room.foreground);
    (room.backgroundFrames ?? []).forEach((path, at) => add(`bgf:${id}:${at}`, path));
    for (const plane of room.occlusionPlanes ?? []) add(plane.mask, plane.mask);
    // AMBIENT SHEETS TOO. A room's people are assets the proof has to see
    // loaded: Room 5's Winnie is an ambient, and without this row the proof
    // could pass with her sheet missing and nothing drawn where she stands.
    for (const npc of this.ambient.present) {
      add(npc.sprite?.sheet ?? '', npc.sprite?.sheet);
      // A walker on a loop (AmbientFile.loop) is drawn from its walk sheet.
      if (npc.loop) add(npc.loop.sheet, npc.loop.sheet);
      // And her props' sheets: the ink stand is drawn from its own file.
      for (const prop of npc.sprite?.props ?? []) add(prop.sheet, prop.sheet);
    }
    // STATE IMAGES TOO. Room 5's floorboard has a rest and a pressed picture,
    // each with a night derivation swapped in by the same candidate mechanism
    // the plate uses; a proof that cannot see them cannot say the night board
    // was the one drawn. Every declared state, not just the one showing:
    // the pressed board is an asset of the room whether or not a foot is on it.
    for (const target of this.state.targets) {
      for (const shown of Object.values(target.states ?? {})) {
        // Keyed by path, as the loader keys them: `loaded` asks the texture store.
        if (shown.image) add(shown.image, shown.image);
        for (const alt of Object.values(shown.imageByState ?? {})) add(alt, alt);
      }
    }
    return out;
  }

  /**
   * Where dialogue option `index` is drawn. See Probeable.optionRow.
   *
   * ONE-BASED, as a player counts them and as the gauntlet's `input` writes
   * them. The renderer answers with nothing while an exchange performs, and
   * that is passed straight through rather than worked around: a harness that
   * clicked into a hidden list would be testing the skip path on every run
   * instead of the performance.
   */
  inventorySlot(id: string): { id: string; x: number; y: number; width: number; height: number } | null {
    return this.view.inventoryHitboxes().find((box) => box.id === id) ?? null;
  }

  titleItem(id: string): { id: string; x: number; y: number; width: number; height: number } | null {
    return this.titleMenu && !this.beginCard ? this.view.titleHitboxes(this.titleMenu).find((box) => box.id === id) ?? null : null;
  }

  optionRow(index: number): { id: string; y: number; height: number; shown: boolean } | null {
    if (!this.state.dialogue.isActive) return null;
    const options = this.state.dialogue.presentOptions();
    if (index < 1 || index > options.length) return null;
    return this.view.dialogueHitboxes(options, this.choiceScroll(options))[index - 1] ?? null;
  }

  optionArrow(direction: 'up' | 'down'): { x: number; y: number; width: number; height: number; live: boolean } | null {
    if (!this.state.dialogue.isActive) return null;
    const options = this.state.dialogue.presentOptions();
    const arrow = this.view.dialogueArrows(options, this.choiceScroll(options)).find((one) => one.direction === direction);
    return arrow ? { x: arrow.x, y: arrow.y, width: arrow.width, height: arrow.height, live: arrow.live } : null;
  }

  /**
   * The first option in view, for the list on offer now: back to the top when
   * the list is not the one it was (a new tree, node or set of rows), and
   * clamped to what the rows allow (errata 143).
   */
  private choiceScroll(options = this.state.dialogue.presentOptions()): number {
    const key = `${this.state.dialogue.activeTreeId}/${this.state.dialogue.positionSnapshot().node}/`
      + options.map((each) => `${each.option.id}:${each.selections}`).join(',');
    if (key !== this.optionListKey) {
      this.optionListKey = key;
      this.optionScroll = 0;
    }
    this.optionScroll = this.view.dialogueScroll(options, this.optionScroll);
    return this.optionScroll;
  }

  /** What the list draws this frame: its window, and the row the pointer is on. */
  private choiceViewNow(): ChoiceView {
    const hovered = this.optionUnderPointer();
    this.lastHoveredOption = hovered;
    return { scroll: this.choiceScroll(), hovered };
  }

  /** Moves the list's window by whole options: an arrow, or the wheel. */
  private scrollChoices(by: number): void {
    if (!this.choicesShowing()) return;
    const options = this.state.dialogue.presentOptions();
    const was = this.choiceScroll(options);
    this.optionScroll = this.view.dialogueScroll(options, was + by);
    if (this.optionScroll !== was) this.markDirty();
  }

  /** The option the pointer rests on, if the list is up and the pointer is on a row in view. */
  private optionUnderPointer(): string | null {
    if (!this.pointerAt || !this.choicesShowing()) return null;
    const { x, y } = this.pointerAt;
    const options = this.state.dialogue.presentOptions();
    const scroll = this.choiceScroll(options);
    if (x >= CHOICE_ARROW_X && this.view.dialogueArrows(options, scroll).length > 0) return null;
    return this.view.dialogueHitboxes(options, scroll)
      .find((box) => box.shown && y >= box.y && y < box.y + box.height)?.id ?? null;
  }

  /**
   * THE CONTROL SURFACE. Four named operations, each of which refuses rather
   * than guesses, and every one of which records what it did.
   *
   * See `Controls` in dev/Probe.ts for why it is four and not a setter.
   */
  get controls(): Controls {
    return {
      cast: (on: boolean) => {
        this.view.hideCast(!on);
        this.dirty = true;
        this.controlWrites.push(`cast(${on})`);
      },
      bystanders: (on: boolean) => {
        this.view.hideBystanders(!on);
        this.dirty = true;
        this.controlWrites.push(`bystanders(${on})`);
      },
      stand: (x: number, y: number) => {
        // REFUSED OFF THE FLOOR, and the refusal is the feature. A depth
        // reading taken where no walk box reaches is the scaling curve
        // answering about ground it was never fitted to, and it looks exactly
        // like a reading somebody can quote.
        if (this.state.actorHeightAt(x, y) === null) {
          return { ok: false, why: `${x},${y} is on no walk box of ${this.state.roomId}` };
        }
        this.actor.placeAt(x, y);
        this.dirty = true;
        this.controlWrites.push(`stand(${x},${y})`);
        return { ok: true };
      },
      flags: (values: Record<string, boolean | number>) => {
        const refused: string[] = [];
        for (const [id, value] of Object.entries(values)) {
          if (!this.state.flags.isDefined(id)) { refused.push(id); continue; }
          this.state.flags.set(id, value);
          this.controlWrites.push(`flag ${id}=${value}`);
        }
        this.dirty = true;
        return { ok: refused.length === 0, refused };
      },
      enter: (roomId: string) => {
        if (!this.state.content.rooms.has(roomId)) {
          return { ok: false, why: `no room "${roomId}"` };
        }
        this.state.enterRoom(roomId);
        this.enterRoomPerformance(null);
        this.dirty = true;
        this.controlWrites.push(`enter(${roomId})`);
        return { ok: true };
      },
      writes: () => [...this.controlWrites],
    };
  }

  /** The opening segment now playing, without claiming which beat of it is. */
  private playingSegment(): { kind: string; beats: string[]; carriedBy: string | null } | null {
    const segment = this.opening?.[this.openingAt];
    if (!segment) return null;
    return {
      kind: segment.kind,
      beats: segment.beats.map((beat) => beat.beat),
      carriedBy: segment.carriedBy,
    };
  }

  /** The control of the opening segment now playing, or null once it is over. */
  private openingControl(): string | null {
    if (!this.opening) return null;
    const segment = this.opening[this.openingAt];
    if (!segment) return null;
    return segment.kind === 'automatic' ? 'none' : segment.kind;
  }

  /** Clears anything that referred to the room we are no longer in. */
  /** The act card's turn: queued when ACT rises, shown when the scene is quiet. */
  private watchActTurn(now: number): void {
    const act = Number(this.state.flags.get('ACT') ?? 1);
    if (this.lastAct === null || this.opening || act < this.lastAct) {
      this.lastAct = act;
    } else if (act > this.lastAct) {
      this.lastAct = act;
      const card = this.state.content.actCards.get(act);
      if (card) this.pendingActCard = card;
    }
    if (this.pendingActCard !== null && this.actCardUntil === null && !this.state.dialogue.isActive
      && this.sayingActor === null && this.pendingSay.length === 0 && this.travelAfterSay === null
      && !this.sequence.isRunning && !this.pendingTree) {
      this.actCard = this.pendingActCard;
      this.pendingActCard = null;
      // The opening's card holds its beat's ~3 s plus its reading time (ui.json).
      this.actCardUntil = now + 3 + (this.state.content.ui.timing?.actCardExtraSeconds ?? 0);
      this.markDirty();
    }
    if (this.actCardUntil !== null && now >= this.actCardUntil) {
      this.actCard = null;
      this.actCardUntil = null;
      this.state.autosave();
      this.markDirty();
    }
  }

  /**
   * AN ACT THAT OPENS SOMEWHERE (errata 101 B): once its card is down and
   * nothing is being said, walked, chosen or performed, he is cut to the room
   * and says the line. Waiting for quiet is what keeps the cut from landing
   * in the middle of a scene; a load that still owes it makes it here too.
   */
  private openActWhenQuiet(): void {
    if (this.opening || this.actCard !== null || this.pendingActCard !== null || this.actCardUntil !== null) return;
    if (this.state.dialogue.isActive || this.pendingTree || this.performance !== null || this.sayingActor !== null
      || this.pendingSay.length > 0 || this.travelAfterSay !== null || this.sequence.isRunning) return;
    if (!this.state.actOpeningDue) return;
    const lines = this.state.openAct();
    this.hovered = null;
    this.hoveredName = null;
    this.enterRoomPerformance();
    const who = this.state.content.actor.id;
    this.pendingSay.push(...lines.map((line) => ({ speaker: who, line })));
    this.advanceSay();
    this.markDirty();
  }

  private afterLoad(): void {
    this.lastAct = null;
    this.pendingActCard = null;
    this.actCard = null;
    this.actCardUntil = null;
    this.hovered = null;
    this.hoveredName = null;
    this.sayLines = [];
    this.pendingSay = [];
    this.enterRoomPerformance(null);
  }

  private afterMenu(): void {
    const notice = this.state.menu.takeNotice();
    if (notice) this.showNotice(notice);
    this.markDirty();
  }

  private onMenuClick(y: number): void {
    const hit = this.view.menuHitboxes().find((box) => y >= box.y && y < box.y + box.height);
    if (!hit) return;
    const rows = this.state.menu.rows();
    if (!rows.find((row) => row.id === hit.id)?.enabled) return;

    const action = this.state.menu.select(hit.id);
    // Options › Music takes effect at once, both ways (errata 156).
    if (hit.id === MUSIC_OPTION) this.music.refresh();
    if (action.kind === 'save') {
      this.state.save(action.slot ?? QUICK_SLOT);
    } else if (action.kind === 'load') {
      if (this.state.load(action.slot ?? QUICK_SLOT)) this.afterLoad();
    } else if (action.kind === 'fullscreen') {
      this.toggleFullscreen();
    } else if (action.kind === 'quit') {
      // TO THE TITLE (errata 128; doc 33 table 5): "Title appears without
      // resetting world or deleting any save." CONTINUE there is the autosave.
      this.toTitle();
    }
    // The title's OPTIONS opens the options page alone: its Back is the title.
    if (this.titleMenu && this.state.menu.page === 'root') this.state.menu.close();
    this.afterMenu();
  }

  /**
   * THE TITLE SCREEN (errata 128). Everything the room was doing stops -- its
   * scenes, its lines, its conversation, its clocks -- and the title is drawn
   * instead of it. The state is left as it is: nothing is reset and no save is
   * touched until NEW GAME or CONTINUE says so.
   */
  private toTitle(): void {
    this.performance = null;
    this.pendingTree = null;
    if (this.state.dialogue.isActive) this.state.dialogue.end();
    this.leaveLines();
    this.page = [];
    this.pageAlpha = 1;
    this.endingFrom = null;
    this.overBlack = false;
    this.sequence.cancel();
    this.carried.cancel();
    this.world.abandon();
    this.timeline.stop();
    this.panelHidden = false;
    this.sceneControlsUntil = null;
    this.tuneStart = null;
    this.opening = null;
    this.actCard = null;
    this.actCardUntil = null;
    this.pendingActCard = null;
    this.accostTimer?.remove();
    this.accostTimer = undefined;
    // An arrival still held is let go: the title is drawn, not its black (errata 223).
    if (this.arrivalHold.holding) this.fadeBlack = 0;
    this.arrivalHold.cancel();
    this.accostAfterHold = null;
    this.loadingUp = false;
    this.sfx.stopAll();
    this.state.menu.close();
    this.titleMenu = titleItems(this.state.content.title!, this.state.canContinue);
    this.titleTheEnd = false;
    // Its plate and drawn title, if boot did not fetch them (a review link quit to the title).
    const file = this.state.content.title!;
    let queued = 0;
    for (const path of [file.background, file.logo]) {
      if (!path || this.textures.exists(path)) continue;
      this.load.image(path, new URL(path, document.baseURI).toString());
      this.load.once(`filecomplete-image-${path}`, () => this.markDirty());
      queued += 1;
    }
    if (queued) this.load.start();
    this.titleHover = null;
    this.hovered = null;
    this.hoveredName = null;
    this.applyMusic();
    this.markDirty();
  }

  private onTitleClick(x: number, y: number): void {
    const items = this.titleMenu;
    if (!items) return;
    const hit = this.view.titleHitboxes(items).find((box) => pointInRect(x, y, box));
    const item = hit ? items.find((each) => each.id === hit.id) : undefined;
    if (!item?.enabled) return;
    if (item.id === 'new') {
      // ERRATA 157: not at once. The title fades to black first; `tickEntry`
      // starts the game in the black and lifts it only on a room that is whole.
      if (this.entry === null) this.entry = { phase: 'out', at: this.time.now / 1000 };
    } else if (item.id === 'continue') {
      if (!this.state.load()) return;
      this.titleMenu = null;
      this.musicFinishing = false;
      this.afterLoad();
    } else if (item.id === 'options') {
      this.state.menu.openOn('options');
    }
    this.markDirty();
  }

  /**
   * THE CLOSE, ONCE ITS LINES ARE SAID (errata 128). In a room that ends the
   * game, when nothing is left to say and the room's `blackWhen` holds, the
   * letter's page holds, fades, the screen stays black, and the title returns.
   * The bed is let play out to the end of its loop rather than cut (doc 45).
   * A game loaded after the close has no page, and goes straight to black and
   * the title.
   */
  private tickEnding(now: number): void {
    const room = this.state.room;
    if (!room.endsGame || this.titleMenu) return;
    if (this.endingFrom === null) {
      const quiet = this.sayingActor === null && this.pendingSay.length === 0 && this.sayAt === null
        && this.performance === null && !this.state.dialogue.isActive;
      if (!quiet || !room.blackWhen || !this.state.flags.test(room.blackWhen)) return;
      const timing = this.endingTiming();
      this.endingFrom = this.page.length ? now : now - timing.hold - timing.fade;
      this.state.autosave();
      this.music.finish();
      this.musicFinishing = true;
    }
    const { phase, pageAlpha } = endingAt(now - this.endingFrom, this.endingTiming());
    this.pageAlpha = pageAlpha;
    if (phase === 'title') {
      this.toTitle();
      this.titleTheEnd = true;
    }
    this.markDirty();
  }

  /**
   * THE FADE BETWEEN ROOMS (errata 133): out to black, hold, and in on the
   * next room. The room changes at the start of the hold, in the black, so
   * nothing of the old room's interface -- the held item, the sentence -- is
   * seen to carry over.
   */
  /**
   * THE CUT-AWAYS (errata 158; doc 96; Tyler, 2026-11-07: "You decide, and I
   * want them included now"). Monkey Island's LeChuck scenes: the screen
   * leaves Thad, shows somewhere else, and comes back exactly where it was.
   * One plays once, at the first quiet moment after its `when` holds, with
   * Thad in some other room. Watching it writes its `done` flag and nothing
   * else: the visit is `GameState.cutTo`, not an arrival.
   */
  private tickCutaway(now: number): void {
    const timing = this.state.content.ui.timing;
    const out = timing?.roomFadeOutSeconds ?? 1;
    const up = timing?.roomFadeInSeconds ?? 1.5;
    const limit = timing?.roomReadyLimitSeconds ?? 12;
    const cut = this.cut;
    if (!cut) {
      if (!this.quietForCutaway(now)) return;
      const due = this.state.content.cutaways.find((one) => one.room !== this.state.roomId
        && this.state.flags.test(one.when) && !this.state.flags.test({ [one.done]: true }));
      if (!due) return;
      // Written as it starts, so nothing can play it twice.
      this.state.flags.applyWrites({ [due.done]: true });
      // ERRATA 159-160: its close-up and its opening shot, fetched under the fade.
      let queued = 0;
      for (const path of [...(due.closeup?.frames ?? []), ...(due.establishing ? [due.establishing.image] : [])]) {
        if (this.textures.exists(path) || this.loadFailed.has(path)) continue;
        this.load.image(path, new URL(path, document.baseURI).toString());
        queued += 1;
      }
      // ITS ROOM TOO, under the same fade (errata 242): nothing asked for it until the screen was already black, so the
      // black held for the whole fetch. Nothing is let go here; `loadNear` does that once the cut is made.
      for (const { key, path } of planRoom(this.state.content, due.room)) {
        if (this.textures.exists(key) || this.nearAsked.has(key) || this.loadFailed.has(key)) continue;
        this.load.image(key, new URL(resolveAssetPath(path, askedCandidates()), document.baseURI).toString());
        this.load.once(`filecomplete-image-${key}`, () => this.markDirty());
        this.nearAsked.add(key);
        queued += 1;
      }
      if (queued) this.load.start();
      this.cut = { cutaway: due, phase: 'out', at: now };
      this.markDirty();
      return;
    }
    const t = now - cut.at;
    if (cut.phase === 'out') {
      this.fadeBlack = Math.min(1, t / out);
      if (t >= out) {
        this.fadeBlack = 1;
        cut.back = { x: this.actor.x, y: this.actor.y, facing: this.actor.facing };
        this.state.cutTo(cut.cutaway.room);
        this.showQuietly();
        this.panelHidden = true;
        this.cut = { ...cut, phase: 'black', at: now };
      }
    } else if (cut.phase === 'black') {
      this.fadeBlack = 1;
      const frames = cut.cutaway.closeup?.frames ?? [];
      const shot = cut.cutaway.establishing?.image;
      const wanted = [...frames, ...(shot ? [shot] : [])];
      const settled = wanted.every((path) => this.textures.exists(path) || this.loadFailed.has(path));
      if ((this.roomWhole() && settled) || t >= limit) {
        // The close-up only if every frame of it is here: half a close-up is worse than the room.
        cut.closeup = frames.length > 0 && frames.every((path) => this.textures.exists(path));
        // ERRATA 160: the opening shot first, if it has one and it arrived.
        if (shot && this.textures.exists(shot)) this.cut = { ...cut, phase: 'establish', at: now };
        else this.beginCutawayLines(cut, now, false);
      }
    } else if (cut.phase === 'establish') {
      this.fadeBlack = Math.max(0, 1 - t / up);
      // A HARD CUT inside, as a film does: no fade between the two shots.
      if (t >= (cut.cutaway.establishing?.seconds ?? 0)) this.beginCutawayLines(cut, now, true);
    } else if (cut.phase === 'show') {
      this.fadeBlack = cut.cutIn ? 0 : Math.max(0, 1 - t / up);
      if (t >= up && !this.sequence.isRunning && this.sayLines.length === 0) this.cut = { ...cut, phase: 'leave', at: now };
    } else if (cut.phase === 'leave') {
      this.fadeBlack = Math.min(1, t / out);
      if (t >= out) {
        this.fadeBlack = 1;
        this.setSay(null);
        this.state.cutBack();
        this.showQuietly();
        if (cut.back) {
          this.actor.placeAt(cut.back.x, cut.back.y);
          this.actor.setFacing(cut.back.facing);
        }
        this.panelHidden = this.state.room.interface === 'none';
        this.cut = { ...cut, phase: 'back', at: now };
      }
    } else if (cut.phase === 'back') {
      this.fadeBlack = 1;
      if (this.roomWhole() || t >= limit) this.cut = { ...cut, phase: 'up', at: now };
    } else {
      this.fadeBlack = Math.max(0, 1 - t / up);
      if (t >= up) this.cut = null;
    }
    this.markDirty();
  }

  /** The scene's lines, as a scene: each holds its reading time, Text speed and all. */
  private beginCutawayLines(cut: NonNullable<GameScene['cut']>, now: number, cutIn: boolean): void {
    this.sequence.start([
      { kind: 'wait', seconds: 0.8 },
      ...cut.cutaway.lines.map((spoken) => ({ kind: 'say' as const, actor: spoken.speaker, line: spoken.line })),
      { kind: 'wait', seconds: 1.2 },
    ]);
    this.cut = { ...cut, phase: 'show', at: now, cutIn, showFrom: now };
  }

  /**
   * WHAT A CUT-AWAY SHOWS OVER ITS ROOM (errata 159-160), or null for the
   * room itself. The opening shot, creeping in; or the close-up, creeping in,
   * mid-word while a line is up (swapping as a mouth does), blinking now and
   * then between lines, its lamp breathing.
   */
  private cutawayShot(): ShotFrame | null {
    const cut = this.cut;
    if (!cut || !this.state.inCutaway) return null;
    const now = this.time.now / 1000;
    const ease = (t: number) => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u); };
    if (cut.phase === 'establish' && cut.cutaway.establishing) {
      const shot = cut.cutaway.establishing;
      return { image: shot.image, sx: shot.x, zoom: 1 + shot.push * ease((now - cut.at) / shot.seconds), focus: shot.focus,
        clock: now };
    }
    const close = cut.cutaway.closeup;
    if (!cut.closeup || !close || cut.phase === 'black' || cut.phase === 'out') return null;
    const since = now - (cut.showFrom ?? now);
    const talking = this.sayLines.length > 0 && Math.floor(this.time.now / 160) % 2 === 1;
    // A blink: 0.14 s in every 4.3, never while he is talking.
    const blinking = !talking && this.sayLines.length === 0 && close.frames[2] !== undefined && (since % 4.3) > 4.16;
    const image = talking ? close.frames[1] : blinking ? close.frames[2] : close.frames[0];
    return { image: image ?? close.frames[0]!, sx: 0, zoom: 1 + (close.push ?? 0) * ease(since / (close.pushSeconds ?? 20)),
      focus: close.focus ?? [960, 432], lamp: close.lamp, clock: now };
  }

  /**
   * Nothing is happening that a cut-away would interrupt (errata 158): no
   * title, fade, conversation, scene, line, card, accost or walk, a room
   * with its panel and no clock of its own, and a few seconds since he came in.
   */
  private quietForCutaway(now: number): boolean {
    const room = this.state.room;
    return !this.titleMenu && this.entry === null && this.roomFade === null && !this.arrivalHold.holding && this.opening === null
      && !this.state.dialogue.isActive && !this.pendingTree && !this.state.menu.isOpen
      && !this.sequence.isRunning && !this.carried.isRunning && this.performance === null
      && this.sayLines.length === 0 && this.pendingSay.length === 0 && this.sayAt === null
      && this.actCard === null && this.actCardUntil === null && this.pendingActCard === null
      && this.tuneStart === null && !this.panelHidden && !room.timeline?.length && !room.endsGame
      && room.kind !== 'map' && this.accostTimer === undefined && !this.actor.isWalking
      && this.panning === null && now - (this.arrivedAt ?? 0) >= 3;
  }

  /**
   * A ROOM SHOWN, NOT ENTERED (errata 158): what is drawn and heard changes
   * to the room the state now names, and nothing else does. No arrival lines,
   * no accost, no entry sound, no timeline, no mover cleared or placed:
   * `enterRoomPerformance` is an arrival and a cut-away is not one.
   */
  private showQuietly(): void {
    this.leaveLines();
    this.loadNear();
    this.arrivedAt = this.time.now / 1000;
    this.view.setArrivedAt(this.arrivedAt);
    this.sayAt = null;
    this.ambient.arrived();
    this.musicResumed = false;
    this.applyMusic();
    this.cueBed.play(null);
    this.plate = null;
    this.hovered = null;
    this.hoveredName = null;
  }

  /**
   * NEW GAME'S WAY IN (errata 157; Tyler, 2026-11-07: "It needs something
   * other than an immediate jump from the main menu into Thad starting his
   * first line"). Out: the title under a rising black. Black: the new game
   * starts underneath, and the black holds until Room 1 is whole -- its plate,
   * its sky, its cast -- so nothing arrives in pieces. Up: the opening begins
   * as the black lifts, on the first frame of its pan down from the stars.
   */
  private tickEntry(now: number): void {
    const entry = this.entry;
    if (!entry) return;
    const timing = this.state.content.ui.timing;
    const out = timing?.newGameFadeOutSeconds ?? 1;
    const up = timing?.newGameFadeInSeconds ?? 1.5;
    const t = now - entry.at;
    if (entry.phase === 'out') {
      this.fadeBlack = Math.min(1, t / out);
      if (t >= out) {
        this.fadeBlack = 1;
        this.titleMenu = null;
        this.musicFinishing = false;
        this.state.reset();
        this.lastAct = null;
        this.actor.placeIn(this.state.roomId);
        this.enterRoomPerformance(null);
        this.loadNear();
        this.entry = { phase: 'black', at: now };
      }
    } else if (entry.phase === 'black') {
      this.fadeBlack = 1;
      if (this.roomWhole() || t >= (timing?.roomReadyLimitSeconds ?? 12)) {
        this.beginOpening();
        this.entry = { phase: 'up', at: now };
      }
    } else {
      this.fadeBlack = Math.max(0, 1 - t / up);
      if (t >= up) this.entry = null;
    }
    this.markDirty();
  }

  /**
   * Every picture this room needs to be seen whole has arrived, or failed
   * (errata 157). Asked before a room is shown out of black, so a room never
   * appears in pieces while its sheets stream in.
   */
  private roomWhole(): boolean {
    return planRoom(this.state.content, this.state.roomId)
      .every((asset) => this.textures.exists(asset.key) || this.loadFailed.has(asset.key));
  }

  /** How far above the room the view is during errata 157's pan, in play-area pixels; null when not panning. */
  private panFrame(): { offset: number; sky: string; clock: number } | null {
    const pan = this.panning;
    const sky = this.state.room.sky;
    if (!pan || !sky) return null;
    if (pan.from === null) return { offset: PLAY_HEIGHT, sky, clock: this.time.now / 1000 };
    const t = Math.min(1, Math.max(0, (this.time.now / 1000 - pan.from) / Math.max(0.001, pan.seconds)));
    if (t >= 1) { this.panning = null; return null; }
    // Eased in and out: the camera starts and settles, it does not lurch.
    const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    return { offset: Math.round(PLAY_HEIGHT * (1 - eased)), sky, clock: this.time.now / 1000 };
  }

  private tickRoomFade(now: number): void {
    const fade = this.roomFade;
    if (!fade) return;
    const timing = this.state.content.ui.timing;
    const out = timing?.roomFadeOutSeconds ?? 1;
    const hold = timing?.roomFadeHoldSeconds ?? 1;
    const up = timing?.roomFadeInSeconds ?? 1.5;
    if (fade.enteredAt === null) {
      const t = now - fade.from;
      this.fadeBlack = Math.min(1, t / out);
      if (t >= out) {
        this.fadeBlack = 1;
        this.state.handOn(fade.after);
        this.hovered = null;
        this.hoveredName = null;
        this.enterRoomPerformance();
        // Timed from AFTER the room change: loading the next plate can stall a frame for the whole hold.
        fade.enteredAt = this.time.now / 1000;
      }
    } else if (fade.upFrom === null) {
      this.fadeBlack = 1;
      // HELD IN THE BLACK until the hold is over and the street's plate has arrived, so it fades UP on it.
      // AND THE WHOLE ROOM, not only its plate (errata 157): the cast arriving
      // a beat after the street is the same pieces Tyler saw out of the title.
      const ready = this.roomWhole() || now - fade.enteredAt >= (timing?.roomReadyLimitSeconds ?? 12);
      if (now - fade.enteredAt >= hold && ready) fade.upFrom = now;
    } else {
      const t = now - fade.upFrom;
      this.fadeBlack = Math.max(0, 1 - t / up);
      if (t >= up) this.roomFade = null;
    }
    this.markDirty();
  }

  private endingTiming(): { hold: number; fade: number; black: number } {
    const timing = this.state.content.ui.timing;
    return { hold: timing?.endingHoldSeconds ?? 7, fade: timing?.endingFadeSeconds ?? 3,
      black: timing?.endingBlackSeconds ?? 2 };
  }

  /** Whether this figure may call this line out now: not the line she called out under a minute ago (SaidLately). */
  private mayCallOut(id: string, line: string): boolean {
    return this.saidLately.allow(id, line, this.time.now / 1000);
  }

  /**
   * An ambient character whose break is a shout, shouting.
   *
   * Tyler: the calling-out pose looks odd without a line, and it does -- an
   * open mouth and a raised hand in silence reads as a fault rather than as a
   * pie seller. The words are already written -- doc 07 gives her a line and a
   * variant for every reputation state -- and no line belongs in this file.
   *
   * Fired ONCE as the break begins, tracked by which cycle it was, because the
   * break itself is derived from the clock and would otherwise re-fire on
   * every frame of it. The line comes from the same reputation table the
   * approach bark uses, so what she shouts across the street is what she would
   * have said to his face.
   */
  private speakingBreaks(): void {
    for (const npc of this.ambient.present) {
      const speaks = npc.sprite?.breaksThatSpeak;
      if (!speaks?.length) continue;
      const playing = this.view.ambientBreak(npc);
      if (!playing || playing.step !== 0 || !speaks.includes(playing.index)) continue;
      // ONCE PER BREAK, keyed on the break's cycle (errata 222): a wall-clock second split one break's first
      // frame in two and said the line twice.
      const token = spokenBreakKey(npc.id, playing);
      if (this.spokenBreak === token) continue;
      this.spokenBreak = token;
      // His reputation's bark, or the next of his turns (doc 110's prayer, errata 233).
      const line = this.ambient.breakLine(npc);
      // Not the line she said to his face a moment ago, or will not say again in a moment (SaidLately, errata 242).
      if (line && this.mayCallOut(npc.id, line)) this.showBark(npc.id, line, npc.x, this.barkFoot(npc));
    }
  }

  /**
   * An ambient character whose break makes a sound, making it (sprite.breakCues):
   * the bell-ringer's strike sounds the bell (doc 07 #4; errata 161). Fired once
   * as the break begins, by which cycle it is, as a speaking break is; the
   * cue's own `at` lands it on the frame the blow falls.
   */
  private soundingBreaks(): void {
    for (const npc of this.ambient.present) {
      const cues = npc.sprite?.breakCues;
      if (!cues) continue;
      const playing = this.view.ambientBreak(npc);
      if (!playing || playing.step !== 0) continue;
      const cue = cues[String(playing.index)];
      if (!cue) continue;
      const token = npc.id + ':' + String(Math.floor(this.time.now / 1000));
      if (this.soundedBreak === token) continue;
      this.soundedBreak = token;
      this.fireCue(cue);
    }
  }

  /**
   * The current room's boards, armed from where the feet are now.
   *
   * A board left `pressed` by a save taken inside its 220 ms hold would stay
   * pressed for ever on load, because the hold is a clock and clocks are not
   * saved; so every board is put back to rest on entry, and re-arms from the
   * feet's actual position -- standing on it does not creak, stepping off and
   * back on does.
   */
  private armSteps(): void {
    this.steps = new StepTriggers(this.state.targets, this.actor.x, this.actor.y);
    for (const target of this.state.targets) {
      if (target.step) this.state.setState(target, target.step.rest);
    }
    this.feetBefore = { x: this.actor.x, y: this.actor.y, walking: false };
  }

  /**
   * One tick of the boards: sweep the feet from where they were to where
   * they are, press whatever they crossed, let pressed boards up again.
   */
  private sweepSteps(now: number): void {
    if (!this.steps?.any) return;
    const before = this.feetBefore ?? { x: this.actor.x, y: this.actor.y, walking: false };
    const walking = this.actor.isWalking || before.walking;
    const { fired, changed } = this.steps.update(now * 1000, before.x, before.y, this.actor.x, this.actor.y,
      walking, (target, state) => this.state.setState(target, state));
    this.feetBefore = { x: this.actor.x, y: this.actor.y, walking: this.actor.isWalking };
    for (const event of fired) this.performStep(event);
    if (changed) this.markDirty();
  }

  /** What a pressed board does beyond changing its picture: says its sound, fires its cue. */
  private performStep(event: StepEvent): void {
    const { step, target } = event;
    if (step.cue) this.fireCue(step.cue);
    if (step.caption) {
      const [rx, ry, rw] = target.rect;
      const at = step.captionAt ?? [rx + rw / 2, ry];
      this.showCaption(step.caption, at[0], at[1], step.captionMs ?? 900);
    }
  }

  /**
   * A doc 45 cue, by id. Recorded so a proof can count it; nothing here plays
   * a sound, because nothing in the build can yet (engine/core/Music.ts
   * carries the room score and no SFX), and a cue that is fired and logged is
   * the hook the audio layer will take when it exists.
   */
  /**
   * THE SCORE THE SLATE SHOWS (errata 136 A): the judges' count, and the point
   * being performed once its pencil has gone down -- the exchange lands only
   * when its last line is read, which is after the next boast.
   */
  /** The open node's running total, as two lines (doc 04 SOW_C1; NodeCounter). */
  private nodeCounterLines(): string[] | null {
    const place = this.state.content.ui.nodeCounter;
    const reading = place ? counterReading(this.state.dialogue.currentNode, (id) => this.state.flags.get(id)) : null;
    if (!place || !reading) return null;
    return [`${place.countLabel} ${reading.count}`, `${place.priceLabel} ${place.currency}${priceText(reading.price)}`];
  }

  private slateTally(): { player: number; opponent: number } | null {
    const score = this.state.dialogue.duelScore;
    if (!score) return null;
    const point = this.pointWritten ? this.state.dialogue.pendingExchange?.resolution.duelPoint : undefined;
    return {
      player: score.player + (point === 'player' ? 1 : 0),
      opponent: score.opponent + (point === 'opponent' ? 1 : 0),
    };
  }

  /** Who holds the judges' mark for the beat on now (errata 130 B). */
  private performingPose(): { speaker: string; frame: number | 'mark' } | null {
    const line = this.performance?.current;
    if (!line?.speaker) return null;
    if (line.mark) return { speaker: line.speaker, frame: 'mark' };
    return null;
  }

  /** Who can act a direction here: the figures present, and Thad (doc 95; errata 148). */
  private performers() {
    return performersWith(this.ambient.present, this.state.content.actor);
  }

  /** Which figures hold which frames now: an acted direction, in a conversation or queued (doc 95; errata 141). */
  private heldPoses(): HeldPose[] | null {
    const now = this.performance?.current?.poses ?? this.queuedPoses ?? (this.spokenPose ? [this.spokenPose] : null);
    if (!this.lingering) return now;
    return [...(now ?? []), ...this.lingering.filter((pose) => !now?.some((one) => one.id === pose.id))];
  }

  private fireCue(id: string): void {
    this.cuesFired = { last: id, count: this.cuesFired.count + 1 };
    // Figures that stir on it do (AmbientFile.stirsOn; errata 131 E).
    this.ambient.heard(id);
    // ERRATA 105: the audio layer exists now. A cue with no sound written for
    // it is still counted, and still silent.
    const cue = this.state.content.sounds?.cues[id];
    if (cue && 'bed' in cue) this.cueBed.play(cue.bed ? { src: cue.bed.src, gain: cue.bed.gain } : null);
    if (cue?.duck) this.music.duck(cue.duck.to, cue.duck.seconds, cue.duck.attack, cue.duck.release);
    for (const part of cue?.play ?? []) {
      if (part.at) this.time.delayedCall(part.at * 1000, () => this.sfx.play(part.src, part.gain ?? 1));
      else this.sfx.play(part.src, part.gain ?? 1);
    }
  }

  /**
   * A whole room's sounds, scaled together (errata 106). The coffin's dirt and
   * the listening chamber's taps were rendered loud and played at full gain,
   * up to sixteen decibels over the music; their shape inside the room -- the
   * dirt thinning, the taps deepening toward the void -- is the design, so the
   * room is turned down as one rather than sound by sound.
   */
  private roomSoundGain(): number {
    return this.state.content.sounds?.roomGain?.[this.state.room.id] ?? 1;
  }

  /** The room's background, or none: doc 45's `-A` beds, which carry under the score. */
  private applyAmbience(): void {
    const bed = this.state.room.music === 'suspend' ? undefined
      : this.state.content.sounds?.ambience[this.state.room.id];
    const here = new Set(this.ambient.present.map((each) => each.id));
    this.ambience.play(ambienceFor(bed, here, this.state.dialogue.duelSounding));
  }

  /**
   * The sounds a verb on a target will make (R02-BELL, R05-QUEUE, B3's whistle
   * and the rest), chosen BEFORE it runs: `when` and `item` describe the world
   * as the player acted on it. Which written line was spoken is known only
   * after, so `variants` is checked by the caller.
   */
  private soundsFor(target: Interactable, verb: string): NonNullable<SoundsFile['verbs']> {
    const room = this.state.room.id;
    const held = this.state.heldItem;
    return (this.state.content.sounds?.verbs ?? []).filter((rule) => rule.room === room && rule.target === target.id
      && rule.verb === verb && (!rule.item || rule.item === held)
      && (!rule.when || this.state.flags.test(rule.when as Record<string, boolean>)));
  }

  /** Walking through a door that doc 45 hears: the batwings, the assay office's latch. */
  private soundForTransit(from: string | null): void {
    const to = this.state.room.id;
    if (!from || from === to) return;
    for (const rule of this.state.content.sounds?.transits ?? []) {
      if (rule.between.includes(from) && rule.between.includes(to)) this.fireCue(rule.cue);
    }
  }

  /**
   * A FOOT COMES DOWN (doc 45 section 3.4: "one step event per animation foot
   * plant"). The gait is distance walked, in cycles, so a plant is every half
   * cycle: the sound keeps time with the legs at any speed and any size.
   */
  private footsteps(): void {
    const foot = Math.floor(this.actor.gait * 2);
    if (foot === this.lastFoot) return;
    const first = this.lastFoot < 0;
    this.lastFoot = foot;
    if (first) return;
    const steps = this.state.content.sounds?.footsteps;
    if (!steps) return;
    const underfoot = this.state.surfaceAt(Math.round(this.actor.x), Math.round(this.actor.y));
    const surface = steps.walkBoxSurfaces.includes(underfoot) ? underfoot : steps.rooms[this.state.room.id];
    const takes = surface ? steps.surfaces[surface] : undefined;
    if (!takes?.length) return;
    const last = this.lastTake.get(surface!) ?? -1;
    let take = Math.floor(Math.random() * takes.length);
    if (take === last && takes.length > 1) take = (take + 1) % takes.length;
    this.lastTake.set(surface!, take);
    this.sfx.play(takes[take]!, steps.gain);
  }

  /**
   * A sound written in the world -- CREEEAK over the board -- drawn where the
   * thing that made it is, for a moment, in the bark's outlined face. Not a
   * line: nobody said it, so it never enters the speech channel, the log or
   * the panel, and it clears itself.
   */
  private showCaption(text: string, x: number, y: number, holdMs: number): void {
    this.captionLines = this.font.wrap(text, GameScene.BARK_BLOCK_WIDTH);
    this.captionAt = { x, y };
    this.captionTimer?.remove();
    this.captionTimer = this.time.delayedCall(holdMs, () => {
      this.captionLines = [];
      this.captionAt = null;
      this.markDirty();
    });
    this.markDirty();
  }

  /**
   * Where a bark's last line sits: over the speaker's head as DRAWN, with
   * speech's gap (SPEECH_GAP) above it. It used to be a
   * fixed 180px above the anchor, and the anchor is not always the feet -- a
   * painted man's identity is anchored so its zone height lands on his head --
   * so the card sharp's bark was drawn across his face.
   */
  private barkFoot(npc: AmbientFile): number {
    const drawn = this.view.ambientDrawnTop(npc);
    if (drawn) return Math.round(drawn.top - GameScene.BARK_GAP * drawn.height);
    const height = this.state.heightForZone(npc.zone);
    return Math.round(npc.y - height - GameScene.BARK_GAP * height);
  }

  /**
   * A BARK TWO PEOPLE SAY (AmbientFile.barkExchange; errata 110): each line
   * over its own speaker's head, one after another, each held as a bark is.
   */
  private showBarkExchange(lines: { speaker: string; line: string }[]): void {
    const next = (at: number): void => {
      const one = lines[at];
      if (!one) return;
      const who = this.ambient.present.find((each) => each.id === one.speaker);
      if (who) this.showBark(who.id, one.line, who.x, this.barkFoot(who));
      if (at + 1 < lines.length) this.barkChain = this.time.delayedCall(this.barkMs(), () => next(at + 1));
    };
    this.barkChain?.remove();
    next(0);
  }

  private showBark(speaker: string, line: string, x: number, y: number): void {
    this.barkLines = this.font.wrap(line, GameScene.BARK_BLOCK_WIDTH);
    this.barkAt = { x, y };
    this.barkBy = speaker;
    this.barkTimer?.remove();
    this.barkTimer = this.time.delayedCall(this.barkMs(), () => {
      this.barkLines = [];
      this.barkAt = null;
      this.markDirty();
    });
    this.markDirty();
  }

  private showNotice(text: string | undefined): void {
    this.notice = text ?? null;
    this.noticeTimer?.remove();
    this.noticeTimer = this.time.delayedCall(NOTICE_MS, () => {
      this.notice = null;
      this.markDirty();
    });
    this.markDirty();
  }

  /** Pointer position in native 320x200 space, clamped to the screen. */
  private nativePoint(pointer: Phaser.Input.Pointer): { x: number; y: number } {
    return {
      x: Phaser.Math.Clamp(Math.floor(pointer.worldX), 0, NATIVE_WIDTH - 1),
      y: Phaser.Math.Clamp(Math.floor(pointer.worldY), 0, NATIVE_HEIGHT - 1),
    };
  }
}
