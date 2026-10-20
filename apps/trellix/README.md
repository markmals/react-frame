# Trellix

A port of [Remix's Trellix demo](https://github.com/remix-run/example-trellix) to `react-frame`: a Trello-style board with accounts, boards, columns, cards, native HTML5 drag and drop, and optimistic updates everywhere.

It is the highly interactive holotype. Pages are React Server Components rendered on a server, as in `apps/bookstore`; every mutation is a React server function that works as a plain form before JavaScript loads, and with JavaScript runs in a transition that ends by reloading the narrowest frame that changed.

## Running it

```sh
pnpm --filter trellix exec remix db migrate   # create db/trellix.sqlite
pnpm --filter trellix exec remix db seed      # load the demo accounts and boards
vp dev --strictPort                           # from apps/trellix, http://localhost:44600
```

```sh
vp test run                                   # server tests + browser tests
./node_modules/.bin/tsc --noEmit -p .
vp build && node server.ts                    # production build on http://localhost:44600
```

Demo accounts, also printed by `node server.ts`:

| Email                  | Password     | Boards                          |
| ---------------------- | ------------ | ------------------------------- |
| `danielle@trellix.dev` | `trellix123` | Launch Checklist, Reading Queue |
| `marcus@trellix.dev`   | `trellix123` | Marcus Only                     |

`remix db reset --force` puts the database back to the seed.

## How it is organised

| Path                  | What it holds                                                                 |
| --------------------- | ----------------------------------------------------------------------------- |
| `app/routes.ts`       | The whole route map: pages and the frame routes they embed                    |
| `app/router.ts`       | Middleware chain and controller wiring                                        |
| `app/middleware/`     | Database, cookie session, and the auth scheme and password provider           |
| `app/data/schema.ts`  | The five tables, mirroring Trellix's Prisma schema                            |
| `app/actions/auth/`   | Login, signup, logout: server functions, validation, and both pages           |
| `app/actions/boards/` | The boards home: the new-board form, and the board list frame                 |
| `app/actions/board/`  | The board page, its three kinds of frame, and every board mutation            |
| `app/ui/`             | Document, layout, buttons, icons, and the Tailwind theme                      |
| `db/`                 | Migrations and the seed                                                       |
| `test/`               | A dev-server-backed router for server tests, and a DOM root for browser tests |

The board's own directory splits along the server/client line: `page.tsx`, `columns-section.tsx`, and `controller.tsx` are server components, `board-shell.tsx`, `column-strip.tsx`, `column.tsx`, `card.tsx`, `new-card.tsx`, `board-title.tsx`, and `editable-text.tsx` are client components, and `actions.ts` holds the server functions both sides call.

## Routes and frames

```
/                        marketing page (signed-in visitors go to /boards)
/login, /signup          credentials
/boards                  new-board form + <Frame name="board-list">
  /boards/list           the board list, on its own
/board/:boardId          the board page: <Frame name="board-title"> + <Frame name="board-columns">
  /board/:boardId/title            the editable board name
  /board/:boardId/columns          the horizontal strip, which embeds one frame per column
  /board/:boardId/columns/:columnId  one column: its name, its cards, its composer
```

Three levels of frame on the board page is a deliberate choice, and the thing this port exists to test. The granularity follows the mutations:

- Renaming the board touches the heading and nothing else, so the heading is a route of its own and `useFrame().reload()` from `board-title.tsx` reloads a few hundred bytes.
- Adding a column changes the set of columns, so the strip is a route: `column-strip.tsx` reloads `board-columns`, and the server hands back the strip with a frame for the new column already in it.
- Adding, deleting, renaming, or moving a card changes one or two columns, never the board, so each column is a route. `new-card.tsx` and `card.tsx` reload the column they sit in with `useFrame().reload()`, and a drop that crosses columns reloads the column it left as well, by name: `useFrames().get(columnFrameName(sourceColumnId))?.reload()`.

What that buys, measured on the running app: adding a card to a four-column board re-renders one column, not twelve cards and four composers, and every other column keeps its scroll position, its open composer, and the text already typed into it. The cost is that frames nest their subrequests, so the first load of a four-column board is six router requests (page, strip, four columns) instead of one, and reloading the strip re-runs all four column routes. For a board page that is the right trade — reloads vastly outnumber first loads — but it is a real cost, and it is why cards are not frames of their own.

Each frame route re-checks ownership: a frame is resolved by dispatching a subrequest through the router, so `requireAuth()` and the board lookup run for it exactly as they do for the page. `/board/1/columns/<id>` returns 404 to an account that doesn't own board 1.

There are no `data-target` links in this app. Every destination here is either a full page (a board, the board list) or a section that only its own component reloads; a link that moves the address bar while loading something else has no honest use in a Trello clone. The findings file says more.

## Mutations, optimism, and reloads

Every mutation is a server function in `app/actions/board/actions.ts` or `app/actions/boards/actions.ts`, used directly as `<form action={...}>`. Without JavaScript the browser posts the form to the page it is on, the function runs, and `render()` renders the page again — so creating and deleting boards, columns, and cards, and renaming boards and columns, all work with JavaScript turned off. Drag and drop does not, exactly as in the reference.

With JavaScript, `onSubmit` takes over: it builds the `FormData`, records an optimistic change, awaits the server function, and awaits the frame reloads, all inside one `startTransition`. Because the reload is part of the transition, React drops the optimistic entry and shows the server's version in the same commit, so nothing flickers.

Card changes are the interesting case, and they shaped the component tree. A move leaves one column and joins another, and those are two separate frames, so neither can own the optimistic state. `BoardShell` — the board page's client shell, above both frames — holds `useOptimistic<CardMutation[]>([])`, and each column merges the pending mutations into its own server cards with `applyCardMutations()`. A mutation carries the card's id, title, order, and destination column, so the column it is leaving drops it and the column it is joining renders it, both before the server has heard anything. It is the same idea as Trellix's `useFetchers()` scan, with the fetcher list replaced by an optimistic array the mutations push onto.

Ids come from the client, as in Trellix: `crypto.randomUUID()` names a card or column at submit time, so the optimistic item and the row the server writes are the same thing and a reload cannot duplicate it. When the form is posted without JavaScript there is no id in it, and the server generates one.

Rapid entry works the way Trellix's does: the card composer stays open, clears, and keeps focus, and each save starts its own transition with its own optimistic card. Orders come from `Math.max(nextOrder, lastIssued + 1)` so three cards typed faster than React can re-render still get 1, 2, 3 rather than three copies of the same order.

Drag and drop is the reference's: `dataTransfer` carries `{ id, title, columnId }` under a custom content type, a card decides from the cursor's position whether a drop lands above or below it, and the new order is the midpoint between its neighbours — drop between 1.0 and 2.0 and the card is stored at 1.5. Columns accept drops only when empty, where there is no card to aim at.

Inline renaming (`editable-text.tsx`) is a `<details>` whose summary is the text and whose contents are the form. It looks like Trellix's click-to-edit — the text swaps for an input in place — but the input is in the document the server sent, so a rename survives JavaScript not having loaded, and the open/close behaviour, select-on-open, Escape, and save-on-blur are enhancements on top. The two composers use the same pattern.

## Data

SQLite through Remix's data layer, with `remix.json`, `db/migrations/`, `db/seed.sql`, and `app/data/schema.ts`, as in the bookstore. The schema mirrors Trellix's Prisma one: `accounts`, `passwords`, `boards`, `columns`, `items`. Two differences, both deliberate:

- Trellix's `Password` stores `salt` and `hash` separately; this stores one `hash` string, because the bookstore's PBKDF2 helper encodes its salt and iteration count into the hash it returns.
- Trellix's fractional `order` columns are `sort_order` here, because the query builder writes column names unquoted and `order` is a SQL keyword.

## Tests

`vp test run` runs both projects.

- `app/actions/auth/controller.test.ts` — login, signup, logout, validation errors, protected-route redirects, and `returnTo` handling, including a `returnTo` pointing off-site.
- `app/actions/boards/controller.test.ts` — the board list shows only your boards; create and delete; one account cannot delete another's board; the list frame renders on its own.
- `app/actions/board/controller.test.ts` — each frame route renders its own section; renames, column creation, card creation, cross-column moves, reordering, and deletion all persist; another account gets 404s and its mutations are refused.
- `app/actions/board/types.test.ts` — the optimistic merge: ordering, cards arriving, cards leaving, deletions, and overlapping mutations for one card.
- `app/actions/board/column.test.browser.tsx` — in a real Chromium: a new card shows before the server answers and survives the frame reload; three rapid saves stay distinct and leave no duplicates; a deleted card disappears at once; a drop between two cards lands at the midpoint order; and a drop into another column moves the card across two frames and reloads both.

The server tests submit forms the way a browser without JavaScript does — `test/helpers.ts` finds the form React rendered, hidden `$ACTION_*` fields included, and posts it back — so they cover the no-JavaScript path at the same time.
