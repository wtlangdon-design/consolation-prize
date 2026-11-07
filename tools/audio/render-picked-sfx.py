"""THE STAMP AND THE STREET ERUPTING, picked by ear (Tyler, 2026-11-06; errata 149).

    stamp.wav          U-STAMP: "B · Ink pad, then stamp" -- a soft dab on the
                       ink pad, then a dull thump of rubber on paper on a wooden
                       counter, and the small lift. No pitched ring.
    crowd-erupts.wav   F4-ERUPTS: "B · Cheering" -- applause, two-finger
                       whistles, whoops and shouts, boots on the boardwalk.

Tyler, of the first versions: "Erupts in applause, or what? I couldn't even
tell what I was listening to." and "The stamp doesn't sound like a stamp." The
old stamp (render-everyday-sfx.py) was three resonant modes and rang like a
small wood block; the old eruption (render-duel-sfx.py) was the Nugget's murmur
layered and swelled, with nothing in it that cheers. Three versions of each were
played to him alone and in the scene (A, B, C); he chose "B and B".

THIS SCRIPT RENDERS ALL SIX CANDIDATES IN THE ORDER THEY WERE AUDITIONED, from
one seeded generator, so the two picked are the same samples he heard, and
writes only those two. Changing the order or the seed changes the sounds.

    python3 tools/audio/render-picked-sfx.py
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

R = 44100
OUT = Path(__file__).resolve().parents[2] / 'audio' / 'sfx'
rng = np.random.default_rng(77)
PICKED = {'stamp-b-pad-then-stamp': 'stamp.wav', 'crowd-b-cheering': 'crowd-erupts.wav'}

def n_of(s): return int(round(s*R))
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo,hi],btype='band',fs=R,output='sos'),x)
def lp(x,hz,o=4): return sosfilt(butter(o,hz,fs=R,output='sos'),x)
def hp(x,hz,o=2): return sosfilt(butter(o,hz,btype='high',fs=R,output='sos'),x)
def place(d,s,at,g=1.0):
    i=n_of(at); m=min(len(s),len(d)-i)
    if m>0 and i>=0: d[i:i+m]+=s[:m]*g
def expdec(n,tau): return np.exp(-np.arange(n)/(tau*R))
def save(name,x,peak=0.9):
    x=lp(x,11000,2); x=x-x.mean(); x=x/(np.abs(x).max()+1e-9)*peak
    if name not in PICKED: return
    f=str(OUT / PICKED[name])
    with wave.open(f,'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(R);w.writeframes((x*32767).astype('<i2').tobytes())
    print(PICKED[name], round(len(x)/R,2))
# ---------- STAMPS: no pitched ring; a dull thud with a paper slap
def thud(dur=0.09, lo=60, hi=380, tau=0.018):
    n=n_of(dur); return lp(hp(rng.normal(0,1,n),lo),hi)*expdec(n,tau)
def slap(dur=0.03, lo=1200, hi=6000, tau=0.004):
    n=n_of(dur); return bp(rng.normal(0,1,n),lo,hi)*expdec(n,tau)
def stamp_a():   # one firm stamp: rubber on paper on a wooden counter
    x=np.zeros(n_of(0.45)); place(x,thud(),0,1.0); place(x,slap(),0,0.55)
    place(x,slap(0.02,2500,7000,0.003),0.16,0.08)   # lifting off
    return x
def stamp_b():   # ink pad dab, then the stamp
    x=np.zeros(n_of(0.8)); place(x,thud(0.06,120,600,0.01),0,0.25); place(x,slap(0.02,800,3000,0.004),0,0.15)
    place(x,thud(),0.38,1.0); place(x,slap(),0.38,0.55); place(x,slap(0.02,2500,7000,0.003),0.55,0.08)
    return x
def stamp_c():   # heavier: a wooden-handled stamp struck down hard, a knock in the counter
    x=np.zeros(n_of(0.5)); place(x,thud(0.14,45,260,0.035),0,1.0)
    n=n_of(0.05); knock=bp(rng.normal(0,1,n),300,900)*expdec(n,0.008); place(x,knock,0,0.6)
    place(x,slap(0.035,1000,5000,0.006),0.002,0.45); return x
for k,f in [('stamp-a-firm',stamp_a),('stamp-b-pad-then-stamp',stamp_b),('stamp-c-heavy',stamp_c)]: save(k,f(),0.85)
# ---------- CROWD: applause, whistles, whoops
def clap():
    n=n_of(0.05); c=rng.uniform(900,2600)
    return bp(rng.normal(0,1,n),c*0.5,c*1.6)*expdec(n,rng.uniform(0.006,0.012))+0.3*bp(rng.normal(0,1,n),300,800)*expdec(n,0.006)
def applause(dur, people, shape):
    x=np.zeros(n_of(dur))
    for p in range(people):
        rate=rng.uniform(3.2,5.0); t=rng.uniform(0,0.4); g=rng.uniform(0.4,1.0)
        while t<dur:
            if rng.random()<shape(t): place(x,clap(),t,g*rng.uniform(0.7,1.0))
            t+=1/rate*rng.uniform(0.85,1.15)
    return x
def whistle(dur=0.7):
    n=n_of(dur); t=np.arange(n)/R; f0=rng.uniform(2100,2900)
    f=f0+np.interp(t,[0,dur*0.25,dur*0.6,dur],[-500,250,350,-700])+25*np.sin(2*np.pi*6*t)
    ph=2*np.pi*np.cumsum(f)/R; e=np.interp(t,[0,0.04,dur*0.8,dur],[0,1,0.8,0])
    return (np.sin(ph)*0.6+0.15*bp(rng.normal(0,1,n),2000,4000))*e
def glottal(f0s,dur):
    n=n_of(dur); out=np.zeros(n); t=0.0; i=0
    while i<n:
        out[i]=1; p=np.interp(i/n,np.linspace(0,1,len(f0s)),f0s)*(1+rng.normal(0,0.02)); t+=1/p; i=n_of(t)
    return lp(out,3500,2)
FORM={'a':(750,1150,2500),'u':(350,800,2300),'e':(450,1900,2550),'i':(300,2200,2900)}
def vowel(src,which):
    o=np.zeros_like(src)
    for f,a,bw in zip(FORM[which],(1,0.6,0.25),(90,110,160)): o+=a*bp(src,max(60,f-bw),f+bw,1)
    return o
def whoop():  # "woo!" -- a rising, then falling voice
    dur=rng.uniform(0.45,0.8); base=rng.uniform(170,260)
    src=glottal([base,base*1.7,base*1.9,base*1.4],dur)
    v=vowel(src,'u'); v=v*np.sin(np.linspace(0,np.pi,len(v)))**0.6
    return v
def hey():
    dur=rng.uniform(0.25,0.4); base=rng.uniform(180,280)
    src=glottal([base*1.2,base*1.5,base],dur); n=len(src)
    h=bp(rng.normal(0,1,n_of(0.05)),800,3000)*np.hanning(n_of(0.05))*0.4
    v=vowel(src,'e')*np.sin(np.linspace(0,np.pi,n))**0.5
    return np.concatenate([h,v])
def stomp():
    n=n_of(0.12); return lp(hp(rng.normal(0,1,n),50),400)*expdec(n,0.025)+0.4*bp(rng.normal(0,1,n),300,1200)*expdec(n,0.01)
dur=6.5
sw=lambda t: float(np.clip(t/0.35,0,1)*np.clip(1-(t-2.6)/3.6,0,1)) if t>0 else 0
# A: applause and whistles
x=applause(dur,32,sw)
for k in range(5): place(x,whistle(rng.uniform(0.5,0.9)),rng.uniform(0.2,2.8),0.35)
save('crowd-a-applause-whistles',x,0.9)
# B: A + whoops and shouts, boots on the boardwalk
x=applause(dur,30,sw)
for k in range(4): place(x,whistle(rng.uniform(0.5,0.9)),rng.uniform(0.2,2.8),0.3)
for k in range(9): place(x,whoop(),rng.uniform(0.05,2.6),rng.uniform(0.35,0.6))
for k in range(7): place(x,hey(),rng.uniform(0.1,2.4),rng.uniform(0.3,0.5))
t=0.1
while t<3.2: place(x,stomp(),t,0.5*sw(t)); t+=rng.uniform(0.18,0.35)
save('crowd-b-cheering',x,0.9)
# C: a cheer swells (voices) then breaks into applause
x=np.zeros(n_of(dur))
for k in range(14): place(x,whoop(),rng.uniform(0.0,0.6),rng.uniform(0.3,0.55))
for k in range(8): place(x,hey(),rng.uniform(0.0,0.7),rng.uniform(0.3,0.5))
x+=applause(dur,28,lambda t: float(np.clip((t-0.4)/0.5,0,1)*np.clip(1-(t-2.8)/3.4,0,1)))
for k in range(3): place(x,whistle(),rng.uniform(0.8,2.6),0.3)
save('crowd-c-cheer-then-applause',x,0.9)
