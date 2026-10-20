import {
  createFromFetch,
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from "@vitejs/plugin-rsc/browser";

import { createServerCallback, hydrate } from "react-server-frame/browser";
import type { Payload } from "../protocol.ts";

setServerCallback(
  createServerCallback({
    createFromFetch: (response, options) => createFromFetch<Payload>(response, options),
    createTemporaryReferenceSet,
    encodeReply,
  }),
);

hydrate({
  createFromFetch: (response) => createFromFetch<Payload>(response),
  createFromReadableStream: (stream) => createFromReadableStream<Payload>(stream),
});
