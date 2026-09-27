// Creates a fresh SQLite database at the given path by applying every
// migration in prisma/migrations, so tests get the same schema (including
// triggers) as production. Usage: node scripts/create-test-db.mjs <path>
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.argv[2] ?? "");
if (!process.argv[2]) {
  console.error("Usage: node scripts/create-test-db.mjs <path>");
  process.exit(1);
}

const migrationsDir = path.resolve(import.meta.dirname, "../prisma/migrations");
const sql = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
  .map((name) =>
    fs.readFileSync(path.join(migrationsDir, name, "migration.sql"), "utf8")
  )
  .join("\n");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
for (const suffix of ["", "-journal", "-wal", "-shm"]) {
  fs.rmSync(dbPath + suffix, { force: true });
}

const sqlFile = `${dbPath}.migrations.sql`;
fs.writeFileSync(sqlFile, sql);
try {
  execFileSync(
    "npx",
    ["prisma", "db", "execute", "--url", `file:${dbPath}`, "--file", sqlFile],
    { stdio: "inherit" }
  );
} finally {
  fs.rmSync(sqlFile, { force: true });
}
