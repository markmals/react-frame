# Marginalia

A small editorial blog built on `react-frame`: eight MDX posts, three authors, tag and author archives, an RSS feed, and a comment thread per post.

It is the content-site holotype. It clones the structure of [`apps/bookstore`](../bookstore) — server components rendered through `reactFrame()` + `@vitejs/plugin-rsc`, routes declared in `app/routes.ts` and mapped to controllers, mutations as React server functions, SQLite through Remix's data layer — and swaps the product catalogue for a content collection loaded by [`@withsprinkles/content-layer`](https://www.npmjs.com/package/@withsprinkles/content-layer).

## Running it

```sh
pnpm db:migrate && pnpm db:seed   # once, to create db/blog.sqlite with a few comments
pnpm dev                          # http://localhost:44400
pnpm test                         # server tests + browser tests
pnpm build && pnpm start          # production build, served by server.ts on 44400
```

`vp check --fix apps/blog` from the repo root lints and formats the app.

## How it is organized

```
app/
  content.config.ts        content-layer collections: posts (MDX) and authors (JSON)
  content/                 the content itself: posts/*.mdx, authors.json
  content.ts               typed queries over sprinkles:content, and the draft rules
  routes.ts                the route map, plus postListHref() for the list frame's URL
  router.tsx               middleware, controller wiring, and the 404 default handler
  actions/
    controller.tsx         home page and /feed.xml
    feed.ts                the RSS document
    home-page.tsx
    posts/                 /posts/:slug, its page, and the table of contents
    tags/                  /tags/:tag
    authors/               /authors/:authorId
    comments/              the comment server function, its schema, and the form
    fragments/             the three frame routes
  ui/                      document, layout, archive shell, post list and card, poll, 404
  data/schema.ts           the comments table
  db.ts, middleware/       database and session wiring, as in the bookstore
mdx/remark-headings.ts     gives headings ids and exports them for the table of contents
db/                        migrations and seed for the comments table
```

## Content

`app/content.config.ts` declares two collections. Posts are globbed from `app/content/posts/**/*.mdx` and their frontmatter is validated with `remix/data-schema`; authors come from a single JSON file. The build fails on a bad field rather than rendering a post dated 1970.

`app/content.ts` is the only module that imports `sprinkles:content`. It maps content-layer entries onto the app's own `PostSummary` / `Author` types, so pages never touch the loader's entry shape, and it owns the draft rules: **a draft is never listed and never syndicated, and it is readable at its own URL only in development**. `import.meta.env.DEV` is inlined per environment, so the production bundle has no draft branch at all. The archive sidebar grows a "Drafts in progress" panel in development; in production that component returns `null` and nothing in the markup hints the draft exists.

MDX bodies are served by content-layer as virtual modules and compiled by `@mdx-js/rollup` in the RSC environment, so a post is a server component. `progressive-enhancement-is-not-nostalgia.mdx` imports `#/ui/poll.tsx`, a `"use client"` component, straight into the prose; the `#/*` subpath import is declared in `package.json` because a virtual MDX module has no file path for relative imports to resolve against.

## Routes and frames

| Route                           | What it is                                                                  |
| ------------------------------- | --------------------------------------------------------------------------- |
| `/`                             | The archive: an intro, a tag index, a writer index, and the post list frame |
| `/posts/:slug`                  | The article, its table of contents, and two frames                          |
| `/tags/:tag`                    | The same archive shell with the list frame filtered                         |
| `/authors/:authorId`            | The same archive shell with the list frame filtered, plus the writer's bio  |
| `/feed.xml`                     | RSS 2.0, returned as a plain `Response` from the controller                 |
| `/fragments/post-list`          | **Frame.** The post list; `?tag=` and `?author=` narrow it                  |
| `/fragments/author-posts/:slug` | **Frame.** "More from this author" under an article                         |
| `/fragments/comments/:slug`     | **Frame.** The thread and the comment form                                  |

Anything unknown — a URL with no route, a slug, a tag, or an author id that does not exist — renders a real 404 page with a 404 status.

### Why these three frames

The boundaries follow how often each section changes, which is the only question that makes a frame worth having.

**The post list** changes on every tag or author click, while the header, the tag index, the writer index, and the about blurb do not. Tag links everywhere in the app carry `data-target="post-list"` and `data-src="/fragments/post-list?tag=…"`, so clicking one moves the address bar to `/tags/:tag` and replaces one column. The same route serves the author archive with `?author=`, so there is one list renderer rather than three. A direct load of `/tags/:tag` renders the same page with the frame's `src` already filtered, so the two paths cannot drift.

Because a `data-target` load replaces only the frame, **the list's heading and its active-filter chip live inside the frame**, not in the page around it. The tag index in the sidebar deliberately does not mark a current tag: it is outside the frame and could not stay honest.

**"More from this author"** is a route of its own because it is a different query from the article, and it can be cached while the comments can't. None of the frames sits inside a `<Suspense>`: each resolves in-process in milliseconds, and a boundary would let React stream it after the first flush inside a hidden element that only a script reveals. Readers without JavaScript would then see a loading message where the post list or the comment form should be.

**The comments** change whenever anyone types. Splitting them out means the article and the author section can be cached and only the thread is `Cache-Control: no-store`.

## Mutations and reloads

Posting a comment is the one mutation. `app/actions/comments/actions.ts` is a `"use server"` function used directly as `<form action={addComment}>`, so the form works before JavaScript loads: the browser posts it to the post's URL, `serverActions()` runs the function there, and `render()` renders the page again in a follow-up `GET`.

The slug is taken from the request URL rather than a form field, so a comment can only land on the page it was written from, and the server function needs no content-layer import.

With JavaScript, `onSubmit` prevents the default, runs the same function in a transition, and then calls `useFrame().reload()`. Only `/fragments/comments/:slug` is fetched; the article, the table of contents, and the author section are untouched. `useFormStatus()` inside the form stays pending for the whole transition, reload included, so the button reads "Posting…" until the new thread is on screen.

Validation runs once, on the server, in `app/actions/comments/schemas.ts`. A rejected submission is **stored in the session as a value** and read — and cleared — by the comments frame. It cannot be flash data: a session loaded with flash is dirty, and the page's session middleware saves (clearing the flash) before its frames resolve, so a frame never sees it. Using a value and clearing it in the frame that owns it gives one code path for both the no-JavaScript follow-up render and the JavaScript frame reload.

The table of contents (`app/actions/posts/table-of-contents.tsx`) is the other client component. It reads scroll position through `useSyncExternalStore` rather than an effect, so there is no second copy of the DOM's truth and no effect to clean up.

## Tests

- `app/**/*.test.ts` run the app on a dev server of their own through `test/helpers.ts` and exercise routing, 404s, tag and author filtering, feed validity and escaping, draft rules, the frame routes in isolation, and comment validation and persistence through a real no-JavaScript form post.
- `app/**/*.test.browser.tsx` run in Playwright Chromium: the poll, the table of contents' scroll highlighting, and the comment form's pending state and the fact that a submission reloads the comments frame and nothing else.
