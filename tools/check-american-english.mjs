/**
 * THE FICTION IS AMERICAN, BECAUSE THADDEUS GRUBB IS.
 *
 * He is from Rhode Island, in 1858, in a California gold-rush town, and he
 * had been saying "storeys" and "colour" and "apologise" because whoever
 * wrote him does not. Tyler caught it reading a line about the buildings.
 *
 * Thirty-three British spellings were in the writing documents and five had
 * reached the shipped content. Nothing could have found them: no validator
 * reads prose, and a misspelling that is correct in another country does not
 * look like an error to a spell-checker or to the person who typed it.
 *
 * ONLY THE FICTION. `colour` is also a field the engine reads and every
 * hotspot in every room carries one, so this checks quoted lines -- `say`,
 * `line`, `text` -- and never a key.
 */
import { Report, loadContent } from './lib/content.mjs';

const BRITISH = {
  storey: 'story', storeys: 'stories', colour: 'color', colours: 'colors',
  neighbour: 'neighbor', realise: 'realize', recognise: 'recognize',
  apologise: 'apologize', favour: 'favor', honour: 'honor', labour: 'labor',
  rumour: 'rumor', odour: 'odor', parlour: 'parlor', behaviour: 'behavior',
  travelling: 'traveling', travelled: 'traveled', marvellous: 'marvelous',
  grey: 'gray', theatre: 'theater', centre: 'center', sombre: 'somber',
  defence: 'defense', offence: 'offense', pretence: 'pretense',
  practise: 'practice', cheque: 'check', plough: 'plow', draught: 'draft',
  moustache: 'mustache', sceptical: 'skeptical', whilst: 'while',
  amongst: 'among', learnt: 'learned', spelt: 'spelled', dreamt: 'dreamed',
  burnt: 'burned', leapt: 'leaped',
};

/** Every spoken string in a loaded content tree, wherever it hides. */
function* spoken(node) {
  if (Array.isArray(node)) { for (const item of node) yield* spoken(item); return; }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === 'string' && ['say', 'line', 'text'].includes(key)) yield value;
    else yield* spoken(value);
  }
}

export function check() {
  const report = new Report('The fiction is American English');
  const content = loadContent();
  let lines = 0;
  const found = [];

  const sources = [
    ...content.rooms.map(({ path, data }) => [path, data]),
    ...(content.dialogue ?? []).map(({ path, data }) => [path, data]),
    ...(content.sequences ?? []).map(({ path, data }) => [path, data]),
    ...(content.ambient ?? []).map(({ path, data }) => [path, data]),
  ];

  for (const [path, data] of sources) {
    for (const line of spoken(data)) {
      lines += 1;
      for (const word of line.match(/[A-Za-z']+/g) ?? []) {
        const swap = BRITISH[word.toLowerCase()];
        if (swap) found.push(`${path}: "${word}" should be "${swap}" — ${line.slice(0, 60)}`);
      }
    }
  }

  for (const line of found.slice(0, 10)) report.fail(line);
  if (found.length > 10) report.fail(`...and ${found.length - 10} more`);
  report.note(`${lines} spoken line(s) checked against ${Object.keys(BRITISH).length} `
    + 'British spellings. Thad is from Rhode Island');
  return report;
}
