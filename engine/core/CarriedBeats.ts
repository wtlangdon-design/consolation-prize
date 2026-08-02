import { carriedStepsFor } from './Opening.ts';
import { SequenceRunner, type SequenceHost } from './Sequence.ts';
import type { SequenceBeat } from './types.ts';

/**
 * BEAT 9'S CARRIER. Issue X4's fourth finding: "beat 9 additionally has no
 * carrier -- Hob's crossing is a player-control beat and the opening runner
 * completes before anything schedules it."
 *
 * Doc 17 puts beats 8, 9 and 10 under player control with no `carriedBy`, so
 * `segmentsOf` correctly makes them ONE segment and the scene, on reaching a
 * player segment with no dialogue tree, correctly handed over control -- and
 * then stopped. Beat 9 went with it: Hob's three lines were never delivered,
 * `T_HOB_CROSSING` was never written, and the watchman's lamp hotspot that
 * flag gates could not appear in the game at all. There was no symptom beyond
 * a road with nobody on it, in a game where nobody was on the road anyway.
 *
 * WHAT CARRIES IT. Errata 30b's answer for beats 4 to 6 is a dialogue tree,
 * and that answer does not fit here: doc 17 note 0 says Hob "does not stop
 * walking", note 1 says what he says is not a hint, and the player keeps the
 * verb panel throughout. So the carrier is a SECOND RUNNER that plays
 * alongside the player rather than instead of him -- the panel stays up,
 * every verb works, and Hob crosses the road regardless. That is what doc
 * 17's `yes` in beat 9's interactive column means.
 *
 * IT IS NOT A CUTSCENE AND MAY NOT CONTAIN ONE. Errata 30a fences `wait`
 * inside `control: none` and errata 38 fences `move` the same way;
 * `carriedStepsFor` refuses both, so nothing here can quietly become a
 * cutscene that has taken the panel away without saying so.
 */
export class CarriedBeats {
  private readonly runner = new SequenceRunner();
  private readonly applyWrites: (writes: Record<string, boolean | number>) => void;
  private beats: SequenceBeat[] = [];
  private at = 0;

  constructor(applyWrites: (writes: Record<string, boolean | number>) => void) {
    this.applyWrites = applyWrites;
  }

  get isRunning(): boolean {
    return this.runner.isRunning;
  }

  /** The beat now playing, for anything that needs to know. */
  get current(): SequenceBeat | null {
    return this.beats[this.at] ?? null;
  }

  arm(beats: SequenceBeat[]): void {
    this.beats = [...beats];
    this.at = 0;
    this.play();
  }

  cancel(): void {
    this.runner.cancel();
    this.beats = [];
    this.at = 0;
  }

  update(seconds: number, host: SequenceHost): boolean {
    if (this.beats.length === 0) return false;
    const was = this.runner.isRunning;
    const moved = this.runner.update(seconds, host);
    if (was && !this.runner.isRunning) {
      this.at += 1;
      this.play();
      return true;
    }
    return moved;
  }

  /**
   * The next beat with anything in it.
   *
   * A BEAT'S FLAG WRITES LAND AS IT BEGINS, not when it ends. Doc 17's
   * `T_HOB_CROSSING` means "Hob is on screen", and the hotspot it gates
   * carries written lines about a man who is still crossing -- "Still
   * crossing. He is in no hurry and he is not lost." Writing it after his
   * last line would put the hotspot in the room only once its subject had
   * left it, and the lines would be describing nothing.
   */
  private play(): void {
    while (this.at < this.beats.length) {
      const beat = this.beats[this.at] as SequenceBeat;
      this.applyWrites(beat.set ?? {});
      const steps = carriedStepsFor(beat);
      if (steps.length === 0) {
        this.at += 1;
        continue;
      }
      this.runner.start(steps);
      return;
    }
    this.beats = [];
    this.at = 0;
  }
}
