"use client";

import { HydrationBoundary, QueryClientProvider } from "@tanstack/react-query";

import { getQueryClient } from "./client.ts";

// Server components reach HydrationBoundary through here, not through @tanstack/react-query:
// importing a node_modules client component from the server graph loads a second copy of the
// package, whose QueryClientContext is a different context than this provider's.
export { HydrationBoundary };

/**
 * The cache lives above every frame, in the document shell, so a frame that reloads keeps the
 * data the browser already has instead of starting over.
 */
export function QueryProvider({ children }: { children?: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
