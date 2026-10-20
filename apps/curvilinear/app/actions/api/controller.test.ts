import { describe, expect, it } from "vite-plus/test";

import type { CommentItem, IssueDetail, IssueListPayload } from "../../data/payloads.ts";
import { createTestRouter, fetchJson, origin } from "../../../test/helpers.ts";

const router = await createTestRouter();

describe("issue JSON routes", () => {
  it("returns every seeded issue, newest first, with the workspace total", async () => {
    let { issues, total } = await fetchJson<IssueListPayload>(router, "/api/issues");

    expect(total).toBe(200);
    expect(issues).toHaveLength(200);
    let timestamps = issues.map((issue) => issue.created_at);
    expect(timestamps).toEqual([...timestamps].sort((left, right) => right - left));
    // The list payload stays lean: descriptions only come back from the detail route.
    expect(issues[0]).not.toHaveProperty("description");
  });

  it("keeps only the statuses the filter names", async () => {
    let { issues, total } = await fetchJson<IssueListPayload>(
      router,
      "/api/issues?status=todo,in_progress",
    );

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.length).toBeLessThan(200);
    expect(new Set(issues.map((issue) => issue.status))).toEqual(new Set(["todo", "in_progress"]));
    // `total` stays the whole workspace so the header can read "72 of 200".
    expect(total).toBe(200);
  });

  it("combines status and priority filters", async () => {
    let { issues } = await fetchJson<IssueListPayload>(
      router,
      "/api/issues?status=backlog&priority=urgent,high",
    );

    expect(issues.length).toBeGreaterThan(0);
    for (let issue of issues) {
      expect(issue.status).toBe("backlog");
      expect(["urgent", "high"]).toContain(issue.priority);
    }
  });

  it("ignores filter values that are not statuses", async () => {
    let { issues } = await fetchJson<IssueListPayload>(router, "/api/issues?status=nonsense");

    expect(issues).toHaveLength(200);
  });

  it("matches the search term against the title, case-insensitively", async () => {
    let { issues } = await fetchJson<IssueListPayload>(router, "/api/issues?query=SLACK");

    expect(issues.length).toBeGreaterThan(0);
    for (let issue of issues) {
      expect(issue.title.toLowerCase()).toContain("slack");
    }
  });

  it("treats a search term's LIKE wildcards as nothing special", async () => {
    let plain = await fetchJson<IssueListPayload>(router, "/api/issues?query=slack");
    let wildcarded = await fetchJson<IssueListPayload>(router, "/api/issues?query=slack%25");

    expect(wildcarded.issues.map((issue) => issue.id)).toEqual(plain.issues.map((i) => i.id));
    expect(plain.issues.length).toBeLessThan(200);
  });

  it("orders by priority, most urgent first, when asked", async () => {
    let { issues } = await fetchJson<IssueListPayload>(
      router,
      "/api/issues?orderBy=priority&orderDirection=desc",
    );

    let rank = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 };
    expect(issues[0]!.priority).toBe("urgent");
    let ranks = issues.map((issue) => rank[issue.priority]);
    expect(ranks).toEqual([...ranks].sort((left, right) => right - left));
  });

  it("reverses the order when the direction flips", async () => {
    let ascending = await fetchJson<IssueListPayload>(
      router,
      "/api/issues?orderBy=created&orderDirection=asc",
    );
    let descending = await fetchJson<IssueListPayload>(router, "/api/issues");

    expect(ascending.issues[0]!.created_at).toBeLessThan(descending.issues[0]!.created_at);
  });

  it("returns one issue with its description", async () => {
    let issue = await fetchJson<IssueDetail>(router, "/api/issues/7");

    expect(issue.id).toBe(7);
    expect(typeof issue.description).toBe("string");
    expect(issue.title.length).toBeGreaterThan(0);
  });

  it("404s for an issue that does not exist", async () => {
    let response = await router.fetch(`${origin}/api/issues/99999`);

    expect(response.status).toBe(404);
  });

  it("returns an issue's comments oldest first", async () => {
    let withComments = await findIssueWithComments();
    let timestamps = withComments.map((comment) => comment.created_at);

    expect(timestamps).toEqual([...timestamps].sort((left, right) => left - right));
    for (let comment of withComments) {
      expect(comment.body.length).toBeGreaterThan(0);
      expect(comment.username.length).toBeGreaterThan(0);
    }
  });
});

async function findIssueWithComments(): Promise<CommentItem[]> {
  for (let id = 1; id <= 20; id++) {
    let comments = await fetchJson<CommentItem[]>(router, `/api/issues/${id}/comments`);
    if (comments.length > 1) return comments;
  }

  throw new Error("The seed should contain an issue with more than one comment");
}
