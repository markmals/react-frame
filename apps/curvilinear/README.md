# Curvilinear

A Linear clone built on `react-frame`, cloned from [convex/curvilinear](https://github.com/convex/curvilinear) (the app in its `curvilinear/` directory). It is the data-heavy productivity holotype: a few hundred issues, URL-driven filters and ordering, inline property menus, and a client-side query cache.

The reference app is a Convex local-first SPA. This port keeps its user-facing features and drops its sync engine: SQLite through Remix's data layer replaces Convex, TanStack Query replaces the IndexedDB local store, and the app has a single implicit user (`Ada Okonkwo`) instead of Clerk auth, with seeded names as the authors of seeded issues and comments.

## What it does

- A left menu of saved views — All issues, Active, Backlog, Done, Canceled — each with a live count, plus a New issue action.
- An issue list with status and priority filters, a title search, and ordering (priority, status, created, updated; ascending or descending), all held in the URL's search params exactly as the reference's `useFilterState` does: comma-joined `status` and `priority`, `query`, `orderBy`, `orderDirection`.
- Inline status and priority menus on every row, which apply optimistically and roll back if the server rejects them.
- A create-issue dialog with title, description, status, and priority.
- An issue detail page: edit the title and description, change status and priority inline, read and post comments, delete with a confirmation dialog.
- The reference has no board or kanban view (its `src/pages` holds only `List` and `Issue`, and its `react-beautiful-dnd` dependency is unused), so this port has none either.

## Layout

```
app/
  routes.ts                  route map: documents, frame routes, JSON routes
  router.ts                  middleware stack and controller wiring
  entry.server.ts            the router, for the Vite plugin and server.ts
  db.ts                      SQLite database, migrations, seed
  data/
    schema.ts                issues and comments tables, with derived sort ranks
    issue-fields.ts          status and priority vocabulary, labels, ranks
    filters.ts               URL filter state: parse and serialize
    issue-queries.ts         the reads behind the JSON routes and the menu counts
    payloads.ts              the shapes the JSON routes return
    workspace.ts             workspace name and the implicit current user
  middleware/
    database.ts              the database on the request context
    query-client.tsx         the request's QueryClient and the one HydrationBoundary
  query/
    client.ts                the request's server cache, and the browser's shared one
    options.ts               queryOptions() factories shared by server and client
    prefetch.ts              in-process JSON loader for server prefetching
    provider.tsx             QueryClientProvider, and the HydrationBoundary re-export
  actions/
    controller.tsx           the document routes: /, /issues, /issue/:issueId
    shell.tsx                document, provider, menu frame, main frame
    api/controller.tsx       the JSON routes TanStack Query fetches
    frames/                  the three frame routes: menu, list, issue
    issues/                  the client components, server functions, and links
  ui/                        document, Tailwind theme, icons, avatar, dropdowns
  utils/                     date formatting, issue id parsing
db/                          migrations and the 200-issue seed
test/                        server-test harness and the browser render helper
```

## Routes and frames

There are two document routes, `/issues` and `/issue/:issueId`, and both render the same shell: a left menu frame and a main frame.

```
/issues?status=backlog        → Shell(mainSrc = /frames/list?status=backlog)
/issue/42?confirm=delete      → Shell(mainSrc = /frames/issue/42?confirm=delete)
```

The shell passes the page's raw search string to the main frame, so the frame route sees the filters and the `new` / `confirm` / `error` flags without the shell having to understand them.

Three frame routes render into those slots:

- `/frames/menu` — the left menu. Server-owned: it reads the per-view counts straight from the database.
- `/frames/list` — the list view.
- `/frames/issue/:issueId` — the detail view.

Every link that changes what the main area shows carries `data-target="main"` and a `data-src` pointing at the frame route: the saved views in the left menu, the filter and ordering menus, the filter chips' clear buttons, each issue row, and the dialogs' open and close links. The address bar moves to the document URL while only the frame loads, so the left menu is fetched once per document load and survives every filter change and issue navigation.

Frame routes are internal. They render inside the shell's React tree, where the `QueryClientProvider` lives, so requesting `/frames/list` directly as a document is not a supported entry point.

## Data ownership

The rule, applied everywhere:

> **A frame owns what is derived across issues; TanStack Query owns the issue records the UI mutates.**

| Data                                   | Owner                     | How it refreshes                                     |
| -------------------------------------- | ------------------------- | ---------------------------------------------------- |
| Saved-view counts in the left menu     | the `menu` frame (server) | `useFrames().get("menu")?.reload()` after a mutation |
| Which view the main area shows         | the `main` frame (server) | a `data-target` link load                            |
| The issue list for the current filters | `issueListQuery(filters)` | `invalidateQueries({ queryKey: ["issues"] })`        |
| One issue                              | `issueQuery(id)`          | the same invalidation                                |
| One issue's comments                   | `issueCommentsQuery(id)`  | the same invalidation                                |

## Hydration: one boundary per response, installed by middleware

No page or frame mentions hydration. `app/middleware/query-client.tsx` gives each request its own server `QueryClient` as `context.queryClient`, then re-installs the renderer (`context.set(Renderer, …)`) so that every `render(root, init)` becomes:

```tsx
render(<HydrationBoundary state={dehydrate(context.queryClient)}>{root}</HydrationBoundary>, init);
```

A request that prefetched nothing renders unwrapped. Controllers are the only prefetch site, because the renderer dehydrates the cache at `render()` time: a query started later, by a server component, would be too late to be captured.

It is one boundary per _response_ rather than one for the whole app because a `<Frame>` is a subrequest with its own `RequestContext` and its own middleware run, and in the browser each frame load parses its own RSC payload. The browser cache, on the other hand, really is single: every frame mounts inside the one React root under the shell's `QueryProvider`.

Server components never render query results. The list's "20 of 200" counter is a client component reading the same query, not a server-rendered number that a client refetch could leave stale.

The prefetch does not open a socket back to the app: `createRouterLoader()` dispatches the JSON route through `context.router`, the same way `<Frame>` resolves a frame.

## Mutations and reloads

Mutations are React server functions in `app/actions/issues/actions.ts`, used as `<form action={...}>` so every one of them works before JavaScript loads: the browser posts to the page, `serverActions()` runs the function, and `render()` renders the page again (or follows the `redirect()`).

With JavaScript, each form's `onSubmit` prevents the default and runs the same server function inside one transition:

```
startTransition(() => dispatch(formData))
  → useOptimistic shows the new value
  → await the server function
  → await queryClient.invalidateQueries({ queryKey: ["issues"] })
  → await frames.get("menu")?.reload()
```

Because the invalidation is awaited inside the transition, the optimistic value stays on screen until the refetched data carries the same value — the row never flickers back to the old one. If the server function throws, the `useActionState` reducer returns the message and React drops the optimistic value when the transition ends.

`useActionState`'s dispatch is **not** a transition on its own when it is called outside a form's `action` prop; without the explicit `startTransition` neither `useOptimistic` nor `isPending` renders. React says so at runtime, and `app/actions/issues/property-menu.test.browser.tsx` locks the behaviour in.

## Working without JavaScript

Every page's content is in the first HTML response, and every mutation works with scripting disabled. The create-issue dialog and the delete confirmation are URLs (`?new=1`, `?confirm=delete`) rather than component state, and each property menu is a `<details>` holding a form with one submit button per value. Saving a title, posting a comment, and deleting an issue are ordinary form posts. Navigation is ordinary links and a GET form for search.

The frame pages render their client views without a `<Suspense>` boundary. The controller has already awaited the prefetch, so the views never suspend for data, but during server rendering they can still suspend while their client module loads. A boundary there would let React flush the page with the fallback and stream the content afterwards, inside a hidden element that only a script reveals.

What needs JavaScript:

- Optimistic status and priority changes, and pending states on buttons. Without scripting the page simply renders again with the saved value.
- Granular frame loading: without scripting a filter or issue link is a full page load. The result is identical, it just costs the menu frame as well.
- Dismissing a dropdown by clicking away or pressing Escape (`app/ui/dropdown.ts`), and keeping the search form's `data-src` in step with what has been typed.

## Running it

```sh
pnpm db:reset      # migrate and seed 200 issues and ~400 comments
pnpm dev           # http://localhost:44500
pnpm test          # server tests and browser tests
pnpm build         # tsc + vp build
pnpm start         # node server.ts, serving the build on 44500
```

`db/curvilinear.sqlite` is gitignored; `pnpm db:reset` recreates it from `db/migrations` and `db/seed.sql`. The seed uses a fixed clock (1 March 2026) and a deterministic shuffle, so tests can assert on exact rows.

## Tests

- `app/actions/api/controller.test.ts` — the JSON routes: filtering by status and priority, title search, ordering, the unfiltered total, and 404s.
- `app/actions/issues/controller.test.ts` — server rendering of the shell and its frames, and every mutation driven the way a browser without JavaScript drives it, asserting the database afterwards.
- `app/actions/issues/property-menu.test.browser.tsx` — optimistic status and priority changes, and the rollback plus error message when the server function rejects.
- `app/actions/issues/issue-list-view.test.browser.tsx` — hydration of server-prefetched data with no client fetch, the filter links' `data-target`/`data-src`, and the old list staying on screen while the frame loads the filtered one.
