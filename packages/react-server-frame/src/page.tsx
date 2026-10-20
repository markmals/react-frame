import {
  startTransition,
  StrictMode,
  use,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  FrameContext,
  FrameScopeContext,
  ResolveFrameContext,
  useFrameScope,
} from "./frame-context.tsx";
import {
  type FrameRequestInit,
  followRedirect,
  type MountedFrame,
  namedFrames,
  type ResolveFrame,
} from "./frames.ts";

type Content = React.ReactNode | Promise<React.ReactNode>;

/** Shown content, wrapped so every commit has its own identity even when the content repeats. */
interface Shown {
  content: Content;
}

interface PageStatus {
  src: string;
  pending: boolean;
}

export interface Page {
  /** The element to render as the React root. */
  element: React.ReactElement;
  /** Loads the current URL into the page again, resolving once the new content has loaded. */
  reload(): Promise<void>;
  /** Stops handling navigations. */
  dispose(): void;
}

/**
 * Runs the page in the browser: it shows `content`, then resolves navigations to same-origin links,
 * form submissions, and history traversals through `resolveFrame`. A link or form with
 * `data-target` loads into that named frame instead, from `data-src` when given.
 */
export function createPage(resolveFrame: ResolveFrame, content: Content): Page {
  if (!("navigation" in window)) {
    throw new Error("react-server-frame requires a browser that supports the Navigation API");
  }

  let status: PageStatus = {
    src: window.location.pathname + window.location.search,
    pending: false,
  };
  const listeners = new Set<() => void>();
  const setStatus = (next: PageStatus) => {
    status = next;
    for (const listener of listeners) listener();
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const getStatus = () => status;

  const { promise: mounted, resolve: setMounted } = Promise.withResolvers<(shown: Shown) => void>();
  const commits = new WeakMap<Shown, () => void>();

  /** Shows content, returning a promise that settles once React commits it. */
  function show(content: Content) {
    const shown = { content };
    const { promise: committed, resolve } = Promise.withResolvers<void>();
    commits.set(shown, resolve);
    void mounted.then((setShown) => startTransition(() => setShown(shown)));
    return committed;
  }

  let current: AbortController | undefined;

  /**
   * Resolves `url` for the page, settling once it has loaded with a promise for when it's shown.
   * A newer load supersedes it, and a redirect navigates, replacing this entry.
   */
  async function load(url: URL, init: FrameRequestInit, signal?: AbortSignal) {
    current?.abort();
    const controller = new AbortController();
    current = controller;
    const settle = () => {
      if (current === controller) setStatus({ ...status, pending: false });
    };

    setStatus({ src: url.pathname + url.search, pending: true });
    try {
      const resolution = await resolveFrame(url, {
        ...init,
        signal: signal ? AbortSignal.any([signal, controller.signal]) : controller.signal,
      });
      if (current !== controller) return undefined;
      if (resolution instanceof Response) {
        followRedirect(resolution, url, "replace");
        settle();
        return undefined;
      }
      return { committed: show(resolution).finally(settle) };
    } catch (error) {
      if (current !== controller) return undefined;
      settle();
      throw error;
    }
  }

  // Like a frame's reload, the page's resolves once the new content has loaded: awaiting the
  // commit would never finish inside an async transition, which holds updates until it ends.
  const reload = async () => {
    await load(new URL(window.location.href), {});
  };

  function Root() {
    const [shown, setShown] = useState<Shown>(() => ({ content }));
    useLayoutEffect(() => setMounted(setShown), []);
    useLayoutEffect(() => commits.get(shown)?.(), [shown]);

    const { src, pending } = useSyncExternalStore(subscribe, getStatus, getStatus);
    const frame = useMemo(() => ({ src, pending, reload }), [src, pending]);
    const scope = useFrameScope(shown.content);

    return (
      <ResolveFrameContext value={resolveFrame}>
        <FrameContext value={frame}>
          <FrameScopeContext value={scope}>
            {shown.content instanceof Promise ? use(shown.content) : shown.content}
          </FrameScopeContext>
        </FrameContext>
      </ResolveFrameContext>
    );
  }

  const listening = new AbortController();
  window.navigation.addEventListener(
    "navigate",
    (event) => {
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
          : async () => {
              const loaded = await load(new URL(event.destination.url), init, event.signal);
              await loaded?.committed;
            },
      });
    },
    { signal: listening.signal },
  );

  return {
    element: (
      <StrictMode>
        <Root />
      </StrictMode>
    ),
    reload,
    dispose: () => listening.abort(),
  };
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
