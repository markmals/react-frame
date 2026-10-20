import {
  createFromReadableStream,
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
} from "@vitejs/plugin-rsc/rsc";

import { createRender, createServerActions, type ServerRuntime } from "../index.ts";
import type { Payload } from "../protocol.ts";
import type * as SsrEntry from "./entry.ssr.tsx";
import { fetchFrame } from "./fetch-frame.ts";

const runtime: ServerRuntime = {
  createFromReadableStream: (stream) => createFromReadableStream<Payload>(stream),
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  fetchFrame,
  loadServerAction,
  async renderHtml(body, init, formState) {
    const ssr = await import.meta.viteRsc.import<typeof SsrEntry>("./entry.ssr.tsx", {
      environment: "ssr",
    });
    return ssr.renderHtml(body, init, formState);
  },
  renderToReadableStream,
};

/** Installs `context.render()` backed by `@vitejs/plugin-rsc`. */
export function render() {
  return createRender(runtime);
}

/** Runs server functions posted to the current URL. Place after the middleware they rely on. */
export function serverActions() {
  return createServerActions(runtime);
}
