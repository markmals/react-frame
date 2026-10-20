import type { RequestContext } from "remix/router";

import type { LoadJson } from "./options.ts";

/**
 * Loads a JSON route by dispatching it back through the router in-process, the way `<Frame>`
 * resolves a frame. A server component's prefetch therefore runs the real route — middleware
 * included — without opening a socket back to itself.
 */
export function createRouterLoader({ request, router, url }: RequestContext<any, any>): LoadJson {
  return async (path, signal) => {
    let subrequest = new Request(new URL(path, url), {
      headers: {
        Accept: "application/json",
        // The body is read here, so a compression middleware must not encode it.
        "Accept-Encoding": "identity",
      },
      signal: signal ?? request.signal,
    });

    let response = await router.fetch(subrequest);

    if (!response.ok) {
      throw new Error(`${path} responded with ${response.status}`);
    }

    return response.json();
  };
}
