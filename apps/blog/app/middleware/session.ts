import * as fs from "node:fs";
import * as path from "node:path";
import { createCookie } from "remix/cookie";
import { createFsSessionStorage } from "remix/session-storage/fs";
import { createMemorySessionStorage } from "remix/session-storage/memory";

// The only thing the blog keeps in a session is the result of a rejected comment, flashed so the
// comments frame can show it on the next render, whether that render comes from a follow-up
// document request or from the frame reloading itself.
export const sessionCookie = createCookie("session", {
  secrets: ["m4rg1n4l14-d3mo-k3y"],
  httpOnly: true,
  sameSite: "Lax",
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
