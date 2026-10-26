import { TUNING } from "./constants.js";
import { MODE_PROFILES } from "./modes.js";
import { randomInt } from "./random.js";

export const Phase = Object.freeze({
  IDLE: "idle",
  TRACK: "track",
  GAP: "gap",
});

/**
 * @typedef {Object} PlaybackState
 * @property {"idle" | "track" | "gap"} phase
 * @property {import("./modes.js").ModeId | null} mode Modo que originou a faixa ou o silêncio atual.
 * @property {string | null} trackId
 * @property {number} untilTick Fim da fase atual.
 * @property {number | null} exitSince Início da saída de um modo de interrupção (histerese).
 */

/**
 * @typedef {Object} Pickable
 * @property {string} id
 * @property {number} durationTicks
 */

/**
 * @template {Pickable} [T=Pickable]
 * @typedef {Object} StepContext
 * @property {(mode: import("./modes.js").ModeId) => T | null} pickTrack
 * @property {import("./random.js").Rng} rng
 * @property {number} gapScale
 * @property {Readonly<import("./constants.js").Tuning>} [tuning]
 */

/**
 * @template {Pickable} [T=Pickable]
 * @typedef {{ kind: "none" }
 *   | { kind: "play", mode: import("./modes.js").ModeId, track: T }
 *   | { kind: "gap", ticks: number }} PlaybackAction
 */

/** @returns {PlaybackState} */
export const createPlaybackState = () => ({
  phase: Phase.IDLE,
  mode: null,
  trackId: null,
  untilTick: 0,
  exitSince: null,
});

/** @type {PlaybackAction<any>} */
const NONE = Object.freeze({ kind: "none" });

/**
 * Regras de transição inspiradas no gerenciador de música de Skyrim:
 * modos de interrupção cortam a faixa; modos ambientes só valem na próxima escolha;
 * ao sair de um modo de interrupção há um silêncio de liberação (com histerese);
 * faixas encadeadas (combate/chefe) seguem sem pausa enquanto o modo persistir.
 *
 * @template {Pickable} T
 * @param {PlaybackState} state
 * @param {import("./modes.js").ModeId} desired
 * @param {number} now
 * @param {StepContext<T>} ctx
 * @returns {{ state: PlaybackState, action: PlaybackAction<T> }}
 */
export function step(state, desired, now, ctx) {
  const tuning = ctx.tuning ?? TUNING;
  if (state.phase === Phase.IDLE) return startTrack(desired, now, ctx);

  const current = state.mode ?? desired;
  const wanted = MODE_PROFILES[desired];
  let next = state;

  if (desired !== current) {
    if (wanted.interrupts) return startTrack(desired, now, ctx);
    if (state.phase === Phase.GAP) {
      next = { ...state, mode: desired, exitSince: null };
    } else if (MODE_PROFILES[current].interrupts) {
      const since = state.exitSince ?? now;
      if (now - since < tuning.exitDebounceTicks) {
        return { state: { ...state, exitSince: since }, action: NONE };
      }
      return enterGap(state, desired, now, tuning.releaseGapTicks, ctx);
    }
  } else if (state.exitSince !== null) {
    next = { ...state, exitSince: null };
  }

  if (now < next.untilTick) return { state: next, action: NONE };

  if (next.phase === Phase.TRACK) {
    if (wanted.chained && desired === next.mode) {
      return startTrack(desired, now, ctx);
    }
    return enterGap(next, desired, now, tuning.gapTicks, ctx);
  }
  return startTrack(desired, now, ctx);
}

/**
 * @template {Pickable} T
 * @param {import("./modes.js").ModeId} mode
 * @param {number} now
 * @param {StepContext<T>} ctx
 * @returns {{ state: PlaybackState, action: PlaybackAction<T> }}
 */
function startTrack(mode, now, ctx) {
  const track = ctx.pickTrack(mode);
  if (!track) {
    return enterGap(createPlaybackState(), mode, now, (ctx.tuning ?? TUNING).gapTicks, ctx);
  }
  return {
    state: {
      phase: Phase.TRACK,
      mode,
      trackId: track.id,
      untilTick: now + track.durationTicks,
      exitSince: null,
    },
    action: { kind: "play", mode, track },
  };
}

/**
 * @template {Pickable} T
 * @param {PlaybackState} state
 * @param {import("./modes.js").ModeId} mode
 * @param {number} now
 * @param {import("./constants.js").TickRange} range
 * @param {StepContext<T>} ctx
 * @returns {{ state: PlaybackState, action: PlaybackAction<T> }}
 */
function enterGap(state, mode, now, range, ctx) {
  const base = randomInt(ctx.rng, range.min, range.max);
  const ticks = Math.max(1, Math.round(base * ctx.gapScale));
  return {
    state: {
      phase: Phase.GAP,
      mode,
      trackId: state.trackId,
      untilTick: now + ticks,
      exitSince: null,
    },
    action: { kind: "gap", ticks },
  };
}
