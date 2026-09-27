import { execFileSync } from "node:child_process";
import fs from "node:fs";
import type { TestProject } from "vitest/node";

export default function setup(project: TestProject) {
  // test.env only reaches the workers, so read the path from the config
  const dbPath = project.config.env.TEST_DB_PATH as string;
  execFileSync("node", ["scripts/create-test-db.mjs", dbPath], {
    stdio: "ignore",
  });

  return () => {
    for (const suffix of ["", "-journal", "-wal", "-shm"]) {
      fs.rmSync(dbPath + suffix, { force: true });
    }
  };
}
