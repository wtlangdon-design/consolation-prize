"""Style references for errata 110's townspeople: Thad, at game size, standing
where Thad stands to talk to each new figure, on the room's own plate (CLAUDE.md
character style gate, step 1: 'Attach a frame of Thad in the room the character
will stand in'). Composed offline from the shipping plate and Thad's stand
frame scaled to the room's curve at his feet -- no room light, which the game
adds; the generator is shown his drawing, not a lighting state. Art plumbing
only; no content.

    python3 tools/art/townspeople-refs.py
"""
import json
import os

from PIL import Image

R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + '/'
OUT = R + 'reference/townspeople/'
FIGURES = {   # ambient file -> (room file, plate)
    'message-boy': ('main-street', 'room-02-main-street'),
    'man-leaving-tomorrow': ('main-street', 'room-02-main-street'),
    'boundary-a': ('main-street', 'room-02-main-street'),
    'dogs-owner': ('back-alley', 'room-20-back-alley'),
    'fiddler': ('nugget', 'room-03-nugget'),
}


def man_at(room, x, y):
    """The height of a man whose feet are at (x, y): the walk box's curve."""
    for box in room['walkBoxes']:
        xs = [p['x'] for p in box['points']]
        ys = [p['y'] for p in box['points']]
        if min(xs) <= x <= max(xs) and min(ys) <= y <= max(ys):
            mode = box['scaleMode']
            if mode['kind'] == 'fixed':
                return mode['height']
            pts = sorted([(mode['farY'], mode['farHeight']), *[tuple(s) for s in mode.get('samples', [])],
                          (mode['nearY'], mode['nearHeight'])])
            for (y0, h0), (y1, h1) in zip(pts, pts[1:]):
                if y0 <= y <= y1:
                    return h0 + (h1 - h0) * (y - y0) / (y1 - y0)
            return pts[-1][1]
    raise SystemExit(f'({x},{y}) is in no walk box')


def thad(facing, height):
    frame = Image.open(f'{R}art/actors/thad-stand-{facing}/stand-00.png').convert('RGBA')
    frame = frame.crop(frame.getbbox())
    scale = height / frame.height
    return frame.resize((max(1, round(frame.width * scale)), round(height)), Image.NEAREST)


for name, (room_file, plate) in FIGURES.items():
    npc = json.load(open(f'{R}content/ambient/{name}.json'))
    room = json.load(open(f'{R}content/rooms/{room_file}.json'))
    stand = npc['walkTo']
    picture = Image.open(f'{R}art/backgrounds/{plate}.png').convert('RGBA')
    height = man_at(room, stand['x'], stand['y'])
    him = thad(stand['facing'], height)
    picture.alpha_composite(him, (round(stand['x'] - him.width / 2), round(stand['y'] - him.height)))
    # The frame a player sees: 1920 wide, centred on where they will stand.
    left = max(0, min(picture.width - 1920, round((stand['x'] + npc['x']) / 2 - 960)))
    frame = picture.crop((left, 0, left + 1920, 864)).convert('RGB')
    frame.save(f'{OUT}{name}-style-reference.png')
    # And close: Thad and the spot the new figure stands on, doubled, nearest.
    cx, cy = (stand['x'] + npc['x']) / 2, stand['y'] - height / 2
    half_w, half_h = max(300, height * 1.6), max(170, height * 0.9)
    box = (round(cx - half_w), round(cy - half_h), round(cx + half_w), round(cy + half_h))
    crop = picture.crop(box).convert('RGB')
    crop = crop.resize((crop.width * 2, crop.height * 2), Image.NEAREST)
    crop.save(f'{OUT}{name}-style-reference-crop.png')
    print(f'{name:22s} Thad {height:5.1f}px at ({stand["x"]},{stand["y"]}) facing {stand["facing"]}; '
          f'figure at ({npc["x"]},{npc["y"]}), a man there is {man_at(room, npc["x"], npc["y"]):.1f}px')
