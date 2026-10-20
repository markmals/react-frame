import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, parseDocument } from "../../../test/helpers.ts";

const router = await createTestRouter();

async function fetchPost(slug: string) {
  let response = await router.fetch(`https://marginalia.test/posts/${slug}`);
  return { response, document: parseDocument(await response.text()) };
}

describe("post page", () => {
  it("renders the article with its author, date, and tags", async () => {
    let { response, document } = await fetchPost("sqlite-is-enough");

    expect(response.status).toBe(200);
    expect(document.querySelector("h1")?.textContent).toBe("SQLite is enough");
    expect(document.querySelector("title")?.textContent).toBe("SQLite is enough — Marginalia");

    let byline = document.querySelector("article header p")!;
    expect(byline.textContent).toContain("March 22, 2026");
    expect(byline.querySelector("a")?.getAttribute("href")).toBe("/authors/maren-oduya");
    expect(byline.textContent).toContain("Maren Oduya");

    let tags = [...document.querySelectorAll("article header ul a")].map((it) =>
      it.getAttribute("href"),
    );
    expect(tags).toEqual(["/tags/databases", "/tags/operations"]);
  });

  it("renders the MDX body, not the source", async () => {
    let { document } = await fetchPost("sqlite-is-enough");
    let body = document.querySelector(".post-body")!;

    expect(body.querySelector("h2")?.textContent).toBe("Why it worked");
    expect(body.querySelector("pre code")?.textContent).toContain("pragma journal_mode = wal;");
    expect(body.querySelectorAll("li").length).toBeGreaterThan(3);
    expect(body.textContent).not.toContain("## Why it worked");
  });

  it("builds a table of contents from the body's headings", async () => {
    let { document } = await fetchPost("sqlite-is-enough");
    let links = [...document.querySelectorAll('nav[aria-label="On this page"] a')];

    expect(links.map((it) => it.textContent)).toContain("What actually broke");
    expect(links.map((it) => it.getAttribute("href"))).toContain("#what-actually-broke");

    // Every entry points at a heading that exists in the rendered body.
    for (let link of links) {
      let id = link.getAttribute("href")!.slice(1);
      expect(document.querySelector(`.post-body [id="${id}"]`)).not.toBeNull();
    }
  });

  it("renders a client component embedded in the MDX", async () => {
    let { document } = await fetchPost("progressive-enhancement-is-not-nostalgia");
    let poll = document.querySelector("fieldset")!;

    expect(poll.querySelector("legend")?.textContent).toBe("Reader check-in");
    expect([...poll.querySelectorAll('input[type="radio"]')]).toHaveLength(4);
    expect(poll.textContent).toContain("Pick one. Nothing is sent anywhere.");
  });

  it("mounts the comments and author frames", async () => {
    let { document } = await fetchPost("sqlite-is-enough");

    expect(document.querySelector("#comments-heading")?.textContent).toContain("comments");
    expect(document.querySelector("#author-posts-heading")?.textContent).toBe(
      "More from Maren Oduya",
    );
  });

  it("404s for an unknown slug", async () => {
    let { response, document } = await fetchPost("no-such-post");

    expect(response.status).toBe(404);
    expect(document.querySelector("h1")?.textContent).toBe("No such post");
  });
});
