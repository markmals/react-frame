"use server";

import { redirect } from "react-server-frame";
import { completeAuth, verifyCredentials } from "remix/auth";
import * as s from "remix/data-schema";
import { getContext } from "remix/middleware/async-context";

import { PasswordResetTokens, Users } from "../../data/schema.ts";
import {
  getLoginRedirectURL,
  getPostAuthRedirect,
  passwordProvider,
} from "../../middleware/auth.ts";
import { routes } from "../../routes.ts";
import { hashPassword } from "../../utils/password-hash.ts";
import {
  ForgotPasswordSchema,
  normalizeEmail,
  RegistrationSchema,
  ResetPasswordSchema,
} from "./schemas.ts";

export async function login(formData: FormData) {
  let context = getContext();
  // passwordProvider reads the submission from context, where the demo's formData() middleware put it.
  context.set(FormData, formData);

  let user = await verifyCredentials(passwordProvider, context);

  if (user == null) {
    context.session.flash("error", "Invalid email or password. Please try again.");
    redirect(getLoginRedirectURL(context.url));
    return;
  }

  let authSession = completeAuth(context);
  authSession.set("auth", { userId: user.id });

  redirect(getPostAuthRedirect(context.url));
}

export async function logout() {
  let { session } = getContext();
  session.unset("auth");
  session.regenerateId(true);
  redirect(routes.home.href());
}

export async function register(formData: FormData) {
  let { db, session } = getContext();
  let { email, name, password } = s.parse(RegistrationSchema, formData);
  let normalizedEmail = normalizeEmail(email);

  // The demo rendered these outcomes straight from its POST. A server function navigates instead,
  // back to the same page, whose controller renders the flashed outcome.
  if (await db.findOne(Users, { where: { email: normalizedEmail } })) {
    session.flash("existingAccount", true);
    redirect(routes.auth.register.index.href());
    return;
  }

  let user = await db.create(
    Users,
    {
      email: normalizedEmail,
      password_hash: await hashPassword(password),
      name,
    },
    { returnRow: true },
  );

  session.regenerateId(true);
  session.set("auth", { userId: user.id });

  redirect(routes.account.index.href());
}

export async function requestPasswordReset(formData: FormData) {
  let context = getContext();
  let { email } = s.parse(ForgotPasswordSchema, formData);
  let normalizedEmail = normalizeEmail(email);
  let user = await context.db.findOne(Users, { where: { email: normalizedEmail } });
  let token = undefined as string | undefined;

  if (user) {
    token = Math.random().toString(36).substring(2, 15);
    await context.db.create(PasswordResetTokens, {
      token,
      user_id: user.id,
      expires_at: Date.now() + 3600000,
    });
  }

  context.session.flash("resetLinkSent", { token });
  redirect(routes.auth.forgotPassword.index.href());
}

export async function resetPassword(token: string, formData: FormData) {
  let { db, session } = getContext();
  let { confirmPassword, password } = s.parse(ResetPasswordSchema, formData);

  if (!token) {
    session.flash("error", "Invalid or expired reset token.");
    redirect(routes.auth.forgotPassword.index.href());
    return;
  }

  if (password !== confirmPassword) {
    session.flash("error", "Passwords do not match.");
    redirect(routes.auth.resetPassword.index.href({ token }));
    return;
  }

  let tokenData = await db.find(PasswordResetTokens, { token });

  if (!tokenData || tokenData.expires_at < Date.now()) {
    session.flash("error", "Invalid or expired reset token.");
    redirect(routes.auth.resetPassword.index.href({ token }));
    return;
  }

  let user = await db.find(Users, tokenData.user_id);
  if (!user) {
    session.flash("error", "Invalid or expired reset token.");
    redirect(routes.auth.resetPassword.index.href({ token }));
    return;
  }

  await db.update(Users, user.id, { password_hash: await hashPassword(password) });
  await db.delete(PasswordResetTokens, { token });

  session.flash("passwordReset", true);
  redirect(routes.auth.resetPassword.index.href({ token }));
}
