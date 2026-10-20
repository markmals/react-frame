import type { ReactFormState } from "react-dom/client";

import type { FetchFrame } from "../client.tsx";
import type { Payload } from "../protocol.ts";

/** The React Flight APIs a bundler integration supplies to the server middleware and `<Frame>`. */
export interface ServerRuntime {
  createFromReadableStream: (stream: ReadableStream<Uint8Array>) => Promise<Payload>;
  createTemporaryReferenceSet: () => unknown;
  decodeAction: (formData: FormData) => Promise<(() => Promise<unknown>) | null>;
  decodeFormState: (actionResult: unknown, body: FormData) => Promise<ReactFormState | undefined>;
  decodeReply: (
    body: string | FormData,
    options: { temporaryReferences: unknown },
  ) => Promise<unknown[]>;
  /** Client reference passed to frames so the browser can reload them. */
  fetchFrame: FetchFrame;
  loadServerAction: (id: string) => Promise<Function>;
  /** Renders an RSC stream to an HTML document response. */
  renderHtml: (
    body: ReadableStream<Uint8Array>,
    init: ResponseInit,
    formState?: ReactFormState,
  ) => Promise<Response>;
  renderToReadableStream: (
    payload: Payload,
    options?: {
      temporaryReferences?: unknown;
      onError?: (error: unknown) => string | undefined;
    },
  ) => ReadableStream<Uint8Array>;
}

export function renderPayload(
  runtime: ServerRuntime,
  request: Request,
  payload: Payload,
  temporaryReferences?: unknown,
) {
  return runtime.renderToReadableStream(payload, {
    temporaryReferences,
    onError(error) {
      if (!request.signal.aborted) console.error(error);
      return undefined;
    },
  });
}
