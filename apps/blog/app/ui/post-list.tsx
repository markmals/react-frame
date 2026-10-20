import type { Author, PostSummary } from "../content.ts";
import { postListHref, routes } from "../routes.ts";
import { PostCard } from "./post-card.tsx";

export interface PostListProps {
  posts: PostSummary[];
  authors: Author[];
  heading: string;
  /** Shown as a removable chip when the list is narrowed to a tag or an author. */
  filterLabel?: string;
}

/**
 * The body of the `post-list` frame. The heading and the active filter live in here rather than in
 * the page around it, because a `data-target` load replaces only this frame.
 */
export function PostList({ posts, authors, heading, filterLabel }: PostListProps) {
  return (
    <section aria-labelledby="post-list-heading">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 id="post-list-heading" className="font-serif text-heading leading-tight font-bold">
          {heading}
        </h1>
        <p className="m-0 text-sm text-muted">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </div>

      {filterLabel === undefined ? null : (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <span className="rounded-chip bg-chip px-3 py-1">{filterLabel}</span>
          <a href={routes.home.href()} data-target="post-list" data-src={postListHref()}>
            Show everything
          </a>
        </p>
      )}

      {posts.length === 0 ? (
        <p className="mt-8 rounded-card border border-rule bg-surface p-6 text-muted shadow-raised">
          Nothing here yet.
        </p>
      ) : (
        <ul className="mt-6 flex list-none flex-col gap-5 p-0">
          {posts.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} author={authors.find((it) => it.id === post.authorId)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
