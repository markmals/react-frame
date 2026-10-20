"use server";

import { redirect } from "react-frame";
import { completeAuth, verifyCredentials } from "remix/auth";
import * as s from "remix/data-schema";
import { getContext } from "remix/middleware/async-context";

import { Accounts, normalizeEmail, Passwords } from "../../data/schema.ts";
import {
  getLoginRedirectURL,
  getPostAuthRedirect,
  passwordProvider,
} from "../../middleware/auth.ts";
import { routes } from "../../routes.ts";
import { hashPassword } from "../../utils/password-hash.ts";
import { CredentialsSchema, validateCredentials } from "./schemas.ts";

export async function login(formData: FormData) {
  let context = getContext();
  let { email, password } = s.parse(CredentialsSchema, formData);

  let errors = validateCredentials(email, password, 6);
  if (errors) {
    context.session.flash("credentialErrors", errors);
    redirect(getLoginRedirectURL(context.url));
    return;
  }

  // passwordProvider reads the submission from context, the way the demo's formData() middleware
  // would have supplied it to a route.
  context.set(FormData, formData);
  let account = await verifyCredentials(passwordProvider, context);

  if (account == null) {
    context.session.flash("credentialErrors", { password: "Invalid credentials" });
    redirect(getLoginRedirectURL(context.url));
    return;
  }

  let authSession = completeAuth(context);
  authSession.set("auth", { accountId: account.id });

  redirect(getPostAuthRedirect(context.url));
}

export async function signup(formData: FormData) {
  let { db, session } = getContext();
  let { email, password } = s.parse(CredentialsSchema, formData);
  let normalizedEmail = normalizeEmail(email);

  let errors = validateCredentials(normalizedEmail, password, 6);
  if (!errors && (await db.findOne(Accounts, { where: { email: normalizedEmail } }))) {
    errors = { email: "An account with this email already exists." };
  }

  if (errors) {
    session.flash("credentialErrors", errors);
    redirect(routes.auth.signup.index.href());
    return;
  }

  let account = await db.create(
    Accounts,
    { id: crypto.randomUUID(), email: normalizedEmail },
    { returnRow: true },
  );
  await db.create(Passwords, {
    account_id: account.id,
    hash: await hashPassword(password),
  });

  session.regenerateId(true);
  session.set("auth", { accountId: account.id });

  redirect(routes.boards.index.href());
}

export async function logout() {
  let { session } = getContext();
  session.unset("auth");
  session.regenerateId(true);
  redirect(routes.home.href());
}
