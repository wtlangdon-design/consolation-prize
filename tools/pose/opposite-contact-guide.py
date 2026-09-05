#!/usr/bin/env python3
"""A DETERMINISTIC POSE GUIDE for the one missing profile-walk pose, and the
do-not-copy composite that goes with it. Tyler, 2026-09-05.

    python3 tools/pose/opposite-contact-guide.py

Writes reference/pose/thad-opposite-contact-guide.png -- a mannequin facing
screen right in the OPPOSITE CONTACT to the shipping contact frame: the far
leg forward with its heel down, the near leg trailing with its heel up, the
NEAR arm forward, the FAR arm back -- and
reference/pose/thad-contact-do-not-copy-vs-target.png, the shipping contact
labelled DO NOT RETURN THIS LIMB POLARITY beside the guide labelled TARGET
LIMB POLARITY. Both are prompt material, not art: the text and the guide
colours exist so the image model cannot read "the same man" as "the same
pose" again (proofs/thad/profile-walk.json, oppositeHalf). Nothing here is
loaded by the game.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np

W = H = 1024
NEAR = (28, 70, 200)      # the viewer-side limbs: drawn ON TOP, thick, blue
FAR = (235, 120, 20)      # the far-side limbs: drawn BEHIND the body, orange
BODY = (90, 90, 100)
INK = (20, 20, 24)
bold = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)

im = Image.new('RGB', (W, H), (245, 245, 240)); d = ImageDraw.Draw(im)
# figure geometry: ~640 tall, soles on row 830, facing right (+x)
top, floor = 190, 830
cx = 440
head_r = 62
neck = top + 2 * head_r
shoulder = (cx, neck + 28)
hip = (cx, shoulder[1] + 200)

def seg(a, ang_deg, length, color, width):
    """One limb segment from `a`, hanging at ang_deg from straight down (+ = forward, screen right)."""
    r = math.radians(ang_deg)
    b = (a[0] + length * math.sin(r), a[1] + length * math.cos(r))
    d.line([a, b], fill=color, width=width)
    d.ellipse([b[0] - width * 0.5, b[1] - width * 0.5, b[0] + width * 0.5, b[1] + width * 0.5], fill=color)
    return b

# FAR limbs first (behind the body)
far_hip = (hip[0] - 14, hip[1])
far_shoulder = (shoulder[0] - 12, shoulder[1] + 6)
ank = seg(far_hip, +24, 290, FAR, 26)                    # FAR LEG FORWARD, straight
d.line([(ank[0] - 12, floor - 13), (ank[0] + 58, floor - 13)], fill=FAR, width=26)   # its foot flat, heel down
d.polygon([(ank[0] + 58, floor - 26), (ank[0] + 74, floor - 30), (ank[0] + 58, floor)], fill=FAR)  # toe slightly up
elb = seg(far_shoulder, -24, 120, FAR, 22)                # FAR ARM BACK
seg(elb, -32, 115, FAR, 22)
# body
d.rounded_rectangle([cx - 62, neck - 6, cx + 62, hip[1] + 40], radius=40, fill=BODY)
d.ellipse([cx - head_r, top, cx + head_r, top + 2 * head_r], fill=BODY)
d.polygon([(cx + head_r - 6, top + 66), (cx + head_r + 26, top + 80), (cx + head_r - 6, top + 92)], fill=BODY)  # nose, pointing right
d.ellipse([cx + 22, top + 48, cx + 36, top + 62], fill=(245, 245, 240))  # eye
# NEAR limbs on top
near_hip = (hip[0] + 14, hip[1] + 6)
near_shoulder = (shoulder[0] + 10, shoulder[1] + 2)
knee = seg(near_hip, -22, 145, NEAR, 30)                  # NEAR LEG TRAILING: thigh back,
ank = seg(knee, -38, 145, NEAR, 30)                       # shin further back, knee flexed for push-off
d.line([ank, (ank[0] + 48, floor - 15)], fill=NEAR, width=30)   # its foot: heel (at the ankle) UP, toe on the floor
elb = seg(near_shoulder, +26, 120, NEAR, 26)              # NEAR ARM FORWARD
hand = seg(elb, +36, 110, NEAR, 26)
d.ellipse([hand[0] - 16, hand[1] - 12, hand[0] + 16, hand[1] + 20], fill=NEAR)
# floor line and direction
d.line([(80, floor), (W - 80, floor)], fill=INK, width=3)
d.line([(700, 120), (900, 120)], fill=INK, width=5); d.polygon([(900, 108), (930, 120), (900, 132)], fill=INK)
d.text((700, 78), 'WALKING TO THE RIGHT', fill=INK, font=bold)
# labels
def label(xy, text, color, anchor):
    d.line([anchor, xy], fill=color, width=2); d.text((xy[0] + 6, xy[1] - 12), text, fill=color, font=bold)
label((610, 250), 'NEAR ARM (viewer side)\nFORWARD', NEAR, (elb[0] + 10, elb[1]))
label((90, 380), 'FAR ARM\nBACK', FAR, (far_shoulder[0] - 62, far_shoulder[1] + 140))
label((690, 560), 'FAR LEG FORWARD\nheel down', FAR, (far_hip[0] + 92, far_hip[1] + 205))
label((60, 600), 'NEAR LEG TRAILING\nheel up', NEAR, (knee[0] - 12, knee[1]))
for i, line in enumerate(['POSE GUIDE ONLY. Blue = limbs on the viewer\'s side (drawn over the coat). Orange = far-side limbs (behind the body).', 'Contact phase of an ordinary walk: FAR leg landing heel-first in front, NEAR leg pushing off behind,', 'NEAR arm swung forward, FAR arm swung back. The OPPOSITE of the existing contact (near leg forward, near arm back).']):
    d.text((60, 880 + 26 * i), line, fill=INK, font=small)
out = Path('reference/pose'); out.mkdir(parents=True, exist_ok=True)
im.save(out / 'thad-opposite-contact-guide.png'); print('wrote', out / 'thad-opposite-contact-guide.png')

# the do-not-copy composite: shipping contact (keyed frame, on a neutral ground) beside the guide
cur = Image.open('art/actors/thad-walk-right/walk-00.png').convert('RGBA')
bb = cur.split()[3].getbbox(); cur = cur.crop(bb)
s = 640 / cur.height; cur = cur.resize((round(cur.width * s), 640), Image.LANCZOS)
comp = Image.new('RGB', (W * 2 + 60, H), (245, 245, 240)); cd = ImageDraw.Draw(comp)
left = Image.new('RGB', (W, H), (245, 245, 240)); left.paste(cur, ((W - cur.width) // 2, floor - 640), cur)
comp.paste(left, (0, 0)); comp.paste(im, (W + 60, 0))
cd.rectangle([0, 0, W, 60], fill=(200, 40, 40)); cd.text((30, 16), 'DO NOT RETURN THIS LIMB POLARITY  (existing contact: near leg forward, near arm back)', fill=(255, 255, 255), font=bold)
cd.rectangle([W + 60, 0, 2 * W + 60, 60], fill=(30, 120, 60)); cd.text((W + 90, 16), 'TARGET LIMB POLARITY  (far leg forward, near leg trailing, near arm forward, far arm back)', fill=(255, 255, 255), font=bold)
cd.line([(W + 30, 0), (W + 30, H)], fill=INK, width=6)
comp.save(out / 'thad-contact-do-not-copy-vs-target.png'); print('wrote', out / 'thad-contact-do-not-copy-vs-target.png')
