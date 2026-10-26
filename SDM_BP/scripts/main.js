import { EntityComponentTypes, ItemStack, system, world } from "@minecraft/server";
import { IDS, TUNING } from "./core/constants.js";
import { SessionRegistry } from "./core/session.js";
import { AudioDriver } from "./platform/audio-driver.js";
import { CombatTracker } from "./platform/combat-tracker.js";
import { EnvironmentSensor } from "./platform/environment-sensor.js";
import { createLogger } from "./platform/logger.js";
import { MusicOrchestrator } from "./platform/music-orchestrator.js";
import { PopupService } from "./platform/popup-service.js";
import { SettingsStore } from "./platform/settings-store.js";
import { WeatherTracker } from "./platform/weather-tracker.js";
import { registerCommands } from "./ui/commands.js";
import { ConfigMenu } from "./ui/config-menu.js";
import { Text } from "./ui/messages.js";

const log = createLogger("main");
const sessions = new SessionRegistry();
const settings = new SettingsStore();
const weather = new WeatherTracker();
const popups = new PopupService(createLogger("popup"));
const orchestrator = new MusicOrchestrator({
  sessions,
  settings,
  sensor: new EnvironmentSensor(createLogger("sensor"), weather),
  audio: new AudioDriver(createLogger("audio")),
  popups,
  scheduler: system,
  clock: () => system.currentTick,
});
const menu = new ConfigMenu({ settings, orchestrator, log: createLogger("menu") });

/** @param {import("@minecraft/server").Player} player */
function giveConfigBook(player) {
  if (player.hasTag(IDS.firstJoinTag)) return;
  player.addTag(IDS.firstJoinTag);
  try {
    const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
    if (!container) return;
    const overflow = container.addItem(new ItemStack(IDS.configBook, 1));
    if (overflow) player.dimension.spawnItem(overflow, player.location);
    player.sendMessage(Text.bookReceived);
  } catch (error) {
    log.warn("Falha ao entregar o Livro de Configuração", error);
  }
}

let polling = false;

function* pollPlayers() {
  try {
    for (const player of world.getAllPlayers()) {
      try {
        orchestrator.tick(player);
      } catch (error) {
        log.warn("Falha ao avaliar a música do jogador", error);
      }
      yield;
    }
  } finally {
    polling = false;
  }
}

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
  registerCommands(customCommandRegistry, { orchestrator, menu });
});

system.runTimeout(() => popups.purgeOrphans(), 20);

world.afterEvents.entityLoad.subscribe(({ entity }) => popups.purgeIfOrphan(entity));

world.afterEvents.itemUse.subscribe(({ itemStack, source }) => {
  if (itemStack.typeId === IDS.configBook) system.run(() => void menu.open(source));
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) giveConfigBook(player);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  popups.remove(playerId);
  sessions.delete(playerId);
  settings.forget(playerId);
});

new CombatTracker(sessions).register();
weather.register();

system.runInterval(() => {
  if (polling) return;
  polling = true;
  try {
    system.runJob(pollPlayers());
  } catch (error) {
    polling = false;
    log.warn("Falha ao agendar a varredura de jogadores", error);
  }
}, TUNING.pollTicks);
