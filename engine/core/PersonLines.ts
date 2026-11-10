import type { AmbientFile, Interactable, ResponseRule, RoomFile } from './types.ts';

/** A line someone answers with, said after his: who says it and what. */
export interface Answer { speaker: string; line: string }

/**
 * THE ROOM'S LINES FOR A PERSON, AS A THING HE WALKS UP TO AND IS ANSWERED BY (errata 192).
 *
 * Doc 54's per-room overrides for a person -- any verb, and TALK TO too for a person with no tree to open --
 * resolve as an object's lines do: `say` the first time, each `repeat` in order after, the last holding (the
 * selection count is the verb system's cursor, kept on the returned target's id). What makes them a person's:
 *
 *   * HE WALKS UP FIRST, FOR TALK TO. That target carries the figure's `walkTo`, so the scene's staged chain walks
 *     him to where a conversation with her stands before the line, as a tree's TALK TO does. Without it he answered
 *     from across the hole. A verb done with his hands (`handsOn`: anything but an examine verb) walks him up too
 *     (errata 248: he pushed the Colonel through his door from across the street). LOOK and LISTEN answer from
 *     where he stands, as they always have.
 *   * SHE ANSWERS. TALK TO on a figure with no tree is a greeting, and her answer is her bark for the current
 *     reputation (`barkLines`), said after his line every time, in her own voice: read from her file, never typed
 *     again (doc 04's "her only line" stays literally true). Any other verb is his alone.
 *
 * Null when the room writes nothing for this person and verb that holds now (`test`), or when TALK TO should open
 * the person's tree instead.
 */
export function personLines(
  room: RoomFile, npc: AmbientFile, verb: string, test: (when: ResponseRule['when']) => boolean,
  hitBox: [number, number, number, number], barkLines: (npc: AmbientFile) => Answer[],
  handsOn = false,
): { target: Interactable; answer: Answer[] } | null {
  const rules = room.peopleResponses?.[npc.id]?.[verb]?.filter((rule) => test(rule.when));
  if (!rules?.length) return null;
  if (verb === 'TALK_TO' && npc.tree) return null;
  const target: Interactable = {
    id: `${npc.id}@${room.id}`, name: npc.name, rect: hitBox, colour: 0,
    responses: { [verb]: rules },
    ...((verb === 'TALK_TO' || handsOn) && npc.walkTo ? { walkTo: npc.walkTo } : {}),
  } as Interactable;
  const answer = verb === 'TALK_TO' && !npc.tree
    ? barkLines(npc).map((one) => ({ speaker: one.speaker === npc.id ? (npc.speaksAs ?? npc.id) : one.speaker, line: one.line }))
    : [];
  return { target, answer };
}
