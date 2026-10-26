import { IDS, TUNING } from "../core/constants.js";

export class AudioDriver {
  /**
   * @param {import("./logger.js").Logger} log
   * @param {{ fadeSeconds?: number, atmosphereTrackId?: string }} [options]
   */
  constructor(log, options = {}) {
    this._log = log;
    this._fade = options.fadeSeconds ?? TUNING.fadeSeconds;
    this._atmosphereTrack = options.atmosphereTrackId ?? IDS.atmosphereTrack;
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {{ id: string }} track
   * @param {import("../core/settings.js").AudioChannel} channel
   * @returns {boolean} `true` se a faixa foi enviada ao cliente.
   */
  playTrack(player, track, channel) {
    if (!channel.audible) return false;
    try {
      player.playMusic(track.id, {
        fade: this._fade,
        loop: false,
        volume: channel.volume,
      });
      return true;
    } catch (error) {
      this._log.warn(`Falha ao tocar ${track.id}`, error);
      return false;
    }
  }

  /**
   * Substitui a música atual pelo leito atmosférico (ou silêncio, se desativado).
   * @param {import("@minecraft/server").Player} player
   * @param {import("../core/settings.js").AudioChannel} atmosphere
   */
  silence(player, atmosphere) {
    try {
      if (atmosphere.audible) {
        player.playMusic(this._atmosphereTrack, {
          fade: this._fade,
          loop: true,
          volume: atmosphere.volume,
        });
      } else {
        player.stopMusic();
      }
    } catch (error) {
      this._log.warn("Falha ao aplicar silêncio/atmosfera", error);
    }
  }
}
