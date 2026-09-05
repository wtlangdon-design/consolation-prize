/**
 * THE PLAYTEST FIXTURE PARAMETER. `?fixture=<id>` starts the game in a named,
 * validated state from the manifest's fixture files -- Room 5's later-act
 * states, for Tyler to play without playing the game up to them. Doc 36 Q111.
 *
 * LIVE IN THE PUBLISHED BUILD, LIKE `?room=`, AND FOR THE SAME REASON (doc
 * 36 Q12): the point is links that work on the deployed site from a
 * Chromebook. It carries the same debt: before release this is gated on
 * import.meta.env.DEV or removed, or every later state is one URL away.
 *
 * It is not a cheat console. It names a fixture; it cannot set a flag, hold
 * an item or pick a room on its own, and a fixture that is not in the
 * manifest is refused with the list of those that are.
 */
export function askedFixture(): string | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('fixture');
  if (value === null) return null;
  if (!/^[a-z][a-z0-9_-]{0,31}$/.test(value)) {
    throw new Error(`?fixture= must be a short lower-case id and this reads "${value}"`);
  }
  return value;
}

/** The save key a fixture session uses, apart from the real game's. */
export const FIXTURE_SAVE_KEY = 'consolation.fixture.v1';
