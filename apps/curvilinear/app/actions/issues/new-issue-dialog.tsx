"use client";

import { useQueryClient } from "@tanstack/react-query";
import { startTransition, useActionState } from "react";
import { useFrames } from "react-frame/client";

import { PRIORITIES, PRIORITY_LABELS, STATUS_LABELS, STATUSES } from "../../data/issue-fields.ts";
import { WORKSPACE_NAME } from "../../data/workspace.ts";
import { issueQueryKey } from "../../query/options.ts";
import { CloseIcon } from "../../ui/icons.tsx";
import { createIssue } from "./actions.ts";

/**
 * The composer is a URL, not component state: `?new=1` on the list renders it, so it opens and
 * submits without JavaScript. With JavaScript the link loads it into the main frame instead.
 */
export function NewIssueDialog({
  returnTo,
  returnToFrame,
  titleMissing,
}: {
  returnTo: string;
  returnToFrame: string;
  titleMissing: boolean;
}) {
  let queryClient = useQueryClient();
  let frames = useFrames();

  let [error, create, creating] = useActionState(
    async (_previousError: string | null, formData: FormData) => {
      try {
        await createIssue(formData);
      } catch (failure) {
        return failure instanceof Error ? failure.message : "Could not create the issue.";
      }

      await queryClient.invalidateQueries({ queryKey: issueQueryKey });
      await frames.get("menu")?.reload();
      return null;
    },
    titleMissing ? "An issue needs a title." : null,
  );

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-ink/30 pt-24">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-issue-heading"
        className="w-dialog max-w-full rounded-lg border border-line bg-canvas shadow-dialog"
      >
        <form
          // Without JavaScript this posts to the list page, which redirects back to it after.
          action={createIssue}
          onSubmit={(event) => {
            event.preventDefault();
            // useActionState's dispatch only becomes an action inside a transition.
            startTransition(() => create(new FormData(event.currentTarget)));
          }}
        >
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="rounded-control bg-hover px-1.5 py-0.5 text-muted">
              {WORKSPACE_NAME}
            </span>
            <h2 id="new-issue-heading" className="font-medium">
              New issue
            </h2>
            <a
              href={returnTo}
              data-target="main"
              data-src={returnToFrame}
              aria-label="Close"
              className="ml-auto flex size-6 items-center justify-center rounded-control text-muted hover:bg-hover"
            >
              <CloseIcon />
            </a>
          </div>

          <div className="flex flex-col gap-3 px-4 py-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="new-issue-title" className="text-xs font-medium text-muted">
                Title
              </label>
              <input
                id="new-issue-title"
                name="title"
                required
                autoComplete="off"
                placeholder="Issue title"
                className="rounded-control border border-line px-2 py-1.5 text-lg font-semibold outline-none placeholder:font-normal placeholder:text-faint focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="new-issue-description" className="text-xs font-medium text-muted">
                Description
              </label>
              <textarea
                id="new-issue-description"
                name="description"
                rows={5}
                placeholder="Add description…"
                className="resize-y rounded-control border border-line px-2 py-1.5 outline-none placeholder:text-faint focus:border-brand"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <label htmlFor="new-issue-status" className="text-xs font-medium text-muted">
                  Status
                </label>
                <select
                  id="new-issue-status"
                  name="status"
                  defaultValue="backlog"
                  className="rounded-control border border-line px-2 py-1.5 outline-none focus:border-brand"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label htmlFor="new-issue-priority" className="text-xs font-medium text-muted">
                  Priority
                </label>
                <select
                  id="new-issue-priority"
                  name="priority"
                  defaultValue="none"
                  className="rounded-control border border-line px-2 py-1.5 outline-none focus:border-brand"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error === null ? null : (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
            <a
              href={returnTo}
              data-target="main"
              data-src={returnToFrame}
              className="rounded-control px-3 py-1.5 text-muted hover:bg-hover"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={creating}
              className="rounded-control bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-hover disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
