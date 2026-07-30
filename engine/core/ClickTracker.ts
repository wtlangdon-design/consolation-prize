export const DOUBLE_CLICK_MS = 300;

export interface ClickRecord {
  targetId: string | null;
  at: number;
}

export const NO_CLICK: ClickRecord = { targetId: null, at: 0 };

/**
 * Double-click detection for the walk verb.
 *
 * A double-click is two rapid clicks on *the same target*. Timing alone is
 * not enough: choosing a verb and then immediately clicking a hotspot is the
 * normal way to play, and if that reads as a double-click the game silently
 * walks instead of applying the verb the player just picked.
 */
export function isDoubleClick(
  last: ClickRecord,
  targetId: string | undefined,
  now: number,
  threshold: number = DOUBLE_CLICK_MS,
): boolean {
  if (targetId === undefined) return false;
  if (last.targetId !== targetId) return false;
  return now - last.at < threshold;
}

export function recordClick(targetId: string | undefined, now: number): ClickRecord {
  return { targetId: targetId ?? null, at: now };
}
