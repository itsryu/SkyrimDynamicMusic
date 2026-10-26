import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createStoredZip } from "./zip-store.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PACKS = ["SDM_BP", "SDM_RP"];
const IGNORED = new Set([".DS_Store", "Thumbs.db"]);

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* walk(dir) {
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    if (IGNORED.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const manifest = JSON.parse(await readFile(join(ROOT, "SDM_BP/manifest.json"), "utf8"));
const version = manifest.header.version.join(".");

const entries = [];
for (const pack of PACKS) {
  for await (const file of walk(join(ROOT, pack))) {
    entries.push({
      name: relative(ROOT, file).split(sep).join("/"),
      data: await readFile(file),
      mtime: (await stat(file)).mtime,
    });
  }
}

const dist = join(ROOT, "dist");
await mkdir(dist, { recursive: true });
const output = join(dist, `SkyrimDynamicMusic-v${version}.mcaddon`);
await writeFile(output, createStoredZip(entries));
console.log(`${entries.length} arquivos -> ${relative(ROOT, output)}`);
