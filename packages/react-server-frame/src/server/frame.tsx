import { cache } from "react";
import type { RequestContext } from "remix/router";

import { ClientFrame } from "../client.tsx";
import { isRscResponse, RSC_CONTENT_TYPE } from "../protocol.ts";
import type { ServerRuntime } from "./runtime.ts";

const MAX_FRAME_REDIRECTS = 20;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const REQUEST_HEADERS_TO_REMOVE = [
  "Connection",
  "Content-Encoding",
  "Content-Language",
  "Content-Length",
  "Content-Location",
  "Content-Type",
  "Expect",
  "Host",
  "If-Match",
  "If-Modified-Since",
  "If-None-Match",
  "If-Range",
  "If-Unmodified-Since",
  "Keep-Alive",
  "Range",
  "TE",
  "Trailer",
  "Transfer-Encoding",
  "Upgrade",
];

// Identity, not a header, marks internal subrequests so browsers can't claim to be one.
const frameRequests = new WeakSet<Request>();

export function isFrameRequest(request: Request) {
  return frameRequests.has(request);
}

interface RenderScope {
  context?: RequestContext<any, any>;
  runtime?: ServerRuntime;
}

const renderScope = cache((): RenderScope => ({}));

/** Makes the current request available to `<Frame>` elements rendered beneath it. */
export function RenderScopeProvider({
  children,
  context,
  runtime,
}: {
  children: React.ReactNode;
  context: RequestContext<any, any>;
  runtime: ServerRuntime;
}) {
  const scope = renderScope();
  scope.context = context;
  scope.runtime = runtime;
  return children;
}

/**
 * Renders the route at `src` in place. The frame is resolved by dispatching a subrequest through
 * the current router, so the target route runs its own middleware, and it can be reloaded in the
 * browser with `useFrame().reload()`.
 */
export async function Frame({ src }: { src: string }) {
  const { context, runtime } = renderScope();
  if (!context || !runtime) {
    throw new Error("<Frame> must be rendered through context.render()");
  }

  const url = new URL(src, context.url);
  if (url.origin !== context.url.origin) {
    throw new Error(`<Frame src="${src}"> must be same-origin`);
  }

  const response = await fetchFrame(context, url);
  if (!response.body || !isRscResponse(response)) {
    throw new Error(`<Frame src="${src}"> did not render (${response.status})`);
  }

  const payload = await runtime.createFromReadableStream(response.body);
  if (payload.type !== "render") {
    throw new Error(`<Frame src="${src}"> responded with a redirect`);
  }

  return (
    <ClientFrame src={url.pathname + url.search} fetchFrame={runtime.fetchFrame}>
      {payload.root}
    </ClientFrame>
  );
}

async function fetchFrame(context: RequestContext<any, any>, initialUrl: URL) {
  const headers = new Headers(context.headers);
  for (const name of REQUEST_HEADERS_TO_REMOVE) headers.delete(name);
  headers.set("Accept", RSC_CONTENT_TYPE);
  // The payload is decoded here, so a compression middleware must not encode it.
  headers.set("Accept-Encoding", "identity");

  let url = initialUrl;
  for (let redirects = 0; redirects <= MAX_FRAME_REDIRECTS; redirects++) {
    const request = new Request(url, { headers, signal: context.request.signal });
    frameRequests.add(request);

    const response = await context.router.fetch(request);
    const location = response.headers.get("Location");
    if (location === null || !REDIRECT_STATUSES.has(response.status)) return response;

    await response.body?.cancel();
    url = new URL(location, url);
    if (url.origin !== context.url.origin) {
      throw new Error(`Frame redirected off-origin to ${url.href}`);
    }
  }

  throw new Error(`Too many redirects while resolving frame ${initialUrl.href}`);
}
