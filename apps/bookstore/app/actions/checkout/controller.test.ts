import { describe, expect, it } from "vite-plus/test";

import {
  createTestRouter,
  loginAsCustomer,
  requestWithSession,
  submitForm,
} from "../../../test/helpers.ts";

const router = await createTestRouter();

const checkoutUrl = "https://remix.run/checkout";

describe("checkout handlers", () => {
  it("redirects to login when not authenticated", async () => {
    let response = await router.fetch(checkoutUrl);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login?returnTo=%2Fcheckout");
  });

  it("places an order for the books in the cart", async () => {
    let loginSession = await loginAsCustomer(router);

    let { session: cartSession } = await submitForm(router, "https://remix.run/books/bbq", {
      action: "toggleCart",
      session: loginSession,
    });

    let { response, session } = await submitForm(router, checkoutUrl, {
      action: "placeOrder",
      fields: { street: "123 Test St", city: "Test City", state: "TS", zip: "12345" },
      session: cartSession,
    });

    expect(response.status).toBe(303);
    let confirmationUrl = response.headers.get("Location");
    expect(confirmationUrl).toMatch(/^\/checkout\/\d+\/confirmation$/);

    let orderId = confirmationUrl!.match(/\/checkout\/([^/]+)\/confirmation/)![1];
    let orderDetails = await router.fetch(
      requestWithSession(`https://remix.run/account/orders/${orderId}`, session!),
    );

    expect(orderDetails.status).toBe(200);
    let html = await orderDetails.text();
    expect(html).toContain("Ash &amp; Smoke");
    expect(html).toContain("123 Test St");
  });
});
