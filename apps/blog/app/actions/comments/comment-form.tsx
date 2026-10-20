"use client";

import { startTransition } from "react";
import { useFormStatus } from "react-dom";
import { useFrame } from "react-frame/client";

import { addComment } from "./actions.ts";
import type { CommentErrors } from "./schemas.ts";

export interface CommentFormProps {
  /** The rejected submission, so the fields keep what was typed and the errors show inline. */
  name?: string;
  body?: string;
  errors?: CommentErrors;
}

export function CommentForm({ name, body, errors }: CommentFormProps) {
  let frame = useFrame();

  return (
    <form
      // Without JavaScript the browser posts this server function to the post's URL and the page
      // is rendered again. With it, the submission reloads this frame and nothing else.
      action={addComment}
      onSubmit={(event) => {
        event.preventDefault();
        let formData = new FormData(event.currentTarget);
        startTransition(async () => {
          await addComment(formData);
          await frame.reload();
        });
      }}
      className="mt-8 rounded-card border border-rule bg-surface p-6 shadow-raised"
    >
      <h3 className="font-serif text-lede font-bold">Leave a comment</h3>

      <div className="mt-4 flex flex-col gap-1">
        <label htmlFor="comment-name" className="text-sm font-bold">
          Name
        </label>
        <input
          type="text"
          id="comment-name"
          name="name"
          defaultValue={name}
          aria-describedby={errors?.name === undefined ? undefined : "comment-name-error"}
          aria-invalid={errors?.name === undefined ? undefined : true}
          className="rounded-sm border border-rule bg-page px-3 py-2"
        />
        {errors?.name === undefined ? null : (
          <p id="comment-name-error" className="m-0 text-sm text-danger">
            {errors.name}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <label htmlFor="comment-body" className="text-sm font-bold">
          Comment
        </label>
        <textarea
          id="comment-body"
          name="body"
          rows={4}
          defaultValue={body}
          aria-describedby={errors?.body === undefined ? undefined : "comment-body-error"}
          aria-invalid={errors?.body === undefined ? undefined : true}
          className="rounded-sm border border-rule bg-page px-3 py-2"
        />
        {errors?.body === undefined ? null : (
          <p id="comment-body-error" className="m-0 text-sm text-danger">
            {errors.body}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  // Stays pending for the whole transition, so it reads "Posting…" until the reloaded frame shows.
  let { pending } = useFormStatus();

  return (
    <p className="mt-5 mb-0 flex items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent px-4 py-2 font-bold text-page disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post comment"}
      </button>
      {pending ? <span className="text-sm text-pending">Saving your comment…</span> : null}
    </p>
  );
}
