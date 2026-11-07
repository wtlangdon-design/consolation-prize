"""Every visible figure's head beside a ruler, at one man's height (300 px), against the in-game Thad (crown to chin
~40). Read by eye: beards and hats defeat a measure. Usage: cast-heads-ruler.py <out.png>  (writes <out>-p0..N.png)
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw
ROOT='/home/user/consolation-prize'; os.chdir(ROOT)
m=json.load(open('content/manifest.json'))
rooms={}
for p in m['rooms']:
    r=json.load(open(p)); rooms[r['id']]=r
js=open('/dev/stdin').read() if False else None
def men(places):
    code=("import {readFileSync} from 'node:fs'; import {WalkBoxes, heightIn} from './engine/core/WalkBoxes.ts';"
          "const m=JSON.parse(readFileSync('content/manifest.json','utf8')); const rooms={}; for (const p of m.rooms){const r=JSON.parse(readFileSync(p,'utf8')); rooms[r.id]=r;}"
          f"const q={json.dumps(places)}; const out=q.map(([id,x,y])=>{{const r=rooms[id]; if(!r||!r.walkBoxes) return 0; const n=new WalkBoxes(r.walkBoxes,()=>true).nearest(x,y); return n?heightIn(n.box,y):0;}}); console.log(JSON.stringify(out));")
    return json.loads(subprocess.check_output(['node','--experimental-strip-types','--input-type=module','-e',code],stderr=subprocess.DEVNULL).decode().strip().splitlines()[-1])
jobs=[]
for p in m['ambient']:
    n=json.load(open(p)); s=n.get('sprite')
    if not s or not s.get('frames') or n.get('posture') in ('identity','animal','band','walking'): continue
    if n['room'] not in rooms or rooms[n['room']].get('candidateOf'): continue
    jobs.append((n['id'],n['room'],n['x'],n['y'],s,n.get('posture')))
mans=men([[j[1],j[2],j[3]] for j in jobs])
thad=Image.open('art/actors/thad-stand-front/stand-00.png').convert('RGBA'); thad=thad.crop(thad.getbbox())
def tile(label, im, k):
    im=im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.NEAREST)
    c=Image.new('RGBA',(max(im.width,120)+40,96),(60,60,70,255)); c.alpha_composite(im.crop((0,0,im.width,80)),(40,0))
    d=ImageDraw.Draw(c)
    for yy in range(0,81,5):
        d.line((0,yy,12 if yy%10 else 26,yy),fill=(255,255,0))
        if yy%10==0: d.text((27,yy-5),str(yy),fill=(255,255,0))
        if yy==40: d.line((40,yy,c.width,yy),fill=(255,60,60))
    d.text((3,84),label[:22],fill=(255,255,255)); return c
tiles=[tile('THAD (40)',thad,300/thad.height)]
meta=[]
for (id,room,x,y,s,post),man in zip(jobs,mans):
    fx,fy,fw,fh=s['frames'][0]; f=Image.open(s['sheet']).convert('RGBA').crop((fx,fy,fx+fw,fy+fh)); bb=f.getbbox()
    if not bb or man<=0: continue
    f=f.crop(bb)
    drawn_man = s['figureHeight']/s.get('stature',1) if s.get('figureHeight') else man
    k=300/drawn_man
    # standing: crown at top unless hat; tile shows top 80 rows
    tiles.append(tile(f'{len(meta)+1} {id}',f,k)); meta.append((len(meta)+1,id,room,post))
import math
for page in range(math.ceil((len(tiles)-1)/10)):
    group=[tiles[0]]+tiles[1+page*10:1+(page+1)*10]
    tw=max(t.width for t in group); th=group[0].height
    o=Image.new('RGB',(6*(tw+6),2*(th+6)),(20,20,20))
    for i,t in enumerate(group): o.paste(t.convert('RGB'),((i%6)*(tw+6),(i//6)*(th+6)))
    o=o.resize((o.width*3,o.height*3),Image.NEAREST); o.save(sys.argv[1].replace('.png',f'-p{page}.png'))
cols=8; tw=max(t.width for t in tiles); th=tiles[0].height
rows=(len(tiles)+cols-1)//cols
o=Image.new('RGB',(cols*(tw+6),rows*(th+6)),(20,20,20))
for i,t in enumerate(tiles): o.paste(t.convert('RGB'),((i%cols)*(tw+6),(i//cols)*(th+6)))
o=o.resize((o.width*2,o.height*2),Image.NEAREST); o.save(sys.argv[1]); json.dump(meta,open(sys.argv[1]+'.json','w')); print(len(tiles), o.size)
