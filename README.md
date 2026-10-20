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
import { createRouter } from "remix/router";
import { render, serverActions } from "react-server-frame/vite/server";

const router = createRouter({
  middleware: [asyncContext(), render(), serverActions()],
});
```

`render()` adds `context.render(element, init)`, built on `renderWith` from `remix/middleware/render`. It responds with an HTML document, or with an RSC payload when the browser runtime or a frame asks for one. `serverActions()` runs server functions posted to the current URL, then lets the request continue as a `GET` so the page's own route renders the result. Put it after any middleware your server functions use, such as sessions or auth.

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
  <Frame src={routes.sidebar.href()} />
</Suspense>;
```

A frame is resolved by sending a subrequest through the router, so its route runs its own middleware (auth, sessions, and so on) exactly as if the browser had requested it.

### Reload frames

```tsx
"use client";

import { useFrame } from "react-server-frame/client";

export function ReloadFrame() {
  const { pending, reload } = useFrame();

  return <button onClick={reload}>Reload{pending ? "ing..." : ""}</button>;
}
```

### Mutate with server functions

```tsx
"use server";

import { redirect } from "react-server-frame";

export async function addToCart(formData: FormData) {
  // ...update the session or database...
  redirect(routes.cart.href());
}
```

Use them as `<form action={addToCart}>`. Forms work before JavaScript loads: they post to the current URL and the server runs the function there. Without a `redirect()`, the current page renders again with the result, including `useActionState` state.

### Navigation

The browser runtime uses the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) to handle same-origin links, form submissions, redirects, and back/forward navigation without reloading the document. Browsers without it fall back to normal document navigations.
