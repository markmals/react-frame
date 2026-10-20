# A new type of RSC routing based on `<Frame />`

New type of RSC routing inspired by iFrames and Remix 3. Routes are plain [Remix router](https://github.com/remix-run/remix/tree/main/packages/fetch-router) routes, pages are React Server Components, and any route can be embedded in another page as a frame.

## How it works

### Add the Vite plugins

```ts
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";
import { reactServerFrame } from "react-server-frame/vite/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactServerFrame({ entry: "/app/entry.server.ts" }), react(), rsc()],
});
```

The entry module default-exports `{ fetch }`, usually your router's `fetch`.

### Install the middleware

```ts
import { asyncContext } from "remix/middleware/async-context";
import { session } from "remix/middleware/session";
import { createRouter } from "remix/router";
import { render, serverActions } from "react-server-frame/vite/server";

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
import { Frame } from "react-server-frame";

<Suspense fallback={<p>Loading sidebar...</p>}>
  <Frame name="sidebar" src={routes.sidebar.href()} />
</Suspense>;
```

A frame is resolved by sending a subrequest through the router, so its route runs its own middleware (auth, sessions, and so on) exactly as if the browser had requested it. A `name` is optional; it lets other components and links find the frame.

### Reload frames

Frames are independently reloadable sections of the page. `reload()` fetches the frame's route again and resolves once the new content has loaded. Inside a transition, React shows it when the transition finishes, so pending state and new content appear together.

```tsx
"use client";

import { useFrame, useFrames } from "react-server-frame/client";

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

import { redirect } from "react-server-frame";

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
import { useFrame } from "react-server-frame/client";

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

The browser runtime requires the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API), which it uses to handle same-origin links, form submissions, redirects, and back/forward navigation without reloading the document. `hydrate()` throws in browsers without it.

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
