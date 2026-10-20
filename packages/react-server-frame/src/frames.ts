/** A frame on the page, as returned by `useFrame()` and `useFrames().get(name)`. */
export interface Frame {
  /** Whether the frame is loading new content. */
  readonly pending: boolean;
  /**
   * Reloads the frame from its source, resolving once the new content has loaded. React shows it
   * right away, or, inside a transition, when the transition finishes.
   */
  reload(): Promise<void>;
}

export interface FrameRequestInit {
  method?: string;
  body?: FormData | null;
}

export interface FrameRequest extends FrameRequestInit {
  signal: AbortSignal;
}

/** A mounted named frame, which `data-target` navigations load new URLs into. */
export interface MountedFrame extends Frame {
  load(url: URL, init?: FrameRequestInit): Promise<void>;
}

/** Frames given a `name`, while they're mounted in the browser. */
export const namedFrames = new Map<string, MountedFrame>();

let reloadPage = (): Promise<void> =>
  Promise.reject(new Error("The page can only reload once the browser runtime has hydrated it"));

/**
 * The page itself, which `useFrame()` returns outside any `<Frame>`. Reloading it renders the
 * current URL again. Its `pending` is always `false`.
 */
export const topFrame: Frame = { pending: false, reload: () => reloadPage() };

/** Sets how the top frame reloads. The browser runtime calls this when it hydrates. */
export function setPageReload(reload: () => Promise<void>) {
  reloadPage = reload;
}
