import { system } from "@minecraft/server";
import { FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import { TUNING } from "../core/constants.js";
import { FREQUENCY_ORDER, sanitizeSettings } from "../core/settings.js";
import { Text } from "./messages.js";

const VOLUME_STEP = 5;

/** @param {number} value */
const snapToStep = (value) => Math.round(value / VOLUME_STEP) * VOLUME_STEP;

/** @param {import("../core/settings.js").Settings} s */
function buildForm(s) {
  const { menu } = Text;
  return new ModalFormData()
    .title(menu.title)
    .toggle(menu.music, { defaultValue: s.musicEnabled })
    .slider(menu.musicVolume, 0, 100, {
      valueStep: VOLUME_STEP,
      defaultValue: snapToStep(s.musicVolume),
    })
    .toggle(menu.atmosphere, { defaultValue: s.atmosEnabled })
    .slider(menu.atmosphereVolume, 0, 100, {
      valueStep: VOLUME_STEP,
      defaultValue: snapToStep(s.atmosVolume),
    })
    .toggle(menu.combat, { defaultValue: s.combatEnabled })
    .toggle(menu.popup, { defaultValue: s.popupEnabled })
    .dropdown(menu.frequency, FREQUENCY_ORDER.map(menu.frequencyOption), {
      defaultValueIndex: FREQUENCY_ORDER.indexOf(s.frequency),
    });
}

/** @param {ReadonlyArray<unknown>} values */
function readForm(values) {
  const [
    musicEnabled,
    musicVolume,
    atmosEnabled,
    atmosVolume,
    combatEnabled,
    popupEnabled,
    frequency,
  ] = values;
  return sanitizeSettings({
    musicEnabled,
    musicVolume,
    atmosEnabled,
    atmosVolume,
    combatEnabled,
    popupEnabled,
    frequency: typeof frequency === "number" ? FREQUENCY_ORDER[frequency] : undefined,
  });
}

/**
 * @typedef {Object} ConfigMenuDeps
 * @property {import("../platform/settings-store.js").SettingsStore} settings
 * @property {Pick<import("../platform/music-orchestrator.js").MusicOrchestrator, "onSettingsChanged">} orchestrator
 * @property {import("../platform/logger.js").Logger} log
 * @property {Readonly<import("../core/constants.js").Tuning>} [tuning]
 */

export class ConfigMenu {
  /** @param {ConfigMenuDeps} deps */
  constructor(deps) {
    this._settings = deps.settings;
    this._orchestrator = deps.orchestrator;
    this._log = deps.log;
    this._tuning = deps.tuning ?? TUNING;
  }

  /** @param {import("@minecraft/server").Player} player */
  async open(player) {
    try {
      const response = await this._show(player, buildForm(this._settings.get(player)));
      if (!response || response.canceled || !response.formValues || !player.isValid) return;

      const previous = this._settings.getRuntime(player);
      const { runtime } = this._settings.save(player, readForm(response.formValues));
      this._orchestrator.onSettingsChanged(player, previous, runtime);
      player.sendMessage(Text.settingsSaved);
    } catch (error) {
      this._log.warn("Falha no menu de configuração", error);
    }
  }

  /**
   * Reabre o formulário enquanto o jogador estiver com outra tela aberta (chat, inventário).
   * @param {import("@minecraft/server").Player} player
   * @param {ModalFormData} form
   */
  async _show(player, form) {
    for (let attempt = 0; attempt < this._tuning.menuMaxAttempts; attempt++) {
      if (!player.isValid) return undefined;
      const response = await form.show(player);
      if (response.cancelationReason !== FormCancelationReason.UserBusy) return response;
      await system.waitTicks(this._tuning.menuRetryTicks);
    }
    return undefined;
  }
}
