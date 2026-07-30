import type {
  ContentBundle,
  DialogueFile,
  FlagsFile,
  FontFile,
  ManifestFile,
  PaletteFile,
  RoomFile,
  UiFile,
  VerbsFile,
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

  const [font, palette, ui, verbs, flags] = await Promise.all([
    read(manifest.font) as Promise<FontFile>,
    read(manifest.palette) as Promise<PaletteFile>,
    read(manifest.ui) as Promise<UiFile>,
    read(manifest.verbs) as Promise<VerbsFile>,
    read(manifest.flags) as Promise<FlagsFile>,
  ]);

  const roomFiles = (await Promise.all(manifest.rooms.map((path) => read(path)))) as RoomFile[];
  const dialogueFiles = (await Promise.all(manifest.dialogue.map((path) => read(path)))) as DialogueFile[];

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

  if (!rooms.has(manifest.startRoom)) {
    throw new Error(`Start room not found: ${manifest.startRoom}`);
  }

  return { manifest, font, palette, ui, verbs, flags, rooms, dialogue };
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
