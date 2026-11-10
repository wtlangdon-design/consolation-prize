"""The stamp that comes down on the title (errata 259; doc 122 P7).

Drawn from content/ui/title.json's `stamp.word` and `stamp.by` in the game's own bitmap face (art/ui/font-5x7.json),
so no word is written here. A rubber stamp in red ink: a ruled box, the word large, the office small under it, set a
little askew by shearing whole rows (a pixel never turns, so every edge stays crisp), with the ink missing where a
worn stamp does not take. The wear is seeded, so the picture is the same every run. No image operation.

    python3 tools/art/title-stamp.py
"""
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TITLE = json.load(open(os.path.join(ROOT, 'content/ui/title.json')))['stamp']
FONT = json.load(open(os.path.join(ROOT, 'art/ui/font-5x7.json')))
INK = (196, 58, 62)
WORD_SCALE, BY_SCALE, CELL = 4, 1, 5   # art pixels per glyph pixel; screen pixels per art pixel


def text(words, scale):
    glyphs = [FONT['glyphs'][c] for c in words]
    advance = FONT['advance']
    width = (len(words) * advance - (advance - FONT['width'])) * scale
    out = np.zeros((FONT['height'] * scale, width), dtype=bool)
    for i, rows in enumerate(glyphs):
        for y, row in enumerate(rows):
            for x, mark in enumerate(row):
                if mark == FONT['on']:
                    out[y * scale:(y + 1) * scale, (i * advance + x) * scale:(i * advance + x + 1) * scale] = True
    return out


word, by = text(TITLE['word'], WORD_SCALE), text(TITLE['by'], BY_SCALE)
pad, rule, gap = 5, 2, 4
inner_w = max(word.shape[1], by.shape[1])
w = inner_w + 2 * (pad + rule)
h = word.shape[0] + gap + by.shape[0] + 2 * (pad + rule)
art = np.zeros((h, w), dtype=bool)
art[:rule, :] = art[-rule:, :] = True
art[:, :rule] = art[:, -rule:] = True
y = rule + pad
x = (w - word.shape[1]) // 2
art[y:y + word.shape[0], x:x + word.shape[1]] |= word
y += word.shape[0] + gap
x = (w - by.shape[1]) // 2
art[y:y + by.shape[0], x:x + by.shape[1]] |= by
# Worn: about one art pixel in fourteen did not take the ink.
rng = np.random.default_rng(259)
art &= rng.random(art.shape) > 0.07
# Askew: each column drops one art pixel every eight across (about seven degrees), whole pixels only.
drop = [cx // 8 for cx in range(w)]
skew = np.zeros((h + max(drop), w), dtype=bool)
for cx in range(w):
    skew[drop[cx]:drop[cx] + h, cx] = art[:, cx]
img = Image.new('RGBA', (skew.shape[1], skew.shape[0]), (0, 0, 0, 0))
px = img.load()
for yy in range(skew.shape[0]):
    for xx in range(skew.shape[1]):
        if skew[yy, xx]:
            px[xx, yy] = INK + (232,)
img = img.resize((img.width * CELL, img.height * CELL), Image.NEAREST)
out = os.path.join(ROOT, TITLE['sheet'])
img.save(out)
print(TITLE['sheet'], img.size)
