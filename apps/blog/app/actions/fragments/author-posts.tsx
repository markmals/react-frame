import type { Author, PostSummary } from "../../content.ts";
import { routes } from "../../routes.ts";
import { formatDay } from "../../utils/format.ts";

export interface AuthorPostsProps {
  author: Author;
  posts: PostSummary[];
}

/** The body of the `author-posts` frame, shown under an article. */
export function AuthorPosts({ author, posts }: AuthorPostsProps) {
  return (
    <section
      aria-labelledby="author-posts-heading"
      className="mx-auto max-w-measure rounded-card border border-rule bg-surface p-6 shadow-raised"
    >
      <h2 id="author-posts-heading" className="font-serif text-title font-bold">
        More from {author.name}
      </h2>
      <p className="mt-2 text-sm text-muted">{author.bio}</p>

      {posts.length === 0 ? (
        <p className="mt-4 text-muted">This is the only thing {author.name} has published here.</p>
      ) : (
        <ul className="mt-4 flex list-none flex-col gap-3 p-0">
          {posts.map((post) => (
            <li key={post.slug}>
              <a href={routes.posts.show.href({ slug: post.slug })}>{post.title}</a>
              <span className="text-sm text-muted"> — {formatDay(post.publishedOn)}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 mb-0 text-sm">
        <a href={routes.authors.show.href({ authorId: author.id })}>
          Everything by {author.name} →
        </a>
      </p>
    </section>
  );
}
