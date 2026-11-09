import { FlagStore } from './FlagStore.ts';
import type { SaveFile } from './SaveManager.ts';
import type { FlagsFile, SaveMigration, SaveMigrationRule } from './types.ts';

/**
 * AN OLD SAVE IS BROUGHT FORWARD, NOT THROWN AWAY (errata 218).
 *
 * When the design changes under a saved game, the save can hold a state the
 * new design never produces -- a puzzle complete without the item it now
 * gives, a flag written by a scene that now ends somewhere else -- and the
 * player is stuck where nothing tells him so. A save written before the
 * change carries the version it was written under; on load, each migration
 * from that version up to the current one is applied in turn, and each of its
 * rules, in order, rewrites the save when its conditions hold.
 *
 * The rules are content (content/save-migrations.json): which flags, puzzles
 * and items a design change left stranded is a fact about the game, and the
 * engine knows nothing about the game. A save already at the current version
 * is returned untouched, and so is a fixture, which never passes through here.
 */
export function migrateSave(save: SaveFile, migrations: SaveMigration[], flagsFile: FlagsFile, current: number): SaveFile {
  if (save.version >= current) return save;
  let migrated: SaveFile = {
    ...save,
    inventory: [...save.inventory],
    flags: { ...save.flags },
    puzzles: { ...(save.puzzles ?? {}) },
  };
  for (let version = save.version; version < current; version += 1) {
    const step = migrations.find((one) => one.from === version);
    for (const rule of step?.rules ?? []) migrated = applyRule(migrated, rule, flagsFile);
  }
  migrated.version = current;
  return migrated;
}

/** Whether a rule's conditions hold for the save as it stands. */
export function ruleHolds(save: SaveFile, rule: SaveMigrationRule, flagsFile: FlagsFile): boolean {
  const flags = new FlagStore(flagsFile);
  flags.restore(save.flags);
  if (!flags.test(rule.when)) return false;
  for (const [puzzle, wanted] of Object.entries(rule.puzzles ?? {})) {
    const complete = save.puzzles?.[puzzle] === 'complete';
    if ((wanted === 'complete') !== complete) return false;
  }
  if ((rule.holds ?? []).some((item) => !save.inventory.includes(item))) return false;
  if ((rule.lacks ?? []).some((item) => save.inventory.includes(item))) return false;
  return true;
}

function applyRule(save: SaveFile, rule: SaveMigrationRule, flagsFile: FlagsFile): SaveFile {
  if (!ruleHolds(save, rule, flagsFile)) return save;
  const flags = new FlagStore(flagsFile);
  flags.restore(save.flags);
  flags.applyWrites(rule.set);
  const puzzles = { ...(save.puzzles ?? {}) };
  for (const puzzle of rule.withdraws ?? []) delete puzzles[puzzle];
  const inventory = [...save.inventory, ...(rule.gives ?? []).filter((item) => !save.inventory.includes(item))];
  return {
    ...save,
    flags: flags.snapshot(),
    puzzles,
    inventory,
    ...(rule.closesDialogue ? { dialoguePosition: { tree: null, node: null }, duel: null } : {}),
  };
}
