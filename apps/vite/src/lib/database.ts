import * as path from "node:path";

import { loadMigrations } from "remix/data-table/migrations/node";
import { createSqliteDatabase } from "remix/data-table/sqlite";

export const db = createSqliteDatabase({
  filename: process.env.NODE_ENV === "test" ? ":memory:" : path.join(process.cwd(), "db.sqlite"),
  foreignKeys: true,
});

await db.migrate(await loadMigrations(path.join(process.cwd(), "migrations")));
