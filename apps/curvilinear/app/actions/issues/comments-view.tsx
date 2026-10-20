"use client";

import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { startTransition, useActionState } from "react";

import { issueCommentsQuery, issueQueryKey } from "../../query/options.ts";
import { Avatar } from "../../ui/avatar.tsx";
import { formatLongDate } from "../../utils/format.ts";
import { addComment } from "./actions.ts";

export function CommentsView({ issueId }: { issueId: number }) {
  let { data: comments } = useSuspenseQuery(issueCommentsQuery(issueId));
  let queryClient = useQueryClient();

  let [error, post, posting] = useActionState(
    async (_previousError: string | null, form: HTMLFormElement) => {
      let formData = new FormData(form);

      try {
        await addComment(formData);
      } catch (failure) {
        return failure instanceof Error ? failure.message : "Could not post the comment.";
      }

      await queryClient.invalidateQueries({ queryKey: issueQueryKey });
      form.reset();
      return null;
    },
    null,
  );

  return (
    <section className="border-t border-line px-6 py-5">
      <h2 className="mb-3 font-medium">
        Comments <span className="text-muted tabular-nums">{comments.length}</span>
      </h2>

      <ul className="flex flex-col gap-3">
        {comments.map((comment) => (
          <li key={comment.id} className="rounded-md border border-line px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Avatar name={comment.username} />
              <span className="font-medium">{comment.username}</span>
              <span className="ml-auto text-muted">{formatLongDate(comment.created_at)}</span>
            </div>
            <p className="prose-body mt-2">{comment.body}</p>
          </li>
        ))}
      </ul>

      <form
        action={addComment}
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => post(event.currentTarget));
        }}
        className="mt-4 flex flex-col gap-2"
      >
        <input type="hidden" name="issueId" value={issueId} />
        <label htmlFor="new-comment" className="text-xs font-medium text-muted">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          name="body"
          rows={3}
          required
          placeholder="Leave a comment…"
          className="resize-y rounded-control border border-line px-2 py-1.5 outline-none placeholder:text-faint focus:border-brand"
        />
        {error === null ? null : (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={posting}
          className="self-end rounded-control bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {posting ? "Posting…" : "Post comment"}
        </button>
      </form>
    </section>
  );
}
