/**
 * THE MUSIC BED. One track at a time, looped, crossfaded between.
 *
 * Doc 45's cue sheet asks for a great deal more than this -- layered stems,
 * bar-boundary crossfades, stride-phase SFX loops, one-shots on beats -- and
 * none of that is here. This is the spine: a room names a bed, the bed loops,
 * and changing rooms crossfades. `O-01-M` on the title and `R02-M` on Main
 * Street are both exactly this shape, and everything else in the sheet layers
 * ON TOP of a bed rather than replacing one.
 *
 * ERRATA 28a STRUCK `sound` AND `musicTransition` FROM THE SEQUENCE RUNNER,
 * and this does not reinstate them. Nothing here is beat-driven; a bed follows
 * the ROOM, which needs no new step kind. Beat-timed cues -- O-06-S1's case
 * impact, O-09-M's three harmonica notes -- do need that ruling reversed, and
 * that is Tyler's rather than an implementation detail.
 *
 * A BROWSER WILL NOT PLAY AUDIO BEFORE A GESTURE, and the cue sheet has
 * `O-01-M` starting cold on the title screen with the gesture -- Start -- as
 * the thing it hands OFF at. The two cannot both be true on the web. Resolved
 * the only way that is honest: the bed is requested whenever the game wants
 * one, and if the context is still locked the request is REMEMBERED and
 * started by the first click anywhere. A player who presses nothing hears
 * nothing, which is the platform's ruling and not ours.
 *
 * A MISSING FILE IS SILENCE, NOT AN ERROR. No music has been written yet --
 * THADDEUS does not exist, and CONSOLATION exists only as the synthesised
 * proof, which errata 49 rules out as a delivery method. So every path here
 * has to survive the file not being there, and the game has to run in silence
 * without a console full of failures. The day a stem lands it plays and
 * nothing else changes.
 */

const CROSSFADE_SECONDS = 2.0;

export interface MusicLayer {
  /** The file, relative to the site root. */
  src: string;
  /** Volume, 0..1. Doc 28's rooms differ in orchestration AND in level. */
  gain?: number;
}

/**
 * A bed, and anything that plays WITH it (errata 103). A layer is its own loop
 * at its own length, started with the bed and never re-synced to it: doc 28's
 * pairs are things that do not share a clock -- a piano heard from down the
 * road under a fiddle, one theme coming round under another that does not
 * know it is there, a bell tolling under a tune.
 */
export interface MusicTrack extends MusicLayer {
  layers?: MusicLayer[];
  /**
   * ERRATA 160: played this much slower and lower than written, on top of the
   * score's detune -- the Company's theme darkened under Fanshawe's scene.
   * Omitted: as written.
   */
  rate?: number;
}

type Voice = { element: HTMLAudioElement; gain: number; rate: number };

/** Two requests are the same bed when the bed, its layers and its rate are. */
const keyOf = (track: MusicTrack): string =>
  [track.src, ...(track.layers ?? []).map((l) => l.src)].join('|') + (track.rate && track.rate !== 1 ? `@${track.rate}` : '');

import { rateForTune } from './Listening.ts';

export class Music {
  private ctx: AudioContext | null = null;
  private playing: Voice[] | null = null;
  private playingKey: string | null = null;
  private wanted: MusicTrack | null = null;
  /** Set once a gesture has unlocked playback. */
  private unlocked = false;
  private readonly cache = new Map<string, HTMLAudioElement>();
  private readonly missing = new Set<string>();
  /** A bed stopped dead by `suspend`, and where it was. */
  private suspended: { voices: { element: HTMLAudioElement; gain: number; position: number }[]; key: string | null } | null = null;

  /**
   * How far the bed is ducked under a featured sound, 0..1 (errata 107). Every
   * volume this player sets is its gain times this, so a duck holds through a
   * crossfade and a resume.
   */
  private level = 1;
  private duckTimer: ReturnType<typeof setTimeout> | null = null;

  /** How far into tune the score is: 0 is the -35 cents it is rendered at, 1 is in tune. */
  private tune = 0;

  // A plain field, not a parameter property: node's type-stripping (the test
  // runner) cannot run parameter properties, and the room-music test loads this.
  private readonly enabled: () => boolean;

  constructor(enabled: () => boolean) {
    this.enabled = enabled;
  }

  /**
   * INVARIANT 5: the score is detuned by -35 cents for the whole game and, in
   * Room 33, comes into tune over ninety seconds (doc 45 R33-TUNE). The beds
   * are rendered at -35, so in tune is a playback rate of +35 cents with the
   * pitch carried by the rate. The rate is the one parameter.
   */
  setTune(fraction: number): void {
    this.tune = Math.max(0, Math.min(1, fraction));
    for (const voice of this.playing ?? []) this.applyTune(voice.element, voice.rate);
  }

  private applyTune(element: HTMLAudioElement, rate = 1): void {
    (element as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = false;
    element.playbackRate = rateForTune(this.tune) * rate;
  }

  /**
   * Call from any real user gesture. Harmless to call repeatedly.
   *
   * The first click in the game is the one that matters and it is usually
   * NEW GAME, which is the same gesture doc 45 has O-01-M handing off at --
   * so on the web the title theme begins at the moment the sheet has it
   * ending. Recorded rather than hidden.
   */
  /**
   * The bed actually sounding, by its files, or null: what the probe reports.
   * A voice the browser refused to play (no gesture yet) is paused again once
   * its play() rejects, so a requested bed that is not heard reads as null.
   */
  get bed(): string | null {
    return this.playing?.some((voice) => !voice.element.paused) ? this.playingKey : null;
  }

  unlock(): void {
    if (this.unlocked) {
      // EVERY CLICK RETRIES A BED THAT IS WANTED AND SILENT (Tyler, 2026-11-07, on his Chromebook: "The music
      // still wasn't working on the main menu screen but it worked when the sky came up"). A refused or
      // interrupted play() used to file the bed as missing for the rest of the page's life, so the title's
      // music never came back; it is only missing when the file is (the element's own `error`).
      if (this.wanted && !this.suspended && this.enabled() && this.bed === null) {
        this.playing = null;
        this.playingKey = null;
        this.play(this.wanted);
      }
      return;
    }
    this.unlocked = true;
    void this.ctx?.resume();
    if (this.wanted) this.play(this.wanted);
  }

  /**
   * The switch changed (Options › Music, errata 156): off fades the bed out at
   * once; on starts the bed this room wants. A suspended bed (the coffin) is
   * left to `resume`, and a bed playing out to its end (the close) is not
   * restarted, because it is no longer wanted.
   */
  refresh(): void {
    if (this.suspended) return;
    if (!this.enabled()) { this.fadeOut(); return; }
    if (this.wanted) this.play(this.wanted);
  }

  /** Requests a bed. Idempotent: asking for the one already playing is free. */
  play(track: MusicTrack | null): void {
    // Nothing starts over a suspended bed; the return is `resume`'s alone.
    if (this.suspended) return;
    this.wanted = track;
    // OFF IS SILENCE NOW (errata 156): with the switch off the bed fades out,
    // and the request is kept so `refresh` can bring it back. Before, an off
    // switch only refused to START a bed, so the one already playing played on.
    if (!track || !this.enabled()) {
      this.fadeOut();
      return;
    }
    // FETCHED BEFORE THE CLICK: the bed the title wants starts downloading at boot, so the click that unlocks
    // sound finds it ready rather than four megabytes away on a Chromebook's wifi.
    if (!this.unlocked) {
      for (const part of [track, ...(track.layers ?? [])]) this.element(part.src);
      return;
    }
    if (this.missing.has(track.src)) return;
    const key = keyOf(track);
    if (this.playing && this.playingKey === key) return;

    const parts = [track, ...(track.layers ?? [])]
      .filter((part) => !this.missing.has(part.src))
      .map((part) => ({ part, element: this.element(part.src) }));
    // A file in both the old bed and the new one (a piano heard in two
    // neighboring rooms, say) carries on where it was instead of being
    // faded out and restarted under itself.
    this.fadeOut(new Set(parts.map(({ element }) => element).filter((e): e is HTMLAudioElement => e !== null)));
    const voices: Voice[] = [];
    // A PART JOINING ONE ALREADY PLAYING JOINS IT IN TIME (errata 116). The
    // tuned piano replaces the untuned one under the fiddler, who plays on:
    // started at 0, the new piano would be bars away from his fiddle. A new
    // part the same length as one carried on starts where that one is.
    const carried = parts.map(({ element }) => element)
      .find((e): e is HTMLAudioElement => e !== null && !e.paused);
    for (const { part, element } of parts) {
      if (!element) continue;
      element.loop = true;
      if (element.paused) {
        element.volume = 0;
        const sameLength = carried && Number.isFinite(carried.duration) && Number.isFinite(element.duration)
          && Math.abs(carried.duration - element.duration) < 0.05;
        element.currentTime = sameLength ? carried.currentTime % element.duration : 0;
      }
      this.applyTune(element, track.rate ?? 1);
      const target = part.gain ?? 1;
      void element.play().then(() => this.fadeIn(element, target)).catch(() => {
        // Autoplay refused, or the play interrupted. NOT a missing file: that is the element's own `error`
        // event (element()). The request is still remembered, and the next click retries it (unlock).
        if (this.playingKey === key) {
          this.playing = null;
          this.playingKey = null;
        }
      });
      voices.push({ element, gain: target, rate: track.rate ?? 1 });
    }
    if (!voices.length) return;
    this.playing = voices;
    this.playingKey = key;
  }

  /**
   * DOC 45 R32-MUTE: the lid closes and the score stops dead -- not a fade --
   * with its playhead carried silently. Nothing else may start while it is
   * suspended: a room change into the coffin must not crossfade to anything.
   */
  suspend(): void {
    if (this.suspended) return;
    const voices = this.playing ?? [];
    this.suspended = {
      voices: voices.map((voice) => ({ element: voice.element, gain: voice.gain, position: voice.element.currentTime })),
      key: this.playingKey,
    };
    for (const voice of voices) voice.element.pause();
    this.playing = null;
    this.playingKey = null;
  }

  /** Whether a gesture has unlocked audio; the one-shots share the answer. */
  /**
   * Where the playing bed is, in seconds into its file, or null when nothing
   * is sounding (locked, missing, suspended, silent). The clock a figure that
   * keeps time with the music is drawn by (errata 118).
   */
  position(): number | null {
    const first = this.playing?.[0]?.element;
    if (!this.unlocked || !first || first.paused) return null;
    return this.loopClock.read(first, first.currentTime, first.duration);
  }

  /** Counts the bed's loops, so `position()` runs on past the file's end. */
  private readonly loopClock = new LoopClock();

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  get isSuspended(): boolean {
    return this.suspended !== null;
  }

  /**
   * DOC 45 R32-RETURN: "a hard return mid-phrase at the playhead position the
   * score would have reached". `elapsedSeconds` is the active time the bed was
   * down; the bed loops, so the position wraps at its length. No fade in: the
   * return is the point, and doc 28 Part Four says it tells the player how
   * long they were down there.
   */
  resume(elapsedSeconds: number): void {
    const held = this.suspended;
    this.suspended = null;
    if (!held?.voices.length) return;
    // Every layer returns where IT would have been: each loops at its own length.
    for (const voice of held.voices) {
      const length = Number.isFinite(voice.element.duration) && voice.element.duration > 0
        ? voice.element.duration : 0;
      const position = voice.position + elapsedSeconds;
      voice.element.currentTime = length ? position % length : 0;
      voice.element.volume = voice.gain * this.level;
      void voice.element.play().catch(() => undefined);
    }
    this.playing = held.voices.map((voice) => ({ element: voice.element, gain: voice.gain, rate: voice.element.playbackRate / rateForTune(this.tune) }));
    this.playingKey = held.key;
  }

  /**
   * DUCKS THE BED UNDER A SOUND THAT IS THE POINT (Tyler, 2026-11-06: "The
   * bell is hard to hear over the music"). Down to `to` over `attack`
   * seconds, held for `seconds`, back over `release`. A second duck while one
   * is held extends it.
   *
   * THE DIP MUST LAND BEFORE THE SOUND (Tyler, again: "the music dips too
   * late"). It was a quarter second down, started with the strike, so the
   * bell's attack -- the moment that says BELL -- landed on music still at
   * full level. The default attack is now 80 ms, and the cue delays its sound
   * past it (`at`).
   */
  duck(to: number, seconds: number, attack = 0.08, release = 2.0): void {
    this.rampLevel(Math.max(0, Math.min(1, to)), attack);
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.duckTimer = setTimeout(() => {
      this.duckTimer = null;
      this.rampLevel(1, release);
    }, (attack + seconds) * 1000);
  }

  private rampLevel(to: number, seconds: number): void {
    const from = this.level;
    const started = Date.now();
    const step = (): void => {
      const t = Math.min(1, (Date.now() - started) / (seconds * 1000));
      this.level = from + (to - from) * t;
      for (const voice of this.playing ?? []) voice.element.volume = Math.max(0, Math.min(1, voice.gain * this.level));
      if (t < 1 && typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(step);
      else if (t < 1) setTimeout(step, 16);
    };
    step();
  }

  /**
   * THE CLOSE (errata 128; doc 45: the close governs, and nothing extends it).
   * The bed stops looping and plays to the end of its file -- a loop is whole
   * bars -- and stops there. Nothing replaces it; a later `play` takes over
   * as usual.
   */
  finish(): void {
    this.wanted = null;
    for (const voice of this.playing ?? []) voice.element.loop = false;
  }

  /** Stops everything, immediately. For a hard cut such as quitting to menu. */
  stop(): void {
    this.wanted = null;
    for (const voice of this.playing ?? []) voice.element.pause();
    this.playing = null;
    this.playingKey = null;
  }

  private element(src: string): HTMLAudioElement | null {
    const cached = this.cache.get(src);
    if (cached) return cached;
    if (typeof Audio === 'undefined') return null;
    const element = new Audio(src);
    element.dataset.src = src;
    element.preload = 'auto';
    element.addEventListener('error', () => this.missing.add(src));
    this.cache.set(src, element);
    return element;
  }

  /**
   * Ramped on the element's own volume rather than through a GainNode.
   *
   * A WebAudio graph would be the better instrument and it is what the layered
   * half of doc 45 will need -- but it also needs every element routed through
   * a MediaElementSource, and an element may only be routed ONCE for the life
   * of the page. Building that here would fix a shape the layered work has to
   * choose freely later. A two-second volume ramp is a crossfade a listener
   * cannot tell from the real thing, and it costs nothing to replace.
   */
  private fadeIn(element: HTMLAudioElement, target: number): void {
    const started = Date.now();
    const from = element.volume;
    const step = (): void => {
      const t = Math.min(1, (Date.now() - started) / (CROSSFADE_SECONDS * 1000));
      element.volume = Math.max(0, Math.min(1, from + t * (target * this.level - from)));
      if (t < 1) requestAnimationFrame(step);
    };
    step();
  }

  private fadeOut(keep: ReadonlySet<HTMLAudioElement> = new Set()): void {
    const voices = this.playing;
    if (!voices) return;
    this.playing = null;
    this.playingKey = null;
    for (const voice of voices) {
      if (keep.has(voice.element)) continue;
      const from = voice.element.volume;
      const started = Date.now();
      const step = (): void => {
        // Taken back up by a later bed before it finished fading: leave it be.
        if (this.playing?.some((v) => v.element === voice.element)) return;
        const t = Math.min(1, (Date.now() - started) / (CROSSFADE_SECONDS * 1000));
        voice.element.volume = Math.max(0, from * (1 - t));
        if (t < 1) { requestAnimationFrame(step); return; }
        voice.element.pause();
        voice.element.currentTime = 0;
      };
      step();
    }
  }
}

/**
 * A LOOPING BED'S TIME, CONTINUOUS ACROSS ITS LOOPS. `currentTime` wraps to 0
 * at the file's end; a figure that keeps time with the music (errata 118)
 * reads breaks every N bars from this clock, and a bed whose loop is not a
 * multiple of N bars -- the Nugget's piano is 16 bars, the fiddler's breaks
 * twelve -- restarted his schedule at every wrap, an extra break four bars
 * after the last (found by review on #182; errata 119). This adds a loop's
 * length each time the position goes backwards, and starts again from the
 * file's own time when the bed changes.
 */
export class LoopClock {
  private source: unknown = null;
  private last = 0;
  private loops = 0;

  read(source: unknown, currentTime: number, duration: number): number {
    if (source !== this.source) {
      this.source = source;
      this.loops = 0;
      this.last = currentTime;
    }
    if (!Number.isFinite(duration) || duration <= 0) return currentTime;
    // A wrap, not a small step back: the position fell by more than half the file.
    if (currentTime < this.last - duration / 2) this.loops += 1;
    this.last = currentTime;
    return this.loops * duration + currentTime;
  }
}
