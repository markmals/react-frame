import { column as c, table } from "remix/data-table";
import type { TableRow } from "remix/data-table";

export const Comments = table({
  name: "comments",
  columns: {
    id: c.integer(),
    post_slug: c.text(),
    author_name: c.text(),
    body: c.text(),
    created_at: c.integer(),
  },
  beforeWrite({ operation, value }) {
    let next = { ...value };

    if (typeof next.post_slug === "string") {
      next.post_slug = next.post_slug.trim().toLowerCase();
    }

    if (typeof next.author_name === "string") {
      next.author_name = next.author_name.trim().replace(/\s+/g, " ");
    }

    if (typeof next.body === "string") {
      next.body = next.body.trim();
    }

    if (operation === "create" && next.created_at === undefined) {
      next.created_at = Date.now();
    }

    return { value: next };
  },
  validate({ operation, value }) {
    let issues: Array<{ message: string; path?: Array<string | number> }> = [];
    let slug = typeof value.post_slug === "string" ? value.post_slug.trim() : undefined;
    let name =
      typeof value.author_name === "string"
        ? value.author_name.trim().replace(/\s+/g, " ")
        : undefined;
    let body = typeof value.body === "string" ? value.body.trim() : undefined;

    if (operation === "create" && slug === undefined) {
      issues.push({ message: "A comment needs a post.", path: ["post_slug"] });
    }

    if (slug !== undefined && slug.length === 0) {
      issues.push({ message: "A comment needs a post.", path: ["post_slug"] });
    }

    if ((operation === "create" && name === undefined) || name?.length === 0) {
      issues.push({ message: "A comment needs a name.", path: ["author_name"] });
    }

    if ((operation === "create" && body === undefined) || body?.length === 0) {
      issues.push({ message: "A comment needs a body.", path: ["body"] });
    }

    return issues.length > 0 ? { issues } : { value };
  },
});

export type Comment = TableRow<typeof Comments>;
