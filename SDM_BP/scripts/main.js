import { world, system, ItemStack } from "@minecraft/server";
import { CONFIG, ENTITY_DICTIONARY, PLAYLISTS } from "./config.js";
import { stateManager } from "./state.js";
import { UIManager } from "./ui.js";
import { AudioOrchestrator } from "./audio.js";
import { PopupManager } from "./popup.js";

system.runTimeout(() => {
  PopupManager.cleanupOrphans();
}, 20);

world.beforeEvents.chatSend.subscribe((ev) => {
  const msg = ev.message.toLowerCase().trim();

  if (msg === "!np" || msg === "!musica" || msg === "!music") {
    ev.cancel = true;
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
    system.runTimeout(() => UIManager.showConfigMenu(player), 5);
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
      } catch (e) {
        console.warn("[SkyrimMusic] Falha ao dar o livro: " + e);
      }
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

system.runInterval(() => {
  PopupManager.tick();
}, 1);

system.runInterval(() => {
  const onlinePlayers = Array.from(world.getPlayers());
  const onlinePlayerIds = new Set(onlinePlayers.map((p) => p.id));

  for (const player of onlinePlayers) {
    try {
      AudioOrchestrator.tickPlayer(player);
    } catch (error) {
      console.warn(
        "[SkyrimMusic] Erro ao processar áudio para " + player.name + ": ",
        error
      );
    }
  }

  stateManager.cleanup(onlinePlayerIds);
}, CONFIG.POLL_TICKS);
