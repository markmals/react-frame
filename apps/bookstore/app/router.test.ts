import { describe, expect, it } from "vite-plus/test";

import { createTestRouter } from "../test/helpers.ts";

const router = await createTestRouter();

describe("router", () => {
  it("responds to basic GET request", async () => {
    let response = await router.fetch("https://remix.run/");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(await response.text()).toContain("Welcome to the Bookstore");
  });

  it("returns 404 for unknown routes", async () => {
    let response = await router.fetch("https://remix.run/does-not-exist");

    expect(response.status).toBe(404);
  });
});
