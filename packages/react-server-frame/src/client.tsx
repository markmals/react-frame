"use client";

import {
  createContext,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  type Frame,
  type FrameRequest,
  type FrameRequestInit,
  namedFrames,
  topFrame,
} from "./frames.ts";
import { RSC_CONTENT_TYPE, type Payload } from "./protocol.ts";

export type { Frame } from "./frames.ts";

/** Fetches a route as an RSC payload for a frame. Supplied by the bundler integration. */
export type FetchFrame = (url: URL, request: FrameRequest) => Promise<React.ReactNode>;

type Content = React.ReactNode | Promise<React.ReactNode>;

const FrameContext = createContext<Frame>(topFrame);
FrameContext.displayName = "FrameContext";

/**
 * Returns the frame that contains the calling component. Outside any `<Frame>`, that's the page
 * itself, whose `reload()` renders the current URL again.
 */
export function useFrame(): Frame {
  return use(FrameContext);
}

const frames = {
  /** Returns the mounted frame with this `name`, or `undefined` when none is mounted. */
  get(name: string): Frame | undefined {
    return namedFrames.get(name);
  },
};

/** Looks up frames elsewhere on the page by the `name` given to `<Frame>`. */
export function useFrames() {
  return frames;
}

export function ClientFrame({
  children,
  fetchFrame,
  name,
  src,
}: {
  children?: React.ReactNode;
  fetchFrame: FetchFrame;
  name?: string;
  src: string;
}) {
  const [content, setContent] = useState<Content>(children);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [pending, startTransition] = useTransition();

  // A server render of the surrounding page replaces content loaded in the browser.
  const [lastChildren, setLastChildren] = useState(children);
  if (lastChildren !== children) {
    setLastChildren(children);
    setContent(children);
    setCurrentSrc(src);
  }

  const controllerRef = useRef<AbortController>(undefined);
  const latestLoadRef = useRef<Promise<void>>(undefined);

  // Resolves once the new content has loaded rather than once it's shown: inside an async
  // transition React holds the update until the transition ends, so awaiting the commit there
  // would never finish. React then shows the content together with the rest of the transition.
  const load = useCallback(
    (url: URL, init: FrameRequestInit = {}) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const next = fetchFrame(url, { ...init, signal: controller.signal });
      const loaded = next.then(
        () => undefined,
        (error: unknown) => {
          // A newer load aborted this one; settle along with it instead.
          if (controller.signal.aborted) return latestLoadRef.current;
          throw error;
        },
      );
      latestLoadRef.current = loaded;

      startTransition(() => {
        if (!init.method || init.method === "GET") setCurrentSrc(url.pathname + url.search);
        setContent(next);
      });
      return loaded;
    },
    [fetchFrame],
  );

  const reload = useCallback(
    () => load(new URL(currentSrc, window.location.href)),
    [load, currentSrc],
  );

  const frame = useMemo(() => ({ pending, reload }), [pending, reload]);

  useLayoutEffect(() => {
    if (name === undefined) return;
    const mounted = { ...frame, load };
    namedFrames.set(name, mounted);
    return () => {
      if (namedFrames.get(name) === mounted) namedFrames.delete(name);
    };
  }, [name, frame, load]);

  return (
    <FrameContext value={frame}>{content instanceof Promise ? use(content) : content}</FrameContext>
  );
}

export async function fetchFramePayload(
  url: URL,
  { body, method, signal }: FrameRequest,
  createFromFetch: (response: Promise<Response>) => Promise<Payload>,
): Promise<React.ReactNode> {
  const payload = await createFromFetch(
    fetch(url, { method, body, headers: { Accept: RSC_CONTENT_TYPE }, signal }),
  );
  if (payload.type === "render") return payload.root;
  if (payload.type === "action") {
    throw new Error(`Expected ${url.href} to render a frame`);
  }

  await window.navigation.navigate(payload.location).finished;
  return null;
}
