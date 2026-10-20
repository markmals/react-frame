import { createCredentialsAuthProvider } from "remix/auth";
import {
  auth,
  createSessionAuthScheme,
  requireAuth as requireAuthenticated,
} from "remix/middleware/auth";
import { redirect } from "remix/response/redirect";

import { Accounts, normalizeEmail, Passwords } from "../data/schema.ts";
import type { Account } from "../data/schema.ts";
import { routes } from "../routes.ts";
import { verifyPassword } from "../utils/password-hash.ts";
import { DatabaseContext } from "./database.ts";

interface TrellixAuthSession {
  accountId: string;
}

export function loadAuth() {
  return auth({
    schemes: [
      createSessionAuthScheme<Account, TrellixAuthSession>({
        read(session) {
          return parseTrellixAuthSession(session.get("auth"));
        },
        async verify(value, context) {
          let db = context.get(DatabaseContext);
          if (db == null) {
            throw new Error("Expected loadDatabase() middleware before loadAuth()");
          }

          return (await db.find(Accounts, value.accountId)) ?? null;
        },
        invalidate(session) {
          session.unset("auth");
        },
      }),
    ],
  });
}

export const passwordProvider = createCredentialsAuthProvider({
  parse(context) {
    let formData = context.get(FormData);
    if (formData == null) {
      throw new Error("Expected the login form data before the password auth provider");
    }

    let email = formData.get("email");
    let password = formData.get("password");

    return {
      email: normalizeEmail(typeof email === "string" ? email : ""),
      password: typeof password === "string" ? password : "",
    };
  },
  async verify({ email, password }, context) {
    let db = context.get(DatabaseContext);
    if (db == null) {
      throw new Error("Expected loadDatabase() middleware before the password auth provider");
    }

    let account = await db.findOne(Accounts, { where: { email } });
    if (!account) {
      return null;
    }

    let stored = await db.find(Passwords, { account_id: account.id });
    if (!stored || !(await verifyPassword(password, stored.hash))) {
      return null;
    }

    return account;
  },
});

/** Protects the board pages: signed-out visitors land on the login page and come back after. */
export function requireAuth() {
  return requireAuthenticated<Account>({
    onFailure(context) {
      return redirect(
        routes.auth.login.index.href(undefined, {
          searchParams: {
            returnTo:
              getSafeReturnTo(context.url.searchParams.get("returnTo")) ??
              context.url.pathname + context.url.search,
          },
        }),
      );
    },
  });
}

export function getPostAuthRedirect(url: URL): string {
  return getSafeReturnTo(url.searchParams.get("returnTo")) ?? routes.boards.index.href();
}

export function getLoginRedirectURL(url: URL): string {
  return routes.auth.login.index.href(undefined, {
    searchParams: { returnTo: getSafeReturnTo(url.searchParams.get("returnTo")) },
  });
}

function parseTrellixAuthSession(value: unknown): TrellixAuthSession | null {
  if (typeof value !== "object" || value == null || !("accountId" in value)) {
    return null;
  }

  let accountId = value.accountId;
  return typeof accountId === "string" && accountId.length > 0 ? { accountId } : null;
}

function getSafeReturnTo(returnTo: string | null): string | undefined {
  if (
    returnTo == null ||
    returnTo === "" ||
    !returnTo.startsWith("/") ||
    returnTo.startsWith("//")
  ) {
    return undefined;
  }

  return returnTo;
}
