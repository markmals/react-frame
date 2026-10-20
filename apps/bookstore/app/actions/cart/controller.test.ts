import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, requestWithSession, submitForm } from "../../../test/helpers.ts";

const router = await createTestRouter();

const booksUrl = "https://remix.run/books";
const cartUrl = "https://remix.run/cart";
const cartItemsUrl = "https://remix.run/fragments/cart-items";

/** Adds a book to the cart with the cart button the books page renders for it. */
async function addToCart(bookId: string, session?: string): Promise<string> {
  let result = await submitForm(router, booksUrl, {
    action: "toggleCart",
    match: { bookId },
    session,
  });

  if (result.response.status !== 200 || !result.session) {
    throw new Error(
      `Expected adding book ${bookId} to render the page, got ${result.response.status}`,
    );
  }

  return result.session;
}

describe("cart handlers", () => {
  it("adds a book to the cart from the cart button on its page", async () => {
    let { response, session } = await submitForm(router, "https://remix.run/books/bbq", {
      action: "toggleCart",
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Remove from Cart");
    expect(session).toBeTruthy();

    let cart = await router.fetch(requestWithSession(cartUrl, session!));

    expect(await cart.text()).toContain("Ash &amp; Smoke");
  });

  it("removes a book from the cart when its cart button is submitted again", async () => {
    let session = await addToCart("1");

    let { response } = await submitForm(router, "https://remix.run/books/bbq", {
      action: "toggleCart",
      session,
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Add to Cart");

    let cart = await router.fetch(requestWithSession(cartUrl, session));

    expect(await cart.text()).toContain("Your cart is empty.");
  });

  it("shows cart items on the cart page", async () => {
    let session = await addToCart("2");

    let response = await router.fetch(requestWithSession(cartUrl, session));

    expect(response.status).toBe(200);
    let html = await response.text();
    expect(html).toContain("Shopping Cart");
    expect(html).toContain("Heavy Metal Guitar Riffs");
  });

  it("keeps the cart across requests with the same session", async () => {
    let session = await addToCart("1");
    session = await addToCart("3", session);

    let response = await router.fetch(requestWithSession(cartUrl, session));

    let html = await response.text();
    expect(html).toContain("Ash &amp; Smoke");
    expect(html).toContain("Three Ways to Change Your Life");
  });

  it("renders the cart items fragment as a table", async () => {
    let session = await addToCart("2");

    let response = await router.fetch(requestWithSession(cartItemsUrl, session));

    expect(response.status).toBe(200);
    let html = await response.text();
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Book</th>");
    expect(html).toContain("Heavy Metal Guitar Riffs");
    expect(html).toContain("Update");
    expect(html).toContain("Remove");
    expect(html).toContain("Total:");
  });

  it("renders totals and actions in the cart items fragment", async () => {
    let session = await addToCart("1");

    let response = await router.fetch(requestWithSession(cartItemsUrl, session));

    expect(response.status).toBe(200);
    let html = await response.text();
    expect(html).toContain("Total:");
    expect(html).toContain("$16.99");
    expect(html).toContain("Continue Shopping");
    expect(html).toContain("Login to Checkout");
  });

  it("renders the empty state in the cart items fragment when the cart is empty", async () => {
    let response = await router.fetch(cartItemsUrl);

    expect(response.status).toBe(200);
    let html = await response.text();
    expect(html).toContain("Your cart is empty.");
    expect(html).toContain("Browse Books");
  });

  it("updates an item's quantity from the cart page", async () => {
    let session = await addToCart("1");

    let result = await submitForm(router, cartUrl, {
      action: "updateCartItem",
      match: { bookId: "1" },
      fields: { quantity: "2" },
      session,
    });

    expect(result.response.status).toBe(200);
    expect(await result.response.text()).toContain("$33.98");

    let fragment = await router.fetch(requestWithSession(cartItemsUrl, result.session!));

    expect(await fragment.text()).toContain("$33.98");
  });

  it("removes an item from the cart page", async () => {
    let session = await addToCart("1");

    let result = await submitForm(router, cartUrl, {
      action: "removeCartItem",
      match: { bookId: "1" },
      session,
    });

    expect(result.response.status).toBe(200);
    let html = await result.response.text();
    expect(html).not.toContain("Ash &amp; Smoke");
    expect(html).toContain("Your cart is empty.");

    let fragment = await router.fetch(requestWithSession(cartItemsUrl, result.session!));

    expect(await fragment.text()).toContain("Your cart is empty.");
  });
});
