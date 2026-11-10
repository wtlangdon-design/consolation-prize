"""THREE SOUNDS FOR THINGS DESCRIBED AND NOT HEARD, picked by ear (doc 122 P1; Tyler, 2026-11-10; errata 257).

    ozymandia-hum.wav   R16-HUM: Madame Ozymandia humming on one note over the map. "It is nearly an A, and nearly is
                        the trouble": 35 cents under, a closed mouth, and it stops dead where the line stops.
    press-pull.wav      R09-PULL: the bar hauled round, the platen down on the bed, the bar back, the knock on the
                        return stroke, and one sheet peeled off wet.
    nail-taps.wav       R14-NAIL: three taps with the tuning fork on a nail in a board. A tick and the wood, with a
                        trace of the fork's A (exactly 440: the fork is the one true thing in town), gone at once.

Two of each were played to Tyler. Of the hums and the presses: "The hums and press are good" (A of each is used). Of the
first nails: "like the ring of hitting glass. The rings should be much fainter and quicker." Two more were made; of
those, "Those are both good" (C is used: it keeps a trace of the A, because his line says each tap is one).

THIS SCRIPT RENDERS EVERY CANDIDATE IN THE ORDER IT WAS AUDITIONED, from the two seeded generators, so the three picked
are the same samples he heard, and writes only those three. Changing the order or a seed changes the sounds.

    python3 tools/audio/render-second-audit-sfx.py
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

R = 44100
OUT = Path(__file__).resolve().parents[2] / 'audio' / 'sfx'
PICKED = {'hum-a-steady.wav': 'ozymandia-hum.wav', 'press-a-pulled.wav': 'press-pull.wav', 'nail-c-faint-ring.wav': 'nail-taps.wav'}

# ---------- THE FIRST AUDITION: two hums, two presses, two nails (the nails were not picked)
rng = np.random.default_rng(122)
def n_of(s): return int(round(s*R))
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo,hi],btype='band',fs=R,output='sos'),x)
def lp(x,hz,o=4): return sosfilt(butter(o,hz,fs=R,output='sos'),x)
def hp(x,hz,o=2): return sosfilt(butter(o,hz,btype='high',fs=R,output='sos'),x)
def place(d,s,at,g=1.0):
    i=n_of(at); m=min(len(s),len(d)-i)
    if m>0 and i>=0: d[i:i+m]+=s[:m]*g
def expdec(n,tau): return np.exp(-np.arange(n)/(tau*R))
def save(name,x,peak=0.85):
    x=lp(x,11000,2); x=x-x.mean(); x=x/(np.abs(x).max()+1e-9)*peak
    if name not in PICKED: return
    with wave.open(str(OUT / PICKED[name]),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(R);w.writeframes((x*32767).astype('<i2').tobytes())
    print(PICKED[name], round(len(x)/R,2))

# ---------- THE HUM: a woman humming on one note, "nearly an A" (flat), closed mouth
def hum(dur, cents, wander, breathy, stop_abrupt):
    n=n_of(dur); t=np.arange(n)/R
    f0=220.0*2**(cents/1200)                      # the A below middle C's octave: a contralto's hum
    vib=5.2+0.3*np.sin(2*np.pi*0.21*t)
    drift=wander*np.cumsum(rng.normal(0,1,n))/np.sqrt(R)   # slow unsteadiness, in cents
    drift=lp(drift,2.0,2)
    depth=np.clip((t-0.5)/1.0,0,1)*9               # vibrato arrives late, as a held note's does
    cents_t=depth*np.sin(2*np.pi*np.cumsum(vib)/R)+drift
    f=f0*2**(cents_t/1200); ph=2*np.pi*np.cumsum(f)/R
    x=np.zeros(n)
    for k,a in enumerate([1.0,0.42,0.16,0.07,0.03,0.012],1): x+=a*np.sin(k*ph+rng.uniform(0,6.28))
    x=lp(x,900,2)+0.25*bp(x,250,450)                # a closed mouth: the nose's resonance, no brightness
    x+=breathy*bp(rng.normal(0,1,n),300,2500)*0.02
    env=np.clip(t/0.35,0,1)
    if stop_abrupt: env*=np.clip((dur-t)/0.04,0,1)   # she stops where the line stops
    else: env*=np.clip((dur-t)/0.5,0,1)
    env*=1+0.05*np.sin(2*np.pi*0.7*t)
    return x*env
save('hum-a-steady.wav', hum(4.2,-35,6,1.0,True),0.6)          # steady, 35 cents under A, stops dead
save('hum-b-wandering.wav', hum(4.6,-45,22,1.6,True),0.6)       # more uncertain of the note, breathier

# ---------- THE PRESS: the bar hauled, the platen down, the knock on the return, a sheet peeled
def creak(dur,f1,f2):
    n=n_of(dur); t=np.arange(n)/R; f=np.linspace(f1,f2,n)
    saw=2*((np.cumsum(f)/R)%1)-1
    stick=(rng.random(n)<0.004).astype(float); stick=np.convolve(stick,np.ones(n_of(0.004)),'same')
    x=bp(saw*(0.4+stick),300,1800)*np.hanning(n); return x
def thump(dur,lo,hi,tau):
    n=n_of(dur); return lp(hp(rng.normal(0,1,n),lo),hi)*expdec(n,tau)
def iron(f,dur,tau):
    n=n_of(dur); t=np.arange(n)/R
    return (np.sin(2*np.pi*f*t)+0.5*np.sin(2*np.pi*f*2.76*t)+0.25*np.sin(2*np.pi*f*5.4*t))*expdec(n,tau)
def peel(dur):
    n=n_of(dur); return bp(rng.normal(0,1,n),1500,7000)*np.hanning(n)*(0.6+0.4*rng.random(n))
def press(heavy):
    x=np.zeros(n_of(3.0))
    place(x,creak(0.7,110,150 if not heavy else 135),0.0,0.35)          # the bar comes round
    place(x,thump(0.35,35,220,0.07 if heavy else 0.05),0.72,1.0)       # the platen meets the bed
    place(x,iron(210,0.5,0.09),0.72,0.18)
    place(x,creak(0.5,150,105),1.15,0.25)                              # the bar goes back
    place(x,thump(0.09,90,700,0.015),1.72,0.5)                         # the knock on the return stroke
    place(x,iron(640,0.25,0.03),1.72,0.2)
    place(x,peel(0.45),2.2,0.12)                                       # one sheet, wet
    return x
save('press-a-pulled.wav', press(False))
save('press-b-heavier.wav', press(True))

# ---------- THE NAIL: three taps with the tuning fork, "each tap an A" (exactly 440: the fork is the one true thing)
def tap(g, ring):
    n=n_of(1.4); t=np.arange(n)/R; x=np.zeros(n)
    k=bp(rng.normal(0,1,n_of(0.03)),1800,6500)*expdec(n_of(0.03),0.004)     # steel on a nail head
    x[:len(k)]+=k*0.8
    x[:n_of(0.08)]+=thump(0.08,150,900,0.012)*0.5                          # the board takes it
    fork=np.sin(2*np.pi*440.0*t)*np.exp(-t/ring)+0.08*np.sin(2*np.pi*440.0*6.27*t)*np.exp(-t/0.04)
    x+=fork*0.5
    return x*g
def nail(gap, ring):
    x=np.zeros(n_of(gap*2+1.6))
    for i,g in enumerate([0.8,0.9,1.0]): place(x,tap(g,ring),i*gap)
    return x
save('nail-a-three-taps.wav', nail(0.55,0.5))
save('nail-b-ringing.wav', nail(0.75,1.0))

# ---------- THE SECOND AUDITION: the nail again, fainter and quicker. Its own generator and its own low-pass.
rng = np.random.default_rng(123)
def n_of(s): return int(round(s*R))
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo,hi],btype='band',fs=R,output='sos'),x)
def lp(x,hz,o=4): return sosfilt(butter(o,hz,fs=R,output='sos'),x)
def hp(x,hz,o=2): return sosfilt(butter(o,hz,btype='high',fs=R,output='sos'),x)
def place(d,s,at,g=1.0):
    i=n_of(at); m=min(len(s),len(d)-i)
    if m>0 and i>=0: d[i:i+m]+=s[:m]*g
def expdec(n,tau): return np.exp(-np.arange(n)/(tau*R))
def save(name,x,peak=0.85):
    x=lp(x,9000,2); x=x-x.mean(); x=x/(np.abs(x).max()+1e-9)*peak
    if name not in PICKED: return
    with wave.open(str(OUT / PICKED[name]),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(R);w.writeframes((x*32767).astype('<i2').tobytes())
    print(PICKED[name], round(len(x)/R,2))
def tap(g, ring_gain, ring_tau, wood):
    n=n_of(0.6); t=np.arange(n)/R; x=np.zeros(n)
    k=bp(rng.normal(0,1,n_of(0.02)),1200,4500)*expdec(n_of(0.02),0.003)       # steel on a nail head: a tick, not a chime
    x[:len(k)]+=k*0.55
    m=n_of(0.12); body=lp(hp(rng.normal(0,1,m),90),600)*expdec(m,0.02)         # the board takes it
    x[:m]+=body*wood
    knock=np.sin(2*np.pi*185*t[:m])*expdec(m,0.025); x[:m]+=knock*wood*0.6     # the board's own low note
    x+=np.sin(2*np.pi*440.0*t)*np.exp(-t/ring_tau)*ring_gain                   # the fork: an A, faint and gone
    return x*g
def nail(gap, ring_gain, ring_tau, wood):
    x=np.zeros(n_of(gap*2+0.7))
    for i,g in enumerate([0.8,0.9,1.0]): place(x,tap(g,ring_gain,ring_tau,wood),i*gap)
    return x
save('nail-c-faint-ring.wav', nail(0.45,0.10,0.09,1.0))     # mostly wood and tick; the A is a trace
save('nail-d-fainter-still.wav', nail(0.45,0.05,0.06,1.2))  # the A barely there
