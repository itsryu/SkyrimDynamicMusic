/** Dublê mínimo de `@minecraft/server`: valida a fiação dos módulos, não o comportamento do jogo. */

class Signal {
  constructor() {
    this.handlers = [];
  }
  subscribe(handler) {
    this.handlers.push(handler);
    return handler;
  }
  emit(event) {
    for (const handler of this.handlers) handler(event);
  }
}

export class Player {}
export class ItemStack {
  constructor(typeId, amount) {
    this.typeId = typeId;
    this.amount = amount;
  }
}
export const EntityComponentTypes = {
  Inventory: "minecraft:inventory",
  TypeFamily: "minecraft:type_family",
};
export const CommandPermissionLevel = { Any: 0 };
export const CustomCommandStatus = { Success: 0, Failure: 1 };

export const mockState = { tick: 0, timeOfDay: 6000, runIntervals: [], players: [] };

export const system = {
  get currentTick() {
    return mockState.tick;
  },
  beforeEvents: { startup: new Signal() },
  runInterval(callback, ticks) {
    mockState.runIntervals.push({ callback, ticks });
    return mockState.runIntervals.length;
  },
  clearRun() {},
  runTimeout(callback) {
    callback();
    return 0;
  },
  run(callback) {
    callback();
  },
  runJob(generator) {
    for (const _ of generator);
    return 0;
  },
  waitTicks: () => Promise.resolve(),
};

export const world = {
  afterEvents: {
    entityHurt: new Signal(),
    entityLoad: new Signal(),
    itemUse: new Signal(),
    playerSpawn: new Signal(),
    playerLeave: new Signal(),
  },
  getAllPlayers: () => mockState.players,
  getTimeOfDay: () => mockState.timeOfDay,
  getDimension: () => ({ getEntities: () => [] }),
};
