/**
 * `?objects=<id>=<state>,<id>=<state>` -- open a room with named objects in
 * named states. A playtest and proof aid in the family of `?state=` and
 * `?fixture=` (doc 36 Q117): the Nugget's stove has an authored OUT state
 * that nothing in Act I triggers yet, and Main Street's sign and notices have
 * Act III states behind an ACT counter no script can reach today. A reviewer
 * still has to see them. The states named must exist on the objects; anything
 * else is ignored with a warning, never guessed.
 */
export function askedObjectStates(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const value = new URLSearchParams(window.location.search).get('objects');
  if (!value) return {};
  const asked: Record<string, string> = {};
  for (const pair of value.split(',')) {
    const [id, state] = pair.split('=');
    if (!id || !state || !/^[a-z][a-z0-9_-]{0,31}$/.test(id) || !/^[a-z][a-z0-9_-]{0,31}$/.test(state)) {
      console.warn(`?objects: "${pair}" is not <id>=<state>; ignored`);
      continue;
    }
    asked[id] = state;
  }
  return asked;
}
