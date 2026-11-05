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
  return idFromQuery(window.location.search, 'fixture');
}

/**
 * A SHORT LOWER-CASE ID FROM THE QUERY, FORGIVING OF WHAT A LINK PICKS UP.
 *
 * It used to throw on anything else, and the throw came out of the scene's
 * `create`, so the game never drew a frame: Tyler opened Room 11's dinner
 * from a chat message whose link ran on into the em dash after it
 * (`?fixture=r11-b—`) and got a black screen that never cleared (2026-11-05).
 * A link pasted from prose often carries the next character with it. So the
 * leading id is taken and the rest is reported; a value with no id at its
 * start is reported and ignored. A bad link now starts the game, never stops it.
 */
export function idFromQuery(search: string, key: string): string | null {
  const value = new URLSearchParams(search).get(key);
  if (value === null || value === '') return null;
  const id = /^[a-z][a-z0-9_-]{0,31}/.exec(value)?.[0] ?? null;
  if (id === null) {
    console.warn(`?${key}= must start with a short lower-case id and this reads "${value}"; ignored`);
  } else if (id !== value) {
    console.warn(`?${key}= reads "${value}"; using "${id}" and ignoring the rest`);
  }
  return id;
}

/** The save key a fixture session uses, apart from the real game's. */
export const FIXTURE_SAVE_KEY = 'consolation.fixture.v1';
