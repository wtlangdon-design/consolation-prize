"""
PLACE THE GLOWS (errata 298). Tyler, 2026-11-13, after Main Street's lamps and windows were made to glow and pulse
(errata 297): "I thought you were doing that treatment to every room already." This finds every dark room's lights
from the plate's own pixels and writes a `glow` for each into the room's annotation, on its own period and seed.

A light is a warm-lit patch with a white-hot core: at least 20 core pixels and six per cent of the patch, clearly
brighter than its surroundings, and, outdoors, not on the ground (a reflection in the mud is not a lamp). And the
patch at each lamp the room already declares (placed by eye at a real flame), whatever its size. Daylight rooms,
the coffin and the listening chamber (invariants 2 and 8), the dawn rooms and the map get none. Main Street's were
placed by hand (errata 297) and are left as they are.

    python3 tools/art/place-glows.py plan <plan.json> <sheet dir>    # find, and draw review sheets
    python3 tools/art/place-glows.py write <plan.json>               # write the annotations; then compile the rooms
"""
import json,glob,os,sys,re
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def lights(path):
  im=np.array(Image.open(path).convert('RGB')).astype(float)
  r,g,b=im[...,0],im[...,1],im[...,2]; lum=r*.3+g*.59+b*.11
  lit=(r>120)&(g>70)&(r-b>60)&(lum>80)
  lab,n=ndimage.label(ndimage.binary_dilation(lit,structure=np.ones((5,5))))
  out=[]
  H,W=lum.shape
  for i,s in enumerate(ndimage.find_objects(lab)):
    ys,xs=s; m=(lab[s]==i+1)&lit[s]; cnt=int(m.sum())
    w=xs.stop-xs.start; h=ys.stop-ys.start
    if cnt<50 or w<12 or h<12 or w>220 or h>220: continue
    y0,y1=max(0,ys.start-14),min(H,ys.stop+14); x0,x1=max(0,xs.start-14),min(W,xs.stop+14)
    ring=lum[y0:y1,x0:x1].copy(); inner=np.zeros_like(ring,bool); inner[ys.start-y0:ys.stop-y0, xs.start-x0:xs.stop-x0]=True
    ringmean=ring[~inner].mean() if (~inner).any() else 0
    pm=lum[s][m].mean()
    core=int(((r[s]>=235)&(g[s]>=165)&m).sum())
    if pm-ringmean<35: continue
    out.append(dict(core=core,x=int(xs.start),y=int(ys.start),w=int(w),h=int(h),count=cnt,contrast=round(pm-ringmean),peak=int(lum[s][m].max())))
  return out

from PIL import ImageDraw
SKIP={'coffin','listening_chamber','coach_stop_dawn','main_street_dawn','town_map','main_street','mine_adit','empty_storefront'}
mode=sys.argv[1]  # 'plan' or 'write'
plan={}
for f in sorted(glob.glob(f'{ROOT}/content/rooms/*.json')):
  d=json.load(open(f)); rid=d.get('id'); bg=d.get('background')
  if not rid or not bg or 'staging' in bg or rid in SKIP: continue
  m=re.search(r'room-(\d+)-',bg)
  if not m: continue
  num=int(m.group(1)); ann=f'{ROOT}/reference/room-{num:02d}/annotation.json'
  if not os.path.exists(ann): print('no annotation',rid); continue
  im=np.array(Image.open(f'{ROOT}/{bg}').convert('L').resize((200,50))).astype(float)
  if im.mean()>=50: continue    # daylight: no lamp is lit against the sun
  full=np.array(Image.open(f'{ROOT}/{bg}').convert('RGB')).astype(float)
  H=full.shape[0]; top=full[:H//10]
  exterior=(top[...,2]>top[...,0]+15).mean()>0.5     # a night sky across the top: an outdoor room
  EXCLUDE={('photographers_studio',1130,293),       # the camera's brass, which glints like a flame
           ('the_lane',580,359),                   # the photographer's portrait, lit by his lantern, not a light
           ('clarion',1460,122),                   # over the press, which completes a puzzle (invariant 9)
           ('ozymandias_tent',1119,497)}           # over the stake, which completes a puzzle (invariant 9)
  L=[l for l in lights(f'{ROOT}/{bg}') if l['core']>=20 and l['core']/l['count']>=0.06 and l['contrast']>=50
     and not (exterior and (l['y']+l['h']/2)/H>0.66) and (rid,l['x'],l['y']) not in EXCLUDE]
  # AND THE LIGHT AT EACH LAMP THE ROOM ALREADY DECLARES (placed by eye at a real flame): the lit patch nearest it.
  allp=[l for l in lights(f'{ROOT}/{bg}') if l['core']>=4 and (rid,l['x'],l['y']) not in EXCLUDE]
  for lamp in d.get('lamps') or []:
    ax,ay=lamp['at']; best=None; bd=1e9
    for l in allp:
      cx=l['x']+l['w']/2; cy=l['y']+l['h']/2; dd=((cx-ax)**2+(cy-ay)**2)**0.5
      if dd<min(160,lamp['radius']*0.6) and dd<bd: best,bd=l,dd
    if best and best not in L: L.append(best)
  L=sorted(L,key=lambda l:-l['count'])[:24]
  if not L: continue
  plan[rid]=dict(num=num,ann=ann,bg=bg,lights=L,file=f)
if mode=='plan':
  for rid,p in plan.items(): print(rid,len(p['lights']))
  json.dump(plan,open(sys.argv[2],'w'),indent=1)
  # contact sheet: each room plate scaled to 600 wide with boxes
  tiles=[]
  for rid,p in plan.items():
    im=Image.open(f"{ROOT}/{p['bg']}").convert('RGB'); s=600/im.width
    t=im.resize((600,int(im.height*s))); dr=ImageDraw.Draw(t)
    for l in p['lights']: dr.rectangle([l['x']*s-2,l['y']*s-2,(l['x']+l['w'])*s+2,(l['y']+l['h'])*s+2],outline=(0,255,0))
    dr.text((4,4),rid,fill=(255,255,255)); tiles.append(t)
  for k in range(0,len(tiles),6):
    group=tiles[k:k+6]; H=sum(t.height for t in group[::2])
    cols=2; rows=(len(group)+1)//2; hmax=max(t.height for t in group)
    sheet=Image.new('RGB',(1210,rows*(hmax+6)),(0,0,0))
    for i,t in enumerate(group): sheet.paste(t,((i%2)*605,(i//2)*(hmax+6)))
    sheet.save(f"{sys.argv[3]}/sheet-{k//6}.png")
else:
  plan=json.load(open(sys.argv[2]))
  import random
  for rid,p in plan.items():
    raw=open(p['ann']).read(); a=json.loads(raw)
    a['motion']=[m for m in a.get('motion',[]) if m.get('kind')!='glow']
    # A light that already swings (a `sway`) or lies on running water is left to that: a glow over it would draw it
    # twice, once moved and once not.
    moving=[m['rect'] for m in a['motion'] if m.get('kind') in ('sway','shimmer','scroll')]
    ov=lambda q,b: not (q[0]+q[2]<=b[0] or b[0]+b[2]<=q[0] or q[1]+q[3]<=b[1] or b[1]+b[3]<=q[1])
    p['lights']=[l for l in p['lights'] if not any(ov([l['x']-2,l['y']-2,l['w']+4,l['h']+4],r) for r in moving)]
    n=len(p['lights'])
    rates=[round(0.05+0.23*i/max(1,n-1),3) for i in range(n)]
    rng=random.Random(p['num']*1009); rng.shuffle(rates)
    for i,l in enumerate(p['lights']):
      flame=l['count']<900 and l['peak']>=200
      g={"kind":"glow","id":f"glow_{i+1}","rect":[l['x']-2,l['y']-2,l['w']+4,l['h']+4],"rate":rates[i],"seed":p['num']*100+i+1,"amount":0.5 if flame else 0.38}
      if flame: g["flame"]=True; g["halo"]=int(min(110,max(40,1.5*max(l['w'],l['h']))))
      if i==0: g["note"]='Errata 298: the room\'s lit lamps and windows, found from the plate\'s own lit pixels (tools/art/place-glows.py), each swelling and sinking on its own period (errata 297).'
      a.setdefault('motion',[]).append(g)
    indent=2 if raw.startswith('{\n  "') else 1
    open(p['ann'],'w').write(json.dumps(a,indent=indent,ensure_ascii=False)+'\n')
    print('wrote',rid,n)
