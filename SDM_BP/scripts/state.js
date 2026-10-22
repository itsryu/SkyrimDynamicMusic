import { world } from "@minecraft/server";

export class PlayerContext {
  constructor(player) {
    this.player = player;
    this.mode = "init";
    this.playbackState = "none";
    this.previousTrack = null;
    this.transitionTick = 0;
    this.combatUntilTick = 0;
  }
}

export class StateManager {
  constructor() {
    /** @type {Map<string, PlayerContext>} */
    this.contexts = new Map();
    this.globalWeather = "Clear";
    this._initWeatherListeners();
  }

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
   * @param {import("@minecraft/server").Player} player
   * @returns {PlayerContext}
   */
  getContext(player) {
    if (!this.contexts.has(player.id)) {
      this.contexts.set(player.id, new PlayerContext(player));
    }
    return this.contexts.get(player.id);
  }

  /**
   * @param {Set<string>} onlinePlayerIds
   */
  cleanup(onlinePlayerIds) {
    for (const playerId of this.contexts.keys()) {
      if (!onlinePlayerIds.has(playerId)) {
        this.contexts.delete(playerId);
      }
    }
  }
}

export const stateManager = new StateManager();
