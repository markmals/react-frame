import { get, route } from "remix/routes";

// Posting a comment is a server function sent to the post's own URL, so every route here is a GET.
// The `fragments` routes are the ones embedded as frames: they render a section of a page and are
// reloaded on their own.
export const routes = route({
  home: get("/"),
  feed: get("/feed.xml"),

  posts: {
    show: get("/posts/:slug"),
  },

  tags: {
    show: get("/tags/:tag"),
  },

  authors: {
    show: get("/authors/:authorId"),
  },

  fragments: route("fragments", {
    // Accepts `tag` and `author` search params; the archive pages embed it with one of them set.
    postList: get("/post-list"),
    authorPosts: get("/author-posts/:slug"),
    comments: get("/comments/:slug"),
  }),
});

export function postListHref(filter: { tag?: string; authorId?: string } = {}): string {
  let searchParams: Record<string, string> = {};
  if (filter.tag !== undefined) searchParams.tag = filter.tag;
  if (filter.authorId !== undefined) searchParams.author = filter.authorId;

  return routes.fragments.postList.href(undefined, { searchParams });
}
