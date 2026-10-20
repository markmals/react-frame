import {
  createFromFetch,
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from "@vitejs/plugin-rsc/browser";

import {
  createFlightResolver,
  createServerCallback,
  hydrate as hydrateDocument,
} from "../browser.tsx";
import type { ResolveFrame } from "../frames.ts";
import type { Payload } from "../protocol.ts";

/** The default `resolveFrame` hook: fetches the route's RSC payload from the server. */
export const resolveFrame: ResolveFrame = createFlightResolver((response, options) =>
  createFromFetch<Payload>(response, options),
);

/**
 * Hydrates the page with `@vitejs/plugin-rsc`. Pass `resolveFrame` to change how frames, page
 * reloads, and navigations load, for example to wrap the default {@link resolveFrame}.
 */
export function hydrate(options: { resolveFrame?: ResolveFrame } = {}) {
  setServerCallback(
    createServerCallback({
      createFromFetch: (response, options) => createFromFetch<Payload>(response, options),
      createTemporaryReferenceSet,
      encodeReply,
    }),
  );

  hydrateDocument({
    createFromReadableStream: (stream) => createFromReadableStream<Payload>(stream),
    resolveFrame: options.resolveFrame ?? resolveFrame,
  });
}
