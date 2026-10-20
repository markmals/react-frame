import { use } from "react";

import { ClientFrame } from "./client.tsx";
import {
  FrameScopeContext,
  isOutsideRuntime,
  loadFrameContent,
  ResolveFrameContext,
} from "./frame-context.tsx";

/**
 * Renders the route at `src` in place, resolved in the browser through the runtime's
 * `resolveFrame` hook. It suspends until the route's content has loaded, and loads again whenever
 * the content around it does, like a server-rendered frame.
 */
export function FrameLoader({ name, src }: { name?: string; src: string }) {
  const resolveFrame = use(ResolveFrameContext);
  const scope = use(FrameScopeContext);
  if (isOutsideRuntime(resolveFrame) || !scope) {
    throw new Error(
      `<Frame src="${src}"> must render in the browser runtime; in an RSC app, render it from a server component`,
    );
  }

  const url = new URL(src, window.location.href);
  let content = scope.frames.get(url.href);
  if (!content) {
    content = loadFrameContent(resolveFrame, url, { signal: scope.controller.signal }, () => null);
    // Loads left behind by navigating away reject with the scope's abort; nothing shows them.
    content.catch(() => {});
    scope.frames.set(url.href, content);
  }

  return (
    <ClientFrame name={name} src={url.pathname + url.search}>
      {content}
    </ClientFrame>
  );
}
