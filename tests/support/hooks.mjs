const MOCKS = new Map([
  ["@minecraft/server", new URL("./minecraft-server.mock.js", import.meta.url).href],
  ["@minecraft/server-ui", new URL("./minecraft-server-ui.mock.js", import.meta.url).href],
]);

export function resolve(specifier, context, nextResolve) {
  const mock = MOCKS.get(specifier);
  return mock ? { url: mock, shortCircuit: true } : nextResolve(specifier, context);
}
