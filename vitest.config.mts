import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = { "@": path.resolve(__dirname) };
const testDbPath = path.join(os.tmpdir(), `cashflow-vitest-${process.pid}.db`);

export default defineConfig({
  test: {
    // db test files share one SQLite database. This is a root-level option, and
    // the unit tests are fast enough that running them serially costs nothing.
    fileParallelism: false,
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["lib/**/*.test.ts"],
          env: { TZ: "UTC" },
        },
      },
      {
        resolve: { alias },
        test: {
          name: "db",
          include: ["tests/db/**/*.test.ts"],
          globalSetup: ["tests/db/global-setup.ts"],
          setupFiles: ["tests/db/setup.ts"],
          env: {
            TZ: "UTC",
            TEST_DB_PATH: testDbPath,
            DATABASE_URL: `file:${testDbPath}`,
          },
        },
      },
    ],
  },
});
