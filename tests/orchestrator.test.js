import assert from "node:assert/strict";
import { test } from "node:test";
import { TUNING } from "../SDM_BP/scripts/core/constants.js";
import { DEFAULT_SETTINGS, toRuntimeSettings } from "../SDM_BP/scripts/core/settings.js";
import { SessionRegistry } from "../SDM_BP/scripts/core/session.js";
import { MusicOrchestrator } from "../SDM_BP/scripts/platform/music-orchestrator.js";

function harness(settingsPatch = {}) {
  const calls = [];
  const state = { now: 0, env: null };
  const runtime = toRuntimeSettings({ ...DEFAULT_SETTINGS, ...settingsPatch });
  const sessions = new SessionRegistry();
  const player = { id: "p1", isValid: true };
  state.env = {
    dimensionId: "minecraft:overworld",
    y: 70,
    submerged: false,
    bossNearby: false,
    villageNearby: false,
    weather: "Clear",
    timeOfDay: 6000,
    biomeId: "minecraft:plains",
  };
  const orchestrator = new MusicOrchestrator({
    sessions,
    settings: { getRuntime: () => runtime },
    sensor: { read: () => state.env },
    audio: {
      playTrack: (_p, track, channel) => (calls.push(["play", track.id]), channel.audible),
      silence: () => calls.push(["silence"]),
    },
    popups: { show: (_p, name) => calls.push(["popup", name]) },
    scheduler: { runTimeout: (cb) => cb() },
    clock: () => state.now,
    rng: () => 0.5,
  });
  return { orchestrator, player, state, calls, sessions, runtime };
}

test("fluxo completo: toca, silêncio atmosférico, próxima faixa e comando np", () => {
  const { orchestrator, player, state, calls } = harness();
  orchestrator.tick(player);
  assert.equal(calls[0][0], "play");
  assert.equal(calls[1][0], "popup");
  assert.ok(orchestrator.nowPlaying(player));

  const track = orchestrator.nowPlaying(player);
  state.now = track.durationTicks;
  orchestrator.tick(player);
  assert.deepEqual(calls.at(-1), ["silence"]);
  assert.equal(orchestrator.nowPlaying(player), undefined);

  state.now += TUNING.gapTicks.max;
  orchestrator.tick(player);
  assert.equal(calls.at(-2)[0], "play");
});

test("combate interrompe e o encadeamento não repete a faixa anterior", () => {
  const { orchestrator, player, state, sessions, calls } = harness();
  orchestrator.tick(player);
  sessions.get(player.id).markCombat(0, TUNING.combatGraceTicks);
  state.now = 20;
  orchestrator.tick(player);
  const first = calls.filter((c) => c[0] === "play").at(-1)[1];
  assert.match(first, /skyrim:track\./);

  state.now = 20 + orchestrator.nowPlaying(player).durationTicks - 1;
  sessions.get(player.id).markCombat(state.now, TUNING.combatGraceTicks);
  state.now += 1;
  orchestrator.tick(player);
  const second = calls.filter((c) => c[0] === "play").at(-1)[1];
  assert.notEqual(first, second);
});

test("música desativada: nada audível e /np informa vazio", () => {
  const { orchestrator, player, calls } = harness({ musicEnabled: false });
  orchestrator.tick(player);
  assert.equal(
    calls.some((c) => c[0] === "popup"),
    false
  );
  assert.equal(orchestrator.nowPlaying(player), undefined);
  assert.equal(orchestrator.skip(player), false);
});

test("skip inicia imediatamente outra faixa", () => {
  const { orchestrator, player, calls } = harness();
  orchestrator.tick(player);
  const before = calls.filter((c) => c[0] === "play").length;
  assert.equal(orchestrator.skip(player), true);
  assert.equal(calls.filter((c) => c[0] === "play").length, before + 1);
});

test("jogador inválido é ignorado", () => {
  const { orchestrator, player, calls } = harness();
  player.isValid = false;
  orchestrator.tick(player);
  assert.equal(calls.length, 0);
});
