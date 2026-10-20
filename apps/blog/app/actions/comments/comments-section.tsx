import type { Comment } from "../../data/schema.ts";
import { formatMinute } from "../../utils/format.ts";
import { CommentForm } from "./comment-form.tsx";
import type { CommentDraft } from "./schemas.ts";

export interface CommentsSectionProps {
  comments: Comment[];
  draft?: CommentDraft;
}

/** The whole body of the `comments` frame: the thread and the form that adds to it. */
export function CommentsSection({ comments, draft }: CommentsSectionProps) {
  return (
    <section aria-labelledby="comments-heading" className="mx-auto max-w-measure">
      <h2 id="comments-heading" className="font-serif text-title font-bold">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {comments.length === 0 ? (
        <p className="mt-4 text-muted">Nobody has said anything yet.</p>
      ) : (
        <ul className="mt-5 flex list-none flex-col gap-5 p-0">
          {comments.map((comment) => (
            <li key={comment.id} className="border-l-2 border-rule pl-4">
              <p className="m-0 flex flex-wrap items-baseline gap-2">
                <strong>{comment.author_name}</strong>
                <time
                  dateTime={new Date(comment.created_at).toISOString()}
                  className="text-sm text-muted"
                >
                  {formatMinute(new Date(comment.created_at))}
                </time>
              </p>
              <p className="mt-1 mb-0">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <CommentForm name={draft?.name} body={draft?.body} errors={draft?.errors} />
    </section>
  );
}
