import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { createCredentialsAuthProvider } from "remix/auth";
import * as s from "remix/data-schema";
import * as checks from "remix/data-schema/checks";
import * as f from "remix/data-schema/form-data";
import { getContext } from "remix/middleware/async-context";
import {
  Auth,
  auth,
  createSessionAuthScheme,
  type BadAuth,
  type GoodAuth,
} from "remix/middleware/auth";

import { users } from "@/data/schema";
import { db } from "@/lib/database";

export type AuthIdentity = {
  username: string;
};

const authSessionSchema = s.object({
  username: s.string(),
});

export type AuthSession = s.InferOutput<typeof authSessionSchema>;

export function getAuth() {
  const { get } = getContext();
  return get(Auth) as GoodAuth<AuthIdentity> | BadAuth;
}

export function authMiddleware() {
  return auth({
    schemes: [
      createSessionAuthScheme<AuthIdentity, AuthSession>({
        read(session) {
          const parsed = s.parseSafe(authSessionSchema, session.get("auth"));
          return parsed.success ? parsed.value : null;
        },
        async verify({ username }) {
          const user = await db.find(users, username);
          return user ? { username: user.username } : null;
        },
        invalidate(session) {
          session.unset("auth");
        },
      }),
    ],
  });
}

const credentialsSchema = f.object({
  username: f.field(
    s
      .string()
      .transform((value) => value.trim())
      .pipe(checks.minLength(1)),
  ),
  password: f.field(s.string().pipe(checks.minLength(1))),
});

export const passwordProvider = createCredentialsAuthProvider({
  parse(context) {
    const formData = context.get(FormData);
    if (!formData) throw new Error("Expected login form data in request context");
    return s.parseSafe(credentialsSchema, formData);
  },
  // An unknown username signs up a new account so the example works without seed data.
  async verify(credentials): Promise<AuthIdentity | null> {
    if (!credentials.success) return null;

    const { username, password } = credentials.value;
    const user = await db.find(users, username);
    if (!user) {
      await db.create(users, { username, passwordHash: await hashPassword(password) });
      return { username };
    }

    return (await verifyPassword(password, user.passwordHash)) ? { username } : null;
  },
});

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keyLength: number,
) => Promise<Buffer>;

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `${salt.toString("base64url")}:${key.toString("base64url")}`;
}

async function verifyPassword(password: string, passwordHash: string) {
  const [salt, key] = passwordHash.split(":").map((part) => Buffer.from(part, "base64url"));
  const candidate = await scryptAsync(password, salt, key.length);
  return timingSafeEqual(candidate, key);
}
