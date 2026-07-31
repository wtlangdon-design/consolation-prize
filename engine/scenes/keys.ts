/** Scene and registry identifiers. Engine-internal, never player-facing. */
export const BOOT_SCENE = 'boot';
export const GAME_SCENE = 'game';
export const REGISTRY_STATE = 'state';
export const SCREEN_TEXTURE = 'screen';

/**
 * Keyboard bindings.
 *
 * There are no F-keys. The target machine is a Chromebook, whose top row is
 * browser keys -- F5 reloads the page, F6 moves focus to the address bar --
 * so the previous save/load/reset bindings never reached the game at all.
 *
 * Everything below is CONVENIENCE ONLY. The panel's menu button reaches
 * save, load, options and quit with a mouse, and nothing here is the sole
 * route to anything.
 */
export const KEY_MENU = 'ESC';
export const KEY_SAVE_MODIFIED = 'S';
export const KEY_LOAD_MODIFIED = 'L';

/** Slot the Ctrl shortcuts act on. Slot 1 in the menu's numbering. */
export const QUICK_SLOT = 0;

/**
 * The options toggle governing background palette cycling. Doc 18 note 2:
 * cycling is decorative and must be disableable, defaulting on.
 *
 * An id, not a label -- the words on the row are in content/ui/menu.json,
 * and this names the row the way SCREEN_TEXTURE names a texture.
 */
export const CYCLING_OPTION = 'cycling';
