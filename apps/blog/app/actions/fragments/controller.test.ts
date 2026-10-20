import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, parseDocument } from "../../../test/helpers.ts";

const router = await createTestRouter();

async function fetchFragment(path: string) {
  let response = await router.fetch(`https://marginalia.test${path}`);
  let html = await response.text();
  return { response, html, document: parseDocument(html) };
}

describe("post list frame", () => {
  it("renders the list on its own, without the page around it", async () => {
    let { response, html, document } = await fetchFragment("/fragments/post-list");

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(html).not.toContain("<header");
    expect(document.querySelector("#post-list-heading")?.textContent).toBe("Latest posts");
    expect(document.querySelectorAll("article")).toHaveLength(7);
  });

  it("filters by tag and offers a way back to everything", async () => {
    let { document } = await fetchFragment("/fragments/post-list?tag=architecture");
    let titles = [...document.querySelectorAll("article h2 a")].map((it) => it.textContent);

    expect(document.querySelector("#post-list-heading")?.textContent).toBe(
      "Posts tagged #architecture",
    );
    expect(titles).toEqual(["Rendering on the server, again", "The case for nested routes"]);

    let clear = [...document.querySelectorAll("a")].find(
      (it) => it.textContent === "Show everything",
    )!;
    expect(clear.getAttribute("href")).toBe("/");
    expect(clear.getAttribute("data-target")).toBe("post-list");
    expect(clear.getAttribute("data-src")).toBe("/fragments/post-list");
  });

  it("filters by author", async () => {
    let { document } = await fetchFragment("/fragments/post-list?author=priya-venkatesan");
    let titles = [...document.querySelectorAll("article h2 a")].map((it) => it.textContent);

    expect(document.querySelector("#post-list-heading")?.textContent).toBe(
      "Posts by Priya Venkatesan",
    );
    expect(titles).toEqual([
      "A small CSS system",
      "Writing MDX that ages well",
      "Progressive enhancement is not nostalgia",
    ]);
  });

  it("404s when nothing matches the filter", async () => {
    let { response } = await fetchFragment("/fragments/post-list?tag=nonsense");

    expect(response.status).toBe(404);
  });

  it("points its tag links at the tag page while targeting the frame", async () => {
    let { document } = await fetchFragment("/fragments/post-list");
    let link = [...document.querySelectorAll("article ul a")].find(
      (it) => it.textContent === "#routing",
    )!;

    expect(link.getAttribute("href")).toBe("/tags/routing");
    expect(link.getAttribute("data-target")).toBe("post-list");
    expect(link.getAttribute("data-src")).toBe("/fragments/post-list?tag=routing");
  });
});

describe("author posts frame", () => {
  it("lists the author's other posts and leaves this one out", async () => {
    let { document } = await fetchFragment("/fragments/author-posts/sqlite-is-enough");
    let links = [...document.querySelectorAll("li a")].map((it) => it.getAttribute("href"));

    expect(document.querySelector("#author-posts-heading")?.textContent).toBe(
      "More from Maren Oduya",
    );
    expect(links).toContain("/posts/rendering-on-the-server-again");
    expect(links).not.toContain("/posts/sqlite-is-enough");
    expect(links).not.toContain("/posts/a-small-css-system");
  });

  it("404s for a post that does not exist", async () => {
    let { response } = await fetchFragment("/fragments/author-posts/nope");

    expect(response.status).toBe(404);
  });
});

describe("comments frame", () => {
  it("renders the thread and the form on its own", async () => {
    let { response, html, document } = await fetchFragment("/fragments/comments/sqlite-is-enough");

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(html).not.toContain("<header");

    let authors = [...document.querySelectorAll("li strong")].map((it) => it.textContent);
    expect(authors).toEqual(["Theo Nakamura", "Maren Oduya"]);
    expect(document.querySelector("#comments-heading")?.textContent).toContain("2");
    expect(document.querySelector("#comment-body")).not.toBeNull();
  });

  it("says so when a post has no comments yet", async () => {
    let { document, html } = await fetchFragment("/fragments/comments/a-small-css-system");

    expect(document.querySelector("#comments-heading")?.textContent).toContain("0");
    expect(html).toContain("Nobody has said anything yet.");
  });
});
