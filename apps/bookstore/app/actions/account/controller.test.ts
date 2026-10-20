import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, loginAsCustomer, requestWithSession } from "../../../test/helpers.ts";

const router = await createTestRouter();

describe("account controller", () => {
  it("GET /account redirects to login when not authenticated", async () => {
    let response = await router.fetch("https://remix.run/account");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login?returnTo=%2Faccount");
  });

  it("GET /account returns account page when authenticated", async () => {
    let session = await loginAsCustomer(router);

    let response = await router.fetch(requestWithSession("https://remix.run/account", session));

    expect(response.status).toBe(200);
    let html = await response.text();
    expect(html).toContain("My Account");
    expect(html).toContain("Account Information");
    expect(html).toContain("John Doe");
  });

  it("GET /account/orders/:orderId shows order for authenticated user", async () => {
    let session = await loginAsCustomer(router);

    let response = await router.fetch(
      requestWithSession("https://remix.run/account/orders/1001", session),
    );

    expect(response.status).toBe(200);
    // React's server renderer separates adjacent text nodes with `<!-- -->`.
    let html = (await response.text()).replaceAll("<!-- -->", "");
    expect(html).toContain("Order #1001");
    expect(html).toContain("Ash &amp; Smoke");
  });

  it("GET /account/orders shows item counts from normalized order items", async () => {
    let session = await loginAsCustomer(router);

    let response = await router.fetch(
      requestWithSession("https://remix.run/account/orders", session),
    );

    expect(response.status).toBe(200);
    let html = (await response.text()).replaceAll("<!-- -->", "");
    expect(html).toContain("2 item(s)");
    expect(html).toContain("1 item(s)");
  });
});
