import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";
import type { Middleware, RequestContext, Router } from "remix/router";
import type { Route } from "remix/routes";

import {
  mapFrames as _mapFrames,
  ProvideFrames as _ProvideFrames,
  render as _render,
  useServerMiddleware as _useServerMiddleware,
} from "../frames.tsx";

import { fetchFrame } from "./fetch-frame.ts";

interface Routes extends Record<string, Route | Routes> {}

export function mapFrames<Context extends RequestContext<any, any>, Frames extends Routes>(
  router: Router<Context>,
  frames: Frames,
  options: Parameters<typeof _mapFrames<Context, Frames>>[2],
) {
  return _mapFrames(router, frames, options, {
    createTemporaryReferenceSet,
    fetchFrame,
    prerender: async (...args) => {
      const ssr = await import.meta.viteRsc.import<typeof import("./entry.ssr.tsx")>(
        "./entry.ssr.tsx",
        {
          environment: "ssr",
        },
      );
      return ssr.prerender(...args);
    },
    renderToReadableStream,
  });
}

export function useServerMiddleware(): Middleware {
  return _useServerMiddleware({
    createTemporaryReferenceSet,
    decodeAction,
    decodeFormState,
    decodeReply,
    loadServerAction,
  });
}

export async function render(request: Request, root: React.ReactNode) {
  const ssr = await import.meta.viteRsc.import<typeof import("./entry.ssr.tsx")>(
    "./entry.ssr.tsx",
    {
      environment: "ssr",
    },
  );

  return _render({
    createTemporaryReferenceSet,
    prerender: ssr.prerender,
    renderToReadableStream,
    request,
    root,
  });
}

export function ProvideFrames(
  props: Omit<React.ComponentProps<typeof _ProvideFrames>, "fetchFrame">,
) {
  return <_ProvideFrames {...props} fetchFrame={fetchFrame} />;
}
