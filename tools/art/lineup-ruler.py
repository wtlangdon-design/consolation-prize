"""The eight townspeople beside the in-game Thad, before (origin/main) and after, each at one man = 300 px, with Thad's
crown and chin ruled across (errata 139: heads read by ruler -- hats, beards and a fiddle defeat a measure).
The boy at his stature. Usage: lineup-ruler.py <out.png> [--ref origin/main]"""
import io, json, subprocess, sys
from PIL import Image, ImageDraw
ROOT = '/home/user/consolation-prize'
REF = sys.argv[sys.argv.index('--ref') + 1] if '--ref' in sys.argv else 'origin/main'
NAMES = ['map-seller', 'pie-woman', 'message-boy', 'letter-writer', 'boundary-a', 'boundary-b', 'bell-ringer', 'fiddler']
MAN, CHIN = 300, 40                    # the in-game Thad's crown-to-chin at a 300 px man


def load(path, ref=None):
    if ref:
        return subprocess.check_output(['git', 'show', f'{ref}:{path}'], cwd=ROOT)
    return open(f'{ROOT}/{path}', 'rb').read()


def rest(name, ref=None):
    r = json.loads(load(f'content/ambient/{name}.json', ref)); s = r['sprite']
    x, y, w, h = s['frames'][0]
    f = Image.open(io.BytesIO(load(s['sheet'], ref))).convert('RGBA').crop((x, y, x + w, y + h))
    f = f.crop(f.getbbox())
    man = s.get('figureHeight') / (s.get('stature') or 1) if s.get('figureHeight') else f.height
    k = MAN / man
    return f.resize((max(1, round(f.width * k)), max(1, round(f.height * k))), Image.NEAREST)


thad = Image.open(f'{ROOT}/art/actors/thad-stand-front/stand-00.png').convert('RGBA'); thad = thad.crop(thad.getbbox())
thad = thad.resize((round(thad.width * MAN / thad.height), MAN), Image.NEAREST)
cols = []
for n in NAMES:
    cols.append((n, rest(n, REF), rest(n)))
W = 20 + thad.width + 30 + sum(max(b.width, a.width) * 2 + 40 for _, b, a in cols)
H = MAN + 120
out = Image.new('RGBA', (W, H), (110, 110, 110, 255)); d = ImageDraw.Draw(out)
base = H - 20
x = 20
out.alpha_composite(thad, (x, base - MAN)); d.text((x, 6), 'Thad', fill=(255, 255, 255, 255)); x += thad.width + 30
for n, b, a in cols:
    d.text((x, 6), n, fill=(255, 255, 255, 255)); d.text((x, 20), 'before | after', fill=(220, 220, 220, 255))
    out.alpha_composite(b, (x, base - b.height)); x2 = x + max(b.width, a.width) + 10
    out.alpha_composite(a, (x2, base - a.height)); x = x2 + max(b.width, a.width) + 30
for y, c in ((base - MAN, (0, 255, 255, 255)), (base - MAN + CHIN, (255, 255, 0, 255))):
    d.line([(0, y), (W, y)], fill=c, width=1)
out.convert('RGB').save(sys.argv[1])
print(sys.argv[1])
