# Room 1 rebuild — the iteration gallery

Every round of the Room 1 rebuild lands here as `round-NNN.png` (native
320×144, what the progress page embeds) and `round-NNN@4x.png` (nearest
neighbour, for looking at on GitHub).

**This is the one place in the project that versions in the filename**, and it
is deliberate. Everywhere else a render is the current state of a thing and git
is the history. Here the history *is* the artefact: the point of the gallery is
to scroll the rounds against the bar and watch the gap close, which a single
overwritten file cannot show.

`rounds.json` carries what happened in each round — the blind critic's verdict
per region and the gap it named. `tools/pixelart/room01_progress.py` turns the
two into the page.
