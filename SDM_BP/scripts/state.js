/**
 * @fileoverview State management architecture for players and global variables.
 */
import { world } from "@minecraft/server";

/**
 * Contextual memory allocated per active player.
 */
export class PlayerContext {
  /**
   * @param {import("@minecraft/server").Player} player
   */
  constructor(player) {
    this.player = player;
    this.mode = "init";
    this.playbackState = "none";
    this.previousTrack = null;
    this.transitionTick = 0;
    this.combatUntilTick = 0;
  }
}

/**
 * Singleton state controller implementing memoization for environments.
 */
export class StateManager {
  constructor() {
    /** @type {Map<string, PlayerContext>} */
    this.contexts = new Map();
    /** @type {Map<string, { value: string, expiry: number }>} */
    this.environmentalCache = new Map();
    this.globalWeather = "Clear";
    this._initWeatherListeners();
  }

  /** @private */
  _initWeatherListeners() {
    world.afterEvents.weatherChange.subscribe((ev) => {
      if (ev.newWeather !== undefined) {
        this.globalWeather = ev.newWeather;
      } else {
        if (ev.lightning) this.globalWeather = "Thunder";
        else if (ev.raining) this.globalWeather = "Rain";
        else this.globalWeather = "Clear";
      }
    });
  }

  /**
   * Retrieves or instantiates the context for a specific player.
   * @param {import("@minecraft/server").Player} player
   * @returns {PlayerContext}
   */
  getContext(player) {
    let context = this.contexts.get(player.id);
    if (!context) {
      context = new PlayerContext(player);
      this.contexts.set(player.id, context);
    }
    return context;
  }

  /**
   * Memory garbage collection. Removes disconnected players.
   * @param {Set<string>} onlinePlayerIds
   */
  cleanup(onlinePlayerIds) {
    for (const playerId of this.contexts.keys()) {
      if (!onlinePlayerIds.has(playerId)) {
        this.contexts.delete(playerId);
        this.environmentalCache.delete(playerId);
      }
    }
  }
}

export const stateManager = new StateManager();
