import type {
  CombinationsFile, Interactable, ResponseRule, SpokenLine, VerbFallbacksFile, VerbsFile,
} from './types.ts';
import type { FlagStore } from './FlagStore.ts';
import { flagEffects } from './Commit.ts';
import type { DurableEffect } from './runtime-types.ts';

export interface ResolvedAction {
  say: string | null;
  /**
   * Which of the rule's written lines `say` is, from 1: the establishing line,
   * then each repeat variant, holding at the last. Doc 45 ties some sounds to
   * a variant (R01-SIGN-1/2 creak; R01-SIGN-3, the sign has stopped, is silent).
   * Absent when no rule matched.
   */
  variant?: number;
  /**
   * Doc 30 §5's further utterances: the rest of what he says the first time,
   * spoken one after another after `say`. Only on the FIRST selection -- a
   * repeat variant is one line by design and a punchline does not want
   * re-delivering every time the player clicks.
   */
  then?: SpokenLine[];
  /** Who speaks `say`, when it is not the actor (a pair rule's `by`). */
  by?: string;
  /** `say` is a stage direction (doc 58). */
  direction?: boolean;
  dialogue: string | null;
  goto: string | null;
  /** Doc 22 item 9: the state this response moves the object to. */
  state?: string;
  /** Ownership passes to the actor. */
  take?: boolean;
  /**
   * A container's contents, if this response opens one. Separate from `take`:
   * `take` transfers the hotspot's own `item` and there is exactly one of it,
   * where a container hands over several and contributes none of itself.
   */
  items?: string[];
  /**
   * Items GIVEN by the object, which stays where it is: a payment rather than
   * a pickup (a pair rule's `items`, doc 57 A8's fee). No ownership passes.
   */
  grants?: string[];
  /**
   * The flag writes this response WOULD make, reserved rather than applied.
   *
   * Doc 34 section 1.2's second defect: "Item/verb resolution writes flags
   * during resolveWith()/resolve()". They are described here and committed by
   * whoever owns the transaction, in section 9.1's phase order.
   *
   * Only flags. Object state, ownership and the room are on the fields above,
   * because turning them into effects needs the room key and the target's
   * item, and this class knows neither -- GameState does, and it is the one
   * that reserves the bundle.
   */
  effects: readonly DurableEffect[];
}

/**
 * Selected verb + clicked target -> action lookup.
 *
 * An unhandled combination draws from the target's own fallback pool rather
 * than a shared refusal line, per the technical spec. The pool rotates so a
 * repeated combination does not repeat the same line.
 */
export class VerbSystem {
  private readonly verbLabels = new Map<string, string>();
  private fallbackCursor = new Map<string, number>();
  private repeatCursor = new Map<string, number>();
  private selected: string | null;
  private poolCursor = new Map<string, number>();
  private readonly file: VerbsFile;
  private readonly flags: FlagStore;
  private readonly pools: Record<string, string[]>;
  private readonly combinations: CombinationsFile | undefined;

  /**
   * WHETHER A CANONICAL PUZZLE IS COMPLETE, for a rule's `afterPuzzles`. The
   * game state answers from its puzzle progress; a VerbSystem built without
   * one answers no, so no puzzle-gated line plays by accident.
   */
  reached: (puzzle: string) => boolean = () => false;

  constructor(
    file: VerbsFile, flags: FlagStore, fallbacks?: VerbFallbacksFile,
    combinations?: CombinationsFile,
  ) {
    this.file = file;
    this.flags = flags;
    this.pools = fallbacks?.pools ?? {};
    this.combinations = combinations;
    for (const verb of file.verbs) {
      this.verbLabels.set(verb.id, verb.label);
    }
    this.verbLabels.set(file.walkVerb.id, file.walkVerb.label);
    // ERRATA 28b: nothing is selected until the player selects something.
    // With a verb always pre-selected there is no "no verb" state, and the
    // ruling's third row -- left click on an object with no verb selected
    // fires the object's own defaultVerb -- could never happen.
    this.selected = null;
  }

  get verbs(): VerbsFile['verbs'] {
    return this.file.verbs;
  }

  get grid(): VerbsFile['grid'] {
    return this.file.grid;
  }

  get selectedVerb(): string | null {
    return this.selected;
  }

  /**
   * The verb a click on this target performs. Errata 28b's table, in one
   * function so the scene cannot implement half of it.
   *
   * `secondary` is the right button: the object's own default, whatever is
   * selected. Otherwise the selection wins, and with nothing selected the
   * object's default answers -- falling back to the verbs file's default for
   * an object that has not declared one, which check-default-verbs reports.
   */
  verbFor(target: Interactable | undefined, secondary = false): string {
    const fallback = target?.defaultVerb ?? this.file.defaultVerb;
    if (secondary) return fallback;
    return this.selected ?? fallback;
  }

  get walkVerbId(): string {
    return this.file.walkVerb.id;
  }

  /** True if this verb goes through a doorway rather than asking about one. */
  isTransit(verbId: string): boolean {
    return (this.file.transitVerbs ?? [this.file.walkVerb.id]).includes(verbId);
  }

  /**
   * True if this verb asks a question about an inventory item rather than
   * picking it up to use. LOOK and LISTEN are the two, and they are named in
   * content because everything else about a verb is.
   */
  examines(verbId: string): boolean {
    return (this.file.examineVerbs ?? []).includes(verbId);
  }

  /**
   * True if this verb picks an inventory item UP to apply it to something
   * else, rather than resolving on the item where it stands.
   *
   * THE PANEL USED TO ASK `examines` AND TREAT EVERY OTHER ANSWER AS "HOLD
   * IT". LOOK and LISTEN answered; the other seven silently became a request
   * to carry the item, so OPEN THE LETTER produced no response of any kind and
   * the only way to get an answer out of an item was to click it and then
   * click Thad. That is the interface reading as broken, and it is one
   * inverted question: the small set is the one that CARRIES, not the one that
   * answers.
   */
  carries(verbId: string): boolean {
    return (this.file.carryVerbs ?? []).includes(verbId);
  }

  /**
   * A verb applied WITH an item TO a target. Doc 24's three tiers, resolved
   * most specific first.
   *
   *   1. the authored pair for this item on this target;
   *   2. this item's own pool, rotating;
   *   3. the global pool, rotating.
   *
   * It deliberately never reaches the TARGET's own override. "On what." is
   * written as the answer to USE THE MUD and it is not the answer to USE THE
   * TUNING FORK ON THE MUD -- a held item makes a different sentence, so it
   * gets a different table.
   *
   * RULE 4. A pair that exists with no written line returns NOTHING rather
   * than falling to a pool. Doc 24 note 4: a combination that should do
   * something and has none is reported as unwritten, and a pool line standing
   * in for it is a gap that reads as content. check-combinations fails the
   * build on one, so this branch should be unreachable in a shipped build --
   * it is here so that if it ever is reached, it is obvious.
   *
   * PURE as of step B. The precedence above is untouched -- doc 34 section 8
   * lists it among the things that are already right -- and the only change is
   * that `pair.set` comes back as a reserved effect instead of being written
   * on the way past.
   */
  resolveWith(
    verbId: string, itemId: string, target: Interactable, roomId: string,
    carried: readonly string[] = [],
  ): ResolvedAction {
    const table = this.combinations;
    // AN EVIDENCE PAIR IS NOT ANSWERED HERE. A pair that `opens` a tree (C5's
    // log on Winnie) is the scene's walk-and-open while it is live
    // (GameState.evidencePairFor), and once it is not, "the pair yields to the
    // ordinary pools" (its own note, doc 36 Q113). Found here it answered with
    // nothing at all, because it has no line of its own (errata 140).
    const pair = table?.pairs.find(
      (candidate) => candidate.item === itemId
        && candidate.room === roomId
        && candidate.target === target.id
        && !candidate.opens,
    );
    // THE FIRST CASE WHOSE CIRCUMSTANCES HOLD (CombinationPair.rules).
    const rule = pair?.rules?.find((one) => this.flags.test(one.when)
      && (one.holds ?? []).every((item) => carried.includes(item)));
    if (pair && rule) {
      const prefix = `with/${roomId}/${target.id}/${itemId}`;
      return {
        say: rule.say,
        ...(rule.by ? { by: rule.by } : {}),
        ...(rule.direction ? { direction: true } : {}),
        ...(rule.then?.length ? { then: rule.then } : {}),
        dialogue: null,
        goto: rule.goto ?? null,
        ...(rule.items?.length ? { grants: rule.items } : {}),
        effects: [
          ...(rule.takes ?? []).map((item, n) => ({ id: `${prefix}#takes${n}:${item}`,
            kind: 'inventoryRemove' as const, item })),
          ...flagEffects(prefix, rule.set, rule.add),
          ...(rule.completes
            ? [{ id: `${prefix}#complete:${rule.completes}`, kind: 'puzzleProgress' as const,
              puzzle: rule.completes, status: 'complete' as const }]
            : []),
        ],
      };
    }
    // A PAIR THAT IS ONLY CASES (doc 57 F5's counter) says nothing of its own
    // when none holds: the item's pool answers, as if there were no pair.
    // ERRATA 124 (the fairness audit, A7): that holds for EVERY pair of cases.
    // Their pair-level `say` is a copy of the first case's success line, and
    // spoken out of state it told the player he had paid Ozymandia when
    // nothing was taken. Only a pair with no cases speaks its own `say` here.
    if (pair && pair.otherwise !== 'pool' && !pair.rules?.length) {
      return {
        say: pair.say ?? null,
        dialogue: null,
        goto: null,
        state: pair.setState,
        effects: flagEffects(`with/${roomId}/${target.id}/${itemId}`, pair.set),
      };
    }
    // ANY OTHER ITEM, TO ONE PERSON OR THING (doc 109, THE LOOKOUT · GIVE anything else): after a pair, before the
    // area's lines and the item's own pool. Only the items with no pair of their own here reach it.
    const other = table?.targetPools?.find((one) => one.room === roomId && one.target === target.id
      && (one.verb === undefined || one.verb === verbId) && !(one.except ?? []).includes(itemId));
    if (other?.lines.length) {
      return { say: this.rotate(`target:${roomId}/${target.id}`, other.lines), dialogue: null, goto: null, effects: [] };
    }
    // AN ITEM'S LINES FOR A PLACE (doc 108, THE MINE · WRONG ANSWERS, ANYWHERE IN IT): after a pair, before the
    // item's own pool -- the brass rod and the fork, anywhere in the mine's four rooms, said in turn across them.
    const area = table?.areaPools?.find((one) => one.item === itemId && one.rooms.includes(roomId));
    if (area?.lines.length) {
      return { say: this.rotate(`area:${area.id}`, area.lines), dialogue: null, goto: null, effects: [] };
    }
    const own = table?.itemPools[itemId];
    if (own?.length) {
      return { say: this.rotate(`item:${itemId}`, own), dialogue: null, goto: null, effects: [] };
    }
    const global = table?.globalPool ?? [];
    if (global.length) {
      return { say: this.rotate('combination', global), dialogue: null, goto: null, effects: [] };
    }
    return { say: null, dialogue: null, goto: null, effects: [] };
  }

  /**
   * The next line of a pool, in order, wrapping.
   *
   * Order rather than random, which is doc 13's rule for the verb pools and
   * doc 24's for the item pools: it gives never-repeat-consecutively for free
   * and it is deterministic, so a save and a test see the same sequence.
   */
  private rotate(key: string, pool: string[]): string | null {
    const cursor = this.poolCursor.get(key) ?? 0;
    this.poolCursor.set(key, cursor + 1);
    return pool[cursor % pool.length] ?? null;
  }

  selectVerb(id: string): void {
    if (!this.verbLabels.has(id)) {
      throw new Error(`Unknown verb: ${id}`);
    }
    this.selected = id;
  }

  /** Back to nothing selected. A verb otherwise persists until changed. */
  resetToDefault(): void {
    this.selected = null;
  }

  labelFor(verbId: string): string {
    const label = this.verbLabels.get(verbId);
    if (label === undefined) {
      throw new Error(`Unknown verb: ${verbId}`);
    }
    return label;
  }

  /**
   * `scope` disambiguates two targets that share an id.
   *
   * Two rooms can legitimately name an exit the same thing -- Room 5 and
   * Room 7 both have a THE STREET DOOR with the id `back_to_street`, which
   * doc 25 gave them and which is the natural name in both. Keyed on the id
   * alone they shared one repeat cursor, so walking out of the assay office
   * advanced the registrar's door and the two rooms handed each other lines.
   *
   * Found by driving the second room rather than by reading the first: with
   * one room in the game the key was unique and the bug did not exist yet.
   *
   * PURE as of step B, in the sense doc 34 section 9.1 defines: it leaves
   * flags, room, objects, inventory, ownership and dialogue counts
   * byte-identical. What it does still advance is the LINE CURSORS, and that
   * is deliberate --
   *
   *   the chosen line IS the resolution. Doc 05's repeat variants and doc
   *   13's rotating pools are content selected here and nowhere else; a
   *   cursor is not durable, never reaches a save file, and is not in section
   *   9.1's list. Deferring it to commit would mean the inventory-examine
   *   path in the scene, which resolves a line and commits nothing, showed
   *   the establishing line forever and the written variants never appeared.
   *
   * The contract that keeps that honest is one resolve per interaction. There
   * is no speculative resolution anywhere in the engine, and adding one would
   * silently spend a written line.
   */
  resolve(verbId: string, target: Interactable, scope = ''): ResolvedAction {
    const rules = target.responses?.[verbId];
    const index = rules?.findIndex((rule: ResponseRule) => this.flags.test(rule.when)
      && (rule.afterPuzzles ?? []).every((puzzle) => this.reached(puzzle))
      && !(rule.untilPuzzles ?? []).some((puzzle) => this.reached(puzzle))) ?? -1;
    const matched = index >= 0 ? rules?.[index] : undefined;

    if (matched) {
      // FIRST SELECTION ONLY. Read BEFORE `nextLine`, which advances the
      // cursor: read after it, as this once was, zero was never seen and a
      // hotspot's `then` lines were never spoken -- Room 19's Act IV letter
      // arrived as its first line alone (tests/room-19.test.ts). A punchline
      // does not want re-delivering every time the player clicks; the repeat
      // variants are what the second look is for.
      const seen = this.repeatCursor.get(`${scope}/${target.id}#${index}:${verbId}`) ?? 0;
      const first = seen === 0;
      const written = [matched.say, ...(matched.repeat ?? [])].filter((line) => typeof line === 'string').length;
      return {
        ...(written ? { variant: Math.min(seen, written - 1) + 1 } : {}),
        say: this.nextLine(`${scope}/${target.id}#${index}`, verbId, matched),
        then: first ? matched.then : undefined,
        ...(matched.by ? { by: matched.by } : {}),
        // `direction` describes `say`, the first of the written lines, and not its repeats (doc 110: the
        // undertaker's "(low)" leads his first answer; his second time is a line, said).
        ...(matched.direction && (!written || seen === 0 || !(matched.repeat?.length)) ? { direction: true } : {}),
        dialogue: matched.dialogue ?? null,
        goto: matched.goto ?? null,
        state: matched.setState,
        take: matched.take,
        items: matched.items,
        // GIVEN, AND THE SOURCE STAYS (errata 85 F): a jar of eggs off the
        // shelf, a photograph from a drawer of forty. `items` takes its
        // source with it, as Room 1's case is taken; these are not taken.
        ...(matched.grants?.length ? { grants: matched.grants } : {}),
        effects: [
          ...flagEffects(`act/${scope}/${target.id}/${verbId}#${index}`, matched.set, matched.add),
          ...(matched.completes
            ? [{ id: `act/${scope}/${target.id}/${verbId}#${index}#complete:${matched.completes}`,
              kind: 'puzzleProgress' as const, puzzle: matched.completes, status: 'complete' as const }]
            : []),
        ],
      };
    }

    // Nothing written for this combination. Three sources, most specific
    // first. Doc 13 note 4: an object override fires the same line every
    // time; a pool rotates. Two different behaviours, both deliberate.
    const override = target.overrides?.[verbId];
    if (override) {
      return { say: override, dialogue: null, goto: null, effects: [] };
    }
    return {
      say: this.nextFallback(target) ?? this.nextFromPool(verbId),
      dialogue: null,
      goto: null,
      effects: [],
    };
  }

  /**
   * The line for this selection: the written one first, then the repeat
   * variants in order, and then the last one holds. It does NOT wrap: a
   * player who looks a fourth time gets the third line again rather than
   * being walked back to the establishing one, which would read as the
   * object resetting. Doc 05 is explicit that Room 2 needs three minimum,
   * because it is the screen the player reads most.
   */
  private nextLine(targetId: string, verbId: string, rule: ResponseRule): string | null {
    // targetId carries the matched RULE INDEX, so a ruling 19a state change
    // gets its own cursor. Keyed on the target alone, looking at the letter
    // twice before Pike dies and once after handed the player the third
    // after-state line first -- the quiet one about his father, out of order
    // and as a punchline.
    const variants = [rule.say, ...(rule.repeat ?? [])].filter(
      (line): line is string => typeof line === 'string',
    );
    if (variants.length === 0) return null;
    const key = `${targetId}:${verbId}`;
    const cursor = this.repeatCursor.get(key) ?? 0;
    this.repeatCursor.set(key, cursor + 1);
    return variants[Math.min(cursor, variants.length - 1)] ?? null;
  }

  /**
   * Global pool for a verb, rotated in order so a line never follows itself.
   * Order rather than random: repeat-avoidance for free, and deterministic.
   */
  private nextFromPool(verbId: string): string | null {
    const pool = this.pools[verbId];
    if (!pool || pool.length === 0) return null;
    return this.rotate(verbId, pool);
  }

  private nextFallback(target: Interactable): string | null {
    const pool = target.fallback;
    if (!pool || pool.length === 0) return null;
    const cursor = this.fallbackCursor.get(target.id) ?? 0;
    this.fallbackCursor.set(target.id, cursor + 1);
    return pool[cursor % pool.length] ?? null;
  }
}
