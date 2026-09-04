/**
 * A ONE-PASS SCANNER FOR TypeScript SOURCE, tracking quote state and bracket
 * depth TOGETHER. Doc 36 Q11, closed.
 *
 * WHAT IT REPLACES AND WHY THAT WAS BROKEN. `check-no-content-in-code` used
 * `source.replace(/Error\(([\s\S]*?)\)/g, 'Error()')` to drop developer text
 * before scanning for prose. The match is LAZY, so an error message carrying
 * brackets of its own --
 *
 *     throw new Error(`No declared clip "${clip}" (${facing}) for mover ...`);
 *
 * -- ends at the `)` inside `(${facing})`, which leaves the rest of the
 * template AND A DANGLING BACKTICK in the scanned source. The next template
 * literal added anywhere later in the file becomes that backtick's accidental
 * partner, and everything between them reads as one enormous prose string.
 *
 * The check then blames a line that has been correct for weeks, immediately
 * after an unrelated edit six hundred lines away. It happened, it was recorded
 * as Q11, and the standing workaround was to write string concatenation in
 * `GameScene.speakingBreaks` where a template literal would have read better.
 *
 * WHY `String.replace` COULD NOT BE FIXED IN PLACE: a replacement cannot
 * remove text beyond its own match, so counting brackets inside the replacer
 * is not enough. A first attempt did exactly that, stopped stripping error
 * messages altogether, produced 37 false positives -- every one a legitimate
 * throw -- and was reverted rather than shipped half-working. Q11 names the
 * real fix as a scanner that walks the source once tracking bracket depth and
 * quote state together. This is that scanner.
 *
 * EACH STATIC CHUNK OF A TEMPLATE IS ITS OWN LITERAL, deliberately. A template
 * is not one string: `` `${a} and then a whole clause of prose ${b}` `` holds
 * two chunks with an expression between them, and stitching them back into one
 * string would invent adjacency the source does not have. Prose is detected
 * per chunk, which is stricter where it matters -- a sentence hiding after an
 * interpolation is still a sentence -- and never merges two innocent fragments
 * into one guilty-looking one.
 */

/** Calls whose arguments are developer text: thrown, logged, never drawn. */
const DEVELOPER_CALLS = [
  /(?:^|[^\w$.])Error$/,
  /(?:^|[^\w$.])console\.\w+$/,
  // Doc 44's violation log. Named exactly so it cannot become a general
  // purpose way to smuggle a drawn string past the check.
  /(?:^|[^\w$.])watch\.record$/,
  // Doc 34 section 4.6's illegal-state guards. Programming-error messages,
  // folded out of the production bundle entirely.
  /(?:^|[^\w$.])assert[A-Za-z]*$/,
];

/** After one of these, a `/` opens a regex literal rather than dividing. */
const BEFORE_REGEX =
  /(?:^|[([{,;:!&|?=+\-*%~^<>]|\b(?:return|typeof|instanceof|in|of|new|do|else|case|void|delete|yield|await))\s*$/;

/**
 * Every string literal in `source`, each tagged with whether it sits inside a
 * developer call, plus the source with comments gone and every literal
 * replaced by a placeholder.
 *
 * The second half is what the fiction-token test reads: a character name in a
 * comment is documentation and a character name in a literal is caught by the
 * literal list, so the token test wants neither.
 *
 * `text` is a third view: comments removed, literals LEFT IN, which is what an
 * import test needs -- `from './x.json'` is a keyword and a path, and the path
 * is the literal. Testing that against `code` would test a placeholder and
 * pass on everything, which is a vacuous assertion wearing a regex.
 *
 * @param {string} source
 * @returns {{ literals: {text: string, developer: boolean}[], code: string,
 *             text: string }}
 */
export function scanSource(source) {
  const literals = [];
  let code = '';
  let text = '';
  let at = 0;
  let depth = 0;
  /** Bracket depths at which a developer call's argument list opened. */
  const developer = [];
  /**
   * Templates we are inside the `${ }` of. Each remembers the bracket depth
   * its `${` was opened at, so the matching `}` is recognised by depth rather
   * than by counting braces in a second place.
   */
  const templates = [];

  const inDeveloper = () => developer.length > 0;

  /**
   * Reads a string or one static chunk of a template from `at`.
   *
   * Returns `'ended'` when the literal closed, or `'interpolated'` when a
   * template opened a `${` -- in which case the caller resumes scanning CODE
   * and the template's remaining chunks are read when its `}` is found.
   */
  const readChunk = (quote) => {
    let chunk = '';
    const developerHere = inDeveloper();
    while (at < source.length) {
      const ch = source[at];
      if (ch === '\\') { chunk += source.slice(at, at + 2); at += 2; continue; }
      if (ch === quote) { at += 1; break; }
      if (quote === '`' && ch === '$' && source[at + 1] === '{') {
        at += 2;
        templates.push(depth);
        depth += 1;
        if (chunk) literals.push({ text: chunk, developer: developerHere });
        text += chunk;
        return 'interpolated';
      }
      if (quote !== '`' && ch === '\n') break;
      chunk += ch;
      at += 1;
    }
    if (chunk) literals.push({ text: chunk, developer: developerHere });
    text += chunk;
    return 'ended';
  };

  while (at < source.length) {
    const ch = source[at];
    const next = source[at + 1];

    if (ch === '/' && next === '/') {
      while (at < source.length && source[at] !== '\n') at += 1;
      code += '\n';
      text += '\n';
      continue;
    }
    if (ch === '/' && next === '*') {
      at += 2;
      while (at < source.length && !(source[at] === '*' && source[at + 1] === '/')) at += 1;
      at += 2;
      code += ' ';
      text += ' ';
      continue;
    }
    if (ch === '/' && BEFORE_REGEX.test(code)) {
      // A REGEX LITERAL, WHICH MAY CONTAIN QUOTES. `/['"]/` is punctuation and
      // one apostrophe that opens nothing, and a scanner that misses that runs
      // the rest of the file believing it is inside a string.
      at += 1;
      let inClass = false;
      while (at < source.length) {
        const r = source[at];
        if (r === '\\') { at += 2; continue; }
        if (r === '\n') break;
        if (r === '[') inClass = true;
        else if (r === ']') inClass = false;
        else if (r === '/' && !inClass) { at += 1; break; }
        at += 1;
      }
      while (at < source.length && /[dgimsuvy]/.test(source[at])) at += 1;
      code += ' RE ';
      text += ' RE ';
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      at += 1;
      text += ch;
      readChunk(ch);
      text += ch;
      code += ' LIT ';
      continue;
    }
    if (ch === '}' && templates.length > 0 && templates[templates.length - 1] === depth - 1) {
      // The `${` closed. Back inside the template's text.
      templates.pop();
      depth -= 1;
      at += 1;
      readChunk('`');
      text += '`';
      code += ' LIT ';
      continue;
    }
    if (ch === '(') {
      // WHAT WAS IMMEDIATELY BEFORE THE BRACKET decides whether this opens a
      // developer call, tested against the code built so far rather than a
      // window of raw source, so a comment between the name and the bracket
      // cannot hide it.
      if (DEVELOPER_CALLS.some((pattern) => pattern.test(code.trimEnd()))) developer.push(depth);
      depth += 1;
      code += ch;
      text += ch;
      at += 1;
      continue;
    }
    if (ch === ')') {
      depth -= 1;
      if (developer.length > 0 && developer[developer.length - 1] === depth) developer.pop();
      code += ch;
      text += ch;
      at += 1;
      continue;
    }
    if (ch === '{' || ch === '[') { depth += 1; code += ch; text += ch; at += 1; continue; }
    if (ch === '}' || ch === ']') { depth -= 1; code += ch; text += ch; at += 1; continue; }
    code += ch;
    text += ch;
    at += 1;
  }

  return { literals, code, text };
}
