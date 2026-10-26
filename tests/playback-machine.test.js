import assert from "node:assert/strict";
import { test } from "node:test";
import { Mode } from "../SDM_BP/scripts/core/modes.js";
import { createPlaybackState, Phase, step } from "../SDM_BP/scripts/core/playback-machine.js";
import { TUNING } from "../SDM_BP/scripts/core/constants.js";

const makeCtx = (overrides = {}) => {
  let n = 0;
  return {
    pickTrack: (mode) => ({ id: `${mode}:${n++}`, durationTicks: 1000 }),
    rng: () => 0,
    gapScale: 1,
    ...overrides,
  };
};

const run = (state, desired, now, ctx = makeCtx()) => step(state, desired, now, ctx);

test("estado inicial toca imediatamente", () => {
  const { state, action } = run(createPlaybackState(), Mode.EXPLORATION, 0);
  assert.equal(action.kind, "play");
  assert.equal(state.phase, Phase.TRACK);
  assert.equal(state.untilTick, 1000);
});

test("modo ambiente não interrompe a faixa; vale na próxima escolha", () => {
  let { state } = run(createPlaybackState(), Mode.EXPLORATION, 0);
  ({ state } = run(state, Mode.NIGHT, 500));
  assert.equal(state.phase, Phase.TRACK);
  let r = run(state, Mode.NIGHT, 1000);
  assert.equal(r.action.kind, "gap");
  r = run(r.state, Mode.NIGHT, r.state.untilTick);
  assert.equal(r.action.kind, "play");
  assert.equal(r.action.mode, Mode.NIGHT);
});

test("modo de interrupção corta a faixa imediatamente", () => {
  const { state } = run(createPlaybackState(), Mode.EXPLORATION, 0);
  const r = run(state, Mode.COMBAT, 10);
  assert.equal(r.action.kind, "play");
  assert.equal(r.action.mode, Mode.COMBAT);
});

test("combate encadeia faixas sem silêncio enquanto persistir", () => {
  const { state } = run(createPlaybackState(), Mode.COMBAT, 0);
  const r = run(state, Mode.COMBAT, 1000);
  assert.equal(r.action.kind, "play");
});

test("sair de modo de interrupção exige histerese e então abre silêncio de liberação", () => {
  const { state } = run(createPlaybackState(), Mode.COMBAT, 0);
  let r = run(state, Mode.EXPLORATION, 100);
  assert.equal(r.action.kind, "none");
  assert.equal(r.state.exitSince, 100);
  r = run(r.state, Mode.COMBAT, 150);
  assert.equal(r.state.exitSince, null);
  r = run(r.state, Mode.EXPLORATION, 200);
  r = run(r.state, Mode.EXPLORATION, 200 + TUNING.exitDebounceTicks);
  assert.equal(r.action.kind, "gap");
  assert.equal(r.state.mode, Mode.EXPLORATION);
  assert.equal(r.action.ticks, TUNING.releaseGapTicks.min);
});

test("fator de frequência escala o silêncio", () => {
  const { state } = run(createPlaybackState(), Mode.EXPLORATION, 0);
  const rare = run(state, Mode.EXPLORATION, 1000, makeCtx({ gapScale: 2 }));
  const frequent = run(state, Mode.EXPLORATION, 1000, makeCtx({ gapScale: 0.5 }));
  assert.equal(rare.action.ticks, TUNING.gapTicks.min * 2);
  assert.equal(frequent.action.ticks, TUNING.gapTicks.min * 0.5);
});

test("playlist vazia vira silêncio em vez de laço infinito", () => {
  const r = run(createPlaybackState(), Mode.EXPLORATION, 0, makeCtx({ pickTrack: () => null }));
  assert.equal(r.action.kind, "gap");
});

test("durante o silêncio, mudança para modo ambiente apenas reaponta o modo", () => {
  let { state } = run(createPlaybackState(), Mode.EXPLORATION, 0);
  ({ state } = run(state, Mode.EXPLORATION, 1000));
  const r = run(state, Mode.RAIN, 1001);
  assert.equal(r.action.kind, "none");
  assert.equal(r.state.mode, Mode.RAIN);
});
