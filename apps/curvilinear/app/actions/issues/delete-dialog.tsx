"use client";

import { useQueryClient } from "@tanstack/react-query";
import { startTransition, useActionState } from "react";
import { useFrames } from "react-frame/client";

import { issueQueryKey } from "../../query/options.ts";
import { issueKey } from "../../utils/format.ts";
import { deleteIssue } from "./actions.ts";
import { issueFrameHref, issueHref } from "./links.ts";

export function DeleteIssueDialog({ issueId }: { issueId: number }) {
  let queryClient = useQueryClient();
  let frames = useFrames();

  let [error, confirm, deleting] = useActionState(
    async (_previousError: string | null, formData: FormData) => {
      try {
        await deleteIssue(formData);
      } catch (failure) {
        return failure instanceof Error ? failure.message : "Could not delete the issue.";
      }

      await queryClient.invalidateQueries({ queryKey: issueQueryKey });
      await frames.get("menu")?.reload();
      return null;
    },
    null,
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-issue-heading"
        className="w-80 rounded-lg border border-line bg-canvas shadow-dialog"
      >
        <form
          action={deleteIssue}
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(() => confirm(new FormData(event.currentTarget)));
          }}
        >
          <input type="hidden" name="issueId" value={issueId} />
          <h2 id="delete-issue-heading" className="border-b border-line px-4 py-3 font-medium">
            Delete {issueKey(issueId)}
          </h2>
          <p className="px-4 py-4 text-muted">
            Are you sure you want to delete this issue? Its comments go with it.
          </p>
          {error === null ? null : (
            <p role="alert" className="px-4 pb-3 text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
            <a
              href={issueHref(issueId)}
              data-target="main"
              data-src={issueFrameHref(issueId)}
              className="rounded-control px-3 py-1.5 text-muted hover:bg-hover"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={deleting}
              className="rounded-control bg-danger px-3 py-1.5 font-medium text-white hover:bg-danger-hover disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
