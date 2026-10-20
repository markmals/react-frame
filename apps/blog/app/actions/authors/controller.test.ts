import { describe, expect, it } from "vite-plus/test";

import { createTestRouter, parseDocument } from "../../../test/helpers.ts";

const router = await createTestRouter();

describe("author page", () => {
  it("shows the writer's bio and only their posts", async () => {
    let response = await router.fetch("https://marginalia.test/authors/tobias-rask");
    let document = parseDocument(await response.text());

    expect(response.status).toBe(200);
    expect(document.querySelector("title")?.textContent).toBe("Tobias Rask — Marginalia");
    expect(document.querySelector("aside")?.textContent).toContain("Interface engineering");
    expect(document.querySelector("#post-list-heading")?.textContent).toBe("Posts by Tobias Rask");

    let titles = [...document.querySelectorAll("article h2 a")].map((it) => it.textContent);
    expect(titles).toEqual(["Measuring what users feel", "The case for nested routes"]);
  });

  it("404s for someone who does not write here", async () => {
    let response = await router.fetch("https://marginalia.test/authors/nobody");
    let document = parseDocument(await response.text());

    expect(response.status).toBe(404);
    expect(document.querySelector("h1")?.textContent).toBe("No such writer");
  });
});
