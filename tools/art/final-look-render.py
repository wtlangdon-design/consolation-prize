"""The final look: what Tyler sees (reference/final-look/handback.md). No image operation.

  renders/final-look-beside-thad.png    each redrawn figure as the engine draws it in its own room beside Thad
                                        (tools/art/beside-thad.py), the old drawing above the new
  renders/final-look-cast-before-after.png   the five redrawn figures' rest frames at one height between Thad and
                                        their neighbours in the line-up (Frame, Deke, the photographer, the
                                        Gulch Deacon), before and after
"""
import json, os, subprocess, sys, tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = lambda p: os.path.join(ROOT, p)
WHO = [('pratt', 'pratt'), ('pratt_jump', 'pratt-jump'), ('gulch_rule_keeper', 'rule-keeper'),
       ('prosperity_ozymandia', 'ozymandia'), ('pie_woman', 'pie-woman')]
OLD = {'pratt': 'art/actors/room-25-pratt-master.png', 'pratt-jump': 'art/actors/room-25-pratt-jump-master.png',
       'rule-keeper': 'art/actors/room-52-rule-keeper.png', 'ozymandia': 'art/actors/room-23-ozymandia.png',
       'pie-woman': 'art/actors/ambient-pie-woman-master.png'}


def beside(npc, sheet=None):
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'b.png')
        if sheet:                                  # the old drawing: its sheet swapped in for the moment
            live = R(OLD[sheet]); keep = live + '.new'
            os.replace(live, keep)
            try:
                Image.open(R(f'art/staging/final-look/{sheet}/old-sheet.png')).save(live)
                subprocess.check_call([sys.executable, R('tools/art/beside-thad.py'), npc, out], cwd=ROOT, stdout=subprocess.DEVNULL)
            finally:
                os.replace(keep, live)
        else:
            subprocess.check_call([sys.executable, R('tools/art/beside-thad.py'), npc, out], cwd=ROOT, stdout=subprocess.DEVNULL)
        return Image.open(out).convert('RGB')


def main():
    rows = []
    for npc, key in WHO:
        a, b = beside(npc, key), beside(npc)
        if a.height < 300:
            a = a.resize((a.width * 2, a.height * 2), Image.NEAREST); b = b.resize((b.width * 2, b.height * 2), Image.NEAREST)
        pair = Image.new('RGB', (a.width + b.width + 12, max(a.height, b.height)), (0, 0, 0))
        pair.paste(a, (0, 0)); pair.paste(b, (a.width + 12, 0))
        rows.append(pair)
    W = max(r.width for r in rows); H = sum(r.height for r in rows) + 12 * (len(rows) - 1)
    sheet = Image.new('RGB', (W, H), (0, 0, 0)); y = 0
    for r in rows:
        sheet.paste(r, (0, y)); y += r.height + 12
    sheet.save(R('renders/final-look-beside-thad.png'))

    # the line-up: Thad, the five before and after, at one height
    def rest(path, box):
        im = Image.open(R(path)).convert('RGBA').crop(box); return im.crop(im.getbbox())
    thad = rest('art/actors/thad-stand-front/stand-00.png', (0, 0, 709, 691))
    H0 = 300
    def fit(im): return im.resize((max(1, round(im.width * H0 / im.height)), H0), Image.NEAREST)
    befores, afters = [fit(thad)], [fit(thad)]
    for npc, key in WHO:
        rec = next(json.load(open(R(f'content/ambient/{f}'))) for f in os.listdir(R('content/ambient'))
                   if f.endswith('.json') and json.load(open(R(f'content/ambient/{f}'))).get('id') == npc)
        x, y0, w, h = rec['sprite']['frames'][0]
        befores.append(fit(rest(f'art/staging/final-look/{key}/old-sheet.png', (x, y0, x + w, y0 + h))))
        afters.append(fit(rest(rec['sprite']['sheet'], (x, y0, x + w, y0 + h))))
    Wl = max(sum(i.width for i in befores), sum(i.width for i in afters)) + 30 * 7
    line = Image.new('RGBA', (Wl, H0 * 2 + 60), (48, 52, 64, 255))
    for row, ims in enumerate((befores, afters)):
        x = 20
        for im in ims:
            line.alpha_composite(im, (x, 20 + row * (H0 + 20))); x += im.width + 30
    line.convert('RGB').save(R('renders/final-look-cast-before-after.png'))
    print('wrote renders/final-look-beside-thad.png and renders/final-look-cast-before-after.png')


main()
