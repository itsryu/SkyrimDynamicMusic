import { EntityComponentTypes, Player, system, world } from "@minecraft/server";
import { HOSTILE_TYPES, TUNING } from "../core/constants.js";

/** @param {import("@minecraft/server").Entity} entity */
function isHostileTarget(entity) {
  try {
    if (entity instanceof Player || HOSTILE_TYPES.has(entity.typeId)) return true;
    return entity.getComponent(EntityComponentTypes.TypeFamily)?.hasTypeFamily("monster") ?? false;
  } catch {
    return false;
  }
}

export class CombatTracker {
  /**
   * @param {import("../core/session.js").SessionRegistry} sessions
   * @param {Readonly<import("../core/constants.js").Tuning>} [tuning]
   */
  constructor(sessions, tuning = TUNING) {
    this._sessions = sessions;
    this._tuning = tuning;
  }

  register() {
    world.afterEvents.entityHurt.subscribe((event) => this._onHurt(event));
  }

  /** @param {import("@minecraft/server").EntityHurtAfterEvent} event */
  _onHurt({ hurtEntity, damageSource }) {
    const attacker = damageSource.damagingEntity;
    if (!attacker) return;
    if (hurtEntity instanceof Player) this._mark(hurtEntity);
    if (attacker instanceof Player && isHostileTarget(hurtEntity)) this._mark(attacker);
  }

  /** @param {import("@minecraft/server").Player} player */
  _mark(player) {
    if (!player.isValid) return;
    this._sessions.get(player.id).markCombat(system.currentTick, this._tuning.combatGraceTicks);
  }
}
