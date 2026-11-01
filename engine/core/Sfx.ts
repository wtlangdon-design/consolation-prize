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

  constructor(private readonly enabled: () => boolean, private readonly unlocked: () => boolean) {}

  play(src: string, gain = 1): void {
    if (!this.enabled() || !this.unlocked() || this.missing.has(src)) return;
    if (typeof Audio === 'undefined') return;
    const element = new Audio(src);
    element.volume = Math.max(0, Math.min(1, gain));
    element.addEventListener('error', () => this.missing.add(src));
    void element.play().catch(() => this.missing.add(src));
  }
}
