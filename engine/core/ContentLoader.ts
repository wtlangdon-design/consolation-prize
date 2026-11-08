import type { AssayFile } from './Assay.ts';
import type {
  ActCardsFile,
  CutawaysFile,
  ActOpening,
  ActorFile,
  CarriedLightFile,
  OverlayFile,
  PathFile,
  SpeechColoursFile,
  TitleFile,
  AmbientFile,
  ContentBundle,
  CombinationsFile,
  ItemFile,
  ItemIconsFile,
  PanelFile,
  DialogueFile,
  FlagsFile,
  FontFile,
  ManifestFile,
  PaletteFile,
  ReputationFile,
  RoomFile,
  ScalingFile,
  UiFile,
  VerbFallbacksFile,
  VerbsFile,
  MenuFile,
  SequenceFile, PlaytestFixture,
  SoundsFile,
  ActedDirectionsFile,
} from './types.ts';

/** Reads and parses one JSON file. Supplied by the host (fetch, or fs in tests). */
export type JsonReader = (path: string) => Promise<unknown>;

export const MANIFEST_PATH = 'content/manifest.json';

/**
 * Resolves the manifest and everything it points at. The manifest is the
 * only path the engine knows; every other file is discovered through it.
 */
export async function loadContent(read: JsonReader, manifestPath = MANIFEST_PATH): Promise<ContentBundle> {
  const manifest = (await read(manifestPath)) as ManifestFile;

  const [font, palette, ui, verbs, flags, scaling, reputation, verbFallbacks] = await Promise.all([
    read(manifest.font) as Promise<FontFile>,
    read(manifest.palette) as Promise<PaletteFile>,
    read(manifest.ui) as Promise<UiFile>,
    read(manifest.verbs) as Promise<VerbsFile>,
    read(manifest.flags) as Promise<FlagsFile>,
    read(manifest.scaling) as Promise<ScalingFile>,
    read(manifest.reputation) as Promise<ReputationFile>,
    read(manifest.verbFallbacks) as Promise<VerbFallbacksFile>,
  ]);

  const menu = (await read(manifest.menu)) as MenuFile;
  const title = manifest.title ? (await read(manifest.title)) as TitleFile : null;
  const actor = (await read(manifest.actor)) as ActorFile;
  // EVERY declared record, keyed by its own id. The list is explicit in the
  // manifest rather than discovered from the directory -- a directory listing
  // loads whatever happens to be on disk, and that is not a decision anybody
  // made. The protagonist is in here too; `actor` says which one he is.
  const actorFiles = await Promise.all(
    (manifest.actors ?? [manifest.actor]).map((path) => read(path) as Promise<ActorFile>),
  );
  const actors = new Map(actorFiles.map((file) => [file.id, file]));
  if (!actors.has(actor.id)) actors.set(actor.id, actor);
  // Head overlays, by their own id. Named in the manifest like everything
  // else: an overlay discovered from a directory is an overlay nobody chose.
  const overlayFiles = await Promise.all(
    (manifest.overlays ?? []).map((path) => read(path) as Promise<OverlayFile>),
  );
  const overlays = new Map(overlayFiles.map((file) => [file.id, file]));
  // Traced paths, keyed BY THE PATH THAT NAMES THEM rather than by an id of
  // their own. The trace is Tyler's file and adding a field to it to satisfy
  // the loader would be the loader's convenience written into his data.
  const pathFiles = await Promise.all(
    (manifest.paths ?? []).map(async (each) => [each, await read(each) as PathFile] as const),
  );
  const paths = new Map<string, PathFile>(pathFiles);
  // Errata D8's lantern pool. Optional: a game that declares none draws none,
  // which is what it did for as long as the spec sat in art/ with no reader.
  const sounds = manifest.sounds ? (await read(manifest.sounds)) as SoundsFile : null;
  const carriedLight = manifest.carriedLight
    ? (await read(manifest.carriedLight)) as CarriedLightFile
    : null;
  // Optional: a game with no colours declared draws every line in the default
  // ink, which is what it did before this existed.
  const speechColours = manifest.speechColours
    ? (await read(manifest.speechColours)) as SpeechColoursFile
    : null;
  const assay = manifest.assay ? (await read(manifest.assay)) as AssayFile : null;
  const panel = (await read(manifest.panel)) as PanelFile;
  const combinations = (await read(manifest.combinations)) as CombinationsFile;
  const itemIcons = (await read(manifest.itemIcons)) as ItemIconsFile;
  const itemFiles = (await Promise.all((manifest.items ?? []).map((path) => read(path)))) as ItemFile[];

  const items = new Map<string, ItemFile>();
  for (const item of itemFiles) {
    if (items.has(item.id)) {
      throw new Error(`Duplicate item id: ${item.id}`);
    }
    items.set(item.id, item);
  }

  const fixtureFiles = (await Promise.all((manifest.fixtures ?? []).map((path) => read(path)))) as { fixtures: PlaytestFixture[] }[];
  const fixtures = new Map<string, PlaytestFixture>();
  for (const file of fixtureFiles) {
    for (const fixture of file.fixtures ?? []) {
      if (fixtures.has(fixture.id)) throw new Error(`Duplicate fixture id: ${fixture.id}`);
      fixtures.set(fixture.id, fixture);
    }
  }

  const roomFiles = (await Promise.all(manifest.rooms.map((path) => read(path)))) as RoomFile[];
  const dialogueFiles = (await Promise.all(manifest.dialogue.map((path) => read(path)))) as DialogueFile[];
  const ambientFiles = (await Promise.all(manifest.ambient.map((path) => read(path)))) as AmbientFile[];
  const sequenceFiles = (await Promise.all(
    (manifest.sequences ?? []).map((path) => read(path)))) as SequenceFile[];

  const sequences = new Map<string, SequenceFile>();
  for (const scene of sequenceFiles) {
    if (sequences.has(scene.id)) {
      throw new Error(`Duplicate sequence id: ${scene.id}`);
    }
    sequences.set(scene.id, scene);
  }

  const ambient = new Map<string, AmbientFile>();
  for (const npc of ambientFiles) {
    if (ambient.has(npc.id)) {
      throw new Error(`Duplicate ambient id: ${npc.id}`);
    }
    ambient.set(npc.id, npc);
  }

  // DOC 95'S ACTED DIRECTIONS (errata 141): each A row is given to the figures
  // it names, as their `performs`, so the one place a class is decided is the
  // document. A row naming a figure that does not exist, or a frame he does not
  // have, is a broken build rather than a direction quietly printed.
  const exitPool = manifest.exitPool ? ((await read(manifest.exitPool)) as { pool: string[] }).pool : [];
  const actedDirections = manifest.actedDirections
    ? (await read(manifest.actedDirections)) as ActedDirectionsFile
    : null;
  for (const row of actedDirections?.directions ?? []) {
    if (row.class !== 'A') continue;
    for (const named of row.performedBy ?? []) {
      // THE PROTAGONIST ACTS IN A CLIP (errata 148): "thad:pick-fit" is his
      // pick-fit clip, drawn in one facing, and the frames are that clip's.
      const [id, clipId] = named.split(':') as [string, string | undefined];
      if (id === actor.id) {
        if (!clipId) throw new Error(`doc 95 row ${row.n}: ${id} acts in a clip, named as "${id}:<clip>"`);
        const clips = (actors.get(id) ?? actor).clips.filter((clip) => clip.id === clipId);
        if (!clips.length) throw new Error(`doc 95 row ${row.n}: ${id} has no clip "${clipId}"`);
        const facings = [...new Set(clips.map((clip) => clip.facing))];
        if (facings.length !== 1) throw new Error(`doc 95 row ${row.n}: "${clipId}" is drawn in ${facings.length} facings; an act is drawn in one`);
        const length = Math.min(...clips.map((clip) => clip.frames.length));
        const frames = row.frames ?? [];
        const bad = frames.find((frame) => frame < 0 || frame >= length);
        if (bad !== undefined) throw new Error(`doc 95 row ${row.n}: ${id}'s ${clipId} has no frame ${bad}`);
        const act = {
          ...(frames.length === 1 ? { frame: frames[0]! } : { frames }),
          seconds: row.seconds ?? 0,
          ...(row.holds !== undefined ? { holds: row.holds } : {}),
          ...(row.cue ? { cue: row.cue } : {}),
          clip: clipId,
          facing: facings[0]!,
        };
        for (const record of new Set([actor, actors.get(id)!])) record.performs = { ...(record.performs ?? {}), [row.words]: act };
        continue;
      }
      if (clipId) throw new Error(`doc 95 row ${row.n}: ${named} -- only the protagonist acts in a clip`);
      const npc = ambient.get(id);
      if (!npc?.sprite) throw new Error(`doc 95 row ${row.n}: "${row.words}" is acted by ${id}, who has no figure`);
      const frames = row.frames ?? [];
      const bad = frames.find((frame) => frame < 0 || frame >= npc.sprite!.frames.length);
      if (bad !== undefined) throw new Error(`doc 95 row ${row.n}: ${id} has no frame ${bad}`);
      npc.sprite.performs = {
        ...(npc.sprite.performs ?? {}),
        [row.words]: {
          ...(frames.length === 1 ? { frame: frames[0]! } : { frames }),
          seconds: row.seconds ?? 0,
          ...(row.holds !== undefined ? { holds: row.holds } : {}),
          ...(row.cue ? { cue: row.cue } : {}),
        },
      };
    }
  }

  const rooms = new Map<string, RoomFile>();
  for (const room of roomFiles) {
    if (rooms.has(room.id)) {
      throw new Error(`Duplicate room id: ${room.id}`);
    }
    rooms.set(room.id, room);
  }

  const dialogue = new Map<string, DialogueFile>();
  for (const tree of dialogueFiles) {
    if (dialogue.has(tree.id)) {
      throw new Error(`Duplicate dialogue id: ${tree.id}`);
    }
    dialogue.set(tree.id, tree);
  }

  const actCards = new Map<number, string>();
  const actOpenings = new Map<number, ActOpening>();
  if (manifest.actCards) {
    const file = (await read(manifest.actCards)) as ActCardsFile;
    for (const [act, card] of Object.entries(file.cards)) actCards.set(Number(act), card);
    for (const [act, opening] of Object.entries(file.openings ?? {})) actOpenings.set(Number(act), opening);
  }

  // ERRATA 158: the cut-aways, each checked against the rooms it names.
  const cutaways = manifest.cutaways ? ((await read(manifest.cutaways)) as CutawaysFile).cutaways : [];
  for (const cut of cutaways) {
    if (!rooms.has(cut.room)) throw new Error(`Cut-away ${cut.id}: no room ${cut.room}`);
  }

  if (!rooms.has(manifest.startRoom)) {
    throw new Error(`Start room not found: ${manifest.startRoom}`);
  }

  return {
    manifest, font, palette, ui, menu, verbs, flags, scaling, reputation,
    verbFallbacks, ambient, rooms, dialogue, actor, actors, overlays, carriedLight, sounds, paths,
    speechColours, assay, items, fixtures, panel, title, actedDirections, exitPool,
    combinations, itemIcons,
    sequences, actCards, actOpenings, cutaways,
  };
}

/** JsonReader backed by fetch, for the browser. */
export function fetchReader(baseUrl: string): JsonReader {
  return async (path: string) => {
    const response = await fetch(new URL(path, baseUrl));
    if (!response.ok) {
      throw new Error(`Content fetch failed (${response.status}): ${path}`);
    }
    return response.json();
  };
}
