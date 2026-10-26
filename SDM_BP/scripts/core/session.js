import { createPlaybackState } from "./playback-machine.js";

/**
 * @typedef {Object} Proximity
 * @property {number} expiry
 * @property {string} dimensionId
 * @property {boolean} bossNearby
 * @property {boolean} villageNearby
 * @property {string | undefined} biomeId
 */

export class PlayerSession {
  /** @param {string} playerId */
  constructor(playerId) {
    this.playerId = playerId;
    this.playback = createPlaybackState();
    this.combatUntilTick = 0;
    /** @type {string | null} */
    this.lastTrackId = null;
    /** @type {Proximity | null} */
    this.proximity = null;
    /** @type {Map<import("./modes.js").ModeId, import("./shuffle-bag.js").ShuffleBag<import("./catalog.js").Track>>} */
    this.bags = new Map();
  }

  /**
   * @param {number} now
   * @param {number} graceTicks
   */
  markCombat(now, graceTicks) {
    this.combatUntilTick = now + graceTicks;
  }

  /** @param {number} now */
  isInCombat(now) {
    return now < this.combatUntilTick;
  }
}

export class SessionRegistry {
  constructor() {
    /** @type {Map<string, PlayerSession>} */
    this._sessions = new Map();
  }

  /** @param {string} playerId */
  get(playerId) {
    let session = this._sessions.get(playerId);
    if (!session) {
      session = new PlayerSession(playerId);
      this._sessions.set(playerId, session);
    }
    return session;
  }

  /** @param {string} playerId */
  delete(playerId) {
    this._sessions.delete(playerId);
  }

  get size() {
    return this._sessions.size;
  }
}
