# SPA Demo

A port of the [Remix 3 SPA demo](https://github.com/remix-run/remix/tree/main/demos/spa) to React with `react-frame`. The fetch router runs in the browser and keeps its normal `Request` to `Response` contract: the `render()` middleware from `react-frame/spa` gives routes `context.render(element)`, and `run(router, { container, fallback })` shows a fallback while the first route loads, then resolves every navigation through the router.

The app has the same layout as a server-rendered one: `app/routes.ts` defines its URL contract, `app/router.tsx` configures the router, and `app/actions/controller.tsx` handles the routes. Pages live beside the controller, shared UI lives in `app/ui/`, and `app/main.tsx` starts the browser runtime. The demo covers a direct deep link, client-side links, aborting delayed routes, POST form data, and push/replace history behavior.

One addition to Remix's demo: the greeting page embeds `/greetings` with `<Frame>` from `react-frame`. The frame's route goes through the same router, loads again whenever the page does, and its Clear button reloads only the frame, leaving the rest of the page (including a half-typed name) as it was.

## Run It

```sh
pnpm -C apps/spa dev
```

Then open [http://localhost:44300](http://localhost:44300).

## Test It

```sh
pnpm exec playwright install chromium
pnpm -C apps/spa test
```

The tests run the app in Chromium with Vitest Browser Mode: each one starts `run()` at a URL and drives the page. Unlike Remix's suite, they don't build and serve the app, so Vite's history fallback for deep links isn't covered. To try the production build, run `pnpm -C apps/spa build`, then `pnpm -C apps/spa preview`.
