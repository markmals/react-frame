import type { ReactFormState } from "react-dom/client";
import { getContext } from "remix/middleware/async-context";
import type { Middleware, RequestContext } from "remix/router";

import { ACTION_ID_HEADER, isRscRequest, RSC_CONTENT_TYPE } from "../protocol.ts";
import { renderPayload, type ServerRuntime } from "./runtime.ts";

/** The result of a server function call, which `render()` passes to the follow-up page render. */
export class ActionState {
  constructor(
    readonly formState?: ReactFormState,
    readonly returnValue?: Promise<unknown>,
    readonly temporaryReferences?: unknown,
  ) {}
}

class RedirectState {
  constructor(readonly location: string) {}
}

/**
 * Redirects after the current server function finishes instead of re-rendering the page.
 * Requires the `asyncContext()` middleware.
 */
export function redirect(location: string) {
  getContext().set(RedirectState, new RedirectState(location));
}

/**
 * Runs server functions sent to the current URL, both from the browser runtime and from forms
 * submitted before JavaScript loads. Unless the function called `redirect()`, `render()` then
 * renders the current page in a follow-up `GET` so it reflects state saved by the action.
 */
export function createServerActions(runtime: ServerRuntime): Middleware {
  return async (context, next) => {
    if (context.method !== "POST") return next();

    const state = context.headers.has(ACTION_ID_HEADER)
      ? await callServerFunction(context, runtime)
      : await submitFormAction(context, runtime);
    if (!state) return next();

    const location = context.get(RedirectState)?.location;
    if (location !== undefined) {
      if (!isRscRequest(context.request)) {
        return new Response(null, { status: 303, headers: { Location: location } });
      }
      const body = renderPayload(
        runtime,
        context.request,
        { type: "redirect", location, returnValue: state.returnValue },
        state.temporaryReferences,
      );
      return new Response(body, { headers: { "Content-Type": RSC_CONTENT_TYPE } });
    }

    // Respond without rendering so outer middleware (sessions in particular) persist the action's
    // changes; render() sees ActionState on the way out and renders the page with them.
    context.set(ActionState, state);
    return new Response(null, { status: 204 });
  };
}

async function callServerFunction(context: RequestContext<any, any>, runtime: ServerRuntime) {
  const id = context.headers.get(ACTION_ID_HEADER)!;
  const body = context.headers.get("Content-Type")?.startsWith("multipart/form-data")
    ? await context.request.formData()
    : await context.request.text();
  const temporaryReferences = runtime.createTemporaryReferenceSet();

  let returnValue: Promise<unknown>;
  try {
    const args = await runtime.decodeReply(body, { temporaryReferences });
    const action = await runtime.loadServerAction(id);
    returnValue = Promise.resolve(action.apply(null, args));
    await returnValue;
  } catch (error) {
    returnValue = Promise.reject(error);
  }

  return new ActionState(undefined, returnValue, temporaryReferences);
}

async function submitFormAction(context: RequestContext<any, any>, runtime: ServerRuntime) {
  const contentType = context.headers.get("Content-Type") ?? "";
  if (
    !contentType.startsWith("multipart/form-data") &&
    !contentType.startsWith("application/x-www-form-urlencoded")
  ) {
    return undefined;
  }

  // Read a clone so ordinary form posts reach their route with an unread body.
  const formData = await context.request.clone().formData();
  const action = await runtime.decodeAction(formData);
  if (!action) return undefined;

  const result = await action();
  return new ActionState(await runtime.decodeFormState(result, formData));
}
