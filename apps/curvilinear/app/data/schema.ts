import { belongsTo, column as c, hasMany, table } from "remix/data-table";
import type { TableRow } from "remix/data-table";

import { PRIORITIES, PRIORITY_RANK, STATUS_RANK, STATUSES } from "./issue-fields.ts";

export const Issues = table({
  name: "issues",
  columns: {
    id: c.integer(),
    title: c.text(),
    description: c.text(),
    status: c.enum(STATUSES),
    priority: c.enum(PRIORITIES),
    status_rank: c.integer(),
    priority_rank: c.integer(),
    username: c.text(),
    created_at: c.integer(),
    modified_at: c.integer(),
  },
  beforeWrite({ operation, value }) {
    let next = { ...value };

    if (typeof next.title === "string") {
      next.title = next.title.trim();
    }

    if (typeof next.description === "string") {
      next.description = next.description.trim();
    }

    // The ranks are derived columns; keeping them in sync here means no caller can forget them.
    if (next.status !== undefined) {
      next.status_rank = STATUS_RANK[next.status];
    }

    if (next.priority !== undefined) {
      next.priority_rank = PRIORITY_RANK[next.priority];
    }

    if (operation === "update" && next.modified_at === undefined) {
      next.modified_at = Date.now();
    }

    return { value: next };
  },
  validate({ operation, value }) {
    let issues: Array<{ message: string; path?: Array<string | number> }> = [];
    let title = typeof value.title === "string" ? value.title.trim() : undefined;

    if (operation === "create" && title === undefined) {
      issues.push({ message: "An issue needs a title.", path: ["title"] });
    }

    if (title !== undefined && title.length === 0) {
      issues.push({ message: "An issue needs a title.", path: ["title"] });
    }

    if (title !== undefined && title.length > 300) {
      issues.push({ message: "Keep the title under 300 characters.", path: ["title"] });
    }

    return issues.length > 0 ? { issues } : { value };
  },
});

export const Comments = table({
  name: "comments",
  columns: {
    id: c.integer(),
    issue_id: c.integer(),
    body: c.text(),
    username: c.text(),
    created_at: c.integer(),
  },
  beforeWrite({ value }) {
    if (typeof value.body !== "string") {
      return { value };
    }

    return { value: { ...value, body: value.body.trim() } };
  },
  validate({ operation, value }) {
    let body = typeof value.body === "string" ? value.body.trim() : undefined;

    if (operation === "create" && body === undefined) {
      return { issues: [{ message: "A comment needs a body.", path: ["body"] }] };
    }

    if (body !== undefined && body.length === 0) {
      return { issues: [{ message: "A comment needs a body.", path: ["body"] }] };
    }

    return { value };
  },
});

export const commentsByIssue = hasMany(Issues, Comments).orderBy("created_at", "asc");
export const issueForComment = belongsTo(Comments, Issues);

export type Issue = TableRow<typeof Issues>;
export type Comment = TableRow<typeof Comments>;
