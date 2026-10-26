export const Mode = Object.freeze({
  EXPLORATION: "exploration",
  NIGHT: "night",
  VILLAGE: "village",
  COMBAT: "combat",
  BOSS: "boss",
  CAVE: "cave",
  DEEP_CAVE: "deep_cave",
  RAIN: "rain",
  STORM: "storm",
  SNOW: "snow",
  NETHER: "nether",
  END: "end",
});

/** @typedef {(typeof Mode)[keyof typeof Mode]} ModeId */

/**
 * @typedef {Object} ModeProfile
 * @property {boolean} interrupts Entrar no modo corta a faixa atual imediatamente.
 * @property {boolean} chained Enquanto o modo persiste, a próxima faixa começa sem silêncio.
 */

/** @type {Readonly<Record<ModeId, Readonly<ModeProfile>>>} */
export const MODE_PROFILES = Object.freeze({
  [Mode.BOSS]: { interrupts: true, chained: true },
  [Mode.COMBAT]: { interrupts: true, chained: true },
  [Mode.CAVE]: { interrupts: true, chained: false },
  [Mode.DEEP_CAVE]: { interrupts: true, chained: false },
  [Mode.VILLAGE]: { interrupts: true, chained: false },
  [Mode.NETHER]: { interrupts: true, chained: false },
  [Mode.END]: { interrupts: true, chained: false },
  [Mode.EXPLORATION]: { interrupts: false, chained: false },
  [Mode.NIGHT]: { interrupts: false, chained: false },
  [Mode.RAIN]: { interrupts: false, chained: false },
  [Mode.STORM]: { interrupts: false, chained: false },
  [Mode.SNOW]: { interrupts: false, chained: false },
});
