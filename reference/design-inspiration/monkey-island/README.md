# Monkey Island design-grammar reference set

**Status: design inspiration only. Not visual canon.**

These references exist to teach composition, staging, negative space, actor-to-room scale, foreground/midground/background structure, dialogue presentation, occlusion, and spatial comedy from *The Secret of Monkey Island*.

They do **not** define Consolation's art style. The approved Room 1 baseline, current approved Thad, and approved Consolation rooms remain the visual authority.

## Binding use rule

Use Monkey Island references for:

- room composition and visual hierarchy;
- actor-to-environment scale relationships;
- negative space;
- foreground framing and occlusion;
- NPC staging;
- dialogue staging while preserving the room tableau;
- readable walkable-space composition;
- spatial/comedic timing;
- strong single-premise room design.

Do **not** use these references to reproduce:

- Monkey Island characters;
- distinctive locations or layouts;
- props;
- palette;
- pixel treatment;
- logos, UI assets, or other copyrighted visual elements.

Monkey Island references are **design-grammar evidence only**. They are not image-generation style references and must never outrank `reference/global-baseline.json`.

## Curated reference frames

The exact source pages and machine-readable lessons are in `sources.json`.

### 01 · SCUMM Bar interior — dense room without confusion

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/dos/3164/

Lesson: a crowded interior can contain many characters and props while the protagonist, walkable areas, and important interaction zones remain immediately readable. Density is hierarchical, not uniform.

### 02 · Pirate leaders — dialogue as part of the room

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/amiga/861869/

Lesson: dialogue choices can occupy substantial screen space while the character tableau and room remain visually legible. Strong held poses often beat unnecessary motion during comedy.

### 03 · The town — theatrical street composition

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/amiga/861873/

Lesson: architecture frames the playable path and creates foreground, middle-ground, and background masses. Perspective serves readability rather than architectural neutrality.

### 04 · Exploring the town — actor scale and depth

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/amiga/861874/

Lesson: the protagonist can be small relative to the environment without becoming insignificant. Walkable space is composed around the actor's path.

### 05 · Docks — negative space and atmosphere

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/amiga/861878/

Lesson: large areas of water, sky, road, darkness, or wall may remain visually quiet. AI-generated rooms should not fill every part of the frame with objects.

### 06 · Bridge troll — aggressive foreground framing

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/atari-st/438524/

Lesson: large foreground silhouettes and occluders can occupy substantial frame area and make characters feel physically embedded in a layered world.

### 07 · Stan's — environment as character

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/amiga/861891/

Lesson: an individual business/location may have a visually absurd or distinctive premise while still obeying the same overall spatial grammar. One dominant idea is stronger than many equally loud ideas.

### 08 · Governor's mansion interior — furniture masses before clutter

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/amiga/861889/

Lesson: large architectural/furniture silhouettes establish the composition first. Small decorative detail is subordinate to readable masses and paths.

### 09 · Forest — readability in a complex environment

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/amiga/861882/

Lesson: visually complex scenery still reserves readable actor silhouettes and traversal lanes. Complexity should not erase gameplay readability.

### 10 · Jail — small interior economy

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/amiga/861876/

Lesson: a small room can be memorable with only a few major spatial/prop ideas. Not every surface needs decorative activity.

### 11 · Church — scale, symmetry, and playable focus

Source: https://www.mobygames.com/game/amiga/secret-of-monkey-island/screenshots/gameShotId%2C861875/

Lesson: strong architecture can dominate the image while leaving a clear playable locus. Symmetry does not require filling all negative space.

### 12 · Sword training — action inside point-and-click grammar

Source: https://www.mobygames.com/game/616/the-secret-of-monkey-island/screenshots/atari-st/180362/

Lesson: performance/action can occur inside a normal adventure-game room. The environment creates an arena through composition rather than switching to a separate combat visual language.

## Production principles extracted from the set

1. **Negative space is productive.** Empty floor, sky, wall, water, road, and darkness are part of composition.
2. **Silhouette precedes detail.** Large masses define the room before tiny props do.
3. **Rooms have one visual premise.** Avoid generative clutter and equal emphasis everywhere.
4. **NPC placement is authored, not decorative scatter.** A few strong positions are better than a crowd distributed for balance alone.
5. **Foreground occlusion is allowed to be bold.** Depth should sometimes physically interrupt the actor.
6. **Dialogue stays spatially connected to the room.** The environment and character tableau remain part of the player's visual experience while reading choices.
7. **Perspective is theatrical.** Geometry may be exaggerated when it improves clarity, depth, comedy, or character staging.
8. **Actor scale is relative to the room.** Characters need not dominate the frame, but must remain legible and compositionally important.
9. **Do not infer Consolation's rendering style from these images.** Consolation's approved art owns rendering style, color language, material language, character design, and historical specificity.

## Acquisition note

The external screenshot pages are retained as source references rather than copied binaries in this commit. If local binary copies are later added for private production use, preserve the source URL/credit and keep them outside any pipeline that treats them as Consolation visual-style references.

The Monkey Island SCUMM Bar screenshot gallery also explicitly permits duplication of its site content with credit and a link: https://scummbar.com/game/the-secret-of-monkey-island/screenshots
