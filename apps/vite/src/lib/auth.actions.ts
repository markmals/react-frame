"use server";

import { redirect } from "react-server-frame";
import { verifyCredentials } from "remix/auth";
import { getContext } from "remix/middleware/async-context";
import { Session } from "remix/session";

import { routes } from "@/routes";
import { passwordProvider, type AuthSession } from "@/lib/auth";

export type LogoutResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export async function logoutAction(): Promise<LogoutResult> {
  try {
    const session = getContext().get(Session);
    session.unset("auth");
    session.regenerateId();
    redirect(routes.frames.home.href());
    return {
      success: true,
      message: "Redirecting...",
    };
  } catch (reason) {
    console.error(reason);
    return {
      success: false,
      error: "Failed to log out.",
    };
  }
}

export type LoginResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export async function loginAction(_: unknown, formData: FormData): Promise<LoginResult> {
  const context = getContext();
  // Server actions receive the form as an argument; expose it the way formData() middleware would.
  context.set(FormData, formData);

  try {
    const identity = await verifyCredentials(passwordProvider, context);
    if (!identity) {
      return {
        success: false,
        error: "Invalid username or password.",
      };
    }

    // Rotate the session ID like completeAuth() does, minus its deleteOldSession flag: cookie
    // storage keeps no server-side copy to delete, so that flag only logs a warning.
    const session = context.get(Session);
    session.regenerateId();
    session.set("auth", { username: identity.username } satisfies AuthSession);
    redirect(routes.frames.home.href());
  } catch (reason) {
    console.error(reason);
    return {
      success: false,
      error: "Failed to login.",
    };
  }

  return {
    success: true,
    message: "Redirecting...",
  };
}
