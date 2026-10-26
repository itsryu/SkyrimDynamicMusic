import { system, world } from "@minecraft/server";
import { DIMENSION_IDS, IDS, TUNING } from "../core/constants.js";

/**
 * @typedef {Object} ActivePopup
 * @property {import("@minecraft/server").Player} player
 * @property {import("@minecraft/server").Entity} entity
 * @property {number} expireTick
 * @property {string} poseKey
 */

export class PopupService {
  /**
   * @param {import("./logger.js").Logger} log
   * @param {Readonly<import("../core/constants.js").Tuning>} [tuning]
   */
  constructor(log, tuning = TUNING) {
    this._log = log;
    this._tuning = tuning;
    /** @type {Map<string, ActivePopup>} */
    this._active = new Map();
    /** @type {number | undefined} */
    this._loopId = undefined;
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {string} label
   */
  show(player, label) {
    this.remove(player.id);
    try {
      const entity = player.dimension.spawnEntity(IDS.popupEntity, player.getHeadLocation());
      entity.nameTag = `§a♫§f ${label}`;
      const popup = {
        player,
        entity,
        expireTick: system.currentTick + this._tuning.popupDurationTicks,
        poseKey: "",
      };
      this._active.set(player.id, popup);
      this._reposition(popup);
      this._startLoop();
    } catch (error) {
      this._log.warn("Falha ao exibir o pop-up de música", error);
    }
  }

  /** @param {string} playerId */
  remove(playerId) {
    const popup = this._active.get(playerId);
    if (!popup) return;
    this._active.delete(playerId);
    this._despawn(popup.entity);
    if (this._active.size === 0) this._stopLoop();
  }

  purgeOrphans() {
    for (const dimensionId of Object.values(DIMENSION_IDS)) {
      try {
        const orphans = world.getDimension(dimensionId).getEntities({ type: IDS.popupEntity });
        for (const orphan of orphans) this._despawn(orphan);
      } catch (error) {
        this._log.warn(`Limpeza de pop-ups em ${dimensionId} falhou`, error);
      }
    }
  }

  /** @param {import("@minecraft/server").Entity} entity */
  purgeIfOrphan(entity) {
    if (entity.typeId !== IDS.popupEntity) return;
    for (const popup of this._active.values()) {
      if (popup.entity.id === entity.id) return;
    }
    this._despawn(entity);
  }

  _tick() {
    const now = system.currentTick;
    for (const [playerId, popup] of this._active) {
      if (now >= popup.expireTick || !popup.player.isValid || !popup.entity.isValid) {
        this.remove(playerId);
        continue;
      }
      this._reposition(popup);
    }
  }

  /** @param {ActivePopup} popup */
  _reposition(popup) {
    const { player, entity } = popup;
    if (!player.isValid || !entity.isValid) return;

    const head = player.getHeadLocation();
    const view = player.getViewDirection();
    const rotation = player.getRotation();
    const distance = this._tuning.popupDistance;
    const target = {
      x: head.x + view.x * distance,
      y: head.y + view.y * distance,
      z: head.z + view.z * distance,
    };

    const poseKey = [
      player.dimension.id,
      target.x.toFixed(2),
      target.y.toFixed(2),
      target.z.toFixed(2),
      rotation.x.toFixed(1),
      rotation.y.toFixed(1),
    ].join("|");
    if (poseKey === popup.poseKey) return;
    popup.poseKey = poseKey;

    try {
      entity.teleport(target, {
        dimension: player.dimension,
        rotation: { x: rotation.x, y: rotation.y },
      });
    } catch (error) {
      this._log.warn("Falha ao reposicionar o pop-up", error);
    }
  }

  /** @param {import("@minecraft/server").Entity} entity */
  _despawn(entity) {
    try {
      if (entity.isValid) entity.remove();
    } catch (error) {
      this._log.warn("Falha ao remover o pop-up", error);
    }
  }

  _startLoop() {
    if (this._loopId === undefined) {
      this._loopId = system.runInterval(() => this._tick(), 1);
    }
  }

  _stopLoop() {
    if (this._loopId !== undefined) {
      system.clearRun(this._loopId);
      this._loopId = undefined;
    }
  }
}
