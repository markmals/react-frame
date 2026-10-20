import { type Renderer, renderWith } from "remix/middleware/render";
import type { Middleware, RequestContext } from "remix/router";

import { isRscRequest, RSC_CONTENT_TYPE } from "../protocol.ts";
import { isFrameRequest, RenderScopeProvider } from "./frame.tsx";
import { renderPayload, type ServerRuntime } from "./runtime.ts";
import { ActionState } from "./server-actions.ts";

export type RenderFunction = (root: React.ReactNode, init?: ResponseInit) => Promise<Response>;

/** Middleware that installs a {@link RenderFunction} as `context.render`. */
export type RenderMiddleware = Middleware<{
  key: typeof Renderer;
  value: RenderFunction;
  property: "render";
}>;

/**
 * Installs `context.render(root, init)`, which responds with an HTML document, or with an RSC
 * payload when the browser runtime or a `<Frame>` asks for one. Redirect responses to RSC
 * navigations become redirect payloads so the browser runtime can update the URL.
 */
export function createRender(runtime: ServerRuntime): RenderMiddleware {
  const install = renderWith((context) => createRenderFunction(context, runtime));

  const middleware: RenderMiddleware = (context, next) =>
    install(context, async () => {
      const response = await next();
      const location = response.headers.get("Location");
      if (
        location === null ||
        response.status < 300 ||
        response.status >= 400 ||
        !isRscRequest(context.request) ||
        isFrameRequest(context.request)
      ) {
        return response;
      }

      await response.body?.cancel();
      const body = renderPayload(runtime, context.request, { type: "redirect", location });
      return new Response(body, { headers: rscHeaders(response.headers) });
    });

  return middleware;
}

function createRenderFunction(
  context: RequestContext<any, any>,
  runtime: ServerRuntime,
): RenderFunction {
  return async (root, init) => {
    const action = context.get(ActionState);
    const body = renderPayload(
      runtime,
      context.request,
      {
        type: "render",
        root: (
          <RenderScopeProvider context={context} runtime={runtime}>
            {root}
          </RenderScopeProvider>
        ),
        formState: action?.formState,
        returnValue: action?.returnValue,
      },
      action?.temporaryReferences,
    );

    if (isRscRequest(context.request)) {
      return new Response(body, { status: init?.status, headers: rscHeaders(init?.headers) });
    }

    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.append("Vary", "Accept");
    return runtime.renderHtml(body, { ...init, headers }, action?.formState);
  };
}

function rscHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  headers.delete("Location");
  headers.delete("Content-Length");
  headers.set("Content-Type", `${RSC_CONTENT_TYPE}; charset=utf-8`);
  headers.append("Vary", "Accept");
  return headers;
}
