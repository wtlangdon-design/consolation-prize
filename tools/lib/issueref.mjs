import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from './content.mjs';

/**
 * QUALIFIED ISSUE REFERENCES. Tyler's ruling, and it came from a real defect.
 *
 * `docs/36-issue-list.md` accumulated TWO numbering series. Q11 through Q21
 * each appear twice, and so does Q37, because entries were appended in two
 * sittings and the second restarted the count. Historical numbering stays as
 * it is -- renumbering canon ids to suit a tool is exactly backwards -- so the
 * ambiguity is permanent and the fix has to be on the reference side.
 *
 * A BARE "Q16" IS THEREFORE MEANINGLESS IN A MACHINE RECORD. It named the
 * panel layout and it named a broken validator, and a ledger row blocked on
 * "Q16" could not say which. Worse, it read as resolvable: `/^Q\d+$/` passed
 * it, so the ledger looked checked.
 *
 * THE FORMAT IS PATH + HEADING:
 *
 *   docs/36-issue-list.md::Q18 · THE IMAGE API PATH HAS NEVER BEEN CALLED
 *
 * RESOLUTION IS EXACT-OR-UNIQUE-PREFIX, and the distinction matters. Headings
 * gain status suffixes as work lands -- "-- **FIXED**", "-- **CLOSED**" -- and
 * a strictly exact match would break every reference the moment an issue was
 * resolved, which trains people to loosen the check. A prefix that matches
 * exactly ONE heading is unambiguous by construction; a prefix that matches
 * two is refused and names both. That is the property being asserted, and it
 * is stronger than exactness because it survives the document being edited.
 */

const REF = /^([^:]+\.md)::(.+)$/s;

/** Every ATX heading in a markdown file, in order, with its line number. */
function headings(relPath) {
  const full = resolve(ROOT, relPath);
  if (!existsSync(full)) return null;
  const out = [];
  const lines = readFileSync(full, 'utf8').split('\n');
  lines.forEach((line, index) => {
    const found = /^#{1,6}\s+(.*?)\s*$/.exec(line);
    if (found) out.push({ text: found[1], line: index + 1 });
  });
  return out;
}

export function isQualified(reference) {
  return REF.test(String(reference));
}

/**
 * Resolve a qualified reference.
 *
 * @returns {{ok: true, path, heading, line}} or {{ok: false, why}}
 */
export function resolveIssueRef(reference) {
  const found = REF.exec(String(reference));
  if (!found) {
    return {
      ok: false,
      why: `"${reference}" is not a qualified reference. docs/36-issue-list.md carries two `
        + 'Q-number series, so a bare Q id names two different issues. Write '
        + 'path.md::Exact Heading.',
    };
  }
  const [, path, raw] = found;
  const all = headings(path);
  if (all === null) return { ok: false, why: `${path} does not exist` };

  // AN OCCURRENCE SELECTOR, because some headings are genuinely repeated and
  // renumbering canon is not on the table. `docs/05-examine-layer.md` carries
  // "ROOM 5 — ASSAY OFFICE, FRONT" twice: once for the room's own examine
  // layer and once, 1200 lines later, in the act-variant section. Both are
  // correct and neither may be renamed to suit a tool, so a reference to
  // either says which:
  //
  //   docs/05-examine-layer.md::ROOM 5 — ASSAY OFFICE, FRONT#2
  //
  // Without the suffix a repeated heading stays AMBIGUOUS and is refused,
  // which is the safe default: an unqualified reference silently taking the
  // first match would read the wrong section and cite the right-looking name.
  const chosen = /^(.*)#(\d+)$/s.exec(raw);
  const wanted = chosen ? chosen[1] : raw;
  const occurrence = chosen ? Number(chosen[2]) : null;

  const exact = all.filter((entry) => entry.text === wanted);
  if (occurrence !== null) {
    if (exact.length === 0) return { ok: false, why: `${path} has no heading "${wanted}"` };
    if (occurrence < 1 || occurrence > exact.length) {
      return {
        ok: false,
        why: `${path} has ${exact.length} heading(s) reading "${wanted}" and #${occurrence} `
          + 'is not one of them',
      };
    }
    const at = exact[occurrence - 1];
    return { ok: true, path, heading: at.text, line: at.line, occurrence };
  }
  if (exact.length === 1) return { ok: true, path, heading: exact[0].text, line: exact[0].line };
  if (exact.length > 1) {
    return {
      ok: false,
      why: `${path} has ${exact.length} headings reading exactly "${wanted}" `
        + `(lines ${exact.map((entry) => entry.line).join(', ')}). Say which with a #N `
        + `suffix, e.g. "${wanted}#1".`,
    };
  }

  const prefixed = all.filter((entry) => entry.text.startsWith(wanted));
  if (prefixed.length === 1) {
    return { ok: true, path, heading: prefixed[0].text, line: prefixed[0].line };
  }
  if (prefixed.length === 0) {
    return { ok: false, why: `${path} has no heading beginning "${wanted}"` };
  }
  return {
    ok: false,
    why: `"${wanted}" is AMBIGUOUS in ${path} -- ${prefixed.length} headings begin with it: `
      + prefixed.map((entry) => `line ${entry.line} "${entry.text}"`).join('; ')
      + '. Extend the reference until it names one.',
  };
}
