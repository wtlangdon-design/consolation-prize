// THE MENU SHOWS THE FIRST SENTENCE; THAD SAYS THE WHOLE LINE (errata 292).
//
// Tyler, 2026-11-11, shown how Monkey Island's menus worked: in the original
// games the menu showed the full line and Guybrush said exactly what was
// clicked; Tales of Monkey Island showed a short version and Guybrush said a
// longer one. After the voice pass made Thad's lines longer, the menu was
// giving the joke away before he said it. Asked which, he chose "Tales style:
// first sentence, then more". So a choice of more than one sentence shows its
// first sentence in the menu, and the whole line is what he says (the
// option's `echo`, doc 30 section 6.2).

// Words that end in a full stop without ending a sentence.
const ABBREVIATIONS = new Set(['Mr', 'Mrs', 'Ms', 'Dr', 'St', 'Col', 'Rev', 'Messrs', 'Mt', 'No', 'Jr', 'Sr', 'vs', 'Capt', 'Gen', 'Lt', 'Sgt']);

/**
 * What the menu shows: the first sentence, or the first two when the first is
 * only a greeting or a word ("Madame!", "Good day!", "Grubb."), which alone
 * would not say what the choice is.
 */
export function menuLine(text) {
  const first = firstSentence(text);
  const words = first.trim().split(/\s+/).length;
  const bare = words <= 2 || (words <= 4 && first.endsWith('!'));
  if (first === text || first.endsWith('?') || !bare) return first;
  const second = firstSentence(text.slice(first.length).trimStart());
  return `${first} ${second}`;
}

/** The first sentence of a line, or the whole line when it is one sentence. */
export function firstSentence(text) {
  const boundary = /([.!?…]+["'’”)]*)(\s+)(?=["'‘“(]?[A-Z0-9])/g;
  let match;
  while ((match = boundary.exec(text)) !== null) {
    const before = text.slice(0, match.index);
    const word = before.split(/\s+/).pop() ?? '';
    if (match[1].startsWith('.') && (ABBREVIATIONS.has(word.replace(/^["'‘“(]/, '')) || /^[A-Z]$/.test(word))) continue;
    return text.slice(0, match.index + match[1].length);
  }
  return text;
}

/** Which options keep their whole line on the menu. */
export function keepsWholeLine(option, treeId) {
  if (option.tag === 'ASSAY') return true;            // the Liar's Assay shows the whole boast or counter, as MI's insults did
  if (option.universal || option.echo) return true;   // pool exits, and lines that already say something else
  if (treeId === 'LETTERS_HOME' || treeId === 'harness_tree') return true;
  return false;
}

/** Apply the rule to every option of a tree, in place. */
export function menuFirstSentence(tree) {
  const nodes = Array.isArray(tree.nodes) ? tree.nodes : Object.values(tree.nodes ?? {});
  for (const node of nodes) {
    for (const option of node.options ?? []) {
      if (typeof option.text !== 'string' || keepsWholeLine(option, tree.id)) continue;
      const first = menuLine(option.text);
      if (first === option.text) continue;
      option.echo = option.text;
      option.text = first;
    }
  }
  return tree;
}
