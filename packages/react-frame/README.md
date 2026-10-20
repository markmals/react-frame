# react-frame

A new type of React routing based on `<Frame />`, inspired by iFrames and Remix 3. Routes are plain [Remix router](https://github.com/remix-run/remix/tree/main/packages/fetch-router) routes, pages are React components, and any route can be embedded in another page as a frame.

Pages render as React Server Components on a server, or entirely in the browser as a [single-page app](#single-page-apps). Either way the routes, controllers, and frames are the same, so an app can start client-only and move to a server, or back, without changing frameworks.

## How it works

### Add the Vite plugins

```ts
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { reactFrame } from "react-frame/vite/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactFrame({ entry: "/app/entry.server.ts" }), react(), rsc()],
});
```

The entry module default-exports `{ fetch }`, usually your router's `fetch`.

### Install the middleware

```ts
import { asyncContext } from "remix/middleware/async-context";
import { session } from "remix/middleware/session";
import { createRouter } from "remix/router";
import { render, serverActions } from "react-frame/vite/server";

const router = createRouter({
  middleware: [render(), asyncContext(), session(cookie, storage), serverActions()],
});
```

`render()` adds `context.render(element, init)`, built on `renderWith` from `remix/middleware/render`. It responds with an HTML document, or with an RSC payload when the browser runtime or a frame asks for one. `serverActions()` runs server functions posted to the current URL. Put it after any middleware your server functions use, such as sessions or auth.

A form submitted before JavaScript loads gets a document back: after its server function runs (and doesn't redirect), `render()` renders the current page in a follow-up `GET` that carries the cookies the function set, so the page and its frames see what the function saved. Install `render()` before `session()` so the session has been persisted by then.

### Render pages from controllers

```tsx
router.map(routes, {
  actions: {
    home({ render }) {
      return render(<Home />);
    },
    sidebar({ render }) {
      return render(<Sidebar />, { headers: { "Cache-Control": "no-store" } });
    },
  },
});
```

### Nest frames

```tsx
import { Frame } from "react-frame";

<Suspense fallback={<p>Loading sidebar...</p>}>
  <Frame name="sidebar" src={routes.sidebar.href()} />
</Suspense>;
```

A frame is resolved by sending a subrequest through the router, so its route runs its own middleware (auth, sessions, and so on) exactly as if the browser had requested it. A `name` is optional; it lets other components and links find the frame.

### Reload frames

Frames are independently reloadable sections of the page. `reload()` fetches the frame's route again and resolves once the new content has loaded. Inside a transition, React shows it when the transition finishes, so pending state and new content appear together.

A frame's state stands in for reload events: `pending` turns `true` when a load starts and `false` once its content shows, `src` is the pathname and search of the URL the frame shows or is loading, and `formData` holds the submitted data while the frame loads a form submission. Components render from them instead of listening for events.

Outside any `<Frame>`, `useFrame()` returns the page itself: its `src`, `pending`, and `formData` follow navigations, and its `reload()` renders the current URL again. A form that posts to its own page can tell its submission from any other load:

```tsx
const page = useFrame();
const submitting = page.formData !== undefined && new URL(page.src, url).pathname === url.pathname;
```

```tsx
"use client";

import { useFrame, useFrames } from "react-frame/client";

export function ReloadButtons() {
  // The frame that contains this component.
  const { pending, reload } = useFrame();
  // A named frame elsewhere on the page, if it's mounted.
  const sidebar = useFrames().get("sidebar");

  return (
    <>
      <button onClick={reload}>Reload{pending ? "ing..." : ""}</button>
      <button onClick={() => sidebar?.reload()}>Reload sidebar</button>
    </>
  );
}
```

### Mutate with server functions

```tsx
"use server";

import { redirect } from "react-frame";

export async function addToCart(formData: FormData) {
  // ...update the session or database...
}

export async function checkout(formData: FormData) {
  // ...place the order...
  redirect(routes.orders.href());
}
```

Use them as `<form action={addToCart}>`. Forms work before JavaScript loads: they post to the current URL, the server runs the function there, and the page renders again (or the browser follows the `redirect()`).

With JavaScript, a server function call responds with its result only; the page isn't rendered again. Call `redirect()` to navigate, or reload the frames that show what changed:

```tsx
"use client";

import { startTransition } from "react";
import { useFrame } from "react-frame/client";

import { addToCart } from "./actions.ts";

export function AddToCart({ bookId }: { bookId: string }) {
  const frame = useFrame();

  return (
    <form
      action={addToCart}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          await addToCart(formData);
          await frame.reload();
        });
      }}
    >
      <input type="hidden" name="bookId" value={bookId} />
      <button type="submit">Add to cart</button>
    </form>
  );
}
```

`useFormStatus()` inside the form stays pending until the transition, reload included, finishes.

### Navigation

The browser runtime requires the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API), which it uses to handle same-origin links, form submissions, redirects, and back/forward navigation without reloading the document. `hydrate()` throws in browsers without it. A form submitted to the URL it's on replaces that history entry instead of adding a second one, so going back leaves the page.

A link or form with `data-target` loads into the mounted frame with that name instead of the whole page, while the address bar still moves to its destination. `data-src` sets the URL the frame loads, when it differs from the destination:

```tsx
<a
  href={routes.albums.show.href({ albumId })}
  data-target="details"
  data-src={routes.albums.details.href({ albumId })}
>
  Show details
</a>
```

If no frame with that name is mounted, or `data-src` isn't a same-origin URL, the browser navigates the document normally.

### Resolve frames

In the browser, every load goes through one hook, `resolveFrame(url, request)`: a frame's reload, a `data-target` load, and the page's own navigations and reloads. It returns the React content to show, or a redirect `Response` whose `Location` the browser navigates to instead. `request` carries the `method`, the submitted form `body`, and an abort `signal`. On the server, `<Frame>` keeps resolving through the router as described above.

The default hook fetches the route's RSC payload, which the server's router renders. To change it, give the plugin a browser entry of your own and pass your hook to `hydrate()`. The default is exported, so yours can wrap it:

```tsx
// app/entry.browser.tsx
import { hydrate, resolveFrame } from "react-frame/vite/browser";

hydrate({
  resolveFrame(url, request) {
    if (!navigator.onLine) return <OfflineNotice />;
    return resolveFrame(url, request);
  },
});
```

```ts
reactFrame({ entry: "/app/entry.server.ts", browserEntry: "/app/entry.browser.tsx" });
```

Tests can render a client component inside a frame and stand in for the hook with `ResolveFrameContext`:

```tsx
import { ClientFrame, ResolveFrameContext } from "react-frame/client";

render(
  <ResolveFrameContext value={() => <CartButton inCart />}>
    <ClientFrame src="/fragments/cart-button/1">
      <CartButton inCart={false} />
    </ClientFrame>
  </ResolveFrameContext>,
);
```

## Single-page apps

The same routes, controllers, and frames run entirely in the browser with `react-frame/spa`, without React Server Components or a server. Its `render()` middleware gives routes `context.render(element, init)`, which responds with a bodyless `Response` that carries the element:

```tsx
import { render, run } from "react-frame/spa";
import { createRouter } from "remix/router";

const router = createRouter({
  middleware: [render()],
  defaultHandler({ render }) {
    return render(<NotFound />, { status: 404 });
  },
});

router.map(routes, controller);

run(router, { container: document.getElementById("root")!, fallback: <p>Loading…</p> });
```

`run()` renders the route for the current URL into `container`, showing `fallback` until it has loaded. From then on, every navigation, frame, and reload is a request dispatched through `router` in the browser, so routes run their middleware, read submitted forms with `request.formData()`, and can return `redirect()` responses. Its default `resolveFrame` is `createRouteResolver(router)`; pass `resolveFrame` to `run()` to wrap or replace it. `dispose()` on the value `run()` returns unmounts the app.

Outside React Server Components, `import { Frame } from "react-frame"` gets a frame that resolves in the browser, so a page renders unchanged in either kind of app. It suspends until its route has loaded, like a server-rendered frame, and loads again whenever the content around it does. `useFrame()`, `useFrames()`, `data-target`, and `data-src` behave as they do on a server.

There are no server functions, so a mutation is either a `<form method="POST">` that the router handles as a navigation, or a form action that calls an ordinary function and reloads the frames that show what changed. Write those functions like server functions, async and taking `FormData` when they need input, and the same form works if the app moves to a server:

```tsx
<form
  action={async () => {
    await clearGreetings();
    await frame.reload();
  }}
>
  <ClearButton />
</form>
```

[`apps/spa`](https://github.com/markmals/react-frame/tree/main/apps/spa) is a port of Remix's SPA demo.
