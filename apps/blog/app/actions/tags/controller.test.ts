import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, parseDocument } from "../../../test/helpers.ts";

const router = await createTestRouter();

describe("tag page", () => {
  it("renders the archive with the list frame already filtered", async () => {
    let response = await router.fetch("https://marginalia.test/tags/performance");
    let document = parseDocument(await response.text());

    expect(response.status).toBe(200);
    expect(document.querySelector("title")?.textContent).toBe("#performance — Marginalia");
    expect(document.querySelector("#post-list-heading")?.textContent).toBe(
      "Posts tagged #performance",
    );

    let titles = [...document.querySelectorAll("article h2 a")].map((it) => it.textContent);
    expect(titles).toEqual(["Measuring what users feel"]);
  });

  it("matches tags case-insensitively", async () => {
    let response = await router.fetch("https://marginalia.test/tags/Routing");

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("The case for nested routes");
  });

  it("404s for a tag nothing carries", async () => {
    let response = await router.fetch("https://marginalia.test/tags/webrings");
    let document = parseDocument(await response.text());

    expect(response.status).toBe(404);
    expect(document.querySelector("h1")?.textContent).toBe("Nothing tagged #webrings");
  });

  it("does not expose a tag that only a draft carries in its index", async () => {
    let response = await router.fetch("https://marginalia.test/");
    let document = parseDocument(await response.text());
    let sidebarTags = [...document.querySelectorAll("aside a")].map((it) =>
      it.getAttribute("href"),
    );

    // The draft is tagged #performance and #architecture; both counts come from published posts.
    let performance = [...document.querySelectorAll("aside a")].find(
      (it) => it.getAttribute("href") === "/tags/performance",
    );
    expect(sidebarTags).toContain("/tags/performance");
    expect(performance?.textContent).toContain("1");
  });
});
