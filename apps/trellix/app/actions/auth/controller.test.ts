import { describe, expect, it } from "vite-plus/test";

import {
  createTestRouter,
  getSessionCookie,
  loginAsDanielle,
  requestWithSession,
  submitForm,
} from "../../../test/helpers.ts";

const router = await createTestRouter();

describe("auth", () => {
  it("logs in with valid credentials and lands on the boards page", async () => {
    let { response, session } = await submitForm(router, "https://trellix.dev/login", {
      action: "login",
      fields: { email: "danielle@trellix.dev", password: "trellix123" },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/boards");

    let boards = await router.fetch(requestWithSession("https://trellix.dev/boards", session!));

    expect(boards.status).toBe(200);
    expect(await boards.text()).toContain("Launch Checklist");
  });

  it("rejects a wrong password and shows the error on the login page", async () => {
    let { response, session } = await submitForm(router, "https://trellix.dev/login", {
      action: "login",
      fields: { email: "danielle@trellix.dev", password: "not-the-password" },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/login");

    let followUp = await router.fetch(requestWithSession("https://trellix.dev/login", session!));

    expect(await followUp.text()).toContain("Invalid credentials");
  });

  it("rejects an email that isn't one before touching the database", async () => {
    let { response, session } = await submitForm(router, "https://trellix.dev/login", {
      action: "login",
      fields: { email: "danielle", password: "trellix123" },
    });

    expect(response.headers.get("Location")).toBe("/login");

    let followUp = await router.fetch(requestWithSession("https://trellix.dev/login", session!));

    expect(await followUp.text()).toContain("Please enter a valid email address");
  });

  it("signs up a new account, signs it in, and starts it with no boards", async () => {
    let { response, session } = await submitForm(router, "https://trellix.dev/signup", {
      action: "signup",
      fields: { email: "newbie@trellix.dev", password: "hunter22" },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/boards");

    let boards = await router.fetch(requestWithSession("https://trellix.dev/boards", session!));
    let html = await boards.text();

    expect(boards.status).toBe(200);
    expect(html).toContain("newbie@trellix.dev");
    expect(html).toContain("No boards yet");
  });

  it("refuses to sign up an email that already has an account", async () => {
    let { response, session } = await submitForm(router, "https://trellix.dev/signup", {
      action: "signup",
      fields: { email: "danielle@trellix.dev", password: "trellix123" },
    });

    expect(response.headers.get("Location")).toBe("/signup");

    let followUp = await router.fetch(requestWithSession("https://trellix.dev/signup", session!));

    expect(await followUp.text()).toContain("An account with this email already exists");
  });

  it("sends signed-out visitors to login with a returnTo, and signed-in ones past it", async () => {
    let anonymous = await router.fetch("https://trellix.dev/board/1");

    expect(anonymous.status).toBe(302);
    expect(anonymous.headers.get("Location")).toBe("/login?returnTo=%2Fboard%2F1");

    let session = await loginAsDanielle(router);
    let login = await router.fetch(requestWithSession("https://trellix.dev/login", session));

    expect(login.status).toBe(302);
    expect(login.headers.get("Location")).toBe("/boards");
  });

  it("returns to the page that required a login", async () => {
    let { response } = await submitForm(router, "https://trellix.dev/login?returnTo=%2Fboard%2F1", {
      action: "login",
      fields: { email: "danielle@trellix.dev", password: "trellix123" },
    });

    expect(response.headers.get("Location")).toBe("/board/1");
  });

  it("ignores a returnTo that points off-site", async () => {
    let { response } = await submitForm(
      router,
      "https://trellix.dev/login?returnTo=%2F%2Fevil.example.com",
      { action: "login", fields: { email: "danielle@trellix.dev", password: "trellix123" } },
    );

    expect(response.headers.get("Location")).toBe("/boards");
  });

  it("logs out and stops serving the boards page", async () => {
    let session = await loginAsDanielle(router);
    let { response, session: loggedOut } = await submitForm(router, "https://trellix.dev/boards", {
      action: "logout",
      session,
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/");
    expect(getSessionCookie(response)).not.toBe(session);

    let boards = await router.fetch(requestWithSession("https://trellix.dev/boards", loggedOut!));

    expect(boards.status).toBe(302);
    expect(boards.headers.get("Location")).toBe("/login?returnTo=%2Fboards");
  });

  it("sends a signed-in visitor from the marketing page to their boards", async () => {
    let session = await loginAsDanielle(router);
    let home = await router.fetch(requestWithSession("https://trellix.dev/", session));

    expect(home.status).toBe(302);
    expect(home.headers.get("Location")).toBe("/boards");
  });
});
