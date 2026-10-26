/** @typedef {() => number} Rng Retorna um valor em [0, 1). */

/**
 * @param {Rng} rng
 * @param {number} min Inclusivo.
 * @param {number} max Inclusivo.
 * @returns {number}
 */
export function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Fisher–Yates (Knuth, TAOCP vol. 2, algoritmo P).
 * @template T
 * @param {T[]} items
 * @param {Rng} rng
 * @returns {T[]} O mesmo array, embaralhado in-place.
 */
export function shuffleInPlace(items, rng) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(rng, 0, i);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
