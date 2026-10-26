export const TICKS_PER_SECOND = 20;

/**
 * @typedef {Object} TickRange
 * @property {number} min
 * @property {number} max
 */

/**
 * @typedef {Object} Tuning
 * @property {number} pollTicks Intervalo entre avaliações por jogador.
 * @property {number} proximityTtlTicks Validade da leitura de proximidade (chefes, vilas, bioma).
 * @property {number} combatGraceTicks Duração do estado de combate após o último golpe.
 * @property {number} exitDebounceTicks Tempo mínimo fora de um modo de interrupção antes de liberá-lo.
 * @property {number} bossRadius
 * @property {number} villageRadius
 * @property {number} caveY
 * @property {number} deepCaveY
 * @property {number} snowAltitudeY
 * @property {number} nightStart
 * @property {number} nightEnd
 * @property {number} fadeSeconds
 * @property {TickRange} gapTicks Silêncio entre faixas (antes do fator de frequência).
 * @property {TickRange} releaseGapTicks Silêncio após sair de um modo de interrupção.
 * @property {number} popupDelayTicks
 * @property {number} popupDurationTicks
 * @property {number} popupDistance
 * @property {number} menuRetryTicks
 * @property {number} menuMaxAttempts
 */

/** @type {Readonly<Tuning>} */
export const TUNING = Object.freeze({
  pollTicks: 20,
  proximityTtlTicks: 40,
  combatGraceTicks: 300,
  exitDebounceTicks: 100,
  bossRadius: 40,
  villageRadius: 32,
  caveY: 45,
  deepCaveY: 0,
  snowAltitudeY: 100,
  nightStart: 13000,
  nightEnd: 23000,
  fadeSeconds: 3,
  gapTicks: Object.freeze({ min: 300, max: 900 }),
  releaseGapTicks: Object.freeze({ min: 200, max: 600 }),
  popupDelayTicks: 5,
  popupDurationTicks: 100,
  popupDistance: 2,
  menuRetryTicks: 10,
  menuMaxAttempts: 30,
});

export const IDS = Object.freeze({
  atmosphereTrack: "skyrim:track.skyrim_atmospheres",
  popupEntity: "skyrim:music_popup",
  configBook: "skyrim:config_book",
  firstJoinTag: "sdm_configured",
  settingsProperty: "sdm_settings",
});

export const LEGACY_PROPERTIES = Object.freeze({
  musicEnabled: "sdm_music_en",
  musicVolume: "sdm_music_vol",
  atmosEnabled: "sdm_atmos_en",
  atmosVolume: "sdm_atmos_vol",
  combatEnabled: "sdm_combat",
  popupEnabled: "sdm_popup_en",
});

export const DIMENSION_IDS = Object.freeze({
  overworld: "minecraft:overworld",
  nether: "minecraft:nether",
  end: "minecraft:the_end",
});

export const BOSS_TYPES = Object.freeze([
  "minecraft:ender_dragon",
  "minecraft:wither",
  "minecraft:warden",
  "minecraft:elder_guardian",
]);

export const HOSTILE_TYPES = new Set([
  "minecraft:zombie",
  "minecraft:skeleton",
  "minecraft:creeper",
  "minecraft:spider",
  "minecraft:cave_spider",
  "minecraft:witch",
  "minecraft:enderman",
  "minecraft:zombified_piglin",
  "minecraft:piglin",
  "minecraft:piglin_brute",
  "minecraft:hoglin",
  "minecraft:blaze",
  "minecraft:ghast",
  "minecraft:wither_skeleton",
  "minecraft:drowned",
  "minecraft:husk",
  "minecraft:stray",
  "minecraft:phantom",
  "minecraft:pillager",
  "minecraft:vindicator",
  "minecraft:evoker",
  "minecraft:ravager",
  "minecraft:guardian",
  "minecraft:shulker",
  "minecraft:breeze",
  "minecraft:bogged",
  "minecraft:creaking",
  ...BOSS_TYPES,
]);
