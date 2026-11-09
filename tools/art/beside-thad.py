"""A placed figure beside Thad, in its room, at game size (errata 205).

The side-by-side Tyler judges a figure by: the figure drawn as the engine draws
it (on the room's depth curve, its `footRow`, the room's `figureLight` grade if
it names the figure, and the lamps' tint at its feet), and Thad's standing frame
beside it at the same depth, drawn the same way (graded if the room grades him,
tinted by the lamps at his own feet). The grade and tint are the models
tools/check-figure-light.mjs measures with -- the CSS filter functions and the
source-atop tint of Renderer.drawTinted and LightFields.moverTint -- so the
picture and the number agree. No image operation; nothing is written but the
render.

usage:
  python3 tools/art/beside-thad.py AMBIENT_ID OUT.png [--frame N] [--thad-x X]
      [--thad-y Y] [--man H] [--pad P]

Thad stands at --thad-x (default: just left of the figure) and --thad-y
(default: the figure's own y), at --man px tall (default: the room's curve
there, carried past the walk band in a straight line as tests/scale.test.ts
does, so a figure off the band is shown against the man at its own depth).
"""
import argparse
import json
import math
import os

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def load(path):
    with open(os.path.join(ROOT, path)) as handle:
        return json.load(handle)


def nearest_box(room, x, y):
    """WalkBoxes.nearest: the box whose clamped point is closest (boxes as their bounding rectangles)."""
    best, gap = None, math.inf
    for box in room['walkBoxes']:
        xs = [p['x'] for p in box['points']]
        ys = [p['y'] for p in box['points']]
        px, py = max(min(xs), min(max(xs), x)), max(min(ys), min(max(ys), y))
        if math.hypot(px - x, py - y) < gap:
            best, gap = box, math.hypot(px - x, py - y)
    return best


def curve_man(room, x, y, carry=True):
    """The room's man at floor point (x, y), on the nearest walk box's curve."""
    mode = nearest_box(room, x, y)['scaleMode']
    if mode['kind'] == 'fixed':
        return mode['height']
    far_y, far_h, near_y, near_h = mode['farY'], mode['farHeight'], mode['nearY'], mode['nearHeight']
    if 'beyondY' in mode and y < far_y:
        walk = max(0.0, min(1.0, (y - mode['beyondY']) / max(1, far_y - mode['beyondY'])))
        return mode['beyondHeight'] + (far_h - mode['beyondHeight']) * walk
    if mode.get('samples'):
        points = sorted([[far_y, far_h], *mode['samples'], [near_y, near_h]])
        at = max(points[0][0], min(points[-1][0], y))
        for (y0, h0), (y1, h1) in zip(points, points[1:]):
            if at <= y1:
                return h1 if y1 == y0 else h0 + (h1 - h0) * (at - y0) / (y1 - y0)
        return points[-1][1]
    walk = (y - far_y) / (near_y - far_y)
    if not carry:
        walk = max(0.0, min(1.0, walk))
    return far_h + (near_h - far_h) * walk


def grade_rgb(rgb, grade):
    """CSS brightness, contrast, saturate, then the light's multiply -- Renderer.drawTinted's order."""
    p = rgb / 255.0
    if grade is None:
        return rgb
    if 'brightness' in grade:
        p = np.clip(p * grade['brightness'], 0, 1)
    if 'contrast' in grade:
        p = np.clip((p - 0.5) * grade['contrast'] + 0.5, 0, 1)
    if 'saturate' in grade:
        s = grade['saturate']
        m = np.array([
            [0.2126 + 0.7874 * s, 0.7152 - 0.7152 * s, 0.0722 - 0.0722 * s],
            [0.2126 - 0.2126 * s, 0.7152 + 0.2848 * s, 0.0722 - 0.0722 * s],
            [0.2126 - 0.2126 * s, 0.7152 - 0.7152 * s, 0.0722 + 0.9278 * s]])
        p = np.clip(p @ m.T, 0, 1)
    if 'light' in grade:
        p = p * np.clip(np.array(grade['light']), 0, 1)
    return p * 255.0


def mover_tint(lamps, x, y):
    """engine/render/LightFields.ts moverTint, line for line."""
    alpha = red = green = blue = 0.0
    for lamp in lamps or []:
        field = lamp.get('movers')
        if not field or not field.get('strength', 0) > 0:
            continue
        radius = field.get('radius', lamp['radius'])
        dx = x - lamp['at'][0]
        dy = (y - lamp['at'][1]) / field.get('reach', 1)
        distance = math.hypot(dx, dy)
        if distance >= radius:
            continue
        weight = field['strength'] * (1 - distance / radius) ** 2
        colour = field.get('colour', [255, 180, 96])
        red += colour[0] * weight
        green += colour[1] * weight
        blue += colour[2] * weight
        alpha += weight
    if alpha <= 0.002:
        return None
    return min(alpha, 0.6), np.array([round(red / alpha), round(green / alpha), round(blue / alpha)], dtype=float)


def lit(image, grade, tint):
    """The figure's pixels through the grade and the tint, its alpha untouched."""
    array = np.asarray(image.convert('RGBA')).astype(float)
    rgb = grade_rgb(array[..., :3], grade)
    if tint is not None:
        alpha, colour = tint
        rgb = rgb * (1 - alpha) + colour * alpha
    array[..., :3] = np.clip(np.round(rgb), 0, 255)
    return Image.fromarray(array.astype(np.uint8), 'RGBA')


def grade_for(room, figure):
    light = room.get('figureLight')
    if not light or figure not in light['figures']:
        return None
    return {**light, **light.get('perFigure', {}).get(figure, {})}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('ambient')
    parser.add_argument('out')
    parser.add_argument('--frame', type=int, default=None)
    parser.add_argument('--thad-x', type=int, default=None)
    parser.add_argument('--thad-y', type=int, default=None)
    parser.add_argument('--man', type=float, default=None)
    parser.add_argument('--pad', type=int, default=120)
    args = parser.parse_args()

    manifest = load('content/manifest.json')
    npc = next(n for n in (load(p) for p in manifest['ambient']) if n['id'] == args.ambient)
    room = next(r for r in (load(p) for p in manifest['rooms']) if r['id'] == npc['room'])
    plate = Image.open(os.path.join(ROOT, room['background'])).convert('RGBA')
    sprite = npc['sprite']
    sheet = Image.open(os.path.join(ROOT, sprite['sheet'])).convert('RGBA')
    frames = sprite['frames']
    index = args.frame if args.frame is not None else next(
        i for i, (fx, fy, fw, fh) in enumerate(frames) if sheet.crop((fx, fy, fx + fw, fy + fh)).getbbox())
    fx, fy, fw, fh = frames[index]
    figure = sheet.crop((fx, fy, fx + fw, fy + fh))
    x, y = npc['x'], npc['y']
    scale = 1.0
    if sprite.get('figureHeight'):
        scale = curve_man(room, x, y, carry=False) * sprite.get('stature', 1) / sprite['figureHeight']
    draw_w, draw_h = max(1, round(fw * scale)), max(1, round(fh * scale))
    figure = figure.resize((draw_w, draw_h), Image.NEAREST)
    below = 0 if sprite.get('footRow') is None else round((fh - 1 - sprite['footRow']) * draw_h / fh)
    left, top = x - draw_w // 2, y - draw_h + 1 + below
    figure = lit(figure, grade_for(room, npc['id']), mover_tint(room.get('lamps'), x, y))

    thad = load('content/actors/thad.json')
    stand = next(c for c in thad['clips'] if c['id'] == 'stand' and c['facing'] == 'front')
    body = Image.open(os.path.join(ROOT, stand['frames'][0])).convert('RGBA')
    ty = args.thad_y if args.thad_y is not None else y
    tx = args.thad_x if args.thad_x is not None else left - round(draw_w * 0.6) - 40
    man = args.man if args.man is not None else curve_man(room, tx, ty)
    k = man / stand['figureHeight']
    body = body.resize((max(1, round(body.width * k)), max(1, round(body.height * k))), Image.LANCZOS)
    ax, ay = stand['anchor']
    body_left, body_top = round(tx - ax * k), round(ty - ay * k)
    body = lit(body, grade_for(room, 'thad'), mover_tint(room.get('lamps'), tx, ty))

    canvas = plate.copy()
    layers = sorted([(y, figure, left, top), (ty, body, body_left, body_top)], key=lambda one: one[0])
    for _, image, lx, ly in layers:
        canvas.paste(image, (lx, ly), image)
    pad = args.pad
    x0 = max(0, min(left, body_left) - pad)
    x1 = min(canvas.width, max(left + draw_w, body_left + body.width) + pad)
    y0 = max(0, min(top, body_top) - pad // 2)
    y1 = min(canvas.height, max(y, ty) + pad // 2)
    canvas.crop((x0, y0, x1, y1)).convert('RGB').save(args.out)
    print(f"{args.out}: {npc['id']} frame {index} drawn {draw_w}x{draw_h} at {x},{y}; Thad {man:.0f} tall at {tx},{ty}")


if __name__ == '__main__':
    main()
