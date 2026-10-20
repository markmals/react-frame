import { createContext, useLayoutEffect, useRef } from "react";

import { type Frame, type FrameRequest, followRedirect, type ResolveFrame } from "./frames.ts";

const resolveOutsideRuntime: ResolveFrame = () => {
  throw new Error("Frames can only load in the browser runtime");
};

/** Supplies the `resolveFrame` hook to the frames beneath it. The browser runtime provides it. */
export const ResolveFrameContext = createContext<ResolveFrame>(resolveOutsideRuntime);
ResolveFrameContext.displayName = "ResolveFrameContext";

export function isOutsideRuntime(resolveFrame: ResolveFrame) {
  return resolveFrame === resolveOutsideRuntime;
}

/** The page's frame while it renders on the server, before a browser runtime provides one. */
export const detachedPage: Frame = {
  src: "",
  pending: false,
  reload: () => Promise.reject(new Error("The page can only reload in the browser runtime")),
};

export const FrameContext = createContext<Frame>(detachedPage);
FrameContext.displayName = "FrameContext";

/**
 * One load of a frame's content. `<Frame>`s rendered in it resolve once per URL and keep that
 * content until the surrounding frame loads again, so a re-render doesn't refetch them and a
 * suspended render finds the same request when React retries it.
 */
export interface FrameScope {
  controller: AbortController;
  frames: Map<string, Promise<React.ReactNode>>;
}

export const FrameScopeContext = createContext<FrameScope | undefined>(undefined);
FrameScopeContext.displayName = "FrameScopeContext";

const scopes = new WeakMap<object, FrameScope>();
// Text and empty content can't contain frames.
const leafScope: FrameScope = { controller: new AbortController(), frames: new Map() };

/**
 * Returns the scope for a frame's content, aborting the loads of the scope it replaces once the new
 * content commits.
 */
export function useFrameScope(content: unknown): FrameScope {
  let scope = leafScope;
  if (typeof content === "object" && content !== null) {
    scope = scopes.get(content) ?? { controller: new AbortController(), frames: new Map() };
    scopes.set(content, scope);
  }

  const committed = useRef<FrameScope>(undefined);
  useLayoutEffect(() => {
    if (committed.current !== scope && committed.current !== leafScope) {
      committed.current?.controller.abort();
    }
    committed.current = scope;
  }, [scope]);

  return scope;
}

/**
 * Resolves a frame's content. A redirect starts a navigation and settles with `onRedirect()`'s
 * content, so the frame keeps showing something until the page moves on.
 */
export function loadFrameContent(
  resolveFrame: ResolveFrame,
  url: URL,
  request: FrameRequest,
  onRedirect: () => React.ReactNode | Promise<React.ReactNode>,
): Promise<React.ReactNode> {
  return Promise.resolve()
    .then(() => resolveFrame(url, request))
    .then((resolution) => {
      if (!(resolution instanceof Response)) return resolution;
      followRedirect(resolution, url, "auto");
      return onRedirect();
    });
}
