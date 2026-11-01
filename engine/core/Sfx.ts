/**
 * ONE-SHOT SOUNDS. Doc 45's SFX layer, as small as Room 32 needs: a file,
 * played once, at a gain, over whatever else is playing.
 *
 * Same contract as the beds (Music.ts): A MISSING FILE IS SILENCE, NOT AN
 * ERROR, and nothing plays before a gesture has unlocked audio -- a sound due
 * before then is dropped rather than queued, because a shovelful of dirt that
 * lands thirty seconds late is a different scene.
 *
 * Each play gets its own element so overlapping one-shots do not cut each
 * other off. They are short and released when they end.
 */
export class Sfx {
  private readonly missing = new Set<string>();
  /** What is still ringing, so SKIP SCENE can cut it. */
  private readonly live = new Set<HTMLAudioElement>();

  constructor(private readonly enabled: () => boolean, private readonly unlocked: () => boolean) {}

  play(src: string, gain = 1): void {
    if (!this.enabled() || !this.unlocked() || this.missing.has(src)) return;
    if (typeof Audio === 'undefined') return;
    const element = new Audio(src);
    element.volume = Math.max(0, Math.min(1, gain));
    element.addEventListener('error', () => this.missing.add(src));
    element.addEventListener('ended', () => this.live.delete(element));
    this.live.add(element);
    void element.play().catch(() => this.missing.add(src));
  }

  /** Cuts every one-shot still playing. */
  stopAll(): void {
    for (const element of this.live) element.pause();
    this.live.clear();
  }
}
