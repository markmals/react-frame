import { getContext } from "remix/middleware/async-context";
import type { AuthState } from "remix/middleware/auth";

import type { Account } from "../data/schema.ts";

export function getCurrentAccount(auth: AuthState<Account> = getContext().auth): Account {
  if (!auth.ok) {
    throw new Error("Expected a signed-in account. Make sure requireAuth() runs before this code.");
  }

  return auth.identity;
}

export function getCurrentAccountSafely(
  auth: AuthState<Account> = getContext().auth,
): Account | null {
  return auth.ok ? auth.identity : null;
}

export function parseBoardId(value: unknown): number | undefined {
  let parsed = Number(value);
  return typeof value === "string" && value !== "" && Number.isSafeInteger(parsed)
    ? parsed
    : undefined;
}
