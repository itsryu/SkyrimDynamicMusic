import { CommandPermissionLevel, CustomCommandStatus, Player, system } from "@minecraft/server";
import { CommandText, Text } from "./messages.js";

/**
 * @typedef {Object} CommandDeps
 * @property {Pick<import("../platform/music-orchestrator.js").MusicOrchestrator, "nowPlaying" | "skip">} orchestrator
 * @property {Pick<import("./config-menu.js").ConfigMenu, "open">} menu
 */

/** @param {import("@minecraft/server").CustomCommandOrigin} origin */
const resolvePlayer = (origin) => {
  const source = origin.initiator ?? origin.sourceEntity;
  return source instanceof Player ? source : undefined;
};

/**
 * @param {import("@minecraft/server").CustomCommandRegistry} registry
 * @param {string} name
 * @param {string} description
 * @param {(player: Player) => void} action
 */
function register(registry, name, description, action) {
  registry.registerCommand(
    {
      name,
      description,
      permissionLevel: CommandPermissionLevel.Any,
      cheatsRequired: false,
    },
    (origin) => {
      const player = resolvePlayer(origin);
      if (!player) {
        return { status: CustomCommandStatus.Failure, message: CommandText.playerOnly };
      }
      system.run(() => action(player));
      return { status: CustomCommandStatus.Success };
    }
  );
}

/**
 * @param {import("@minecraft/server").CustomCommandRegistry} registry
 * @param {CommandDeps} deps
 */
export function registerCommands(registry, { orchestrator, menu }) {
  const { descriptions } = CommandText;

  register(registry, "sdm:np", descriptions.np, (player) => {
    const track = orchestrator.nowPlaying(player);
    player.sendMessage(track ? Text.nowPlaying(track.displayName) : Text.nothingPlaying);
  });

  register(registry, "sdm:skip", descriptions.skip, (player) => {
    player.sendMessage(orchestrator.skip(player) ? Text.skipped : Text.skipUnavailable);
  });

  register(registry, "sdm:config", descriptions.config, (player) => {
    void menu.open(player);
  });
}
