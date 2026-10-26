import assert from "node:assert/strict";
import { test } from "node:test";
import { ShuffleBag } from "../SDM_BP/scripts/core/shuffle-bag.js";

const items = ["a", "b", "c", "d"].map((id) => ({ id }));

test("cada ciclo contém todos os itens exatamente uma vez", () => {
  const bag = new ShuffleBag(items);
  for (let cycle = 0; cycle < 20; cycle++) {
    const ids = Array.from({ length: items.length }, () => bag.draw().id).sort();
    assert.deepEqual(ids, ["a", "b", "c", "d"]);
  }
});

test("nunca repete o id a evitar quando há alternativas", () => {
  const bag = new ShuffleBag(items);
  let previous = null;
  for (let i = 0; i < 500; i++) {
    const drawn = bag.draw(previous);
    assert.notEqual(drawn.id, previous);
    previous = drawn.id;
  }
});

test("casos de borda: vazio e item único", () => {
  assert.equal(new ShuffleBag([]).draw(), undefined);
  assert.equal(new ShuffleBag([{ id: "x" }]).draw("x").id, "x");
});
