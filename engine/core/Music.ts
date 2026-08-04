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

export interface MusicTrack {
  /** The file, relative to the site root. */
  src: string;
  /** Bed volume, 0..1. Doc 28's rooms differ in orchestration AND in level. */
  gain?: number;
}

type Voice = { element: HTMLAudioElement; gain: number };

export class Music {
  private ctx: AudioContext | null = null;
  private playing: Voice | null = null;
  private wanted: MusicTrack | null = null;
  /** Set once a gesture has unlocked playback. */
  private unlocked = false;
  private readonly cache = new Map<string, HTMLAudioElement>();
  private readonly missing = new Set<string>();

  constructor(private readonly enabled: () => boolean) {}

  /**
   * Call from any real user gesture. Harmless to call repeatedly.
   *
   * The first click in the game is the one that matters and it is usually
   * NEW GAME, which is the same gesture doc 45 has O-01-M handing off at --
   * so on the web the title theme begins at the moment the sheet has it
   * ending. Recorded rather than hidden.
   */
  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    void this.ctx?.resume();
    if (this.wanted) this.play(this.wanted);
  }

  /** Requests a bed. Idempotent: asking for the one already playing is free. */
  play(track: MusicTrack | null): void {
    this.wanted = track;
    if (!track) {
      this.fadeOut();
      return;
    }
    if (!this.unlocked || !this.enabled()) return;
    if (this.missing.has(track.src)) return;
    if (this.playing && this.playing.element.dataset.src === track.src) return;

    const element = this.element(track.src);
    if (!element) return;
    this.fadeOut();
    element.loop = true;
    element.volume = 0;
    const target = track.gain ?? 1;
    void element.play().then(() => this.fadeIn(element, target)).catch(() => {
      // Autoplay refused, or the file is not there. Either way: silence, and
      // the request is still remembered, so a later gesture retries it.
      this.missing.add(track.src);
    });
    this.playing = { element, gain: target };
  }

  /** Stops everything, immediately. For a hard cut such as quitting to menu. */
  stop(): void {
    this.wanted = null;
    if (!this.playing) return;
    this.playing.element.pause();
    this.playing = null;
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
    const step = (): void => {
      const t = Math.min(1, (Date.now() - started) / (CROSSFADE_SECONDS * 1000));
      element.volume = Math.max(0, Math.min(1, t * target));
      if (t < 1) requestAnimationFrame(step);
    };
    step();
  }

  private fadeOut(): void {
    const voice = this.playing;
    if (!voice) return;
    this.playing = null;
    const from = voice.element.volume;
    const started = Date.now();
    const step = (): void => {
      const t = Math.min(1, (Date.now() - started) / (CROSSFADE_SECONDS * 1000));
      voice.element.volume = Math.max(0, from * (1 - t));
      if (t < 1) { requestAnimationFrame(step); return; }
      voice.element.pause();
      voice.element.currentTime = 0;
    };
    step();
  }
}
