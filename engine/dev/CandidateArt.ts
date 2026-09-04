/**
 * LOADING A STAGED CANDIDATE INTO THE LIVE RUNTIME. Tyler's ruling 10.
 *
 * The candidate-art lifecycle is:
 *
 *   GENERATED -> STAGED -> TECHNICAL GATES PASS -> CANDIDATE
 *     -> CANDIDATE LOADED INTO LIVE RUNTIME -> FOUR-PANEL FULL-FRAME PROOF
 *     -> TYLER visual_accepted=true -> PROMOTED TO SHIPPING
 *
 * The proof comes BEFORE acceptance, which means a staged candidate has to be
 * loadable into the real runtime while it is still staged. Without that the
 * order collapses into promote-then-look, and promotion is the one step that
 * writes over approved art.
 *
 * SO THE OVERRIDE IS A URL PARAMETER AND NOTHING ELSE:
 *
 *   ?candidate=art/backgrounds/room-05-assay-office.png=art/staging/room-05/plate-03.png
 *
 * Repeatable. Left of the inner `=` is the content path a room declares; right
 * of it is the staged file to draw instead.
 *
 * WHY A URL PARAMETER RATHER THAN A FILE. Every other mechanism -- a swap
 * file, a copy into place, an entry in a config -- has a moment where the tree
 * on disk is not the tree in git, and a proof taken in that moment records a
 * commit that does not describe what was drawn. A query parameter exists for
 * one page load and is gone when the tab closes. "The override disappears
 * after the proof run" is then a property of the mechanism rather than a
 * cleanup step somebody has to remember.
 *
 * FOUR REFUSALS, and each one is a way this could quietly lie:
 *
 * 1. A target outside `art/staging/` is refused. The override may only point
 *    AT a candidate, never at another shipping asset -- and it can never write
 *    anywhere at all, because it only ever renames a URL.
 * 2. A malformed parameter throws instead of being skipped. A typo that
 *    silently drew the shipping plate would produce a proof of the wrong
 *    picture that looks exactly like a proof of the right one.
 * 3. `applied()` reports what was actually substituted, so the harness can
 *    assert the candidate was really used rather than trusting that asking
 *    was enough.
 * 4. Nothing here falls back. If the candidate URL fails to load, its texture
 *    is simply absent and the room draws without it -- which the proof detects
 *    as an unloaded asset and fails on. There is no `catch` that reaches for
 *    the shipping file.
 *
 * A CANDIDATE IS NOT AN APPROVAL. Nothing in this file, and nothing that reads
 * it, may set or imply `visual_accepted`. That is Tyler's field and a picture
 * being loadable says nothing about whether it is any good.
 */

const STAGING = 'art/staging/';

export interface CandidateSwap {
  /** The path a room declares. */
  readonly from: string;
  /** The staged file drawn in its place. */
  readonly to: string;
}

let applied: CandidateSwap[] = [];

/** Parse `?candidate=` from the current location. Dev-only; null in tests. */
export function askedCandidates(): CandidateSwap[] {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams(window.location.search);
  const out: CandidateSwap[] = [];
  for (const raw of params.getAll('candidate')) {
    const at = raw.indexOf('=');
    if (at <= 0 || at === raw.length - 1) {
      throw new Error(`?candidate= must read from=to and this reads "${raw}". A candidate `
        + 'override that were skipped for being malformed would draw the shipping plate and '
        + 'call the result a proof of the candidate.');
    }
    const from = raw.slice(0, at);
    const to = raw.slice(at + 1);
    if (!to.startsWith(STAGING)) {
      throw new Error(`?candidate= may only point at a staged file, and "${to}" is not under `
        + `${STAGING}. A candidate is by definition not shipping art.`);
    }
    out.push({ from, to });
  }
  return out;
}

/**
 * The path to actually load for a declared content path.
 *
 * Called at the ONE place a content path becomes a URL, so nothing can load a
 * plate by a route this does not see.
 */
export function resolveAssetPath(path: string, swaps: readonly CandidateSwap[]): string {
  const swap = swaps.find((entry) => entry.from === path);
  if (!swap) return path;
  if (!applied.some((entry) => entry.from === swap.from && entry.to === swap.to)) {
    applied = [...applied, swap];
  }
  return swap.to;
}

/** What was actually substituted this run. Read by the probe. */
export function appliedCandidates(): readonly CandidateSwap[] {
  return applied;
}

/** Tests only. */
export function resetAppliedCandidates(): void {
  applied = [];
}
