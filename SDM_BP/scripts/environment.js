import { system, world } from "@minecraft/server";
import { CONFIG, ENTITY_DICTIONARY } from "./config.js";
import { stateManager } from "./state.js";

export class EnvironmentSensor {
  static isBossNearby(player) {
    try {
      return Array.from(
        player.dimension.getEntities({
          location: player.location,
          maxDistance: CONFIG.BOSS_DETECTION_RADIUS,
        })
      ).some((e) => ENTITY_DICTIONARY.BOSSES.has(e.typeId));
    } catch (e) {
      console.warn(
        `[SkyrimMusic] Falha de sensor (Boss) em ${player.name}:`,
        e
      );
      return false;
    }
  }

  static isVillageNearby(player) {
    try {
      return (
        Array.from(
          player.dimension.getEntities({
            type: "minecraft:villager",
            location: player.location,
            maxDistance: CONFIG.VILLAGE_DETECTION_RADIUS,
          })
        ).length > 0
      );
    } catch (e) {
      console.warn(
        `[SkyrimMusic] Falha de sensor (Vilarejo) em ${player.name}:`,
        e
      );
      return false;
    }
  }

  static isSnowyBiome(player) {
    try {
      if (typeof player.dimension.getBiome === "function") {
        const biome = player.dimension.getBiome(player.location);
        if (biome) {
          const id = typeof biome === "string" ? biome : biome.id;
          if (
            id &&
            (id.includes("snow") || id.includes("ice") || id.includes("frozen"))
          )
            return true;
        }
      }
    } catch (e) {}
    return player.location.y > 100;
  }

  static resolveMode(player, context, settings) {
    if (this.isBossNearby(player)) return "boss";
    if (settings.combatEnabled && system.currentTick < context.combatUntilTick)
      return "combat";

    const dimId = player.dimension.id;
    if (dimId === "minecraft:nether") return "nether";
    if (dimId === "minecraft:the_end") return "end";

    if (player.location.y < CONFIG.DEEP_CAVE_Y_THRESHOLD) return "deep_cave";
    if (player.location.y < CONFIG.CAVE_Y_THRESHOLD) return "cave";

    if (this.isVillageNearby(player)) return "village";

    if (
      stateManager.globalWeather === "Thunder" ||
      stateManager.globalWeather === 2
    )
      return "storm";
    if (
      stateManager.globalWeather === "Rain" ||
      stateManager.globalWeather === 1
    ) {
      return this.isSnowyBiome(player) ? "snow" : "rain";
    }

    const timeOfDay = world.getTimeOfDay();
    if (timeOfDay >= 13000 && timeOfDay < 23000) return "night";

    return "exploration";
  }
}
