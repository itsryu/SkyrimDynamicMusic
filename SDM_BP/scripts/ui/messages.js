/** @typedef {import("@minecraft/server").RawMessage} RawMessage */

/** @param {string} key @param {string[]} [args] @returns {RawMessage} */
const t = (key, args) => (args ? { translate: key, with: args } : { translate: key });

export const Text = Object.freeze({
  nowPlaying: (/** @type {string} */ trackName) => t("sdm.np.playing", [trackName]),
  nothingPlaying: t("sdm.np.none"),
  skipped: t("sdm.skip.done"),
  skipUnavailable: t("sdm.skip.unavailable"),
  settingsSaved: t("sdm.menu.saved"),
  bookReceived: t("sdm.book.received"),
  menu: Object.freeze({
    title: t("sdm.menu.title"),
    music: t("sdm.menu.music"),
    musicVolume: t("sdm.menu.music_volume"),
    atmosphere: t("sdm.menu.atmosphere"),
    atmosphereVolume: t("sdm.menu.atmosphere_volume"),
    combat: t("sdm.menu.combat"),
    popup: t("sdm.menu.popup"),
    frequency: t("sdm.menu.frequency"),
    frequencyOption: (/** @type {string} */ id) => t(`sdm.menu.frequency.${id}`),
  }),
});

export const CommandText = Object.freeze({
  playerOnly: "Este comando só pode ser executado por um jogador.",
  descriptions: Object.freeze({
    np: "Exibe a música que está tocando agora.",
    skip: "Pula para a próxima música.",
    config: "Abre o menu de configuração do Skyrim Music.",
  }),
});
