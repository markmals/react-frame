import { createController } from "remix/router";

import { CommentsSection } from "../comments/comments-section.tsx";
import type { CommentDraft } from "../comments/schemas.ts";
import { findAuthor, listAuthors, listPosts } from "../../content.ts";
import { Comments } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { PostList } from "../../ui/post-list.tsx";
import { AuthorPosts } from "./author-posts.tsx";

// Frames are reloaded on their own after a comment is posted, and the post list is swapped by
// `data-target` links, so none of these responses may be cached.
const frameHeaders = { "Cache-Control": "no-store" };

export default createController(routes.fragments, {
  actions: {
    async postList({ render, url }) {
      let tag = url.searchParams.get("tag") ?? undefined;
      let authorId = url.searchParams.get("author") ?? undefined;
      let [posts, authors] = await Promise.all([listPosts({ tag, authorId }), listAuthors()]);
      let author = authorId === undefined ? undefined : authors.find((it) => it.id === authorId);

      let heading = "Latest posts";
      let filterLabel: string | undefined;

      if (tag !== undefined) {
        heading = `Posts tagged #${tag}`;
        filterLabel = `#${tag}`;
      } else if (author !== undefined) {
        heading = `Posts by ${author.name}`;
        filterLabel = author.name;
      }

      return render(
        <PostList posts={posts} authors={authors} heading={heading} filterLabel={filterLabel} />,
        {
          headers: frameHeaders,
          status: posts.length === 0 && filterLabel !== undefined ? 404 : 200,
        },
      );
    },

    async authorPosts({ params, render }) {
      let posts = await listPosts();
      let post = posts.find((it) => it.slug === params.slug);
      let author = post === undefined ? undefined : await findAuthor(post.authorId);

      if (post === undefined || author === undefined) {
        return render(<p className="text-muted">No author for this post.</p>, {
          headers: frameHeaders,
          status: 404,
        });
      }

      let others = posts.filter((it) => it.authorId === author.id && it.slug !== post.slug);

      return render(<AuthorPosts author={author} posts={others.slice(0, 4)} />, {
        headers: frameHeaders,
      });
    },

    async comments({ db, params, render, session }) {
      let comments = await db.findMany(Comments, {
        where: { post_slug: params.slug },
        orderBy: ["created_at", "asc"],
      });

      // This frame owns the rejected submission: it shows it once and clears it, so the error is
      // gone whether the page came back from a plain form post or this frame reloaded itself.
      let draft = session.get("commentDraft") as CommentDraft | undefined;
      if (draft !== undefined) session.unset("commentDraft");

      return render(
        <CommentsSection
          comments={comments}
          draft={draft?.slug === params.slug ? draft : undefined}
        />,
        { headers: frameHeaders },
      );
    },
  },
});
