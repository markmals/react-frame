"use client";

import { fetchFramePayload } from "../client.tsx";

export async function fetchFrame(url: URL, signal: AbortSignal) {
  // This module is also evaluated during SSR, where the browser Flight client can't load.
  const { createFromFetch } = await import("@vitejs/plugin-rsc/browser");
  return fetchFramePayload(url, signal, createFromFetch);
}
