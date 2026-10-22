/**
 * @fileoverview Environmental heuristics with TTl caching.
 */
import { system, world } from "@minecraft/server";
import { CONFIG, ENTITY_DICTIONARY } from "./config.js";
import { stateManager } from "./state.js";

export class EnvironmentSensor {
  /**
   * Identifies the contextual game mode, prioritizing performance via memoization.
   * @param {import("@minecraft/server").Player} player
   * @param {import("./state.js").PlayerContext} context
   * @param {Object} settings
   * @returns {string} The computed environmental mode.
   */
  static resolveMode(player, context, settings) {
    const currentTick = system.currentTick;
    const cached = stateManager.environmentalCache.get(player.id);

    if (cached && cached.expiry > currentTick) {
      return cached.value;
    }

    const mode = this._computeMode(player, context, settings, currentTick);

    stateManager.environmentalCache.set(player.id, {
      value: mode,
      expiry: currentTick + CONFIG.CACHE_TTL_TICKS,
    });

    return mode;
  }

  /** @private */
  static _computeMode(player, context, settings, currentTick) {
    if (this._isBossNearby(player)) return "boss";
    if (settings.combatEnabled && currentTick < context.combatUntilTick)
      return "combat";

    const dimId = player.dimension.id;
    if (dimId === "minecraft:nether") return "nether";
    if (dimId === "minecraft:the_end") return "end";

    const yLevel = player.location.y;
    if (yLevel < CONFIG.DEEP_CAVE_Y_THRESHOLD) return "deep_cave";
    if (yLevel < CONFIG.CAVE_Y_THRESHOLD) return "cave";

    if (this._isVillageNearby(player)) return "village";

    const weather = stateManager.globalWeather;
    if (weather === "Thunder" || weather === 2) return "storm";
    if (weather === "Rain" || weather === 1) {
      return this._isSnowyBiome(player) ? "snow" : "rain";
    }

    const timeOfDay = world.getTimeOfDay();
    if (timeOfDay >= 13000 && timeOfDay < 23000) return "night";

    return "exploration";
  }

  /** @private */
  static _isBossNearby(player) {
    try {
      const entities = player.dimension.getEntities({
        location: player.location,
        maxDistance: CONFIG.BOSS_DETECTION_RADIUS,
      });
      for (const e of entities) {
        if (ENTITY_DICTIONARY.BOSSES.has(e.typeId)) return true;
      }
    } catch (e) {
      // Dimension bounds failure safeguard
    }
    return false;
  }

  /** @private */
  static _isVillageNearby(player) {
    try {
      const villagers = player.dimension.getEntities({
        type: "minecraft:villager",
        location: player.location,
        maxDistance: CONFIG.VILLAGE_DETECTION_RADIUS,
      });
      return villagers.length > 0;
    } catch (e) {
      return false;
    }
  }

  /** @private */
  static _isSnowyBiome(player) {
    try {
      const biome = player.dimension.getBiome(player.location);
      if (biome) {
        const id = typeof biome === "string" ? biome : biome.id;
        if (
          id &&
          (id.includes("snow") || id.includes("ice") || id.includes("frozen"))
        ) {
          return true;
        }
      }
    } catch (e) {
      // Chunk not loaded safeguard
    }
    return player.location.y > 100;
  }
}
