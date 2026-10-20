import { describe, expect, it } from "vite-plus/test";

import {
  createTestRouter,
  parseDocument,
  requestWithSession,
  submitForm,
} from "../../../test/helpers.ts";

const router = await createTestRouter();
const postUrl = "https://marginalia.test/posts/a-small-css-system";

/** Posts the comment form the way a browser without JavaScript does. */
async function postComment(fields: Record<string, string | null>) {
  let { response, session } = await submitForm(router, postUrl, { action: "addComment", fields });

  return { response, session, document: parseDocument(await response.text()) };
}

async function fetchComments(slug: string, session: string | null) {
  let url = `https://marginalia.test/fragments/comments/${slug}`;
  let response = await router.fetch(session ? requestWithSession(url, session) : url);
  return parseDocument(await response.text());
}

describe("addComment", () => {
  it("saves the comment and renders it in the document the submission gets back", async () => {
    let { response, document, session } = await postComment({
      name: "  Wren Abiodun  ",
      body: "The arbitrary values rule is the one I keep losing arguments about.",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(document.body.textContent).toContain("The arbitrary values rule");

    // It is in the database, not just in that render: the frame alone shows it too.
    let comments = await fetchComments("a-small-css-system", session);
    expect([...comments.querySelectorAll("li strong")].map((it) => it.textContent)).toEqual([
      "Wren Abiodun",
    ]);
    expect(comments.querySelector("#comments-heading")?.textContent).toContain("1");
  });

  it("rejects a short name, keeps what was typed, and saves nothing", async () => {
    let { document, session } = await postComment({
      name: "A",
      body: "A rejected body nobody should ever see on the page.",
    });

    expect(document.querySelector("#comment-name-error")?.textContent).toBe(
      "Please enter a name of at least 2 characters.",
    );
    expect(document.querySelector("#comment-name")?.getAttribute("value")).toBe("A");
    expect(document.querySelector("#comment-name")?.getAttribute("aria-invalid")).toBe("true");
    expect(document.querySelector("#comment-body")?.textContent).toBe(
      "A rejected body nobody should ever see on the page.",
    );

    let comments = await fetchComments("a-small-css-system", session);
    expect(comments.querySelector("#comments-heading")?.textContent).not.toContain("2");
    expect([...comments.querySelectorAll("li p")].map((it) => it.textContent)).not.toContain(
      "A rejected body nobody should ever see on the page.",
    );
  });

  it("rejects a short body and reports only that field", async () => {
    let { document } = await postComment({ name: "Rosalind Mbeki", body: "Nice." });

    expect(document.querySelector("#comment-body-error")?.textContent).toBe(
      "Comments need at least 10 characters.",
    );
    expect(document.querySelector("#comment-name-error")).toBeNull();
  });

  it("reports both fields when both are wrong", async () => {
    let { document } = await postComment({ name: "", body: "" });

    expect(document.querySelector("#comment-name-error")).not.toBeNull();
    expect(document.querySelector("#comment-body-error")).not.toBeNull();
  });

  it("shows a rejection once, not on every later render", async () => {
    let { document, session } = await postComment({
      name: "A",
      body: "Long enough to be acceptable.",
    });

    expect(document.querySelector("#comment-name-error")).not.toBeNull();

    let comments = await fetchComments("a-small-css-system", session);
    expect(comments.querySelector("#comment-name-error")).toBeNull();
  });

  it("does not leak a rejection onto another post's thread", async () => {
    let { session } = await postComment({ name: "A", body: "Long enough to be acceptable." });
    let comments = await fetchComments("sqlite-is-enough", session);

    expect(comments.querySelector("#comment-name-error")).toBeNull();
  });
});
