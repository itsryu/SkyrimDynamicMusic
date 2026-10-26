import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { IDS } from "../SDM_BP/scripts/core/constants.js";
import { MODE_PROFILES } from "../SDM_BP/scripts/core/modes.js";
import { PLAYLISTS, TRACKS_BY_NAME } from "../SDM_BP/scripts/core/catalog.js";

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const readText = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const soundDefinitions = readJson("SDM_RP/sounds/sound_definitions.json").sound_definitions;

test("toda faixa do catálogo está registrada em sound_definitions.json", () => {
  for (const track of TRACKS_BY_NAME.values()) {
    assert.ok(soundDefinitions[track.id], `${track.id} ausente em sound_definitions.json`);
    assert.ok(track.durationTicks > 0);
  }
  assert.ok(soundDefinitions[IDS.atmosphereTrack]);
});

test("todo modo tem playlist sem faixas repetidas e perfil definido", () => {
  for (const mode of Object.keys(MODE_PROFILES)) {
    const names = PLAYLISTS[mode].map((t) => t.name);
    assert.ok(names.length > 0, `playlist vazia: ${mode}`);
    assert.equal(new Set(names).size, names.length, `faixa duplicada em ${mode}`);
  }
});

test("music_definitions.json não tem chaves duplicadas nem eventos inexistentes", () => {
  const raw = readText("SDM_RP/sounds/music_definitions.json");
  const keys = [...raw.matchAll(/^ {2}"([^"]+)": \{/gm)].map((m) => m[1]);
  assert.equal(new Set(keys).size, keys.length, "chave duplicada");
  for (const [key, def] of Object.entries(readJson("SDM_RP/sounds/music_definitions.json"))) {
    const known = def.event_name.startsWith("minecraft:") || soundDefinitions[def.event_name];
    assert.ok(known, `${key} aponta para evento inexistente: ${def.event_name}`);
  }
});

test("manifests: versões e UUIDs consistentes", () => {
  const bp = readJson("SDM_BP/manifest.json");
  const rp = readJson("SDM_RP/manifest.json");
  assert.deepEqual(bp.header.version, rp.header.version);
  const rpDependency = bp.dependencies.find((d) => d.uuid);
  assert.equal(rpDependency.uuid, rp.header.uuid);
  assert.deepEqual(rpDependency.version, rp.header.version);
  const uuids = [
    bp.header.uuid,
    rp.header.uuid,
    ...bp.modules.map((m) => m.uuid),
    ...rp.modules.map((m) => m.uuid),
  ];
  assert.equal(new Set(uuids).size, uuids.length, "UUID repetido");
  assert.equal(bp.modules[0].entry, "scripts/main.js");
});

test("chaves de tradução usadas no código existem nos dois idiomas", () => {
  const source = ["ui/messages.js"].map((f) => readText(`SDM_BP/scripts/${f}`)).join("\n");
  const used = new Set([...source.matchAll(/"(sdm\.[a-z_.]+)"/g)].map((m) => m[1]));
  for (const lang of ["pt_BR", "en_US"]) {
    const keys = new Set(
      readText(`SDM_RP/texts/${lang}.lang`)
        .split("\n")
        .map((l) => l.split("=")[0])
    );
    for (const key of used) assert.ok(keys.has(key), `${lang}: falta ${key}`);
    for (const f of ["frequent", "normal", "rare"]) assert.ok(keys.has(`sdm.menu.frequency.${f}`));
  }
});
