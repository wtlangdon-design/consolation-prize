"""Room 49, THE LINE: the two passages made one picture, mirrored (reference/fiddlers-gulch/brief.md: "49's two
passages must be indistinguishable in the picture"; doc 108: "Two passages that look exactly alike"). No image
operation here.

    python3 tools/art/room49-mirror.py

Reads art/staging/room-49/plate-01/source.png (room-49 operation 2, whose hash the ledger keeps) and writes
art/staging/room-49/plate-01/composed.png beside it: the left passage's frame -- its timbers, its mouth and the dark
inside -- flipped left-for-right and set over the right passage's frame. The passages are then mirror images, pixel
for pixel, so nothing in their drawing can say which is the way through.
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = os.path.join(ROOT, 'art/staging/room-49/plate-01')
LEFT = (378, 285, 622, 637)       # the left frame: outer edge of its posts, the top of its beam, the floor at its foot
RIGHT_X = 969                      # where the right frame's outer left edge stands, the same width

if __name__ == '__main__':
    img = Image.open(os.path.join(S, 'source.png')).convert('RGB')
    frame = img.crop(LEFT).transpose(Image.FLIP_LEFT_RIGHT)
    img.paste(frame, (RIGHT_X, LEFT[1]))
    img.save(os.path.join(S, 'composed.png'))
    print('composed', os.path.relpath(os.path.join(S, 'composed.png'), ROOT), 'frame', LEFT, '->', RIGHT_X)
