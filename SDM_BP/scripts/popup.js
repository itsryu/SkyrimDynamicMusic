import { system, world } from "@minecraft/server";

export class PopupManager {
  static popups = new Map();
  static POPUP_DURATION_TICKS = 100; // 5 sec
  static DISTANCE_FROM_CAMERA = 2.0;

  static cleanupOrphans() {
    for (const dimension of ["overworld", "nether", "the_end"]) {
      try {
        const dim = world.getDimension(dimension);
        const orphans = dim.getEntities({ tags: ["sdm_popup"] });
        for (const orphan of orphans) {
          orphan.remove();
        }
      } catch (e) {}
    }
  }

  static show(player, trackName) {
    this.remove(player.id);

    try {
      const headLoc = player.getHeadLocation();
      const entity = player.dimension.spawnEntity(
        "skyrim:music_popup",
        headLoc
      );

      entity.addTag("sdm_popup");
      entity.addTag(`popup_owner_${player.id}`);
      entity.nameTag = `§a♫§f ${trackName}`;

      this.popups.set(player.id, {
        entity: entity,
        expireTick: system.currentTick + this.POPUP_DURATION_TICKS,
        playerId: player.id,
      });

      this.updatePosition(player, entity);
    } catch (error) {
      console.warn(
        `[SkyrimMusic] Falha ao criar popup para ${player.name}:`,
        error
      );
    }
  }

  static remove(playerId) {
    const data = this.popups.get(playerId);
    if (data) {
      if (data.entity?.isValid()) {
        try {
          data.entity.remove();
        } catch (e) {}
      }
      this.popups.delete(playerId);
    }
  }

  static updatePosition(player, entity) {
    if (!player.isValid() || !entity.isValid()) return;

    const headLoc = player.getHeadLocation();
    const viewDir = player.getViewDirection();
    const rot = player.getRotation();

    const targetLoc = {
      x: headLoc.x + viewDir.x * this.DISTANCE_FROM_CAMERA,
      y: headLoc.y + viewDir.y * this.DISTANCE_FROM_CAMERA,
      z: headLoc.z + viewDir.z * this.DISTANCE_FROM_CAMERA,
    };

    try {
      entity.teleport(targetLoc, {
        rotation: { x: rot.x, y: rot.y },
      });
    } catch (e) {}
  }

  static tick() {
    const currentTick = system.currentTick;
    const players = Array.from(world.getPlayers());
    const validPlayerIds = new Set(players.map((p) => p.id));

    for (const [playerId, data] of this.popups.entries()) {
      const player = players.find((p) => p.id === playerId);

      if (
        currentTick >= data.expireTick ||
        !validPlayerIds.has(playerId) ||
        !data.entity.isValid()
      ) {
        this.remove(playerId);
        continue;
      }

      this.updatePosition(player, data.entity);
    }
  }
}
