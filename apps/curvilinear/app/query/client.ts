import {
  defaultShouldDehydrateQuery,
  environmentManager,
  QueryClient,
} from "@tanstack/react-query";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Above zero so data hydrated from the server prefetch counts as fresh and the browser
      // doesn't refetch it the moment the page hydrates.
      queries: { staleTime: 30_000 },
      dehydrate: {
        // Pending queries dehydrate too, so a query still in flight when the response is
        // rendered streams its result into the same promise the browser is already using.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * The browser's one cache, shared by every frame. On the server this is only the throwaway
 * client the provider needs while it server-renders; the request's real cache is the one
 * `loadQueryClient()` puts on the request context.
 */
export function getQueryClient(): QueryClient {
  if (environmentManager.isServer()) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
