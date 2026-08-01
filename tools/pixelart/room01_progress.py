"""Builds the live progress page for the Room 1 rebuild.

One HTML file, every round's render embedded as a data URI at native 320x144
and magnified by the browser with image-rendering: pixelated. Native rather
than the 4x PNG because the page is meant to be opened on a phone: seven
kilobytes a round instead of a hundred, and the pixels arrive exact rather
than as somebody's resample of a resample.

    python3 room01_progress.py

Reads renders/room-01-loop/rounds.json for what happened in each round and
renders/room-01-loop/round-NNN.png for what it looked like. Writes
work/room-01-loop/progress.html, which the caller publishes.
"""

from __future__ import annotations

import base64
import html
import json
from pathlib import Path

from room01_regions import AUTHORED

ROOT = Path(__file__).resolve().parents[2]
GALLERY = ROOT / "renders" / "room-01-loop"
ROUNDS_JSON = GALLERY / "rounds.json"
REFERENCE = ROOT / "reference" / "room-01" / "image-B-bar-320x144.png"
OUT = ROOT / "work" / "room-01-loop" / "progress.html"


def data_uri(path: Path) -> str:
    return "data:image/png;base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def load_rounds() -> list[dict]:
    if not ROUNDS_JSON.exists():
        return []
    rounds = json.loads(ROUNDS_JSON.read_text())
    return sorted(rounds, key=lambda entry: entry["round"], reverse=True)


def build() -> Path:
    rounds = load_rounds()
    bar = data_uri(REFERENCE)

    latest = rounds[0] if rounds else None
    won = sum(1 for r in (latest or {}).get("verdicts", {}).values() if r == "ours")
    judged = len((latest or {}).get("verdicts", {}))

    cards = "\n".join(card(entry, bar) for entry in rounds)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(PAGE.format(
        bar=bar,
        cards=cards or EMPTY,
        round_count=len(rounds),
        latest_round=f"{latest['round']:03d}" if latest else "--",
        won=won,
        judged=judged or len(AUTHORED),
        status=html.escape((latest or {}).get("status", "starting up")),
    ))
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB, {len(rounds)} rounds)")
    return OUT


def card(entry: dict, bar: str) -> str:
    number = entry["round"]
    frame = GALLERY / f"round-{number:03d}.png"
    if not frame.exists():
        return ""
    verdicts = entry.get("verdicts", {})
    gaps = entry.get("gaps", {})
    won = [region for region, who in verdicts.items() if who == "ours"]

    chips = "\n".join(
        f'<li class="chip chip--{"won" if verdicts.get(region.id) == "ours" else ("lost" if region.id in verdicts else "unjudged")}">'
        f'<span class="chip__name">{html.escape(region.id.replace("_", " "))}</span>'
        f'<span class="chip__mark">{"held" if verdicts.get(region.id) == "ours" else ("gap" if region.id in verdicts else "--")}</span>'
        f"</li>"
        for region in AUTHORED
    )

    notes = "\n".join(
        f'<li><b>{html.escape(region.replace("_", " "))}</b> {html.escape(text)}</li>'
        for region, text in gaps.items()
    )

    return f"""
    <article class="round" id="round-{number:03d}">
      <header class="round__head">
        <span class="round__no">{number:03d}</span>
        <div class="round__meta">
          <h2>{html.escape(entry.get("title", "iteration"))}</h2>
          <p class="round__sub">{html.escape(entry.get("note", ""))}</p>
        </div>
        <span class="round__tally" title="regions where the blind critic preferred ours">{len(won)}<span>/{len(verdicts) or len(AUTHORED)}</span></span>
      </header>

      <figure class="frame" data-compare>
        <img class="frame__ours" src="{data_uri(frame)}" alt="Room 1, iteration {number}" />
        <img class="frame__bar" src="{bar}" alt="the reference bar" />
        <button class="frame__swap" type="button" aria-pressed="false">
          <span class="frame__swaplabel">hold to see the bar</span>
        </button>
      </figure>

      <ul class="chips">{chips}</ul>
      {"<ul class='gaps'>" + notes + "</ul>" if notes else ""}
    </article>
    """


EMPTY = """
    <article class="round">
      <header class="round__head">
        <span class="round__no">--</span>
        <div class="round__meta"><h2>no iterations yet</h2>
        <p class="round__sub">The first render will appear here the moment it is composed.</p></div>
      </header>
    </article>
"""


PAGE = """<title>Room 1 &mdash; the stage road, rebuilt</title>
<style>
  /* One visual world, committed to on purpose. Every image on this page is a
     night exterior at 320x144, and value judgements about a night exterior
     made against a white page are not judgements at all -- the surround has
     to be darker than the darkest thing in the frame or the frame lifts. So
     there is no light theme here, and the toggle is honoured by staying put. */
  :root {{
    --void:        #07070f;
    --ground:      #0c0d18;
    --panel:       #14162a;
    --panel-lift:  #1c1f38;
    --rule:        #2a2f52;
    --ink:         #d7dbe8;
    --ink-dim:     #8b93b4;
    --ink-faint:   #5b628a;
    --lamp:        #e0a63f;
    --lamp-dim:    #8a6425;
    --cold:        #5a82c0;
    --gap:         #b4553f;

    --shell: min(1120px, 100%);
    --step:  clamp(0.95rem, 0.9rem + 0.3vw, 1.05rem);

    --display: "Rockwell", "Bookman Old Style", "Bitstream Charter", Charter,
               ui-serif, Georgia, serif;
    --body: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --data: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;

    color-scheme: dark;
  }}

  * {{ box-sizing: border-box; }}

  body {{
    margin: 0;
    background:
      radial-gradient(120% 80% at 50% -10%, #191c33 0%, var(--ground) 55%, var(--void) 100%)
      no-repeat fixed;
    color: var(--ink);
    font-family: var(--body);
    font-size: var(--step);
    line-height: 1.55;
    -webkit-text-size-adjust: 100%;
  }}

  .wrap {{ width: var(--shell); margin-inline: auto; padding: 0 1rem 5rem; }}

  /* -- masthead ------------------------------------------------------- */

  .masthead {{ padding: 2.4rem 0 1.4rem; }}
  .eyebrow {{
    font-family: var(--data);
    font-size: 0.7rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--lamp-dim);
    margin: 0 0 0.7rem;
  }}
  .masthead h1 {{
    font-family: var(--display);
    font-weight: 400;
    font-size: clamp(1.9rem, 1.4rem + 3vw, 3.1rem);
    line-height: 1.05;
    letter-spacing: -0.01em;
    text-wrap: balance;
    margin: 0 0 0.6rem;
  }}
  .masthead h1 em {{ font-style: normal; color: var(--lamp); }}
  .masthead p {{ margin: 0; max-width: 62ch; color: var(--ink-dim); }}

  .readout {{
    display: flex; flex-wrap: wrap; gap: 0.5rem 2rem;
    margin-top: 1.4rem; padding-top: 1.1rem;
    border-top: 1px solid var(--rule);
    font-family: var(--data); font-size: 0.78rem;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--ink-faint);
    font-variant-numeric: tabular-nums;
  }}
  .readout b {{ color: var(--ink); font-weight: 600; }}

  /* -- the bar, pinned ------------------------------------------------ */

  .bar {{
    position: sticky; top: 0; z-index: 5;
    margin: 1.6rem 0 2.2rem;
    padding: 0.55rem 0 0.7rem;
    background: linear-gradient(var(--ground) 78%, transparent);
  }}
  .bar__label {{
    display: flex; align-items: baseline; justify-content: space-between;
    font-family: var(--data); font-size: 0.68rem;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--lamp-dim); margin-bottom: 0.45rem;
  }}
  .bar__label span {{ color: var(--ink-faint); letter-spacing: 0.1em; }}

  .shot {{
    display: block; width: 100%; height: auto;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    border: 1px solid var(--rule);
    background: var(--void);
  }}

  /* -- rounds --------------------------------------------------------- */

  .rounds {{ display: flex; flex-direction: column; gap: 2.6rem; }}

  .round {{
    background: var(--panel);
    border: 1px solid var(--rule);
    padding: 1.1rem;
  }}

  .round__head {{
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: start;
    gap: 0 0.9rem;
    margin-bottom: 0.9rem;
  }}
  .round__no {{
    font-family: var(--data); font-variant-numeric: tabular-nums;
    font-size: 1.5rem; color: var(--lamp);
    line-height: 1; padding-top: 0.15rem;
  }}
  .round__meta h2 {{
    font-family: var(--display); font-weight: 400;
    font-size: 1.15rem; line-height: 1.25; margin: 0;
    text-wrap: balance;
  }}
  .round__sub {{ margin: 0.25rem 0 0; color: var(--ink-dim); font-size: 0.88rem; }}
  .round__tally {{
    font-family: var(--data); font-variant-numeric: tabular-nums;
    font-size: 1.05rem; color: var(--ink);
  }}
  .round__tally span {{ color: var(--ink-faint); font-size: 0.8rem; }}

  /* The comparison. On a phone, side by side means two postage stamps, so
     the two images are stacked in the same box and the top one is lifted
     away while the control is held. Flipping in place is how you see a
     four-pixel difference; scrolling between two copies is not. */
  .frame {{ position: relative; margin: 0; }}
  .frame img {{
    display: block; width: 100%; height: auto;
    image-rendering: pixelated; image-rendering: crisp-edges;
    border: 1px solid var(--rule); background: var(--void);
  }}
  .frame__bar {{ position: absolute; inset: 0; opacity: 0; }}
  .frame[data-showing-bar] .frame__bar {{ opacity: 1; }}

  .frame__swap {{
    position: absolute; inset: auto 0 0 0;
    display: flex; justify-content: center;
    padding: 0.5rem; border: 0;
    background: linear-gradient(transparent, rgba(7, 7, 15, 0.82));
    color: var(--ink-dim);
    font-family: var(--data); font-size: 0.68rem;
    letter-spacing: 0.16em; text-transform: uppercase;
    cursor: pointer;
    -webkit-user-select: none; user-select: none;
    -webkit-touch-callout: none;
  }}
  .frame__swap:focus-visible {{ outline: 2px solid var(--lamp); outline-offset: 2px; }}
  .frame[data-showing-bar] .frame__swap {{ color: var(--lamp); }}

  /* -- verdict chips --------------------------------------------------- */

  .chips {{
    list-style: none; margin: 0.9rem 0 0; padding: 0;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
    gap: 1px; background: var(--rule); border: 1px solid var(--rule);
  }}
  .chip {{
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 0.4rem; padding: 0.4rem 0.55rem;
    background: var(--panel-lift);
    font-family: var(--data); font-size: 0.7rem;
    letter-spacing: 0.06em;
  }}
  .chip__name {{ color: var(--ink-dim); text-transform: uppercase; }}
  .chip__mark {{ color: var(--ink-faint); }}
  .chip--won .chip__mark {{ color: var(--lamp); }}
  .chip--lost .chip__mark {{ color: var(--gap); }}
  .chip--lost {{ box-shadow: inset 2px 0 0 var(--gap); }}
  .chip--won {{ box-shadow: inset 2px 0 0 var(--lamp); }}

  .gaps {{
    margin: 0.9rem 0 0; padding: 0.8rem 0 0 1.1rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-dim); font-size: 0.86rem;
  }}
  .gaps li {{ margin-bottom: 0.35rem; }}
  .gaps b {{ color: var(--ink); font-weight: 600; }}

  .foot {{
    margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--rule);
    font-family: var(--data); font-size: 0.7rem;
    letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint);
  }}

  @media (prefers-reduced-motion: no-preference) {{
    .frame__bar {{ transition: opacity 90ms linear; }}
  }}
</style>

<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">The Last Claim in Consolation &middot; room 1 &middot; stage road, night</p>
    <h1>Every iteration, against <em>the bar</em>.</h1>
    <p>Each render below is the real composed frame at 320&times;144, straight out of the
       Python compositor. The image pinned at the top is the target. Hold the strip at the
       bottom of any frame to swap it for the target in place &mdash; flipping is the only
       way to see a four-pixel difference.</p>
    <div class="readout">
      <span><b>{round_count}</b> iterations</span>
      <span>latest <b>{latest_round}</b></span>
      <span>blind critic held <b>{won}</b> of <b>{judged}</b> regions</span>
      <span>{status}</span>
    </div>
  </header>

  <section class="bar">
    <p class="bar__label">The bar &mdash; image B at 320&times;144 <span>never changes</span></p>
    <img class="shot" src="{bar}" alt="The reference: Room 1 at 320 by 144" />
  </section>

  <section class="rounds">
    {cards}
  </section>

  <p class="foot">Newest first &middot; regenerated each round &middot; renders/room-01-loop/</p>
</div>

<script>
  // Hold to compare. Pointer events cover mouse, touch and pen in one path;
  // the keyboard gets space and enter through the button's own semantics.
  for (const frame of document.querySelectorAll('[data-compare]')) {{
    const button = frame.querySelector('.frame__swap');
    const label = frame.querySelector('.frame__swaplabel');
    const show = (on) => {{
      frame.toggleAttribute('data-showing-bar', on);
      button.setAttribute('aria-pressed', String(on));
      label.textContent = on ? 'the bar' : 'hold to see the bar';
    }};
    button.addEventListener('pointerdown', (event) => {{ event.preventDefault(); show(true); }});
    for (const done of ['pointerup', 'pointerleave', 'pointercancel']) {{
      button.addEventListener(done, () => show(false));
    }}
    button.addEventListener('keydown', (event) => {{
      if (event.key === ' ' || event.key === 'Enter') {{ event.preventDefault(); show(true); }}
    }});
    button.addEventListener('keyup', () => show(false));
    button.addEventListener('contextmenu', (event) => event.preventDefault());
  }}
</script>
"""


if __name__ == "__main__":
    build()
