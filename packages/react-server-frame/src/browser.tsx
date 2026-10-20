import { startTransition, StrictMode, use, useLayoutEffect, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";

import { ACTION_ID_HEADER, RSC_CONTENT_TYPE, type Payload } from "./protocol.ts";

type CreateFromFetch = (response: Promise<Response>, options?: object) => Promise<Payload>;

type SetPayload = (payload: Promise<Payload>) => void;

const { promise: hydrated, resolve: setHydrated } = Promise.withResolvers<SetPayload>();
const commits = new WeakMap<Promise<Payload>, () => void>();

function Content({ initialPayload }: { initialPayload: Promise<Payload> }) {
  const [payload, setPayload] = useState(initialPayload);

  useLayoutEffect(() => setHydrated(setPayload), []);
  useLayoutEffect(() => commits.get(payload)?.(), [payload]);

  const { root } = use(payload) as Extract<Payload, { type: "render" }>;
  return root;
}

/** Shows a resolved payload, returning a promise that settles once React commits it. */
async function commit(payload: Promise<Payload>) {
  const setPayload = await hydrated;
  const committed = new Promise<void>((resolve) => commits.set(payload, resolve));
  startTransition(() => setPayload(payload));
  return committed;
}

function redirect(location: string, history: NavigationHistoryBehavior) {
  if (window.navigation) {
    window.navigation.navigate(location, { history });
  } else {
    window.location.assign(location);
  }
}

/** Calls server functions at the current URL and shows the page the server renders afterwards. */
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
    const payload = createFromFetch(response, { temporaryReferences });
    const resolved = await payload;

    if (resolved.type === "redirect") {
      redirect(resolved.location, "push");
    } else {
      // Not awaited: the action's own transition holds this update until the action resolves.
      void commit(payload);
    }
    return resolved.returnValue;
  };
}

/**
 * Hydrates the document, then handles same-origin links, form submissions, and history
 * traversals through the Navigation API by rendering the server's RSC payload for them.
 */
export function hydrate({
  createFromFetch,
  createFromReadableStream,
}: {
  createFromFetch: CreateFromFetch;
  createFromReadableStream: (stream: ReadableStream<Uint8Array>) => Promise<Payload>;
}) {
  const initialPayload = createFromReadableStream(rscStream);
  initialPayload.then(
    ({ formState }) =>
      hydrateRoot(
        document,
        <StrictMode>
          <Content initialPayload={initialPayload} />
        </StrictMode>,
        { formState },
      ),
    (reason) => console.error("Failed to hydrate root", reason),
  );

  async function navigate(url: string, init: RequestInit) {
    const payload = createFromFetch(fetch(url, { ...init, headers: { Accept: RSC_CONTENT_TYPE } }));
    const resolved = await payload;
    if (resolved.type === "redirect") {
      redirect(resolved.location, "replace");
      return;
    }
    await commit(payload);
  }

  window.navigation?.addEventListener("navigate", (event) => {
    if (
      !event.canIntercept ||
      event.hashChange ||
      event.downloadRequest !== null ||
      event.navigationType === "reload" ||
      new URL(event.destination.url).origin !== window.location.origin
    ) {
      return;
    }

    event.intercept({
      handler: () =>
        navigate(event.destination.url, {
          method: event.formData ? "POST" : "GET",
          body: event.formData,
          signal: event.signal,
        }),
    });
  });

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => navigate(window.location.href, {}));
  }
}
