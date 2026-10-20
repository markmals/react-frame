"use client";

import { fetchFramePayload } from "../client.tsx";
import type { FrameRequest } from "../frames.ts";

export async function fetchFrame(url: URL, request: FrameRequest) {
  // This module is also evaluated during SSR, where the browser Flight client can't load.
  const { createFromFetch } = await import("@vitejs/plugin-rsc/browser");
  return fetchFramePayload(url, request, createFromFetch);
}
