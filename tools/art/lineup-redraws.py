"""The eight townspeople redrawn against Thad (reference/lineup-redraws/brief.md; errata 168, 170, and the method of
errata 144, which Tyler chose on 2026-11-08 over the brief's board of Thad's cast-sheet drawing).

Errata 139/144: the image model copies the proportions of any full figure it is shown, and Thad's cast-sheet drawing
has a head ~1.3x the in-game Thad's. So each sheet is painted OVER THE IN-GAME THAD (art/actors/thad-stand-front/
stand-00.png), repeated once per drawn pose, with the character shown ONLY AS A FACE CROP; clothes, props and poses are
in the prompt. The message boy's template is a child built from Thad (a smaller body under a head ~0.88 of Thad's);
the fiddler's face is Charlie's own, from art/staging/fiddler-charlie/sheet-01.png (errata 123) -- no photograph.

  python3 tools/art/lineup-redraws.py refs
      writes art/staging/cast-unify/batch-NN/{template,face}.png for every figure (BATCH below).
  python3 tools/art/lineup-redraws.py cut <figure> [--batch NN]
      cuts batch-NN/sheet.png into the figure's shipping sheet, in its existing frame order, at the drawn height of
      the frame it replaces (crown to sole of the rest frame), snaps it to one level, and rewrites the record's frames.

No image operation here.
"""
import json
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
THAD = os.path.join(ROOT, 'art/actors/thad-stand-front/stand-00.png')
MAGENTA = (255, 0, 255)

# figure: (batch, record(s), drawn poses on the sheet, source frame for the face, order of the shipping frames
#          from the cut poses, where 'breath' is derived from the first)
FIGURES = {
    'map-seller': (50, ['content/ambient/map-seller.json'], 4, 3, [0, 'breath', 1, 2, 3]),   # face from 3: map lowered
    'pie-woman': (51, ['content/ambient/pie-woman.json'], 4, 0, [0, 'breath', 1, 2, 3]),
    'message-boy': (52, ['content/ambient/message-boy.json'], 4, 0, [0, 'breath', 1, 2, 3]),
    'letter-writer': (53, ['content/ambient/letter-writer.json'], 4, 0, [0, 'breath', 1, 2, 3]),
    'boundary-men': (54, ['content/ambient/boundary-a.json', 'content/ambient/boundary-b.json'], 6, 0,
                     [[0, 'breath', 1, 2], [3, 'breath', 4, 5]]),
    'bell-ringer': (55, ['content/ambient/bell-ringer.json'], 4, 0, [0, 'breath', 1, 2, 3]),
    'fiddler': (56, ['content/ambient/fiddler.json'], 5, 0, [0, 1, 2, 3, 4]),
}


def stage(batch):
    return os.path.join(ROOT, f'art/staging/cast-unify/batch-{batch}')


def thad():
    t = Image.open(THAD).convert('RGBA')
    return t.crop(t.getbbox())


def child():
    """A ten-year-old built from Thad: his body at 0.62 under his head at 0.88, ~0.68 of his height overall."""
    t = thad()
    head_h = round(t.height * 0.135)
    head, body = t.crop((0, 0, t.width, head_h)), t.crop((0, head_h, t.width, t.height))
    hk, bk = 0.88, 0.62
    head = head.resize((round(head.width * hk), round(head.height * hk)), Image.NEAREST)
    body = body.resize((round(body.width * bk), round(body.height * bk)), Image.NEAREST)
    out = Image.new('RGBA', (max(head.width, body.width), head.height + body.height), (0, 0, 0, 0))
    out.alpha_composite(head, ((out.width - head.width) // 2, 0))
    out.alpha_composite(body, ((out.width - body.width) // 2, head.height - 2))
    return out.crop(out.getbbox())


def template(figs, gaps=None):
    """Figures in a row on magenta, feet on one line, fitted into 1536 x 1024 with margin."""
    gaps = gaps or [60] * (len(figs) - 1)
    W = sum(f.width for f in figs) + sum(gaps)
    H = max(f.height for f in figs)
    k = min(1400 / W, 820 / H)
    figs = [f.resize((round(f.width * k), round(f.height * k)), Image.NEAREST) for f in figs]
    gaps = [round(g * k) for g in gaps]
    W = sum(f.width for f in figs) + sum(gaps)
    H = max(f.height for f in figs)
    out = Image.new('RGBA', (1536, 1024), MAGENTA + (255,))
    x, base = (1536 - W) // 2, (1024 + H) // 2
    for i, f in enumerate(figs):
        out.alpha_composite(f, (x, base - f.height))
        x += f.width + (gaps[i] if i < len(gaps) else 0)
    return out.convert('RGB')


def head_crop(rgba, share):
    """The head: the top `share` of the figure, narrowed to the crown's columns (a prop held beside the head, a
    fiddle under the chin, is cut away), the width 1.7x the crown's."""
    a = np.asarray(rgba)
    m = a[..., 3] > 128 if a.shape[2] == 4 else ~((a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110))
    rows = np.nonzero(m.any(1))[0]
    top, h = rows[0], rows[-1] - rows[0] + 1
    crown = m[top:top + max(4, round(h * 0.05))]
    cols = np.nonzero(crown.any(0))[0]
    cx, cw = (cols.min() + cols.max()) / 2, cols.max() - cols.min() + 1
    half = round(cw * 0.95)
    return (max(0, round(cx - half)), top, min(a.shape[1], round(cx + half)), top + round(h * share))


def face(record, frame=0, share=0.2, sheet=None, box=None):
    """The figure's head -- hat, face and collar -- enlarged on magenta."""
    if sheet:
        img = Image.open(sheet).convert('RGB').crop(box)
    else:
        s = json.load(open(os.path.join(ROOT, record)))['sprite']
        x, y, w, h = s['frames'][frame]
        cell = Image.open(os.path.join(ROOT, s['sheet'])).convert('RGBA').crop((x, y, x + w, y + h))
        cell = cell.crop(cell.getbbox())
        flat = Image.new('RGBA', cell.size, MAGENTA + (255,))
        flat.alpha_composite(cell)
        img = flat.convert('RGB').crop(head_crop(cell, share))
    k = min(700 / img.width, 700 / img.height)
    img = img.resize((round(img.width * k), round(img.height * k)), Image.NEAREST)
    out = Image.new('RGB', (1024, 1024), MAGENTA)
    out.paste(img, ((1024 - img.width) // 2, (1024 - img.height) // 2))
    return out


def refs():
    t, c = thad(), child()
    for name, (batch, records, poses, src, _) in FIGURES.items():
        d = stage(batch)
        os.makedirs(d, exist_ok=True)
        if name == 'message-boy':
            template([c] * poses).save(os.path.join(d, 'template.png'))
        elif name == 'boundary-men':
            template([t] * 6, [50, 50, 220, 50, 50]).save(os.path.join(d, 'template.png'))
            a, b = face(records[0]), face(records[1])
            both = Image.new('RGB', (2048, 1024), MAGENTA)
            both.paste(a, (0, 0)); both.paste(b, (1024, 0))
            both.resize((1536, 768), Image.NEAREST).save(os.path.join(d, 'face.png'))
            continue
        else:
            template([t] * poses).save(os.path.join(d, 'template.png'))
        if name == 'fiddler':
            sheet = os.path.join(ROOT, 'art/staging/fiddler-charlie/sheet-01.png')
            a = np.asarray(Image.open(sheet).convert('RGB')).astype(int)
            fg = ~((a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110))
            cols = fg.sum(0) > 3
            x0 = int(np.argmax(cols)); x1 = x0
            while x1 + 1 < len(cols) and cols[x1 + 1]:
                x1 += 1
            first = Image.open(sheet).convert('RGB').crop((x0, 0, x1 + 1, a.shape[0]))
            bx0, by0, bx1, by1 = head_crop(first, 0.2)
            face(None, sheet=sheet, box=(x0 + bx0, by0, x0 + bx1, by1)).save(os.path.join(d, 'face.png'))
        else:
            face(records[0], frame=src).save(os.path.join(d, 'face.png'))
        print(name, os.path.relpath(d, ROOT))


def rest_height(sheet, frame):
    x, y, w, h = frame
    a = np.asarray(Image.open(os.path.join(ROOT, sheet)).convert('RGBA'))[y:y + h, x:x + w, 3] > 128
    return int(a.any(1).sum())


def cut_poses(src, height, tmp):
    """Every pose on the sheet, left to right, at `height` (the cutter's derived breath dropped)."""
    out = os.path.join(tmp, f'cut-{height}.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'),
                                               src, '0', str(height), out, '--grid', '1'], cwd=ROOT).decode())
    img = Image.open(out).convert('RGBA')
    cells = [img.crop((x, y, x + w, y + h)) for x, y, w, h in info['frames']]
    return [cells[0]] + cells[2:]


def breath(frame, tmp):
    f0, f1 = os.path.join(tmp, 'b0.png'), os.path.join(tmp, 'b1.png')
    frame.save(f0)
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools/rig/ambient-breath.py'), f0, f1], check=True,
                   capture_output=True, cwd=ROOT)
    return Image.open(f1).convert('RGBA')


def pad_and_assemble(frames, path):
    w = max(f.width for f in frames)
    h = max(f.height for f in frames)
    sheet = Image.new('RGBA', (len(frames) * (w + 2) + 2, h + 4), (0, 0, 0, 0))
    rects = []
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, (2 + i * (w + 2) + (w - f.width) // 2, 2 + h - f.height))
        rects.append([2 + i * (w + 2), 2, w, h])
    sheet.save(path)
    return rects


def split(src, tmp):
    """The boundary men's sheet as two: the widest magenta gap between the third and fourth pose."""
    a = np.asarray(Image.open(src).convert('RGB')).astype(int)
    fg = ~((a[..., 0] > 150) & (a[..., 2] > 150) & (a[..., 1] < 110))
    cols = fg.sum(0) > 3
    runs, start = [], None
    for x, on in enumerate(list(cols) + [False]):
        if on and start is None:
            start = x
        elif not on and start is not None:
            if x - start > 30:
                runs.append((start, x))
            start = None
    assert len(runs) == 6, f'expected six figures, found {len(runs)}'
    mid = (runs[2][1] + runs[3][0]) // 2
    img = Image.open(src).convert('RGB')
    left, right = os.path.join(tmp, 'a.png'), os.path.join(tmp, 'b.png')
    img.crop((0, 0, mid, img.height)).save(left)
    Image.new('RGB', (img.width - mid, img.height), MAGENTA).save(right)
    r = Image.open(right); r.paste(img.crop((mid, 0, img.width, img.height)), (0, 0)); r.save(right)
    return left, right


def cut(name, batch=None):
    b, records, poses, _, orders = FIGURES[name]
    batch = batch or b
    src = os.path.join(stage(batch), 'sheet.png')
    snapped = []
    with tempfile.TemporaryDirectory() as tmp:
        if name == 'boundary-men':
            halves = split(src, tmp)
            groups = [(records[0], halves[0], [0, 'breath', 1, 2]), (records[1], halves[1], [0, 'breath', 1, 2])]
        else:
            groups = [(records[0], src, orders)]
        for rec_p, sheet_src, order in groups:
            text = open(os.path.join(ROOT, rec_p)).read()
            rec = json.loads(text)
            s = rec['sprite']
            target = rest_height(s['sheet'], s['frames'][0])
            probe = 400
            _ = cut_poses(sheet_src, probe, tmp)
            h0 = _[0].crop(_[0].getbbox()).height
            height = round(probe * target / h0)
            cells = cut_poses(sheet_src, height, tmp)
            frames = []
            for k in order:
                frames.append(breath(frames[0], tmp) if k == 'breath' else cells[k])
            path = os.path.join(ROOT, s['sheet'])
            rects = pad_and_assemble(frames, path)
            rec['sprite']['frames'] = rects
            if s.get('figureHeight'):
                got = rest_height(s['sheet'], rects[0])
                rec['sprite']['figureHeight'] = round(s['figureHeight'] * got / target, 1) if isinstance(s['figureHeight'], float) else round(s['figureHeight'] * got / target)
            indent = 1 if text.startswith('{\n "') else 2
            open(os.path.join(ROOT, rec_p), 'w').write(json.dumps(rec, indent=indent, ensure_ascii=False) + '\n')
            snapped.append(os.path.basename(s['sheet']).replace('.png', ''))
            print(rec['id'], 'cut at', height, 'rest', rest_height(s['sheet'], rects[0]), 'target', target, len(rects), 'frames')
    # THE RECORDS FIRST, THEN THE SNAP: one-level.py reads each frame's box from the record.
    subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools/art/one-level.py'), '--only', *snapped],
                          cwd=ROOT, stdout=subprocess.DEVNULL)


if __name__ == '__main__':
    if sys.argv[1] == 'refs':
        refs()
    elif sys.argv[1] == 'cut':
        cut(sys.argv[2], int(sys.argv[sys.argv.index('--batch') + 1]) if '--batch' in sys.argv else None)
    else:
        print(__doc__)
