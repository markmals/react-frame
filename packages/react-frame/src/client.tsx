"use client";

import { use, useCallback, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  detachedPage,
  FrameContext,
  FrameScopeContext,
  loadFrameContent,
  ResolveFrameContext,
  useFrameScope,
} from "./frame-context.tsx";
import { type Frame, type FrameRequestInit, namedFrames } from "./frames.ts";

export { ResolveFrameContext } from "./frame-context.tsx";
export type {
  Frame,
  FrameRequest,
  FrameRequestInit,
  FrameResolution,
  ResolveFrame,
} from "./frames.ts";

type Content = React.ReactNode | Promise<React.ReactNode>;

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

/**
 * Gives the page's frame its URL while the page renders on the server. In the browser the runtime
 * provides the page's frame, and inside a `<Frame>` the frame's own applies, so it passes through.
 */
export function PageFrame({ children, src }: { children?: React.ReactNode; src: string }) {
  const frame = use(FrameContext);
  const page = useMemo(() => ({ ...detachedPage, src }), [src]);
  return frame === detachedPage ? <FrameContext value={page}>{children}</FrameContext> : children;
}

/**
 * Shows a frame's content and loads new content into it through the `resolveFrame` hook. `<Frame>`
 * renders it; it's exported for tests that render frame content with their own resolver.
 */
export function ClientFrame({
  children,
  name,
  src,
}: {
  /** The content to show first, or a promise of it, which suspends the frame until it settles. */
  children?: Content;
  name?: string;
  src: string;
}) {
  const resolveFrame = use(ResolveFrameContext);
  const [content, setContent] = useState<Content>(children);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [pending, startTransition] = useTransition();

  // The surrounding content loading again (the page on the server, or a parent frame) replaces
  // content loaded into this frame since.
  const [lastChildren, setLastChildren] = useState(children);
  if (lastChildren !== children) {
    setLastChildren(children);
    setContent(children);
    setCurrentSrc(src);
  }

  const shown = useRef<Content>(content);
  useLayoutEffect(() => {
    shown.current = content;
  }, [content]);

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

      const next = loadFrameContent(
        resolveFrame,
        url,
        { ...init, signal: controller.signal },
        () => shown.current,
      );
      const loaded = next.then(
        () => undefined,
        (error: unknown) => {
          // A newer load aborted this one; settle along with it instead.
          if (controller.signal.aborted) return latestLoadRef.current;
          throw error;
        },
      );
      latestLoadRef.current = loaded;

      if (!init.method || init.method === "GET") setCurrentSrc(url.pathname + url.search);
      startTransition(() => setContent(next));
      return loaded;
    },
    [resolveFrame],
  );

  const reload = useCallback(
    () => load(new URL(currentSrc, window.location.href)),
    [load, currentSrc],
  );

  const frame = useMemo(
    () => ({ src: currentSrc, pending, reload }),
    [currentSrc, pending, reload],
  );

  useLayoutEffect(() => {
    if (name === undefined) return;
    const mounted = { ...frame, load };
    namedFrames.set(name, mounted);
    return () => {
      if (namedFrames.get(name) === mounted) namedFrames.delete(name);
    };
  }, [name, frame, load]);

  const scope = useFrameScope(content);

  return (
    <FrameContext value={frame}>
      <FrameScopeContext value={scope}>
        {content instanceof Promise ? use(content) : content}
      </FrameScopeContext>
    </FrameContext>
  );
}
