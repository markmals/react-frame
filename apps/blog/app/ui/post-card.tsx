import type { Author, PostSummary } from "../content.ts";
import { routes } from "../routes.ts";
import { formatDay } from "../utils/format.ts";
import { TagLink } from "./tag-link.tsx";

export interface PostCardProps {
  post: PostSummary;
  author?: Author;
}

export function PostCard({ post, author }: PostCardProps) {
  return (
    <article className="rounded-card border border-rule bg-surface p-6 shadow-raised">
      <h2 className="font-serif text-title leading-tight font-bold">
        <a href={routes.posts.show.href({ slug: post.slug })} className="text-ink no-underline">
          {post.title}
        </a>
      </h2>

      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
        <time dateTime={post.publishedOn.toISOString()}>{formatDay(post.publishedOn)}</time>
        {author === undefined ? null : (
          <>
            <span aria-hidden="true">·</span>
            <a href={routes.authors.show.href({ authorId: author.id })}>{author.name}</a>
          </>
        )}
      </p>

      <p className="mt-3 text-muted">{post.description}</p>

      <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
        {post.tags.map((tag) => (
          <li key={tag}>
            <TagLink tag={tag} />
          </li>
        ))}
      </ul>
    </article>
  );
}
