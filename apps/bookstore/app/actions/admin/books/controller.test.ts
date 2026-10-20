import { describe, expect, it } from "vite-plus/test";

import {
  createTestRouter,
  loginAsAdmin,
  requestWithSession,
  submitForm,
} from "../../../../test/helpers.ts";

const router = await createTestRouter();

describe("admin books controller", () => {
  it("createBook() creates a new book when admin", async () => {
    let session = await loginAsAdmin(router);

    let { response } = await submitForm(router, "https://remix.run/admin/books/new", {
      action: "createBook",
      session,
      fields: {
        slug: "test-book",
        title: "Test Book",
        author: "Test Author",
        description: "Test description",
        price: "29.99",
        genre: "test",
        isbn: "978-0000000000",
        publishedYear: "2024",
        inStock: "true",
      },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/admin/books");

    let index = await router.fetch(requestWithSession("https://remix.run/admin/books", session));

    expect(index.status).toBe(200);
    let html = await index.text();
    expect(html).toContain("Test Book");
    expect(html).toContain("Test Author");
  });
});
