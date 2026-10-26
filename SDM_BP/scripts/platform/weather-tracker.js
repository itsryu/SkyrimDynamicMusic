import { world } from "@minecraft/server";

const DEFAULT_WEATHER = "Clear";

/** @param {string} dimensionId */
const keyOf = (dimensionId) => dimensionId.replace(/^minecraft:/, "");

/**
 * A API estável não expõe leitura direta do clima; ele é rastreado por evento.
 * Antes da primeira mudança observada, assume-se tempo limpo.
 */
export class WeatherTracker {
  constructor() {
    /** @type {Map<string, string>} */
    this._byDimension = new Map();
  }

  register() {
    world.afterEvents.weatherChange.subscribe(({ dimension, newWeather }) => {
      this._byDimension.set(keyOf(dimension), String(newWeather));
    });
  }

  /**
   * @param {string} dimensionId
   * @returns {string} `Clear`, `Rain` ou `Thunder`.
   */
  get(dimensionId) {
    return this._byDimension.get(keyOf(dimensionId)) ?? DEFAULT_WEATHER;
  }
}
