import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": new URL("./src/test/server-only-stub.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    // env.ts validates env at import; skip so unit tests don't need full .env.
    env: { SKIP_ENV_VALIDATION: "true" },
    include: ["src/**/*.test.ts"],
  },
});
