# Retracing Room 1: what it costs, and what it is blocked on

Two questions answered before the work rather than after.

---

## 1 · The geometry does not move. This part is nearly free.

Measured by taking the centroid of high-contrast structure inside every wired
hotspot rect, in the composed render and in the quantised bar:

| hotspot | shift | |
|---|---|---|
| team | 0.31 px | |
| coach / coach_gone | 0.41 px | |
| case_mud | 0.42 px | |
| case_roof | 0.45 px | |
| lamp / lamp_gone | 0.63 px | |
| town_sign | 3.79 px | **not movement — see below** |
| road_east | 5.78 px | **not an object** |
| mud | 10.74 px | **not an object** |

**Every hotspot that contains an object is within 0.7 px.** The three larger
numbers are all rects containing texture rather than a thing:

- `town_sign` — the board occupies rows **62–77 in both images**, identically.
  The centroid differs because the bar's board carries lettering and ours is
  blank by ruling, and lettering is high-contrast structure. The board has not
  moved a pixel.
- `road_east` and `mud` — rects of road surface. Their centroids track rut and
  standing-water distribution, which was deliberately cut back by three
  quarters under the focal-point correction. Nothing an exit or a walk box
  cares about.

**Walk boxes are unaffected.** Row-mean luminance tracks within 2–3 luminance
at every band edge (96, 108, 122) and the profile has the same shape — rising
into the lit band at 106–112, falling after. The ground plane is where it was.

**And this is causal rather than lucky.** `layout.py`'s anchors were measured
off the bar in the first place, so the composed room was built to the bar's
geometry. That is the one thing reconstruction did reliably, and it is why
retracing costs no re-authoring: the hotspots were always aimed at where the
traced art will put things.

**Cost of re-siting: zero.** No hotspot rect changes, no walk box changes, no
staging point changes.

---

## 2 · It is blocked on one asset I cannot produce

Not on step A, and not on the coordinator. On a **companion generation**.

Errata 53's second condition says movable objects come from companion
generations rather than from cutting. Room 1 has a movable object: **the coach
and team depart** on the driver's exit line, and the engine composites the
departure by removing a layer.

The quantised bar contains **only the coach-present scene**. Behind the coach
is 5,959 px of hillside, road, fence and terrain that no traced image contains,
because a trace contains only what is visible. Today that comes free —
`compose(with_coach=False)` draws it because the code knows it is there, and
the coach layer is the difference between two composes, exact and identically
lit because both passes ran the same lighting.

**So retracing Room 1 needs one generation that does not exist yet: the same
scene, same camera, same light, with no coach and no team.** With it, the coach
layer is again a difference between two images and errata 53's condition is
satisfied by construction. Without it there are only bad options — either the
coach cannot depart, or 5,959 px of background is hand-invented and the
departure reveals a patch in a different hand from the rest of the frame.

A second companion is worth requesting at the same time, though it is not
blocking: **the same scene with no figure**, so Hob can become the `idles`
sprite errata 52 rules he gets. He does not move, so his ground pool stays
baked either way, but a two-frame idle needs him cut from a background that
still exists behind him.

The 96 px foreground plane needs no companion — it is drawn over the actor and
can be cut from the trace directly, since nothing is behind it that anything
ever sees.

---

## The recommendation

**After step A, and for a stronger reason than critical path.** The instinct
was right but the argument is better: this work cannot start until a companion
generation exists, so the ordering is not a preference.

The useful consequence is that the two can overlap. If the no-coach companion
is generated while step A is being written, retracing becomes unblocked at
roughly the moment the coordinator lands — and step E, which converts Stage
Road → Main Street into the integrated proof, then gets to build against final
art rather than art that is about to be replaced underneath it.

The one thing worth *not* doing is retracing under a half-written coordinator.
Nothing about the trace depends on the coordinator, but step E's proof depends
on both, and having exactly one of them move at a time is worth more than the
few days.
