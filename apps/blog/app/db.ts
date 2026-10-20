import * as path from "node:path";
import { loadMigrations, loadSeed } from "remix/data-table/migrations/node";
import { createSqliteDatabase } from "remix/data-table/sqlite";

// Paths resolve from the app root because the production server runs a bundled copy of this module.
export const db = createSqliteDatabase({
  filename: process.env.NODE_ENV === "test" ? ":memory:" : path.resolve("db/blog.sqlite"),
  foreignKeys: true,
});

export function loadAppMigrations() {
  return loadMigrations(path.resolve("db/migrations"));
}

export function loadAppSeed() {
  return loadSeed(path.resolve("db/seed.sql"));
}
