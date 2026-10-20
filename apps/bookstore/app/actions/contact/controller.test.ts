import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, requestWithSession, submitForm } from "../../../test/helpers.ts";

const router = await createTestRouter();

describe("contact controller", () => {
  it("sendMessage() redirects back to /contact with a success message", async () => {
    let { response, session } = await submitForm(router, "https://remix.run/contact", {
      action: "sendMessage",
      fields: {
        name: "Test User",
        email: "test@example.com",
        message: "Test message",
      },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/contact");
    expect(session).toBeTruthy();

    let page = await router.fetch(requestWithSession("https://remix.run/contact", session!));

    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Thank you for your message");
  });

  it("shows the form again once the success message has been read", async () => {
    let { session } = await submitForm(router, "https://remix.run/contact", {
      action: "sendMessage",
      fields: {
        name: "Test User",
        email: "test@example.com",
        message: "Test message",
      },
    });

    let first = await router.fetch(requestWithSession("https://remix.run/contact", session!));
    expect(await first.text()).toContain("Thank you for your message");

    let second = await router.fetch(requestWithSession("https://remix.run/contact", session!));

    expect(second.status).toBe(200);
    let html = await second.text();
    expect(html).not.toContain("Thank you for your message");
    expect(html).toContain("Contact Us");
  });
});
