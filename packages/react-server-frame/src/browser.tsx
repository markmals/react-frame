import { startTransition, StrictMode, use, useLayoutEffect, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { rscStream } from "rsc-html-stream/client";

import { type MountedFrame, namedFrames } from "./frames.ts";
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
  const { promise: committed, resolve } = Promise.withResolvers<void>();
  commits.set(payload, resolve);
  startTransition(() => setPayload(payload));
  return committed;
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
 * Hydrates the document, then handles same-origin links, form submissions, and history
 * traversals through the Navigation API by rendering the server's RSC payload for them. A link or
 * form with `data-target` loads into that named frame instead, from `data-src` when given.
 * Browsers without the Navigation API aren't supported.
 */
export function hydrate({
  createFromFetch,
  createFromReadableStream,
}: {
  createFromFetch: CreateFromFetch;
  createFromReadableStream: (stream: ReadableStream<Uint8Array>) => Promise<Payload>;
}) {
  if (!("navigation" in window)) {
    throw new Error("react-server-frame requires a browser that supports the Navigation API");
  }

  const initialPayload = createFromReadableStream(rscStream);
  initialPayload.then(
    (payload) =>
      hydrateRoot(
        document,
        <StrictMode>
          <Content initialPayload={initialPayload} />
        </StrictMode>,
        { formState: payload.type === "render" ? payload.formState : undefined },
      ),
    (reason) => console.error("Failed to hydrate root", reason),
  );

  async function navigate(url: string, init: RequestInit) {
    const payload = createFromFetch(fetch(url, { ...init, headers: { Accept: RSC_CONTENT_TYPE } }));
    const resolved = await payload;
    if (resolved.type === "redirect") {
      window.navigation.navigate(resolved.location, { history: "replace" });
      return;
    }
    await commit(payload);
  }

  window.navigation.addEventListener("navigate", (event) => {
    if (
      !event.canIntercept ||
      event.hashChange ||
      event.downloadRequest !== null ||
      event.navigationType === "reload" ||
      new URL(event.destination.url).origin !== window.location.origin
    ) {
      return;
    }

    const target = readFrameTarget(event);
    if (target === null) return;

    const init = { method: event.formData ? "POST" : "GET", body: event.formData };
    event.intercept({
      handler: target
        ? () => target.frame.load(target.url, init)
        : () => navigate(event.destination.url, { ...init, signal: event.signal }),
    });
  });

  if (import.meta.hot) {
    import.meta.hot.on("rsc:update", () => navigate(window.location.href, {}));
  }
}

/**
 * Reads `data-target` and `data-src` from the link, submit button, or form that started a
 * navigation. Returns `undefined` when there's no target, so the page navigates as usual, and
 * `null` when the browser should navigate the document itself: the target frame isn't mounted, or
 * `data-src` isn't a same-origin URL.
 */
function readFrameTarget(
  event: NavigateEvent,
): { frame: MountedFrame; url: URL } | null | undefined {
  const source = event.sourceElement;
  const form =
    source instanceof HTMLFormElement
      ? source
      : source instanceof HTMLButtonElement || source instanceof HTMLInputElement
        ? source.form
        : null;
  const read = (attribute: string) =>
    source?.getAttribute(attribute) ?? form?.getAttribute(attribute) ?? null;

  const src = read("data-src");
  const url = URL.parse(src ?? event.destination.url, window.location.href);
  if (!url || url.origin !== window.location.origin) return null;

  const name = read("data-target");
  if (name === null) return undefined;

  const frame = namedFrames.get(name);
  return frame ? { frame, url } : null;
}
