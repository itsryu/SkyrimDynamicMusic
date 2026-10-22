/**
 * @fileoverview Audio orchestration and logic transitions.
 */
import { system } from "@minecraft/server";
import { CONFIG, PLAYLISTS } from "./config.js";
import { stateManager } from "./state.js";
import { EnvironmentSensor } from "./environment.js";
import { UIManager } from "./ui.js";

export class AudioOrchestrator {
  /**
   * Cryptographically insecure pseudo-random generator integer scaling.
   * @private
   */
  static _getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * @private
   */
  static _chooseTrack(playlist, previousTrackId) {
    if (!playlist || playlist.length === 0) return null;
    const available =
      playlist.length > 1
        ? playlist.filter((t) => t.id !== previousTrackId)
        : playlist;
    return available[this._getRandomInt(0, available.length - 1)];
  }

  /**
   * Handles inter-track atmospheric pauses.
   * @private
   */
  static _playAtmosphereGap(player, context, settings) {
    try {
      if (settings.atmosEnabled && settings.atmosVolume > 0) {
        player.playMusic(CONFIG.ATMOSPHERE_TRACK_ID, {
          fade: CONFIG.FADE_SECONDS,
          loop: true,
          volume: settings.atmosVolume,
        });
      }
      context.playbackState = "gap";
      const gapDuration = this._getRandomInt(
        CONFIG.EXPLORATION_GAP_MIN_TICKS,
        CONFIG.EXPLORATION_GAP_MAX_TICKS
      );
      context.transitionTick = system.currentTick + gapDuration;
    } catch (error) {
      // Runtime engine constraint safeguard
    }
  }

  /**
   * Invokes track payload based on active behavioral modes.
   * @private
   */
  static _playContextTrack(player, context, mode, settings) {
    const playlist = PLAYLISTS[mode];
    if (!playlist) return;

    const track = this._chooseTrack(playlist, context.previousTrack);
    if (!track) return;

    const isCombatLoop = mode === "combat" || mode === "boss";

    try {
      if (settings.musicEnabled && settings.musicVolume > 0) {
        player.playMusic(track.id, {
          fade: CONFIG.FADE_SECONDS,
          loop: isCombatLoop,
          volume: settings.musicVolume,
        });

        if (settings.popupEnabled) {
          system.runTimeout(() => {
            if (player.isValid())
              UIManager.showNowPlaying(player, track.displayName);
          }, 5);
        }
      }

      context.mode = mode;
      context.playbackState = "track";
      context.previousTrack = track.id;
      context.transitionTick = isCombatLoop
        ? Infinity
        : system.currentTick + track.durationTicks;
    } catch (error) {
      // Handled engine exception
    }
  }

  /**
   * Core execution tick evaluated per player.
   * @param {import("@minecraft/server").Player} player
   */
  static tickPlayer(player) {
    if (!player.isValid()) return;

    const context = stateManager.getContext(player);
    const settings = UIManager.getSettings(player);
    const currentMode = EnvironmentSensor.resolveMode(
      player,
      context,
      settings
    );

    if (context.mode !== currentMode || context.transitionTick === 0) {
      this._playContextTrack(player, context, currentMode, settings);
      return;
    }

    if (system.currentTick >= context.transitionTick) {
      if (context.playbackState === "track") {
        this._playAtmosphereGap(player, context, settings);
      } else if (context.playbackState === "gap") {
        this._playContextTrack(player, context, currentMode, settings);
      }
    }
  }
}
