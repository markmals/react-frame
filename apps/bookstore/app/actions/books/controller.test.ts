import { describe, expect, it } from "vite-plus/test";

import { createTestRouter } from "../../../test/helpers.ts";

const router = await createTestRouter();

describe("books controller", () => {
  it("GET /books returns list of books", async () => {
    let response = await router.fetch("https://remix.run/books");

    expect(response.status).toBe(200);
    let html = await response.text();
    expect(html).toContain("Browse Books");
    expect(html).toContain("Ash &amp; Smoke");
    expect(html).toContain("Heavy Metal Guitar Riffs");
    expect(html).toContain("Three Ways to Change Your Life");
  });

  it("GET /books/:slug returns book details", async () => {
    let response = await router.fetch("https://remix.run/books/bbq");

    expect(response.status).toBe(200);
    let html = await response.text();
    expect(html).toContain("Ash &amp; Smoke");
    expect(html).toContain("Rusty Char-Broil");
    expect(html).toContain("Add to Cart");
  });

  it("GET /books/:slug returns 404 for non-existent book", async () => {
    let response = await router.fetch("https://remix.run/books/does-not-exist");

    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Book Not Found");
  });
});
