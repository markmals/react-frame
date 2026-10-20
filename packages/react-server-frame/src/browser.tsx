import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";

import type { ResolveFrame } from "./frames.ts";
import { createPage } from "./page.tsx";
import { ACTION_ID_HEADER, RSC_CONTENT_TYPE, type Payload } from "./protocol.ts";

type CreateFromFetch = (response: Promise<Response>, options?: object) => Promise<Payload>;

/**
 * Creates the `resolveFrame` hook for apps with a server: it fetches the route as an RSC payload,
 * which the server's router renders, and decodes the React Flight stream.
 */
export function createFlightResolver(createFromFetch: CreateFromFetch): ResolveFrame {
  return async (url, request) => {
    const payload = await createFromFetch(
      fetch(url, { ...request, headers: { Accept: RSC_CONTENT_TYPE } }),
    );
    if (payload.type === "action") {
      throw new Error(`Expected ${url.href} to render, not run a server function`);
    }
    if (payload.type === "redirect") return Response.redirect(new URL(payload.location, url), 303);
    return payload.root;
  };
}

/**
 * Calls server functions at the current URL and returns their results. The page isn't
 * re-rendered; callers reload the frames that show what the function changed.
 */
export function createServerCallback({
  createFromFetch,
  createTemporaryReferenceSet,
  encodeReply,
}: {
  createFromFetch: CreateFromFetch;
  createTemporaryReferenceSet: () => unknown;
  encodeReply: (value: unknown[], options: { temporaryReferences: unknown }) => Promise<BodyInit>;
}) {
  return async (id: string, args: unknown[]) => {
    const temporaryReferences = createTemporaryReferenceSet();
    const response = fetch(window.location.href, {
      method: "POST",
      body: await encodeReply(args, { temporaryReferences }),
      headers: { Accept: RSC_CONTENT_TYPE, [ACTION_ID_HEADER]: id },
    });
    const payload = await createFromFetch(response, { temporaryReferences });
    if (payload.type === "render") {
      throw new Error("Expected a server function result, not a page");
    }

    // "auto" replaces the entry for a redirect to the current URL and pushes one otherwise.
    if (payload.type === "redirect") {
      window.navigation.navigate(payload.location, { history: "auto" });
    }
    return payload.returnValue;
  };
}

/**
 * Hydrates the server-rendered document, then loads navigations, page reloads, and frame reloads
 * through `resolveFrame`. Browsers without the Navigation API aren't supported.
 */
export function hydrate({
  createFromReadableStream,
  resolveFrame,
}: {
  createFromReadableStream: (stream: ReadableStream<Uint8Array>) => Promise<Payload>;
  resolveFrame: ResolveFrame;
}) {
  const initialPayload = createFromReadableStream(rscStream);
  // Flight responses are thenables whose `then()` doesn't return a new promise.
  const initialContent = Promise.resolve(initialPayload).then((payload) =>
    payload.type === "render" ? payload.root : null,
  );
  const page = createPage(resolveFrame, initialContent);

  initialPayload.then(
    (payload) =>
      hydrateRoot(document, page.element, {
        formState: payload.type === "render" ? payload.formState : undefined,
      }),
    (reason) => console.error("Failed to hydrate root", reason),
  );

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => page.reload());
  }
}
