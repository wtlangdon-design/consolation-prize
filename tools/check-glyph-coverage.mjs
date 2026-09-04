import {
  allDialogueOptions, allResponseCarriers, loadContent, Report, runCheck,
} from './lib/content.mjs';

/**
 * Every character the game can draw has a glyph.
 *
 * The font is 1-bit and hand-authored, so an unmapped character renders as a
 * gap rather than a fallback shape -- a typographer's quote or an en dash
 * pasted in from a design document would silently vanish mid-sentence.
 */
export function collectStrings(content) {
  const strings = [];

  // Response carriers rather than room targets: an item's name goes in the
  // sentence line and its lines are spoken, so they are drawn text and need
  // glyphs exactly as a hotspot's do.
  for (const { roomId, target } of allResponseCarriers(content)) {
    strings.push({ text: target.name, where: `${roomId}/${target.id} (name)` });
    for (const [verb, rules] of Object.entries(target.responses ?? {})) {
      rules.forEach((rule, index) => {
        if (rule.say) strings.push({ text: rule.say, where: `${roomId}/${target.id}/${verb}[${index}]` });
      });
    }
    (target.fallback ?? []).forEach((line, index) => {
      strings.push({ text: line, where: `${roomId}/${target.id}/fallback[${index}]` });
    });
  }

  for (const { data } of content.dialogue) {
    for (const [nodeId, node] of Object.entries(data.nodes ?? {})) {
      if (node.prompt) strings.push({ text: node.prompt, where: `${data.id}/${nodeId} (prompt)` });
      (node.opening ?? []).forEach((spoken, index) => {
        strings.push({ text: spoken.line, where: `${data.id}/${nodeId} (opening[${index}])` });
      });
    }
  }
  for (const { treeId, nodeId, option } of allDialogueOptions(content)) {
    const where = `${treeId}/${nodeId}/${option.id}`;
    for (const [field, text] of Object.entries({ text: option.text, say: option.say, repeat: option.repeat })) {
      if (text) strings.push({ text, where: `${where} (${field})` });
    }
    (option.exchange ?? []).forEach((spoken, index) => {
      strings.push({ text: spoken.line, where: `${where} (exchange[${index}])` });
    });
  }

  for (const verb of content.verbs.verbs) {
    strings.push({ text: verb.label, where: `verb ${verb.id}` });
  }
  strings.push({ text: content.verbs.walkVerb.label, where: 'walk verb' });

  for (const [key, value] of Object.entries(content.ui.notices)) {
    strings.push({ text: value, where: `ui.notices.${key}` });
  }
  // ui.keys is gone -- there are no F-key hints to draw any more. The menu
  // replaced them, and every string it can show has to have glyphs.
  const menu = content.menu ?? {};
  for (const [section, value] of Object.entries(menu)) {
    if (typeof value === 'string') {
      strings.push({ text: value, where: `menu.${section}` });
      continue;
    }
    if (value === null || typeof value !== 'object') continue;
    for (const [key, inner] of Object.entries(value)) {
      if (typeof inner === 'string') {
        strings.push({ text: inner, where: `menu.${section}.${key}` });
      } else if (Array.isArray(inner)) {
        for (const item of inner) {
          if (item?.label) strings.push({ text: item.label, where: `menu.${section}.${key}` });
        }
      } else if (inner && typeof inner === 'object') {
        for (const [deep, text] of Object.entries(inner)) {
          if (typeof text === 'string') {
            strings.push({ text, where: `menu.${section}.${key}.${deep}` });
          }
        }
      }
    }
  }
  for (const [key, value] of Object.entries(content.ui.dialogue)) {
    strings.push({ text: value, where: `ui.dialogue.${key}` });
  }

  // Sequence beats. Only the drawn parts: what a character says, and the act
  // card. The description and the note are the document talking to us.
  for (const { data } of content.sequences ?? []) {
    for (const beat of data.beats ?? []) {
      (beat.lines ?? []).forEach((spoken, index) => {
        strings.push({ text: spoken.line, where: `${data.id}/beat ${beat.beat}[${index}]` });
      });
      if (beat.actCard) {
        strings.push({ text: beat.actCard, where: `${data.id}/beat ${beat.beat} (act card)` });
      }
    }
    for (const speaker of Object.values(data.speakers ?? {})) {
      strings.push({ text: speaker.name, where: `${data.id} (speaker)` });
    }
  }

  return strings;
}

export function check() {
  const report = new Report('Every content character has a font glyph');
  const content = loadContent();
  const glyphs = new Set(Object.keys(content.font.glyphs));
  const strings = collectStrings(content);

  const missing = new Map();
  for (const { text, where } of strings) {
    for (const char of text) {
      if (!glyphs.has(char)) {
        if (!missing.has(char)) missing.set(char, where);
      }
    }
  }

  for (const [char, where] of missing) {
    const code = char.codePointAt(0)?.toString(16).padStart(4, '0');
    report.fail(`no glyph for "${char}" (U+${code}), first seen at ${where}`);
  }

  report.note(`${strings.length} strings checked against ${glyphs.size} glyphs`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
