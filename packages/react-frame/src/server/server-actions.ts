import type { ReactFormState } from "react-dom/client";
import { getContext } from "remix/middleware/async-context";
import type { Middleware, RequestContext } from "remix/router";

import { ACTION_ID_HEADER, RSC_CONTENT_TYPE, type Payload } from "../protocol.ts";
import { renderPayload, type ServerRuntime } from "./runtime.ts";

/** A submitted form's server function result, which `render()` passes to the page it renders. */
export class ActionState {
  constructor(readonly formState?: ReactFormState) {}
}

class RedirectState {
  constructor(readonly location: string) {}
}

/**
 * Navigates to `location` once the current server function finishes. Requires the
 * `asyncContext()` middleware.
 */
export function redirect(location: string) {
  getContext().set(RedirectState, new RedirectState(location));
}

/**
 * Runs server functions sent to the current URL. Calls from the browser runtime respond with the
 * function's result and leave updating the page to the caller, which can reload frames. Forms
 * submitted before JavaScript loads get a document instead: `render()` renders the current page
 * in a follow-up `GET`, unless the function called `redirect()`.
 */
export function createServerActions(runtime: ServerRuntime): Middleware {
  return async (context, next) => {
    if (context.method !== "POST") return next();
    if (context.headers.has(ACTION_ID_HEADER)) return callServerFunction(context, runtime);

    const state = await submitFormAction(context, runtime);
    if (!state) return next();

    const location = context.get(RedirectState)?.location;
    if (location !== undefined) {
      return new Response(null, { status: 303, headers: { Location: location } });
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

  const location = context.get(RedirectState)?.location;
  const payload: Payload =
    location === undefined
      ? { type: "action", returnValue }
      : { type: "redirect", location, returnValue };
  const stream = renderPayload(runtime, context.request, payload, temporaryReferences);
  return new Response(stream, { headers: { "Content-Type": RSC_CONTENT_TYPE } });
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
