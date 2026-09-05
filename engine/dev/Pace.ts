/**
 * `?pace=` -- a DEV-ONLY multiplier on the protagonist's walking speed, so
 * three paces can be felt in the live game on one build without any of them
 * being shipped as a decision. Tyler's global Thad audit (2026-09-04) asked
 * for A / B / C candidates chosen by feel from a runtime comparison, not from
 * constants; this is the knob that comparison turns. Absent, the multiplier is
 * exactly 1 and the build is bit-identical in behaviour to one without it.
 * Nothing in content or in a room may set it.
 */
export function askedPace(): number {
  if (typeof window === 'undefined') return 1;
  const raw = new URLSearchParams(window.location.search).get('pace');
  if (raw === null) return 1;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > 4) {
    throw new Error(`?pace= must be a number in (0, 4] and this reads "${raw}"`);
  }
  return value;
}
