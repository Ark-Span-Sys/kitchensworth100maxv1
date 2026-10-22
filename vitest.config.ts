import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest configuration for Kitchen's Worth.
 *
 * Unit tests live under `lib/__tests__/**` and run in a Node environment.
 * Playwright end-to-end tests live under `e2e/**` and are run separately
 * via `pnpm test:e2e` (see `playwright.config.ts`).
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/__tests__/**/*.test.ts", "app/api/__tests__/**/*.test.ts"],
    globals: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts"],
      exclude: ["lib/types.ts", "lib/supabase/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
