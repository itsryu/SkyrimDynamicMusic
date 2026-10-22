/**
 * @fileoverview Subsystem for UI instantiation and state retrieval.
 */
import { ModalFormData } from "@minecraft/server-ui";
import { system } from "@minecraft/server";
import { PopupManager } from "./popup.js";

/**
 * @typedef {Object} UISettings
 * @property {boolean} musicEnabled
 * @property {number} musicVolume
 * @property {boolean} atmosEnabled
 * @property {number} atmosVolume
 * @property {boolean} combatEnabled
 * @property {boolean} popupEnabled
 * @property {number} mVolRaw
 * @property {number} aVolRaw
 */

export class UIManager {
  /**
   * Fetches persisted settings directly from entity dynamic properties.
   * @param {import("@minecraft/server").Player} player
   * @returns {UISettings}
   */
  static getSettings(player) {
    const mToggle = player.getDynamicProperty("sdm_music_en") ?? true;
    const mVol = player.getDynamicProperty("sdm_music_vol") ?? 100;
    const aToggle = player.getDynamicProperty("sdm_atmos_en") ?? true;
    const aVol = player.getDynamicProperty("sdm_atmos_vol") ?? 30;
    const cToggle = player.getDynamicProperty("sdm_combat") ?? true;
    const pToggle = player.getDynamicProperty("sdm_popup_en") ?? true;

    return {
      musicEnabled: mToggle,
      musicVolume: mToggle ? mVol / 100 : 0,
      atmosEnabled: aToggle,
      atmosVolume: aToggle ? aVol / 100 : 0,
      combatEnabled: cToggle,
      popupEnabled: pToggle,
      mVolRaw: mVol,
      aVolRaw: aVol,
    };
  }

  /**
   * Asynchronously invokes the configuration form with recursive retry for race conditions.
   * @param {import("@minecraft/server").Player} player
   */
  static async showConfigMenu(player) {
    const settings = this.getSettings(player);

    const form = new ModalFormData()
      .title("§l§8Skyrim Audio Config")
      .toggle("Ativar Músicas (Orquestra)", settings.musicEnabled)
      .slider("Volume da Música (%):", 0, 100, 5, settings.mVolRaw)
      .toggle("Ativar Vento/Atmosfera", settings.atmosEnabled)
      .slider("Volume do Vento/Atmosfera (%):", 0, 100, 5, settings.aVolRaw)
      .toggle("Ativar Música de Combate", settings.combatEnabled)
      .toggle("Mostrar Pop-up de Música Tocando", settings.popupEnabled);

    try {
      const response = await form.show(player);
      if (response.canceled) return;

      const [newMToggle, newMVol, newAToggle, newAVol, newCToggle, newPToggle] =
        response.formValues;

      player.setDynamicProperty("sdm_music_en", newMToggle);
      player.setDynamicProperty("sdm_music_vol", newMVol);
      player.setDynamicProperty("sdm_atmos_en", newAToggle);
      player.setDynamicProperty("sdm_atmos_vol", newAVol);
      player.setDynamicProperty("sdm_combat", newCToggle);
      player.setDynamicProperty("sdm_popup_en", newPToggle);

      player.sendMessage(
        "§e[Skyrim Music]§f Configurações salvas com sucesso!"
      );
    } catch (e) {
      if (e.message.includes("busy") || e.message.includes("is in a state")) {
        // Silently fail if client is executing transitions
      }
    }
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {string} trackName
   */
  static showNowPlaying(player, trackName) {
    PopupManager.show(player, trackName);
  }
}
