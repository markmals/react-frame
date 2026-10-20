import { describe, expect, it } from "vite-plus/test";

import {
  createTestRouter,
  getSessionCookie,
  requestWithSession,
  submitForm,
} from "../../../test/helpers.ts";

const router = await createTestRouter();

describe("auth", () => {
  it("logs in with valid credentials and redirects to the account page", async () => {
    let { response, session } = await submitForm(router, "https://remix.run/login", {
      action: "login",
      fields: { email: "admin@bookstore.com", password: "admin123" },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/account");
    expect(getSessionCookie(response)).toBeTruthy();

    let account = await router.fetch(requestWithSession("https://remix.run/account", session!));

    expect(account.status).toBe(200);
    expect(await account.text()).toContain("admin@bookstore.com");
  });

  it("rejects invalid credentials and shows the error on the login page", async () => {
    let { response, session } = await submitForm(router, "https://remix.run/login", {
      action: "login",
      fields: { email: "wrong@example.com", password: "wrongpassword" },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/login");

    let followUp = await router.fetch(requestWithSession("https://remix.run/login", session!));

    expect(await followUp.text()).toContain("Invalid email or password");
  });

  it("does not treat wildcard characters as email matches", async () => {
    let { response, session } = await submitForm(router, "https://remix.run/login", {
      action: "login",
      fields: { email: "%@bookstore.com", password: "admin123" },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/login");

    let account = await router.fetch(requestWithSession("https://remix.run/account", session!));

    expect(account.status).toBe(302);
    expect(account.headers.get("Location")).toBe("/login?returnTo=%2Faccount");
  });

  it("clears the flash error after showing it once", async () => {
    let { response, session } = await submitForm(router, "https://remix.run/login", {
      action: "login",
      fields: { email: "wrong@example.com", password: "wrongpassword" },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/login");

    let firstFollowUp = await router.fetch(requestWithSession("https://remix.run/login", session!));

    expect(await firstFollowUp.text()).toContain("Invalid email or password");

    let updatedSession = getSessionCookie(firstFollowUp) ?? session!;
    let secondFollowUp = await router.fetch(
      requestWithSession("https://remix.run/login", updatedSession),
    );

    expect(await secondFollowUp.text()).not.toContain("Invalid email or password");
  });

  it("registers a new user and signs them in", async () => {
    let { response, session } = await submitForm(router, "https://remix.run/register", {
      action: "register",
      fields: { name: "New User", email: "new-user@example.com", password: "password123" },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/account");
    expect(getSessionCookie(response)).toBeTruthy();

    let account = await router.fetch(requestWithSession("https://remix.run/account", session!));

    expect(account.status).toBe(200);

    let html = await account.text();
    expect(html).toContain("New User");
    expect(html).toContain("new-user@example.com");
  });

  it("redirects to login with a returnTo parameter when a protected page needs auth", async () => {
    let response = await router.fetch("https://remix.run/checkout");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login?returnTo=%2Fcheckout");
  });

  it("sends the user to returnTo after a successful login", async () => {
    let { response, session } = await submitForm(
      router,
      "https://remix.run/login?returnTo=%2Fcheckout",
      {
        action: "login",
        fields: { email: "customer@example.com", password: "password123" },
      },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/checkout");
    expect(getSessionCookie(response)).toBeTruthy();

    let checkout = await router.fetch(requestWithSession("https://remix.run/checkout", session!));

    expect(checkout.status).toBe(200);
  });

  it("keeps returnTo when the login fails", async () => {
    let { response, session } = await submitForm(
      router,
      "https://remix.run/login?returnTo=%2Fcheckout",
      {
        action: "login",
        fields: { email: "wrong@example.com", password: "wrongpassword" },
      },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/login?returnTo=%2Fcheckout");

    let followUp = await router.fetch(
      requestWithSession("https://remix.run/login?returnTo=%2Fcheckout", session!),
    );

    expect(await followUp.text()).toContain("Invalid email or password");
  });

  it("shows an error when the new passwords do not match", async () => {
    let token = await requestResetToken("customer@example.com");

    let { response, session } = await submitForm(
      router,
      `https://remix.run/reset-password/${token}`,
      {
        action: "resetPassword",
        fields: { password: "newpassword123", confirmPassword: "differentpassword" },
      },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(`/reset-password/${token}`);

    let followUp = await router.fetch(
      requestWithSession(`https://remix.run/reset-password/${token}`, session!),
    );

    expect(await followUp.text()).toContain("Passwords do not match");
  });

  it("shows an error when the reset token is invalid", async () => {
    let token = "invalid-token-12345";

    let { response, session } = await submitForm(
      router,
      `https://remix.run/reset-password/${token}`,
      {
        action: "resetPassword",
        fields: { password: "newpassword123", confirmPassword: "newpassword123" },
      },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(`/reset-password/${token}`);

    let followUp = await router.fetch(
      requestWithSession(`https://remix.run/reset-password/${token}`, session!),
    );

    expect(await followUp.text()).toContain("Invalid or expired reset token");
  });
});

/** Requests a password reset and reads the token from the demo link on the success page. */
async function requestResetToken(email: string): Promise<string> {
  let { response, session } = await submitForm(router, "https://remix.run/forgot-password", {
    action: "requestPasswordReset",
    fields: { email },
  });

  expect(response.status).toBe(303);
  expect(response.headers.get("Location")).toBe("/forgot-password");

  let sent = await router.fetch(requestWithSession("https://remix.run/forgot-password", session!));
  let html = await sent.text();
  // The success page links to the reset form; the href is the only unescaped copy of the token.
  let token = html.match(/href="\/reset-password\/([^"]+)"/)?.[1];

  expect(token).toBeTruthy();

  return token!;
}
