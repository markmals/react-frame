import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, loginAsCustomer, requestWithSession } from "../../../test/helpers.ts";

const router = await createTestRouter();

describe("admin controller", () => {
  it("GET /admin redirects when not authenticated", async () => {
    let response = await router.fetch("https://remix.run/admin");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login?returnTo=%2Fadmin");
  });

  it("GET /admin returns 403 for non-admin users", async () => {
    let session = await loginAsCustomer(router);

    let response = await router.fetch(requestWithSession("https://remix.run/admin", session));

    expect(response.status).toBe(403);
  });
});
