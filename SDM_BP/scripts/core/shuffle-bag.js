import { randomInt, shuffleInPlace } from "./random.js";

/**
 * Sorteio sem reposição por ciclo: todo item sai uma vez antes de qualquer repetição.
 * @template {{ id: string }} T
 */
export class ShuffleBag {
  /**
   * @param {readonly T[]} items
   * @param {import("./random.js").Rng} [rng]
   */
  constructor(items, rng = Math.random) {
    this._items = items;
    this._rng = rng;
    /** @type {T[]} */
    this._queue = [];
  }

  /**
   * @param {string | null} [avoidId] Id que não deve sair em sequência.
   * @returns {T | undefined}
   */
  draw(avoidId = null) {
    const size = this._items.length;
    if (size === 0) return undefined;
    if (size === 1) return this._items[0];
    if (this._queue.length === 0) this._refill();

    let index = this._queue.length - 1;
    if (this._queue[index].id === avoidId) {
      if (this._queue.length > 1) {
        index = randomInt(this._rng, 0, this._queue.length - 2);
      } else {
        const carried = /** @type {T} */ (this._queue.pop());
        this._refill(carried);
        index = this._queue.length - 1;
      }
    }
    return this._queue.splice(index, 1)[0];
  }

  /** @param {T} [carried] Item preservado para o fim do próximo ciclo. */
  _refill(carried) {
    const pool = this._items.filter((item) => item !== carried);
    shuffleInPlace(pool, this._rng);
    this._queue = carried === undefined ? pool : [carried, ...pool];
  }
}
