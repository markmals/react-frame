"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { startTransition, useActionState } from "react";

import {
  DEFAULT_ORDER_BY,
  DEFAULT_ORDER_DIRECTION,
  type IssueFilters,
} from "../../data/filters.ts";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_LABELS,
  STATUSES,
  type Priority,
  type Status,
} from "../../data/issue-fields.ts";
import { issueQuery, issueQueryKey } from "../../query/options.ts";
import { Avatar } from "../../ui/avatar.tsx";
import { CloseIcon, PriorityIcon, StatusIcon, TrashIcon } from "../../ui/icons.tsx";
import { formatLongDate, issueKey } from "../../utils/format.ts";
import { setIssuePriority, setIssueStatus, updateIssueContent } from "./actions.ts";
import { CommentsView } from "./comments-view.tsx";
import { issueFrameHref, issueHref, listFrameHref, listHref, withParam } from "./links.ts";
import { PropertyMenu } from "./property-menu.tsx";

const ALL_ISSUES: IssueFilters = {
  status: [],
  priority: [],
  query: "",
  orderBy: DEFAULT_ORDER_BY,
  orderDirection: DEFAULT_ORDER_DIRECTION,
};

export function IssueDetailView({ issueId }: { issueId: number }) {
  let { data: issue } = useSuspenseQuery(issueQuery(issueId));
  let queryClient = useQueryClient();

  let [error, save, saving] = useActionState(
    async (_previousError: string | null, formData: FormData) => {
      try {
        await updateIssueContent(formData);
      } catch (failure) {
        return failure instanceof Error ? failure.message : "Could not save the issue.";
      }

      await queryClient.invalidateQueries({ queryKey: issueQueryKey });
      return null;
    },
    null,
  );

  return (
    <>
      <header className="flex h-topbar shrink-0 items-center gap-2 border-b border-line px-5">
        <span className="font-semibold">Issue</span>
        <span className="text-muted tabular-nums">{issueKey(issue.id)}</span>
        <a
          href={withParam(issueHref(issue.id), "confirm=delete")}
          data-target="main"
          data-src={withParam(issueFrameHref(issue.id), "confirm=delete")}
          aria-label="Delete issue"
          className="ml-auto flex size-7 items-center justify-center rounded-control text-muted hover:bg-hover hover:text-danger"
        >
          <TrashIcon />
        </a>
        <a
          href={listHref(ALL_ISSUES)}
          data-target="main"
          data-src={listFrameHref(ALL_ISSUES)}
          aria-label="Back to issues"
          className="flex size-7 items-center justify-center rounded-control text-muted hover:bg-hover"
        >
          <CloseIcon />
        </a>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row-reverse">
        <aside className="flex shrink-0 flex-col gap-3 border-line px-6 py-5 md:w-detail-aside md:border-l">
          <PropertyRow label="Opened by">
            <span className="flex items-center gap-1.5">
              <Avatar name={issue.username} />
              {issue.username}
            </span>
          </PropertyRow>
          <PropertyRow label="Status">
            <PropertyMenu<Status>
              field="status"
              issueId={issue.id}
              value={issue.status}
              options={STATUSES}
              labels={STATUS_LABELS}
              renderIcon={(status) => <StatusIcon status={status} />}
              submit={setIssueStatus}
              menuLabel="Status"
              showValue
            />
          </PropertyRow>
          <PropertyRow label="Priority">
            <PropertyMenu<Priority>
              field="priority"
              issueId={issue.id}
              value={issue.priority}
              options={PRIORITIES}
              labels={PRIORITY_LABELS}
              renderIcon={(priority) => <PriorityIcon priority={priority} />}
              submit={setIssuePriority}
              menuLabel="Priority"
              showValue
            />
          </PropertyRow>
          <PropertyRow label="Created">{formatLongDate(issue.created_at)}</PropertyRow>
          <PropertyRow label="Updated">{formatLongDate(issue.modified_at)}</PropertyRow>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <form
            action={updateIssueContent}
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(() => save(new FormData(event.currentTarget)));
            }}
            className="flex flex-col gap-3 px-6 py-5"
            key={issue.id}
          >
            <input type="hidden" name="issueId" value={issue.id} />
            <label htmlFor="issue-title" className="sr-only">
              Issue title
            </label>
            <input
              id="issue-title"
              name="title"
              required
              defaultValue={issue.title}
              className="rounded-control border border-transparent px-2 py-1 text-lg font-semibold outline-none hover:border-line focus:border-brand"
            />
            <label htmlFor="issue-description" className="sr-only">
              Description
            </label>
            <textarea
              id="issue-description"
              name="description"
              rows={8}
              defaultValue={issue.description}
              placeholder="Add description…"
              className="prose-body resize-y rounded-control border border-transparent px-2 py-1 outline-none hover:border-line focus:border-brand"
            />
            {error === null ? null : (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="self-start rounded-control bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>

          <CommentsView issueId={issue.id} />
        </div>
      </div>
    </>
  );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-muted">{label}</span>
      <span className="flex min-w-0 flex-1 items-center">{children}</span>
    </div>
  );
}
