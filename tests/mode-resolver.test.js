import assert from "node:assert/strict";
import { test } from "node:test";
import { Mode } from "../SDM_BP/scripts/core/modes.js";
import { resolveMode } from "../SDM_BP/scripts/core/mode-resolver.js";

const base = {
  dimensionId: "minecraft:overworld",
  y: 70,
  submerged: false,
  bossNearby: false,
  villageNearby: false,
  weather: "Clear",
  timeOfDay: 6000,
  biomeId: "minecraft:plains",
};
const resolve = (patch = {}, combat = false) => resolveMode({ ...base, ...patch }, combat);

test("exploração por padrão e noite entre 13000 e 23000", () => {
  assert.equal(resolve(), Mode.EXPLORATION);
  assert.equal(resolve({ timeOfDay: 13000 }), Mode.NIGHT);
  assert.equal(resolve({ timeOfDay: 22999 }), Mode.NIGHT);
  assert.equal(resolve({ timeOfDay: 23000 }), Mode.EXPLORATION);
});

test("prioridade: chefe > combate > dimensão > subsolo > vila > clima > noite", () => {
  const everything = {
    bossNearby: true,
    villageNearby: true,
    weather: "Thunder",
    y: -10,
    timeOfDay: 15000,
  };
  assert.equal(resolve(everything, true), Mode.BOSS);
  assert.equal(resolve({ ...everything, bossNearby: false }, true), Mode.COMBAT);
  assert.equal(
    resolve({ ...everything, bossNearby: false, dimensionId: "minecraft:nether" }),
    Mode.NETHER
  );
  assert.equal(resolve({ ...everything, bossNearby: false }), Mode.DEEP_CAVE);
  assert.equal(resolve({ ...everything, bossNearby: false, y: 70 }), Mode.VILLAGE);
  assert.equal(resolve({ weather: "Thunder", timeOfDay: 15000 }), Mode.STORM);
  assert.equal(resolve({ weather: "Rain", timeOfDay: 15000 }), Mode.RAIN);
});

test("subsolo respeita limiares, imersão e biomas subterrâneos", () => {
  assert.equal(resolve({ y: 44 }), Mode.CAVE);
  assert.equal(resolve({ y: 45 }), Mode.EXPLORATION);
  assert.equal(resolve({ y: -1 }), Mode.DEEP_CAVE);
  assert.equal(resolve({ y: 30, submerged: true }), Mode.EXPLORATION);
  assert.equal(resolve({ biomeId: "minecraft:deep_dark" }), Mode.DEEP_CAVE);
  assert.equal(resolve({ biomeId: "minecraft:lush_caves" }), Mode.CAVE);
});

test("chuva em terreno nevado vira neve", () => {
  assert.equal(resolve({ weather: "Rain", biomeId: "minecraft:frozen_ocean" }), Mode.SNOW);
  assert.equal(resolve({ weather: "Rain", biomeId: "minecraft:cherry_grove" }), Mode.RAIN);
  assert.equal(resolve({ weather: "Rain", y: 120 }), Mode.SNOW);
});
