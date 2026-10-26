import { DIMENSION_IDS, TUNING } from "./constants.js";
import { Mode } from "./modes.js";

/**
 * @typedef {Object} EnvironmentSnapshot
 * @property {string} dimensionId
 * @property {number} y
 * @property {boolean} submerged
 * @property {boolean} bossNearby
 * @property {boolean} villageNearby
 * @property {string} weather `Clear`, `Rain` ou `Thunder`.
 * @property {number} timeOfDay 0–23999.
 * @property {string | undefined} biomeId
 */

const SNOWY_BIOMES = new Set(["grove", "snowy_slopes", "jagged_peaks", "frozen_peaks"]);
const SNOWY_PATTERN = /snow|ice|frozen|cold_taiga|cold_beach/;
const DEEP_UNDERGROUND_BIOMES = new Set(["deep_dark"]);
const UNDERGROUND_BIOMES = new Set(["lush_caves", "dripstone_caves"]);

/** @param {string | undefined} biomeId */
const biomeKey = (biomeId) => biomeId?.replace(/^[^:]+:/, "") ?? "";

/**
 * @param {string | undefined} biomeId
 * @param {number} y
 * @param {Readonly<import("./constants.js").Tuning>} tuning
 */
export function isSnowyTerrain(biomeId, y, tuning = TUNING) {
  const key = biomeKey(biomeId);
  return SNOWY_BIOMES.has(key) || SNOWY_PATTERN.test(key) || y > tuning.snowAltitudeY;
}

/**
 * Cadeia de prioridade: chefe > combate > dimensão > subsolo > vila > clima > noite > exploração.
 * @param {EnvironmentSnapshot} env
 * @param {boolean} inCombat
 * @param {Readonly<import("./constants.js").Tuning>} [tuning]
 * @returns {import("./modes.js").ModeId}
 */
export function resolveMode(env, inCombat, tuning = TUNING) {
  if (env.bossNearby) return Mode.BOSS;
  if (inCombat) return Mode.COMBAT;
  if (env.dimensionId === DIMENSION_IDS.nether) return Mode.NETHER;
  if (env.dimensionId === DIMENSION_IDS.end) return Mode.END;

  const biome = biomeKey(env.biomeId);
  if (!env.submerged) {
    if (env.y < tuning.deepCaveY || DEEP_UNDERGROUND_BIOMES.has(biome)) {
      return Mode.DEEP_CAVE;
    }
    if (env.y < tuning.caveY || UNDERGROUND_BIOMES.has(biome)) {
      return Mode.CAVE;
    }
  }

  if (env.villageNearby) return Mode.VILLAGE;
  if (env.weather === "Thunder") return Mode.STORM;
  if (env.weather === "Rain") {
    return isSnowyTerrain(env.biomeId, env.y, tuning) ? Mode.SNOW : Mode.RAIN;
  }
  if (env.timeOfDay >= tuning.nightStart && env.timeOfDay < tuning.nightEnd) {
    return Mode.NIGHT;
  }
  return Mode.EXPLORATION;
}
