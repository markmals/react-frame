# Bookstore

A port of the [Remix 3 bookstore demo](https://github.com/remix-run/remix/tree/main/demos/bookstore) to React Server Components with `react-frame`. You can browse books, manage a cart, check out, update your account, and run the store from an admin area. Routes, controllers, middleware, data, and sessions follow the demo; pages render with React, mutations are React server functions, and every form still works before JavaScript loads.

## Run It

```sh
cd apps/bookstore
pnpm install
pnpm db:reset
pnpm dev
```

Visit [http://localhost:44100](http://localhost:44100) and sign in with one of the demo accounts:

- Admin: `admin@bookstore.com` / `admin123`
- Customer: `customer@example.com` / `password123`

For a production build, run `pnpm build` and then `pnpm start`.

## Explore the Code

- Start with [`app/routes.ts`](app/routes.ts) and [`app/router.ts`](app/router.ts) for the typed route contract and the middleware stack. `render()` installs `context.render()`, and `serverActions()` runs server functions posted to the current URL.
- Follow the storefront through [`app/actions/books`](app/actions/books), [`app/actions/cart`](app/actions/cart), and [`app/actions/checkout`](app/actions/checkout). Pages are async server components that load their own data, so sibling sections such as the genre list and the book grid query in parallel.
- The cart button and cart table are frames ([`app/actions/fragments`](app/actions/fragments)): `<Frame src>` renders their routes on the server. Like the demo's client entries, the client components in those folders run their mutation and then reload their own frame with `useFrame().reload()`, so only that part of the page updates. Their forms still post the server function when JavaScript hasn't loaded.
- Look in [`app/actions/auth`](app/actions/auth), [`app/actions/account`](app/actions/account), and [`app/actions/admin`](app/actions/admin) for nested controllers, sessions, authorization, CRUD, and cover uploads. Each `actions.ts` holds the server functions for its area; they check authorization themselves because route middleware doesn't run before them.
- [`app/ui`](app/ui) contains the shared document, layout, and stylesheet. Styling is Tailwind; shared values live in the `@theme` block of [`app/ui/app.css`](app/ui/app.css), next to the demo's component classes.
- [`app/data/schema.ts`](app/data/schema.ts), [`db/migrations`](db/migrations), and [`remix.json`](remix.json) show the typed SQLite schema and the `remix db` workflow.

## Differences From the Demo

- Mutations are server functions instead of `POST`, `PUT`, and `DELETE` routes, so there's no `_method` override or `RestfulForm`. When the demo's action rendered a page instead of redirecting (registering a taken email, requesting or completing a password reset, sending a contact message), the server function flashes the outcome to the session and redirects back to the same page, whose `GET` controller renders it.
- Vite serves static files and compiled assets, so the demo's `assets` route and colocated `public` directories are gone.
- Navigation uses the Navigation API: links and `GET` forms fetch RSC payloads instead of reloading the document.

## Database Commands

`pnpm db:reset` creates `db/bookstore.sqlite`, applies the migrations, and loads the sample catalog and accounts. You can manage it with:

```sh
pnpm db:status
pnpm db:migrate
pnpm db:rollback
pnpm db:seed
pnpm db:reset
```

`db:rollback` reverts the latest migration, while `db:reset` recreates the database from scratch. The other commands let you inspect or update it without discarding your local changes.

## Tests

```sh
pnpm exec playwright install chromium
pnpm test
```

`pnpm test` runs two Vitest projects. The `server` project (`app/**/*.test.ts`) ports the demo's controller tests: each test file runs the app on its own Vite dev server, against an in-memory database, and submits forms the way a browser without JavaScript does (see [`test/helpers.ts`](test/helpers.ts)). The `browser` project (`app/**/*.test.browser.tsx`) uses Vitest Browser Mode with Playwright's Chromium to test client components such as the cart's pending states and the image carousel. Run one with `pnpm test --project server` or `--project browser`.
