import { LEGACY_PROPERTIES } from "./constants.js";

export const SETTINGS_VERSION = 1;

export const Frequency = Object.freeze({
  FREQUENT: "frequent",
  NORMAL: "normal",
  RARE: "rare",
});

/** @typedef {(typeof Frequency)[keyof typeof Frequency]} FrequencyId */

/** @type {readonly FrequencyId[]} */
export const FREQUENCY_ORDER = Object.freeze([
  Frequency.FREQUENT,
  Frequency.NORMAL,
  Frequency.RARE,
]);

/** @type {Readonly<Record<FrequencyId, number>>} */
const GAP_SCALE = Object.freeze({
  [Frequency.FREQUENT]: 0.5,
  [Frequency.NORMAL]: 1,
  [Frequency.RARE]: 2,
});

/**
 * @typedef {Object} Settings
 * @property {boolean} musicEnabled
 * @property {number} musicVolume 0–100
 * @property {boolean} atmosEnabled
 * @property {number} atmosVolume 0–100
 * @property {boolean} combatEnabled
 * @property {boolean} popupEnabled
 * @property {FrequencyId} frequency
 */

/** @type {Readonly<Settings>} */
export const DEFAULT_SETTINGS = Object.freeze({
  musicEnabled: true,
  musicVolume: 100,
  atmosEnabled: true,
  atmosVolume: 30,
  combatEnabled: true,
  popupEnabled: true,
  frequency: Frequency.NORMAL,
});

/**
 * @typedef {Object} AudioChannel
 * @property {boolean} audible
 * @property {number} volume 0–1
 */

/**
 * @typedef {Object} RuntimeSettings
 * @property {AudioChannel} music
 * @property {AudioChannel} atmosphere
 * @property {boolean} combatEnabled
 * @property {boolean} popupEnabled
 * @property {number} gapScale
 */

/**
 * @param {unknown} value
 * @param {boolean} fallback
 */
const toBoolean = (value, fallback) => (typeof value === "boolean" ? value : fallback);

/**
 * @param {unknown} value
 * @param {number} fallback
 */
const toPercent = (value, fallback) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : fallback;

/**
 * @param {unknown} raw
 * @returns {Settings}
 */
export function sanitizeSettings(raw) {
  const source = /** @type {Record<string, unknown>} */ (raw && typeof raw === "object" ? raw : {});
  const d = DEFAULT_SETTINGS;
  const frequency = FREQUENCY_ORDER.find((f) => f === source.frequency);
  return {
    musicEnabled: toBoolean(source.musicEnabled, d.musicEnabled),
    musicVolume: toPercent(source.musicVolume, d.musicVolume),
    atmosEnabled: toBoolean(source.atmosEnabled, d.atmosEnabled),
    atmosVolume: toPercent(source.atmosVolume, d.atmosVolume),
    combatEnabled: toBoolean(source.combatEnabled, d.combatEnabled),
    popupEnabled: toBoolean(source.popupEnabled, d.popupEnabled),
    frequency: frequency ?? d.frequency,
  };
}

/**
 * @param {unknown} json
 * @returns {Settings | null} `null` quando ausente ou corrompido.
 */
export function parseSettings(json) {
  if (typeof json !== "string") return null;
  try {
    return sanitizeSettings(JSON.parse(json));
  } catch {
    return null;
  }
}

/** @param {Settings} settings */
export function serializeSettings(settings) {
  return JSON.stringify({ v: SETTINGS_VERSION, ...sanitizeSettings(settings) });
}

/**
 * @param {(key: string) => unknown} read
 * @returns {Settings | null} `null` se nenhuma chave legada existir.
 */
export function settingsFromLegacy(read) {
  const entries = Object.entries(LEGACY_PROPERTIES).map(
    ([field, key]) => /** @type {const} */ ([field, read(key)])
  );
  if (entries.every(([, value]) => value === undefined)) return null;
  return sanitizeSettings(Object.fromEntries(entries));
}

/**
 * @param {Settings} settings
 * @returns {RuntimeSettings}
 */
export function toRuntimeSettings(settings) {
  return {
    music: {
      audible: settings.musicEnabled && settings.musicVolume > 0,
      volume: settings.musicVolume / 100,
    },
    atmosphere: {
      audible: settings.atmosEnabled && settings.atmosVolume > 0,
      volume: settings.atmosVolume / 100,
    },
    combatEnabled: settings.combatEnabled,
    popupEnabled: settings.popupEnabled,
    gapScale: GAP_SCALE[settings.frequency],
  };
}
