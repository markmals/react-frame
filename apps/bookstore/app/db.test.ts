import { sql } from "remix/data-table";
import { beforeEach, describe, expect, it } from "vite-plus/test";

import { importApp } from "../test/helpers.ts";
import type * as SchemaModule from "./data/schema.ts";
import type * as DatabaseModule from "./db.ts";
import type * as PasswordHashModule from "./utils/password-hash.ts";

const { db, loadAppMigrations, loadAppSeed } = await importApp<typeof DatabaseModule>("/app/db.ts");
const { Users } = await importApp<typeof SchemaModule>("/app/data/schema.ts");
const { verifyPassword } = await importApp<typeof PasswordHashModule>(
  "/app/utils/password-hash.ts",
);

beforeEach(async () => {
  await db.reset({ migrations: await loadAppMigrations(), seed: await loadAppSeed() });
});

describe("bookstore database seed", () => {
  it("stores verifiable password hashes for seeded users", async () => {
    let admin = await db.find(Users, 1);
    let customer = await db.find(Users, 2);

    expect(admin?.email).toBe("admin@bookstore.com");
    expect(customer?.email).toBe("customer@example.com");
    expect(admin?.password_hash).not.toBe("admin123");
    expect(customer?.password_hash).not.toBe("password123");
    expect(await verifyPassword("admin123", admin!.password_hash)).toBe(true);
    expect(await verifyPassword("password123", customer!.password_hash)).toBe(true);
  });

  it("does not duplicate journal entries or seed data when migrated again", async () => {
    let journalBefore = await db.exec(sql`select count(*) as count from data_table_migrations`);

    await db.migrate(await loadAppMigrations());
    let seed = await loadAppSeed();
    await seed(db);

    let journalAfter = await db.exec(sql`select count(*) as count from data_table_migrations`);
    let seededUsers = await db.exec(sql`select count(*) as count from users`);

    expect(journalAfter.rows).toEqual(journalBefore.rows);
    expect(Number(seededUsers.rows?.[0]?.count)).toBe(2);
  });
});
