"""Thad sits down in the listening chamber, and gets up again (doc 48 S5 beat 3:
"He sits down in the dark and listens to it").

Room 33's fourth operation drew four poses on one sheet, at one scale, against
his cast sheet and his key poses (art/staging/room-33/thad-sits/sheet.png):
standing, half down, a hand behind him, sitting with his knees up. Here they
become his clips, on the scale of his chores (the standing man 526 tall, the
soles on row 526):

  thad-sit-<facing>          stand, half down x2, hand down x2, seated  (a one-shot)
  thad-rise-<facing>         the same six, backwards                    (a one-shot)
  thad-seated-<facing>       seated, held: `idle` in the state `seated`
  thad-idlebreak-seated-*    the same frame: no break while he listens
  thad-stand-seated-*        the same frame: `stand` in the state

Frame 0 of `sit` (and the last of `rise`) is his chore stand, byte for byte, so
neither end pops. Each drawn pose is centred where the stand's drawn pixels are
centred (the weight stays over one spot as a man lowers himself), soles on the
stand's sole row. Left is the right drawing mirrored about the anchor, as a
profile drawn once.

ONE STILL FRAME, ON PURPOSE. Invariant 8: by the time the score resolves, the
only moving thing in the frame -- the lamp -- has stopped. A breathing seated
figure would be a second moving thing.

Usage: thad-sit.py   (it snaps its own frames to one level; then node tools/build-actor-record.mjs)
"""
import json, os, shutil, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHEET = os.path.join(ROOT, 'art/staging/room-33/thad-sits/sheet.png')
STAND = os.path.join(ROOT, 'art/actors/thad-give-offer-right/give-offer-00.png')   # the chores' stand
FIG_W, FIG_H, PAD = 221, 526, 150      # anchor x = PAD + Math.round(FIG_W / 2) = 261 (the record rounds as JS does)
AX = PAD + int(FIG_W / 2 + 0.5)
W, H = 2 * AX + 1, 547


with tempfile.TemporaryDirectory() as tmp:
    out = os.path.join(tmp, 'r.png')
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cast-unify-cut.py'),
                                               SHEET, '0', '1000', out, '--grid', '1']))
    im = Image.open(out).convert('RGBA')
    fr = info['frames']; fr = [fr[0]] + fr[2:]        # the cutter inserts a breath after the rest pose
    figs = []
    for x, y, w, h in fr:
        c = im.crop((x, y, x + w, y + h)); figs.append(c.crop(c.getbbox()))

k = FIG_H / figs[0].height                             # the standing pose is the man's height
def scaled(f):
    s = f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.LANCZOS)
    a = np.asarray(s).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    return Image.fromarray(a)

def centre_x(img):
    m = np.asarray(img)[..., 3] > 128
    return float(np.nonzero(m)[1].mean())

stand_old = Image.open(STAND).convert('RGBA')
sm = np.asarray(stand_old)[..., 3] > 128
s_rows = np.nonzero(sm.any(1))[0]; s_sole = s_rows[-1]
s_cx = centre_x(stand_old) - 196 + AX                  # the old canvas's anchor x is 196
stand = Image.new('RGBA', (W, H), (0, 0, 0, 0))
stand.alpha_composite(stand_old, (AX - 196, 0))
frames = [stand]
for f in figs[1:]:
    p = scaled(f)
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    c.alpha_composite(p, (int(round(s_cx - centre_x(p))), int(s_sole - p.height + 1)))
    frames.append(c)

def write(name, imgs, prefix, extra):
    for facing in ('right', 'left'):
        d = os.path.join(ROOT, 'art/actors', f'thad-{name}-{facing}')
        shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
        for i, img in enumerate(imgs):
            (img if facing == 'right' else img.transpose(Image.FLIP_LEFT_RIGHT)).save(
                os.path.join(d, f'{prefix}-{i:02d}.png'))
        rig = {'clip': extra.pop('clip', name), 'facing': facing, 'figure': [FIG_W, FIG_H], 'frames': len(imgs),
               'padding': PAD, **extra,
               **({} if name in ('sit', 'rise') else {'scale_from': f'thad-sit-{facing}'}),
               'note': 'Doc 48 S5 beat 3: he sits down in the dark and listens. Room 33 operation 4 '
                       '(art/staging/room-33/thad-sits/sheet.png), cut by tools/art/thad-sit.py on the '
                       "chores' scale; left is the right drawing mirrored about the anchor."}
        json.dump(rig, open(os.path.join(d, 'rig.json'), 'w'), indent=2)
        extra = {kk: v for kk, v in rig.items() if kk not in ('facing', 'figure', 'frames', 'padding', 'note')}

# A MAN LOWERING HIMSELF TO THE GROUND IS NOT A VERB'S SNAP. Four frames at his reactRate (7) was
# 0.57 s, a drop; the two middle poses are held a frame each, so the sit takes 0.86 s.
slow = [frames[0], frames[1], frames[1], frames[2], frames[2], frames[3]]
write('sit', slow, 'sit', {'clip': 'sit'})
write('rise', slow[::-1], 'rise', {'clip': 'rise'})
write('seated', [frames[-1]], 'seated', {'clip': 'idle', 'state': 'seated'})
write('idlebreak-seated', [frames[-1]], 'idle-break', {'clip': 'idle-break', 'state': 'seated'})
write('stand-seated', [frames[-1]], 'stand', {'clip': 'stand', 'state': 'seated'})
print('sit/rise', len(frames), 'frames; canvas', (W, H), 'anchor', (AX, FIG_H), 'scale', round(k, 3))

# ONE LEVEL (errata 112 G), then the stand put back. The stand is his chores' own frame, already snapped;
# a snapped frame snapped again moves its outline by a pixel, and then `sit` would pop on its first frame.
subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools/art/one-level.py'), '--only',
                       'thad-sit-', 'thad-rise-', 'thad-seated-', 'thad-idlebreak-seated-', 'thad-stand-seated-'],
                      stdout=subprocess.DEVNULL)
for facing in ('right', 'left'):
    img = stand if facing == 'right' else stand.transpose(Image.FLIP_LEFT_RIGHT)
    img.save(os.path.join(ROOT, 'art/actors', f'thad-sit-{facing}', 'sit-00.png'))
    img.save(os.path.join(ROOT, 'art/actors', f'thad-rise-{facing}', 'rise-05.png'))
print('snapped to one level; the stand frames are the chores\' own')
