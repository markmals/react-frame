import { createFromReadableStream, getClientEntryUrl } from "@vitejs/plugin-rsc/ssr";
import { use } from "react";
import type { ReactFormState } from "react-dom/client";
import { renderToReadableStream } from "react-dom/server";
import { injectRSCPayload } from "rsc-html-stream/server";

import type { Payload } from "../protocol.ts";

export async function renderHtml(
  body: ReadableStream<Uint8Array>,
  init: ResponseInit,
  formState?: ReactFormState,
) {
  const [flightBody, inlineBody] = body.tee();

  let payload: Promise<Payload> | undefined;
  function Content() {
    // Decoding during render lets client module preloads attach to this HTML response.
    payload ??= createFromReadableStream<Payload>(flightBody);
    const resolved = use(payload);
    return resolved.type === "render" ? resolved.root : null;
  }

  const html = await renderToReadableStream(<Content />, {
    bootstrapModules: [getClientEntryUrl()],
    formState,
  });

  return new Response(html.pipeThrough(injectRSCPayload(inlineBody)), init);
}
