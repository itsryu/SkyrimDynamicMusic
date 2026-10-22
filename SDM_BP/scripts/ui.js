import { ModalFormData } from "@minecraft/server-ui";
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
   * @param {import("@minecraft/server").Player} player
   */
  static async showConfigMenu(player) {
    const settings = this.getSettings(player);
    let form = new ModalFormData().title("§l§8Skyrim Audio Config");

    try {
      form.toggle("Ativar Músicas", { defaultValue: settings.musicEnabled });
      form.slider("Volume da Música:", 0, 100, { valueStep: 5, defaultValue: settings.mVolRaw });
      form.toggle("Ativar Vento/Atmosfera", { defaultValue: settings.atmosEnabled });
      form.slider("Volume do Vento/Atmosfera:", 0, 100, { valueStep: 5, defaultValue: settings.aVolRaw });
      form.toggle("Ativar Música de Combate", { defaultValue: settings.combatEnabled });
      form.toggle("Mostrar Pop-up de Música Tocando", { defaultValue: settings.popupEnabled });
    } catch (e) {
      form = new ModalFormData().title("§l§8Skyrim Audio Config");
      form.toggle("Ativar Músicas", settings.musicEnabled);
      form.slider("Volume da Música:", 0, 100, 5, settings.mVolRaw);
      form.toggle("Ativar Vento/Atmosfera", settings.atmosEnabled);
      form.slider("Volume do Vento/Atmosfera:", 0, 100, 5, settings.aVolRaw);
      form.toggle("Ativar Música de Combate", settings.combatEnabled);
      form.toggle("Mostrar Pop-up de Música Tocando", settings.popupEnabled);
    }

    try {
      const response = await form.show(player);
      if (response.canceled) return;

      const [newMToggle, newMVol, newAToggle, newAVol, newCToggle, newPToggle] = response.formValues;

      player.setDynamicProperty("sdm_music_en", newMToggle);
      player.setDynamicProperty("sdm_music_vol", newMVol);
      player.setDynamicProperty("sdm_atmos_en", newAToggle);
      player.setDynamicProperty("sdm_atmos_vol", newAVol);
      player.setDynamicProperty("sdm_combat", newCToggle);
      player.setDynamicProperty("sdm_popup_en", newPToggle);

      player.sendMessage("§e[Skyrim Music]§f Configurações salvas com sucesso!");
    } catch (e) {
      if (e.message && (e.message.includes("busy") || e.message.includes("is in a state"))) {
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
