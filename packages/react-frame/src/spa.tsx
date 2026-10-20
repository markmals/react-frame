import { createRoot } from "react-dom/client";
import { renderWith } from "remix/middleware/render";

import type { ResolveFrame } from "./frames.ts";
import { createPage } from "./page.tsx";
import type { RenderMiddleware } from "./server/render.tsx";

/** The part of a router `run()` uses: a fetch that dispatches requests to its routes. */
export interface Router {
  fetch(request: Request): Promise<Response>;
}

const renderedContent = new WeakMap<Response, React.ReactNode>();

/**
 * Installs `context.render(root, init)` for routes that run in the browser. It responds with a
 * bodyless `Response` carrying `root`, keeping the status and headers, which the route resolver
 * shows in the frame that asked for it.
 */
export function render(): RenderMiddleware {
  return renderWith(() => async (root, init) => {
    const response = new Response(null, init);
    renderedContent.set(response, root);
    return response;
  });
}

/**
 * Creates the `resolveFrame` hook for single-page apps: it dispatches the frame's request through
 * `router` in the browser and shows what the route rendered with `context.render()`. Redirects pass
 * through for the runtime to follow.
 */
export function createRouteResolver(router: Router): ResolveFrame {
  return async (url, request) => {
    const response = await router.fetch(new Request(url, request));
    if (response.status >= 300 && response.status < 400 && response.headers.has("Location")) {
      return response;
    }
    if (!renderedContent.has(response)) {
      throw new Error(
        `${url.pathname}${url.search} responded without context.render() (${response.status})`,
      );
    }
    return renderedContent.get(response);
  };
}

export interface RunOptions {
  /** The element to render the app into. */
  container: Element;
  /** Shown while the first route loads. */
  fallback?: React.ReactNode;
  /** Resolves frames and navigations; defaults to {@link createRouteResolver} for `router`. */
  resolveFrame?: ResolveFrame;
}

/**
 * Starts a single-page app: renders the route for the current URL into `container`, then resolves
 * navigations, frames, and their reloads through `router` in the browser. Returns `dispose()`, which
 * unmounts the app and stops handling navigations.
 */
export function run(
  router: Router,
  { container, fallback = null, resolveFrame = createRouteResolver(router) }: RunOptions,
) {
  const page = createPage(resolveFrame, fallback);
  const root = createRoot(container);
  root.render(page.element);
  page.reload().catch((error: unknown) => console.error("Failed to load the first route", error));

  return {
    dispose() {
      page.dispose();
      root.unmount();
    },
  };
}
