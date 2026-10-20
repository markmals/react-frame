import { Frame } from "react-frame";

import type { Author, Post } from "../../content.ts";
import { routes } from "../../routes.ts";
import { Layout } from "../../ui/layout.tsx";
import { TagLink } from "../../ui/tag-link.tsx";
import { formatDay } from "../../utils/format.ts";
import { TableOfContents } from "./table-of-contents.tsx";

export interface ShowPageProps {
  post: Post;
  author?: Author;
}

export function ShowPage({ post, author }: ShowPageProps) {
  let { Content } = post;

  return (
    <Layout title={post.title} description={post.description}>
      <div className="grid gap-12 lg:grid-cols-article">
        <article className="min-w-0">
          <header>
            <h1 className="font-serif text-display leading-tight font-bold">{post.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-muted">
              <time dateTime={post.publishedOn.toISOString()}>{formatDay(post.publishedOn)}</time>
              {author === undefined ? null : (
                <>
                  <span aria-hidden="true">·</span>
                  <a href={routes.authors.show.href({ authorId: author.id })}>{author.name}</a>
                  <span className="text-sm">({author.role})</span>
                </>
              )}
              {post.draft ? (
                <span className="rounded-chip bg-danger-surface px-2 py-0.5 text-micro font-bold tracking-wide text-danger uppercase">
                  Draft
                </span>
              ) : null}
            </p>
            <p className="mt-4 text-lede text-muted">{post.description}</p>
            <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <TagLink tag={tag} />
                </li>
              ))}
            </ul>
          </header>

          <div className="post-body mt-10">
            <Content />
          </div>
        </article>

        <TableOfContents headings={post.headings} />
      </div>

      {/* No <Suspense> around these frames: both resolve in-process in milliseconds, and a
          boundary would let React stream them after the first flush, hidden until a script
          reveals them, so readers without JavaScript would never see the comment form. */}
      <div className="mt-16 border-t border-rule pt-10">
        <Frame name="author-posts" src={routes.fragments.authorPosts.href({ slug: post.slug })} />
      </div>

      <div className="mt-12">
        <Frame name="comments" src={routes.fragments.comments.href({ slug: post.slug })} />
      </div>
    </Layout>
  );
}
