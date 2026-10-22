/**
 * @fileoverview 3D entity billboard manager.
 */
import { system, world } from "@minecraft/server";

export class PopupManager {
  static popups = new Map();
  static POPUP_DURATION_TICKS = 100;
  static DISTANCE_FROM_CAMERA = 2.0;

  /**
   * Sweeps dimensions enforcing memory de-allocation for orphaned entities.
   */
  static cleanupOrphans() {
    const dimensions = ["overworld", "nether", "the_end"];
    for (const dimId of dimensions) {
      try {
        const dim = world.getDimension(dimId);
        const orphans = dim.getEntities({ tags: ["sdm_popup"] });
        for (const orphan of orphans) {
          orphan.remove();
        }
      } catch (e) {
        // Safe fail if dimension is unloaded
      }
    }
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {string} trackName
   */
  static show(player, trackName) {
    this.remove(player.id);

    try {
      const entity = player.dimension.spawnEntity(
        "skyrim:music_popup",
        player.getHeadLocation()
      );
      entity.addTag("sdm_popup");
      entity.addTag(`popup_owner_${player.id}`);
      entity.nameTag = `§a♫§f ${trackName}`;

      this.popups.set(player.id, {
        entity: entity,
        expireTick: system.currentTick + this.POPUP_DURATION_TICKS,
      });

      this.updatePosition(player, entity);
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * @param {string} playerId
   */
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

  /**
   * Synchronizes spatial coordinates via trigonometric vectors.
   * @param {import("@minecraft/server").Player} player
   * @param {import("@minecraft/server").Entity} entity
   */
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
      entity.teleport(targetLoc, { rotation: { x: rot.x, y: rot.y } });
    } catch (e) {}
  }
}
