"use client";

import { createContext, use, useCallback, useMemo, useRef, useState, useTransition } from "react";

import { RSC_CONTENT_TYPE, type Payload } from "./protocol.ts";

/** Fetches a frame's route as an RSC payload. Supplied by the bundler integration. */
export type FetchFrame = (url: URL, signal: AbortSignal) => Promise<React.ReactNode>;

type Frame = {
  pending: boolean;
  reload: () => void;
};

const FrameContext = createContext<Frame | undefined>(undefined);
FrameContext.displayName = "FrameContext";

/** Returns the frame that contains the calling component. */
export function useFrame() {
  const frame = use(FrameContext);
  if (!frame) {
    throw new Error("useFrame() must be called inside a <Frame>");
  }
  return frame;
}

export function ClientFrame({
  children,
  fetchFrame,
  src,
}: {
  children?: React.ReactNode;
  fetchFrame: FetchFrame;
  src: string;
}) {
  const [content, setContent] = useState<React.ReactNode | Promise<React.ReactNode>>(children);
  const [pending, startTransition] = useTransition();

  // A server render of the surrounding page replaces any content loaded by reload().
  const [lastChildren, setLastChildren] = useState(children);
  if (lastChildren !== children) {
    setLastChildren(children);
    setContent(children);
  }

  const controllerRef = useRef<AbortController>(undefined);

  const reload = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    startTransition(() =>
      setContent(fetchFrame(new URL(src, window.location.href), controller.signal)),
    );
  }, [fetchFrame, src]);

  const frame = useMemo(() => ({ pending, reload }), [pending, reload]);

  return (
    <FrameContext value={frame}>{content instanceof Promise ? use(content) : content}</FrameContext>
  );
}

export async function fetchFramePayload(
  url: URL,
  signal: AbortSignal,
  createFromFetch: (response: Promise<Response>) => Promise<Payload>,
): Promise<React.ReactNode> {
  const payload = await createFromFetch(
    fetch(url, { headers: { Accept: RSC_CONTENT_TYPE }, signal }),
  );
  if (payload.type === "render") return payload.root;

  if (window.navigation) {
    await window.navigation.navigate(payload.location).finished;
  } else {
    window.location.assign(payload.location);
  }
  return null;
}
