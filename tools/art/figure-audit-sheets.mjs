// EVERY FIGURE IN HIS ROOM, CROPPED AROUND HIM, AT TWICE GAME SIZE: the sheets a
// person looks through before anyone else has to (Tyler, 2026-11-06: "The old
// man is super weirdly short and stout. The man in the blue jacket is a bad
// cutout. PLEASE catch things like this."). Drawn as the engine draws them --
// bottom-centre on x, y, scaled by the room's man over figureHeight -- on the
// room's plate, with Thad standing beside each at the same depth for scale, and
// punched out by the occlusion plane the figure is assigned (clipPlane).
//
//   node --experimental-strip-types tools/art/figure-audit-sheets.mjs <out dir>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { WalkBoxes, heightIn } from '../../engine/core/WalkBoxes.ts';

const ROOT = resolve(new URL('../..', import.meta.url).pathname);
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), 'utf8'));
const m = read('content/manifest.json');
const rooms = new Map(m.rooms.map((p) => { const r = read(p); return [r.id, r]; }));
const jobs = [];
for (const p of m.ambient) {
  const n = read(p);
  const places = [{ room: n.room, x: n.x, y: n.y, sprite: n.sprite, posture: n.posture },
    ...Object.entries(n.placements ?? {}).map(([room, a]) => ({ room, x: a.x ?? n.x, y: a.y ?? n.y, sprite: a.sprite ?? n.sprite, posture: a.posture ?? n.posture }))];
  for (const pl of places) {
    const r = rooms.get(pl.room);
    if (!r?.background || !pl.sprite?.frames?.length || r.candidateOf || pl.posture === 'identity') continue;
    let man = 0;
    if (r.walkBoxes) { const near = new WalkBoxes(r.walkBoxes, () => true).nearest(pl.x, pl.y); man = near ? heightIn(near.box, pl.y) : 0; }
    const scale = pl.sprite.figureHeight ? man * (pl.sprite.stature ?? 1) / pl.sprite.figureHeight : 1;
    // AND WHAT STANDS IN FRONT OF HIM (errata 135): a figure assigned an occlusion plane (clipPlane) is
    // punched out by that plane's mask, as Renderer.drawOccluded does -- Ozymandia's ball is in front of
    // her. Drawn without it, a sheet showed her in front of the ball, which the game never does.
    const plane = n.clipPlane !== undefined
      ? (r.occlusionPlanes ?? []).find((one) => one.level === n.clipPlane && !one.maskPending) : undefined;
    jobs.push({ id: n.id, room: pl.room, plate: r.background, sheet: pl.sprite.sheet, frame: pl.sprite.frames[0], x: pl.x, y: pl.y, scale, man,
      ...(plane ? { mask: plane.mask } : {}) });
  }
}
const out = process.argv[2];
mkdirSync(out, { recursive: true });
writeFileSync(`${out}/jobs.json`, JSON.stringify(jobs));
execFileSync('python3', ['-c', `
import json, sys
from PIL import Image, ImageDraw
jobs=json.load(open(sys.argv[1])); out=sys.argv[2]
thad=Image.open('art/actors/thad-stand-front/stand-00.png').convert('RGBA'); thad=thad.crop(thad.getbbox())
tiles=[]
for j in jobs:
    plate=Image.open(j['plate']).convert('RGBA'); x,y,w,h=j['frame']
    f=Image.open(j['sheet']).convert('RGBA').crop((x,y,x+w,y+h))
    W,H=max(1,round(w*j['scale'])),max(1,round(h*j['scale']))
    f=f.resize((W,H),Image.NEAREST)
    left,top=j['x']-W//2,j['y']-H+1
    if j['man']>0:
        t=thad.resize((max(1,round(thad.width*j['man']/thad.height)),round(j['man'])),Image.NEAREST)
        tx=left-t.width-12
        if tx<0: tx=left+W+12
        plate.alpha_composite(t,(tx,j['y']-t.height+1)); l2=min(left,tx); r2=max(left+W,tx+t.width)
    else: l2,r2=left,left+W
    layer=Image.new('RGBA',plate.size,(0,0,0,0)); layer.alpha_composite(f,(left,top))
    if j.get('mask'):
        hole=Image.open(j['mask']).convert('L')
        a=layer.getchannel('A'); a.paste(0,(0,0),hole); layer.putalpha(a)
    plate.alpha_composite(layer)
    box=(max(0,l2-20),max(0,top-20),min(plate.width,r2+20),min(plate.height,j['y']+24))
    c=plate.crop(box); c=c.resize((c.width*2,c.height*2),Image.NEAREST)
    d=ImageDraw.Draw(c); d.rectangle((0,0,c.width,22),fill=(0,0,0)); d.text((4,4),j['id']+' / '+j['room'],fill=(255,255,0))
    tiles.append(c)
page=0
while tiles:
    batch=tiles[:6]; tiles=tiles[6:]
    W=sum(t.width for t in batch)+10*len(batch); H=max(t.height for t in batch)
    o=Image.new('RGB',(W,H),(30,30,30)); xx=0
    for t in batch: o.paste(t,(xx,0)); xx+=t.width+10
    s=min(1.0, 2600/W); o=o.resize((int(W*s),int(H*s)),Image.NEAREST)
    o.save(f'{out}/audit-{page:02d}.png'); page+=1
print(page)
`, `${out}/jobs.json`, out], { cwd: ROOT, stdio: 'inherit' });
