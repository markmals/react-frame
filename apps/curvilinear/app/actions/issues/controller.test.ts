import { describe, expect, it } from "vite-plus/test";

import type { CommentItem, IssueDetail, IssueListPayload } from "../../data/payloads.ts";
import { createTestRouter, fetchJson, origin, submitForm } from "../../../test/helpers.ts";

const router = await createTestRouter();
const issuesUrl = `${origin}/issues`;

describe("the issue list page", () => {
  it("server-renders the rows from the prefetched query, not a client fetch", async () => {
    let html = await (await router.fetch(issuesUrl)).text();
    let { issues } = await fetchJson<IssueListPayload>(router, "/api/issues");

    expect(html).toContain(issues[0]!.title);
    expect(html).toContain("CVX-" + issues[0]!.id);
  });

  it("embeds the left menu frame with a count per saved view", async () => {
    let html = await (await router.fetch(issuesUrl)).text();

    expect(html).toContain("All issues");
    expect(html).toContain("Backlog");
    expect(html).toContain('data-src="/frames/list?status=backlog"');
  });

  it("filters the embedded list frame by the page's search params", async () => {
    let html = await (await router.fetch(`${origin}/issues?status=backlog`)).text();
    let backlog = await fetchJson<IssueListPayload>(router, "/api/issues?status=backlog");
    let done = await fetchJson<IssueListPayload>(router, "/api/issues?status=done");

    expect(html).toContain(backlog.issues[0]!.title);
    expect(html).not.toContain(`CVX-${done.issues[0]!.id}<`);
  });

  it("opens the composer from the URL, so it works before JavaScript loads", async () => {
    let html = await (await router.fetch(`${origin}/issues?new=1`)).text();

    expect(html).toContain('role="dialog"');
    expect(html).toContain("New issue");
    expect(html).toContain('name="title"');
  });

  it("redirects the bare root to the issue list", async () => {
    let response = await router.fetch(`${origin}/`);

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/issues");
  });
});

describe("issue mutations without JavaScript", () => {
  it("creates an issue from the composer and redirects back to the list", async () => {
    let response = await submitForm(router, `${origin}/issues?new=1`, {
      action: "createIssue",
      fields: {
        title: "Make the composer work without JavaScript",
        description: "It posts to the page and the page renders again.",
        status: "todo",
        priority: "high",
      },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/issues");

    let { issues, total } = await fetchJson<IssueListPayload>(router, "/api/issues");
    expect(total).toBe(201);
    expect(issues[0]!.title).toBe("Make the composer work without JavaScript");
    expect(issues[0]!.status).toBe("todo");
    expect(issues[0]!.priority).toBe("high");
  });

  it("sends an empty title back to the composer instead of saving it", async () => {
    let before = await fetchJson<IssueListPayload>(router, "/api/issues");

    let response = await submitForm(router, `${origin}/issues?new=1`, {
      action: "createIssue",
      fields: { title: "   " },
    });

    expect(response.headers.get("Location")).toContain("error=title");
    let after = await fetchJson<IssueListPayload>(router, "/api/issues");
    expect(after.total).toBe(before.total);
  });

  it("changes an issue's status from the row menu", async () => {
    let response = await submitForm(router, issuesUrl, {
      action: "setIssueStatus",
      match: { issueId: "7" },
      fields: { status: "done" },
    });

    expect(response.status).toBe(200);
    let issue = await fetchJson<IssueDetail>(router, "/api/issues/7");
    expect(issue.status).toBe("done");
  });

  it("changes an issue's priority from the row menu", async () => {
    await submitForm(router, issuesUrl, {
      action: "setIssuePriority",
      match: { issueId: "9" },
      fields: { priority: "urgent" },
    });

    let issue = await fetchJson<IssueDetail>(router, "/api/issues/9");
    expect(issue.priority).toBe("urgent");
  });

  it("saves the title and description from the detail page", async () => {
    await submitForm(router, `${origin}/issue/12`, {
      action: "updateIssueContent",
      fields: { title: "Rewritten title", description: "Rewritten description." },
    });

    let issue = await fetchJson<IssueDetail>(router, "/api/issues/12");
    expect(issue.title).toBe("Rewritten title");
    expect(issue.description).toBe("Rewritten description.");
    expect(issue.modified_at).toBeGreaterThan(issue.created_at);
  });

  it("posts a comment from the detail page", async () => {
    await submitForm(router, `${origin}/issue/14`, {
      action: "addComment",
      fields: { body: "Picking this up today." },
    });

    let comments = await fetchJson<CommentItem[]>(router, "/api/issues/14/comments");
    expect(comments.at(-1)!.body).toBe("Picking this up today.");
    expect(comments.at(-1)!.username).toBe("Ada Okonkwo");
  });

  it("deletes an issue with its comments and redirects to the list", async () => {
    let response = await submitForm(router, `${origin}/issue/14?confirm=delete`, {
      action: "deleteIssue",
      match: { issueId: "14" },
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/issues");

    let missing = await router.fetch(`${origin}/api/issues/14`);
    expect(missing.status).toBe(404);
    let comments = await fetchJson<CommentItem[]>(router, "/api/issues/14/comments");
    expect(comments).toHaveLength(0);
  });

  it("404s the issue frame for an issue that is gone", async () => {
    let response = await router.fetch(`${origin}/frames/issue/99999`);

    expect(response.status).toBe(404);
    expect(await response.text()).toContain("does not exist");
  });
});
