import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      // Scoped to the Batch/Files surface added in this PR — that code
      // is held to 100%. Pre-existing modules are out of scope here.
      include: [
        "src/resources/files.ts",
        "src/resources/batches.ts",
        "src/resources/batch-options.ts",
      ],
      reporter: ["text", "lcov"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
