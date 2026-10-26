import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_SETTINGS,
  parseSettings,
  sanitizeSettings,
  serializeSettings,
  settingsFromLegacy,
  toRuntimeSettings,
} from "../SDM_BP/scripts/core/settings.js";

test("sanitize aplica padrões, limita volumes e rejeita lixo", () => {
  assert.deepEqual(sanitizeSettings(undefined), DEFAULT_SETTINGS);
  const s = sanitizeSettings({
    musicVolume: 250,
    atmosVolume: -5,
    musicEnabled: "sim",
    frequency: "x",
  });
  assert.equal(s.musicVolume, 100);
  assert.equal(s.atmosVolume, 0);
  assert.equal(s.musicEnabled, true);
  assert.equal(s.frequency, "normal");
});

test("serialização é reversível e tolera JSON corrompido", () => {
  const custom = { ...DEFAULT_SETTINGS, musicVolume: 35, frequency: "rare", popupEnabled: false };
  assert.deepEqual(parseSettings(serializeSettings(custom)), custom);
  assert.equal(parseSettings("{quebrado"), null);
  assert.equal(parseSettings(undefined), null);
});

test("migração das chaves legadas", () => {
  assert.equal(
    settingsFromLegacy(() => undefined),
    null
  );
  const legacy = { sdm_music_en: false, sdm_music_vol: 60, sdm_atmos_vol: 10 };
  const s = settingsFromLegacy((key) => legacy[key]);
  assert.equal(s.musicEnabled, false);
  assert.equal(s.musicVolume, 60);
  assert.equal(s.atmosVolume, 10);
  assert.equal(s.combatEnabled, true);
});

test("runtime deriva audibilidade e escala de silêncio", () => {
  const r = toRuntimeSettings({
    ...DEFAULT_SETTINGS,
    musicVolume: 0,
    atmosVolume: 50,
    frequency: "frequent",
  });
  assert.equal(r.music.audible, false);
  assert.equal(r.atmosphere.volume, 0.5);
  assert.equal(r.gapScale, 0.5);
});
