import { Cookie, SetCookie } from "remix/headers";
import type { RequestContext } from "remix/router";

import { ACTION_ID_HEADER } from "../protocol.ts";
import type { ActionState } from "./server-actions.ts";

const REQUEST_HEADERS_TO_REMOVE = ["Content-Length", "Content-Type", ACTION_ID_HEADER];

// Identity, not a header, carries the action result so clients can't forge one.
const actionStates = new WeakMap<Request, ActionState>();

/** The server function result that a follow-up page render should include. */
export function getActionState(request: Request) {
  return actionStates.get(request);
}

/**
 * Renders the current page after a server function ran. The page is fetched through the router
 * as a new `GET` that carries the cookies the action set, so the page, and every frame it
 * resolves, reads the state the action saved instead of the state from before it ran.
 */
export async function renderAfterAction(
  context: RequestContext<any, any>,
  actionResponse: Response,
  action: ActionState,
) {
  await actionResponse.body?.cancel();
  const setCookies = actionResponse.headers.getSetCookie();

  const headers = new Headers(context.request.headers);
  for (const name of REQUEST_HEADERS_TO_REMOVE) headers.delete(name);
  // Outer compression middleware encodes the final response; the page must arrive decoded.
  headers.set("Accept-Encoding", "identity");

  const cookie = new Cookie(headers.get("Cookie") ?? "");
  for (const setCookie of setCookies) {
    const { name, value } = new SetCookie(setCookie);
    if (name) cookie.set(name, value ?? "");
  }
  headers.set("Cookie", cookie.toString());

  const request = new Request(context.url, { headers, signal: context.request.signal });
  actionStates.set(request, action);
  const page = await context.router.fetch(request);

  // Browsers apply Set-Cookie headers in order, so the page's cookies (a session that consumed
  // its flash, for example) must come after the action's to win.
  const response = new Response(page.body, page);
  response.headers.delete("Set-Cookie");
  for (const setCookie of setCookies) response.headers.append("Set-Cookie", setCookie);
  for (const setCookie of page.headers.getSetCookie()) {
    response.headers.append("Set-Cookie", setCookie);
  }
  return response;
}
