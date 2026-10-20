import type { Priority, Status } from "./issue-fields.ts";

/** A row of the issue list. The description is left out: the list never renders it. */
export interface IssueListItem {
  id: number;
  title: string;
  status: Status;
  priority: Priority;
  username: string;
  created_at: number;
  modified_at: number;
}

export interface IssueListPayload {
  issues: IssueListItem[];
  /** Every issue in the workspace, so the header can read "12 of 200". */
  total: number;
}

export interface IssueDetail extends IssueListItem {
  description: string;
}

export interface CommentItem {
  id: number;
  body: string;
  username: string;
  created_at: number;
}
