/**
 * @fileoverview Main entry point. Defines runtime logic loops and event subscriptions.
 */
import { world, system, ItemStack } from "@minecraft/server";
import { CONFIG, ENTITY_DICTIONARY, PLAYLISTS } from "./config.js";
import { stateManager } from "./state.js";
import { UIManager } from "./ui.js";
import { AudioOrchestrator } from "./audio.js";
import { PopupManager } from "./popup.js";

// Initialize Environment State
system.runTimeout(() => {
  PopupManager.cleanupOrphans();
}, 20);

// Use afterEvents as beforeEvents.chatSend is non-standard in modern APIs
world.afterEvents.chatSend.subscribe((ev) => {
  const msg = ev.message.toLowerCase().trim();

  if (msg === "!np" || msg === "!musica" || msg === "!music") {
    const player = ev.sender;

    system.run(() => {
      const context = stateManager.getContext(player);
      const trackId = context.previousTrack;

      if (!trackId) {
        player.sendMessage(
          "§e[Skyrim Music]§f Nenhuma música tocando no momento."
        );
        return;
      }

      let trackName = "Desconhecida";
      for (const mode in PLAYLISTS) {
        const track = PLAYLISTS[mode].find((t) => t.id === trackId);
        if (track) {
          trackName = track.displayName;
          break;
        }
      }

      player.sendMessage(`§e[Skyrim Music]§f Tocando agora: §a♫ ${trackName}`);
    });
  }
});

world.afterEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack.typeId === "skyrim:config_book") {
    const player = ev.source;
    system.run(() => UIManager.showConfigMenu(player));
  }
});

world.afterEvents.playerSpawn.subscribe((ev) => {
  if (ev.initialSpawn) {
    const player = ev.player;
    if (!player.hasTag("sdm_configured")) {
      player.addTag("sdm_configured");
      try {
        const inv = player.getComponent("minecraft:inventory")?.container;
        if (inv) {
          inv.addItem(new ItemStack("skyrim:config_book", 1));
          player.sendMessage(
            "§e[Skyrim Music]§f Você recebeu o Livro de Configurações de Áudio! Se perder, crafte com um Livro + Bloco Musical."
          );
        }
      } catch (e) {}
    }
  }
});

world.afterEvents.entityHurt.subscribe((event) => {
  const target = event.hurtEntity;
  const attacker = event.damageSource?.damagingEntity;
  const currentTick = system.currentTick;

  if (target?.typeId === "minecraft:player" && attacker) {
    if (target.isValid()) {
      stateManager.getContext(target).combatUntilTick =
        currentTick + CONFIG.COMBAT_GRACE_TICKS;
    }
  }

  if (attacker?.typeId === "minecraft:player" && target) {
    const isHostile =
      ENTITY_DICTIONARY.HOSTILES.has(target.typeId) ||
      ENTITY_DICTIONARY.BOSSES.has(target.typeId) ||
      target.typeId === "minecraft:player";

    if (attacker.isValid() && isHostile) {
      stateManager.getContext(attacker).combatUntilTick =
        currentTick + CONFIG.COMBAT_GRACE_TICKS;
    }
  }
});

world.afterEvents.playerLeave.subscribe((ev) => {
  PopupManager.remove(ev.playerId);
});

// UI Sync implementation
system.runInterval(() => {
  const currentTick = system.currentTick;
  const players = world.getPlayers();

  for (const [playerId, data] of PopupManager.popups.entries()) {
    const player = players.find((p) => p.id === playerId);
    if (currentTick >= data.expireTick || !player || !data.entity.isValid()) {
      PopupManager.remove(playerId);
      continue;
    }
    PopupManager.updatePosition(player, data.entity);
  }
}, 1);

// Cooperative Multitasking: Generator function limits execution complexity per tick
function* processAudioQueue() {
  const players = Array.from(world.getPlayers());
  for (const player of players) {
    try {
      AudioOrchestrator.tickPlayer(player);
    } catch (e) {}
    yield; // Relinquish thread execution to subsequent engine ticks
  }
}

// Spawns the Job at predefined intervals
system.runInterval(() => {
  const players = Array.from(world.getPlayers());
  stateManager.cleanup(new Set(players.map((p) => p.id)));

  system.runJob(processAudioQueue());
}, CONFIG.POLL_TICKS);
