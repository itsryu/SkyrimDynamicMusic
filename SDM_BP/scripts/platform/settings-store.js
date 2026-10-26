import { IDS, LEGACY_PROPERTIES } from "../core/constants.js";
import {
  DEFAULT_SETTINGS,
  parseSettings,
  sanitizeSettings,
  serializeSettings,
  settingsFromLegacy,
  toRuntimeSettings,
} from "../core/settings.js";

/**
 * @typedef {Object} CacheEntry
 * @property {import("../core/settings.js").Settings} settings
 * @property {import("../core/settings.js").RuntimeSettings} runtime
 */

export class SettingsStore {
  constructor() {
    /** @type {Map<string, CacheEntry>} */
    this._cache = new Map();
  }

  /** @param {import("@minecraft/server").Player} player */
  get(player) {
    return this._entry(player).settings;
  }

  /** @param {import("@minecraft/server").Player} player */
  getRuntime(player) {
    return this._entry(player).runtime;
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {Partial<import("../core/settings.js").Settings>} patch
   * @returns {CacheEntry}
   */
  save(player, patch) {
    const settings = sanitizeSettings({ ...this.get(player), ...patch });
    player.setDynamicProperty(IDS.settingsProperty, serializeSettings(settings));
    return this._remember(player.id, settings);
  }

  /** @param {string} playerId */
  forget(playerId) {
    this._cache.delete(playerId);
  }

  /** @param {import("@minecraft/server").Player} player */
  _entry(player) {
    return this._cache.get(player.id) ?? this._remember(player.id, this._load(player));
  }

  /**
   * @param {string} playerId
   * @param {import("../core/settings.js").Settings} settings
   */
  _remember(playerId, settings) {
    const entry = { settings, runtime: toRuntimeSettings(settings) };
    this._cache.set(playerId, entry);
    return entry;
  }

  /** @param {import("@minecraft/server").Player} player */
  _load(player) {
    const stored = parseSettings(player.getDynamicProperty(IDS.settingsProperty));
    if (stored) return stored;

    const legacy = settingsFromLegacy((key) => player.getDynamicProperty(key));
    if (legacy) {
      player.setDynamicProperty(IDS.settingsProperty, serializeSettings(legacy));
      for (const key of Object.values(LEGACY_PROPERTIES)) {
        player.setDynamicProperty(key, undefined);
      }
      return legacy;
    }
    return { ...DEFAULT_SETTINGS };
  }
}
