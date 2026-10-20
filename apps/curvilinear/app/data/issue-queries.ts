import { and, ilike, inList, type Database } from "remix/data-table";

import type { IssueFilters, OrderField } from "./filters.ts";
import { STATUSES, type Status } from "./issue-fields.ts";
import type { CommentItem, IssueDetail, IssueListItem, IssueListPayload } from "./payloads.ts";
import { Comments, Issues, type Issue } from "./schema.ts";

const ORDER_COLUMNS: Record<
  OrderField,
  "priority_rank" | "status_rank" | "created_at" | "modified_at"
> = {
  priority: "priority_rank",
  status: "status_rank",
  created: "created_at",
  modified: "modified_at",
};

export async function loadIssueList(
  db: Database,
  filters: IssueFilters,
): Promise<IssueListPayload> {
  let predicates = [];

  if (filters.status.length > 0) {
    predicates.push(inList("status", filters.status));
  }

  if (filters.priority.length > 0) {
    predicates.push(inList("priority", filters.priority));
  }

  if (filters.query !== "") {
    predicates.push(ilike("title", `%${escapeLike(filters.query)}%`));
  }

  let where = predicates.length === 0 ? undefined : and(...predicates);
  let [rows, total] = await Promise.all([
    db.findMany(Issues, {
      where,
      // The id tiebreaker keeps rows from swapping places when the ordering column ties.
      orderBy: [
        [ORDER_COLUMNS[filters.orderBy], filters.orderDirection],
        ["id", "desc"],
      ],
    }),
    db.count(Issues),
  ]);

  return { issues: rows.map(toListItem), total };
}

export async function loadIssue(db: Database, id: number): Promise<IssueDetail | null> {
  let issue = await db.find(Issues, id);
  return issue === null ? null : { ...toListItem(issue), description: issue.description };
}

export async function loadComments(db: Database, issueId: number): Promise<CommentItem[]> {
  let comments = await db.findMany(Comments, {
    where: { issue_id: issueId },
    orderBy: [
      ["created_at", "asc"],
      ["id", "asc"],
    ],
  });

  return comments.map(({ id, body, username, created_at }) => ({ id, body, username, created_at }));
}

export interface ViewCounts {
  total: number;
  byStatus: Record<Status, number>;
}

export async function countIssuesByStatus(db: Database): Promise<ViewCounts> {
  let counts = await Promise.all(STATUSES.map((status) => db.count(Issues, { where: { status } })));

  let byStatus = Object.fromEntries(
    STATUSES.map((status, index) => [status, counts[index]!]),
  ) as Record<Status, number>;

  return { total: counts.reduce((sum, count) => sum + count, 0), byStatus };
}

function toListItem(issue: Issue): IssueListItem {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    username: issue.username,
    created_at: issue.created_at,
    modified_at: issue.modified_at,
  };
}

// data-table compiles ilike to `lower(col) like lower(?)` with no ESCAPE clause, so a literal
// term can't carry LIKE wildcards; dropping them keeps "100%" from matching every title.
function escapeLike(value: string): string {
  return value.replace(/[%_]/g, "");
}
