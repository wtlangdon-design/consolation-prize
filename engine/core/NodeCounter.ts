import type { DialogueNode, FlagValue } from './types.ts';

/**
 * WHAT A NODE'S RUNNING TOTAL READS NOW (doc 04 SOW_C1; errata 75, 189), or null when the open
 * node keeps none. The count is the counter flag; the price is `perUnit` times it until the
 * negotiation is settled (`stopsOn`), when it stops at `minimum`. Nothing here knows whose
 * funeral it is: the node carries the figures, extracted from the documents.
 */
export function counterReading(
  node: DialogueNode | null | undefined,
  flag: (id: string) => FlagValue,
): { count: number; price: number; stopped: boolean } | null {
  const spec = node?.counter;
  if (!spec) return null;
  const value = flag(spec.counter);
  const count = typeof value === 'number' ? value : 0;
  const stopped = flag(spec.stopsOn) === true;
  return { count, price: stopped ? spec.minimum : count * spec.perUnit, stopped };
}

/** A price as the counter shows it: whole dollars bare, anything else to the cent. */
export function priceText(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}
