import { dehydrate, type QueryClient } from "@tanstack/react-query";
import type { RenderFunction } from "react-frame";
import { Renderer } from "remix/middleware/render";
import { createContextKey, type Middleware } from "remix/router";

import { makeQueryClient } from "../query/client.ts";
import { HydrationBoundary } from "../query/provider.tsx";

export const QueryClientContext = createContextKey<QueryClient>();

/**
 * Gives each request its own server cache as `context.queryClient`, and re-installs the renderer
 * so every root this request renders is wrapped in one `<HydrationBoundary>`. Controllers
 * prefetch into `context.queryClient` and then call `render()` as usual; no page or frame
 * mentions hydration at all.
 *
 * It is one boundary per response rather than one per app because a `<Frame>` is a subrequest
 * with its own context and its own RSC payload, which the browser hydrates on its own.
 */
export function loadQueryClient(): Middleware<{
  key: typeof QueryClientContext;
  value: QueryClient;
  property: "queryClient";
}> {
  return (context, next) => {
    let queryClient = makeQueryClient();
    context.set(QueryClientContext, queryClient, { property: "queryClient" });

    let render = context.get(Renderer) as RenderFunction | undefined;
    if (render === undefined) {
      throw new Error("loadQueryClient() must come after render()");
    }

    context.set(Renderer, ((root, init) => {
      // dehydrate() runs here, not in the controller, so it sees everything the loader phase
      // prefetched. A request that prefetched nothing renders without the extra wrapper.
      let state = dehydrate(queryClient);
      if (state.queries.length === 0) return render(root, init);

      return render(<HydrationBoundary state={state}>{root}</HydrationBoundary>, init);
    }) satisfies RenderFunction);

    return next();
  };
}
