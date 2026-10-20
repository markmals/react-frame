import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, parseDocument } from "../test/helpers.ts";

const router = await createTestRouter();

describe("router", () => {
  it("renders the home page with the newest post first", async () => {
    let response = await router.fetch("https://marginalia.test/");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");

    let document = parseDocument(await response.text());
    let titles = [...document.querySelectorAll("article h2 a")].map((it) => it.textContent);

    expect(titles[0]).toBe("A small CSS system");
    expect(titles[1]).toBe("Measuring what users feel");
    expect(titles).toHaveLength(7);
  });

  it("renders a 404 page for an unknown URL", async () => {
    let response = await router.fetch("https://marginalia.test/does-not-exist");

    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Page not found");
  });

  it("renders a 404 page for an unknown post, tag, or author", async () => {
    let responses = await Promise.all([
      router.fetch("https://marginalia.test/posts/nope"),
      router.fetch("https://marginalia.test/tags/nope"),
      router.fetch("https://marginalia.test/authors/nope"),
    ]);

    expect(responses.map((it) => it.status)).toEqual([404, 404, 404]);

    let [post, tag, author] = await Promise.all(responses.map((it) => it.text()));
    expect(post).toContain("No such post");
    expect(tag).toContain("Nothing tagged #nope");
    expect(author).toContain("No such writer");
  });

  it("keeps drafts out of the published list", async () => {
    let response = await router.fetch("https://marginalia.test/");
    let html = await response.text();

    let document = parseDocument(html);
    let listed = [...document.querySelectorAll("article h2 a")].map((it) =>
      it.getAttribute("href"),
    );

    expect(listed).not.toContain("/posts/notes-on-caching-fragments");
    // In development the draft is still reachable, and the sidebar links to it.
    expect(html).toContain("Drafts in progress");
    expect(
      (await router.fetch("https://marginalia.test/posts/notes-on-caching-fragments")).status,
    ).toBe(200);
  });
});
