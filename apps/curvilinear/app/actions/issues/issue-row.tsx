"use client";

import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUSES,
  type Priority,
  type Status,
} from "../../data/issue-fields.ts";
import type { IssueListItem } from "../../data/payloads.ts";
import { Avatar } from "../../ui/avatar.tsx";
import { PriorityIcon, StatusIcon } from "../../ui/icons.tsx";
import { formatShortDate, issueKey } from "../../utils/format.ts";
import { setIssuePriority, setIssueStatus } from "./actions.ts";
import { issueFrameHref, issueHref } from "./links.ts";
import { PropertyMenu } from "./property-menu.tsx";

export function IssueRow({ issue }: { issue: IssueListItem }) {
  return (
    <li className="relative flex h-row items-center gap-2 border-b border-line pr-5 pl-3 hover:bg-hover">
      <PropertyMenu<Priority>
        field="priority"
        issueId={issue.id}
        value={issue.priority}
        options={PRIORITIES}
        labels={PRIORITY_LABELS}
        renderIcon={(priority) => <PriorityIcon priority={priority} />}
        submit={setIssuePriority}
        menuLabel={`Priority of ${issueKey(issue.id)}`}
      />
      <PropertyMenu<Status>
        field="status"
        issueId={issue.id}
        value={issue.status}
        options={STATUSES}
        labels={STATUS_LABELS}
        renderIcon={(status) => <StatusIcon status={status} />}
        submit={setIssueStatus}
        menuLabel={`Status of ${issueKey(issue.id)}`}
      />
      <span className="w-16 shrink-0 text-faint tabular-nums">{issueKey(issue.id)}</span>
      {/* The pseudo-element stretches the one link over the whole row, so the row is clickable
          without nesting the property menus inside an anchor. */}
      <a
        href={issueHref(issue.id)}
        data-target="main"
        data-src={issueFrameHref(issue.id)}
        className="min-w-0 flex-1 truncate font-medium after:absolute after:inset-0"
      >
        {issue.title}
      </a>
      <span className="shrink-0 text-muted">{formatShortDate(issue.created_at)}</span>
      <Avatar name={issue.username} />
    </li>
  );
}
