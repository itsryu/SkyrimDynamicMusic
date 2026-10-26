import assert from "node:assert/strict";
import { test } from "node:test";

test("main.js inicializa e registra eventos, comandos e laço de varredura", async () => {
  const mc = await import("./support/minecraft-server.mock.js");
  await import("../SDM_BP/scripts/main.js");

  assert.equal(mc.system.beforeEvents.startup.handlers.length, 1);
  const registered = [];
  mc.system.beforeEvents.startup.emit({
    customCommandRegistry: { registerCommand: (def) => registered.push(def.name) },
  });
  assert.deepEqual(registered, ["sdm:np", "sdm:skip", "sdm:config"]);

  assert.ok(mc.world.afterEvents.itemUse.handlers.length >= 1);
  assert.ok(mc.world.afterEvents.playerLeave.handlers.length >= 1);
  assert.ok(mc.mockState.runIntervals.some((i) => i.ticks === 20));
  mc.mockState.runIntervals.find((i) => i.ticks === 20).callback();
});
