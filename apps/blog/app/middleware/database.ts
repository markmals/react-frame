import { createContextKey, type Middleware } from "remix/router";
import type { Database } from "remix/data-table";

import { db } from "../db.ts";

export const DatabaseContext = createContextKey<Database>();

export function loadDatabase(): Middleware<{
  key: typeof DatabaseContext;
  value: Database;
  property: "db";
}> {
  return (context, next) => {
    context.set(DatabaseContext, db, { property: "db" });
    return next();
  };
}
