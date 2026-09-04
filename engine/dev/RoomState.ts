/**
 * THE ROOM'S VISUAL STATE, DEV-ONLY. Errata 64d: time of day is an authored
 * story/world visual state, never a clock. The mechanism that selects a
 * room's visual state from canonical flags is Q26's and does not exist yet;
 * until it does, the proofs select a state the same way they select a
 * candidate plate -- with a URL parameter that lives for one page load and
 * writes nothing anywhere:
 *
 *   ?state=night
 *
 * What reads it today: a room lamp's `amountByState`. Nothing else. No
 * state named means every lamp draws its plain `amount`, which is the day.
 */
export function askedState(): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('state');
  if (value === null) return null;
  if (!/^[a-z][a-z0-9_-]{0,31}$/.test(value)) {
    throw new Error(`?state= must be a short lower-case name and this reads "${value}"`);
  }
  return value;
}
