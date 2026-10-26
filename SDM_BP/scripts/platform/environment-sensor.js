import { world } from "@minecraft/server";
import { BOSS_TYPES, TUNING } from "../core/constants.js";

const BOSS_FILTERS = Object.freeze(BOSS_TYPES.map((type) => ({ type })));
const VILLAGER_FILTERS = Object.freeze([
  { families: ["villager"] },
  { type: "minecraft:villager_v2" },
]);

export class EnvironmentSensor {
  /**
   * @param {import("./logger.js").Logger} log
   * @param {Readonly<import("../core/constants.js").Tuning>} [tuning]
   */
  constructor(log, tuning = TUNING) {
    this._log = log;
    this._tuning = tuning;
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {import("../core/session.js").PlayerSession} session
   * @param {number} now
   * @returns {import("../core/mode-resolver.js").EnvironmentSnapshot}
   */
  read(player, session, now) {
    const { dimension, location } = player;
    const proximity = this._proximity(player, session, now);
    return {
      dimensionId: dimension.id,
      y: location.y,
      submerged: player.isInWater,
      bossNearby: proximity.bossNearby,
      villageNearby: proximity.villageNearby,
      biomeId: proximity.biomeId,
      weather: this._weather(dimension),
      timeOfDay: world.getTimeOfDay(),
    };
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {import("../core/session.js").PlayerSession} session
   * @param {number} now
   * @returns {import("../core/session.js").Proximity}
   */
  _proximity(player, session, now) {
    const dimensionId = player.dimension.id;
    const cached = session.proximity;
    if (cached && cached.expiry > now && cached.dimensionId === dimensionId) {
      return cached;
    }
    const fresh = {
      expiry: now + this._tuning.proximityTtlTicks,
      dimensionId,
      bossNearby: this._hasNearby(player, BOSS_FILTERS, this._tuning.bossRadius),
      villageNearby: this._hasNearby(player, VILLAGER_FILTERS, this._tuning.villageRadius),
      biomeId: this._biomeId(player),
    };
    session.proximity = fresh;
    return fresh;
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {ReadonlyArray<import("@minecraft/server").EntityQueryOptions>} filters
   * @param {number} maxDistance
   */
  _hasNearby(player, filters, maxDistance) {
    const { dimension, location } = player;
    for (const filter of filters) {
      try {
        const query = { ...filter, location, maxDistance, closest: 1 };
        if (dimension.getEntities(query).length > 0) return true;
      } catch (error) {
        this._log.warn("Consulta de entidades próximas falhou", error);
      }
    }
    return false;
  }

  /** @param {import("@minecraft/server").Player} player */
  _biomeId(player) {
    try {
      return player.dimension.getBiome(player.location).id;
    } catch (error) {
      this._log.warn("Leitura de bioma falhou", error);
      return undefined;
    }
  }

  /** @param {import("@minecraft/server").Dimension} dimension */
  _weather(dimension) {
    try {
      return String(dimension.getWeather());
    } catch (error) {
      this._log.warn("Leitura de clima falhou", error);
      return "Clear";
    }
  }
}
