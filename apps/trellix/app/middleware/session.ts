import * as fs from "node:fs";
import * as path from "node:path";
import { createCookie } from "remix/cookie";
import { Session } from "remix/session";
import { createFsSessionStorage } from "remix/session-storage/fs";
import { createMemorySessionStorage } from "remix/session-storage/memory";

export const sessionCookie = createCookie("session", {
  secrets: [process.env.COOKIE_SECRET ?? "trellix-demo-secret"],
  httpOnly: true,
  sameSite: "Lax",
  // Trellix keeps its auth cookie for 30 days.
  maxAge: 2592000,
  path: "/",
});

export const sessionStorage =
  process.env.NODE_ENV === "test"
    ? createMemorySessionStorage()
    : createFsSessionStorage(sessionDirectory());

function sessionDirectory() {
  let directory = path.resolve("tmp/sessions");
  fs.mkdirSync(directory, { recursive: true });
  return directory;
}

export { Session };
