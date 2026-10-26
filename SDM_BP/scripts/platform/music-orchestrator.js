import { findTrackById, PLAYLISTS } from "../core/catalog.js";
import { TUNING } from "../core/constants.js";
import { resolveMode } from "../core/mode-resolver.js";
import { Phase, step } from "../core/playback-machine.js";
import { ShuffleBag } from "../core/shuffle-bag.js";

/**
 * @typedef {Object} OrchestratorDeps
 * @property {import("../core/session.js").SessionRegistry} sessions
 * @property {{ getRuntime(player: import("@minecraft/server").Player): import("../core/settings.js").RuntimeSettings }} settings
 * @property {{ read: import("./environment-sensor.js").EnvironmentSensor["read"] }} sensor
 * @property {Pick<import("./audio-driver.js").AudioDriver, "playTrack" | "silence">} audio
 * @property {Pick<import("./popup-service.js").PopupService, "show">} popups
 * @property {{ runTimeout(callback: () => void, ticks: number): unknown }} scheduler
 * @property {() => number} clock
 * @property {import("../core/random.js").Rng} [rng]
 * @property {Readonly<import("../core/constants.js").Tuning>} [tuning]
 */

export class MusicOrchestrator {
  /** @param {OrchestratorDeps} deps */
  constructor(deps) {
    this._sessions = deps.sessions;
    this._settings = deps.settings;
    this._sensor = deps.sensor;
    this._audio = deps.audio;
    this._popups = deps.popups;
    this._scheduler = deps.scheduler;
    this._clock = deps.clock;
    this._rng = deps.rng ?? Math.random;
    this._tuning = deps.tuning ?? TUNING;
  }

  /** @param {import("@minecraft/server").Player} player */
  tick(player) {
    if (!player.isValid) return;
    const now = this._clock();
    const session = this._sessions.get(player.id);
    const runtime = this._settings.getRuntime(player);
    const environment = this._sensor.read(player, session, now);
    const inCombat = runtime.combatEnabled && session.isInCombat(now);
    const desired = resolveMode(environment, inCombat, this._tuning);

    const { state, action } = step(session.playback, desired, now, {
      pickTrack: (mode) => this._pickTrack(session, mode),
      rng: this._rng,
      gapScale: runtime.gapScale,
      tuning: this._tuning,
    });
    session.playback = state;

    if (action.kind === "play") {
      this._play(player, session, runtime, action.track);
    } else if (action.kind === "gap") {
      this._audio.silence(player, runtime.atmosphere);
    }
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @returns {boolean}
   */
  skip(player) {
    const runtime = this._settings.getRuntime(player);
    if (!runtime.music.audible) return false;
    this._forceNextTrack(player);
    return true;
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @returns {Readonly<import("../core/catalog.js").Track> | undefined}
   */
  nowPlaying(player) {
    const { phase, trackId, untilTick } = this._sessions.get(player.id).playback;
    if (phase !== Phase.TRACK || this._clock() >= untilTick) return undefined;
    return findTrackById(trackId);
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {import("../core/settings.js").RuntimeSettings} previous
   * @param {import("../core/settings.js").RuntimeSettings} next
   */
  onSettingsChanged(player, previous, next) {
    const session = this._sessions.get(player.id);
    if (previous.music.audible && !next.music.audible) {
      session.playback = { ...session.playback, phase: Phase.GAP, trackId: null, untilTick: 0 };
      this._audio.silence(player, next.atmosphere);
      return;
    }
    if (!previous.music.audible && next.music.audible) {
      this._forceNextTrack(player);
      return;
    }
    const musicPlaying =
      session.playback.phase === Phase.TRACK && session.playback.trackId !== null;
    if (previous.atmosphere.audible !== next.atmosphere.audible && !musicPlaying) {
      this._audio.silence(player, next.atmosphere);
    }
  }

  /** @param {import("@minecraft/server").Player} player */
  _forceNextTrack(player) {
    const session = this._sessions.get(player.id);
    if (session.playback.phase !== Phase.IDLE) {
      session.playback = { ...session.playback, phase: Phase.GAP, untilTick: 0, exitSince: null };
    }
    this.tick(player);
  }

  /**
   * @param {import("../core/session.js").PlayerSession} session
   * @param {import("../core/modes.js").ModeId} mode
   */
  _pickTrack(session, mode) {
    const playlist = PLAYLISTS[mode];
    if (!playlist || playlist.length === 0) return null;
    let bag = session.bags.get(mode);
    if (!bag) {
      bag = new ShuffleBag(playlist, this._rng);
      session.bags.set(mode, bag);
    }
    const track = bag.draw(session.lastTrackId);
    if (!track) return null;
    session.lastTrackId = track.id;
    return track;
  }

  /**
   * @param {import("@minecraft/server").Player} player
   * @param {import("../core/session.js").PlayerSession} session
   * @param {import("../core/settings.js").RuntimeSettings} runtime
   * @param {Readonly<import("../core/catalog.js").Track>} track
   */
  _play(player, session, runtime, track) {
    const audible = this._audio.playTrack(player, track, runtime.music);
    if (!audible) {
      session.playback = { ...session.playback, trackId: null };
      this._audio.silence(player, runtime.atmosphere);
      return;
    }
    if (!runtime.popupEnabled) return;
    this._scheduler.runTimeout(() => {
      if (player.isValid && session.playback.trackId === track.id) {
        this._popups.show(player, track.displayName);
      }
    }, this._tuning.popupDelayTicks);
  }
}
