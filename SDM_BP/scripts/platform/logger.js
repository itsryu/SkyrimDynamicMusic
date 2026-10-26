const MAX_REMEMBERED = 100;

/**
 * Logger com deduplicação: a mesma falha é registrada uma única vez por sessão.
 * @param {string} scope
 */
export function createLogger(scope) {
  /** @type {Set<string>} */
  const seen = new Set();

  return Object.freeze({
    /**
     * @param {string} message
     * @param {unknown} [error]
     */
    warn(message, error) {
      const detail =
        error instanceof Error ? error.message : error === undefined ? "" : String(error);
      const key = `${message}|${detail}`;
      if (seen.has(key) || seen.size >= MAX_REMEMBERED) return;
      seen.add(key);
      console.warn(`[SDM:${scope}] ${message}${detail ? ` — ${detail}` : ""}`);
    },
  });
}

/** @typedef {ReturnType<typeof createLogger>} Logger */
