import { DOMParser } from "linkedom";
import { describe, expect, it } from "vite-plus/test";

import { createTestRouter } from "../../test/helpers.ts";

const router = await createTestRouter();

async function fetchFeed() {
  let response = await router.fetch("https://marginalia.test/feed.xml");
  let xml = await response.text();
  return { response, xml, document: new DOMParser().parseFromString(xml, "text/xml") };
}

describe("feed.xml", () => {
  it("answers with RSS rather than a page", async () => {
    let { response, document } = await fetchFeed();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/rss+xml; charset=utf-8");
    expect(document.documentElement.nodeName).toBe("rss");
    expect(document.documentElement.getAttribute("version")).toBe("2.0");
    expect(document.querySelector("channel > title")?.textContent).toBe("Marginalia");
    expect(document.querySelector("channel > link")?.textContent).toBe("https://marginalia.test/");
  });

  it("lists every published post, newest first, with its metadata", async () => {
    let { document } = await fetchFeed();
    let items = [...document.querySelectorAll("item")];

    expect(items).toHaveLength(7);

    let first = items[0]!;
    expect(first.querySelector("title")?.textContent).toBe("A small CSS system");
    expect(first.querySelector("link")?.textContent).toBe(
      "https://marginalia.test/posts/a-small-css-system",
    );
    expect(first.querySelector("guid")?.textContent).toBe(
      "https://marginalia.test/posts/a-small-css-system",
    );
    expect(first.querySelector("pubDate")?.textContent).toBe("Tue, 02 Jun 2026 00:00:00 GMT");
    expect([...first.children].find((it) => it.nodeName === "dc:creator")?.textContent).toBe(
      "Priya Venkatesan",
    );
    expect([...first.querySelectorAll("category")].map((it) => it.textContent)).toEqual([
      "css",
      "design",
    ]);

    let dates = items.map((item) => Date.parse(item.querySelector("pubDate")!.textContent!));
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it("escapes markup characters instead of emitting them raw", async () => {
    let { xml, document } = await fetchFeed();
    let description = [...document.querySelectorAll("item > description")].find((it) =>
      it.textContent?.includes("device segments"),
    );

    expect(description?.textContent).toContain("device segments & the metric");
    expect(xml).toContain("device segments &amp; the metric");
    expect(xml).not.toContain("device segments & the metric");
  });

  it("never syndicates a draft", async () => {
    let { xml, document } = await fetchFeed();

    expect(xml).not.toContain("notes-on-caching-fragments");
    expect(
      [...document.querySelectorAll("item > title")].map((it) => it.textContent),
    ).not.toContain("Notes on caching fragments");
  });
});
