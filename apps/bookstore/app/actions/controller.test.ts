import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, importApp, loginAsAdmin, submitForm } from "../../test/helpers.ts";
import type * as SchemaModule from "../data/schema.ts";
import type * as DatabaseModule from "../db.ts";
import type * as UploadsModule from "../utils/uploads.ts";

const router = await createTestRouter();
const { db } = await importApp<typeof DatabaseModule>("/app/db.ts");
const { Books } = await importApp<typeof SchemaModule>("/app/data/schema.ts");
const { uploadsStorage } = await importApp<typeof UploadsModule>("/app/utils/uploads.ts");

describe("root controller", () => {
  it("GET / returns home page", async () => {
    let response = await router.fetch("https://remix.run/");

    expect(response.status).toBe(200);
    let html = await response.text();
    expect(html).toContain("Welcome to the Bookstore");
    expect(html).toContain("Browse Books");
  });

  it("GET /uploads/*key serves uploaded files from storage", async () => {
    let session = await loginAsAdmin(router);
    let initialBookCount = await db.count(Books);
    let fileContent = "fake image data";

    let { response } = await submitForm(router, "https://remix.run/admin/books/new", {
      action: "createBook",
      session,
      fields: {
        title: "Book with Cover",
        author: "Test Author",
        slug: "book-with-cover",
        description: "A book with a cover image",
        price: "19.99",
        genre: "test",
        isbn: "978-1234567890",
        publishedYear: "2024",
        inStock: "true",
        cover: new File([fileContent], "test-cover.jpg", { type: "image/jpeg" }),
      },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/admin/books");
    expect(await db.count(Books)).toBe(initialBookCount + 1);

    let newBook = await db.findOne(Books, { where: { slug: "book-with-cover" } });
    expect(newBook).toBeTruthy();
    expect(newBook!.cover_url.startsWith("/uploads/")).toBe(true);

    let fileResponse = await router.fetch(`https://remix.run${newBook!.cover_url}`);

    expect(fileResponse.status).toBe(200);
    expect(fileResponse.headers.get("Content-Type")).toBe("image/jpeg");
    expect(fileResponse.headers.get("Cache-Control")).toBe("public, max-age=31536000");
    expect(await fileResponse.text()).toBe(fileContent);
  });

  it("GET /uploads/*key returns 404 for non-existent files", async () => {
    let response = await router.fetch("https://remix.run/uploads/nonexistent/file.jpg");

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("File not found");
  });

  it("GET /uploads/*key serves files with correct content type", async () => {
    let pngFile = new File(["png data"], "test.png", { type: "image/png" });
    let pdfFile = new File(["pdf data"], "test.pdf", { type: "application/pdf" });

    await uploadsStorage.set("images/test.png", pngFile);
    await uploadsStorage.set("docs/test.pdf", pdfFile);

    let pngResponse = await router.fetch("https://remix.run/uploads/images/test.png");
    expect(pngResponse.status).toBe(200);
    expect(pngResponse.headers.get("Content-Type")).toBe("image/png");

    let pdfResponse = await router.fetch("https://remix.run/uploads/docs/test.pdf");
    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers.get("Content-Type")).toBe("application/pdf");
  });
});
