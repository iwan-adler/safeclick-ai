import { defineConfig } from "vitest/config";

/** Separate config so `npm test` stays fast and offline; `npm run eval` downloads data. */
export default defineConfig({
  test: { include: ["eval/**/*.eval.ts"], environment: "node", testTimeout: 120_000 },
});
