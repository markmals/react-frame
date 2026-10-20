/** A frame on the page, as returned by `useFrame()` and `useFrames().get(name)`. */
export interface Frame {
  /** The pathname and search of the URL the frame shows, or is loading. */
  readonly src: string;
  /**
   * Whether the frame is loading new content. It turns `true` when a load starts and `false` once
   * the new content shows, so rendering from it covers what reload start and complete events would.
   */
  readonly pending: boolean;
  /** While the frame loads a form submission, the submitted data; otherwise `undefined`. */
  readonly formData?: FormData;
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
  /** Aborts when the load is superseded, or the content it was for goes away. */
  signal: AbortSignal;
}

/** Content to show in a frame, or a redirect `Response` whose `Location` the browser navigates to. */
export type FrameResolution = React.ReactNode | Response;

/**
 * Resolves what a frame shows: the route at `url` for a `<Frame>` or its reload, and a navigation's
 * destination for the page itself. The browser runtime calls it for every load; return React
 * content, or a redirect `Response` to navigate instead.
 */
export type ResolveFrame = (
  url: URL,
  request: FrameRequest,
) => FrameResolution | Promise<FrameResolution>;

/** A mounted named frame, which `data-target` navigations load new URLs into. */
export interface MountedFrame extends Frame {
  load(url: URL, init?: FrameRequestInit): Promise<void>;
}

/** Frames given a `name`, while they're mounted in the browser. */
export const namedFrames = new Map<string, MountedFrame>();

/**
 * Navigates to where a redirect `Response` points. A redirect for the page replaces the entry it
 * was resolving, so going back doesn't land on the URL that redirected.
 */
export function followRedirect(response: Response, url: URL, history: NavigationHistoryBehavior) {
  const location = response.headers.get("Location");
  if (location === null || response.status < 300 || response.status >= 400) {
    throw new Error(`Expected a redirect response while resolving ${url.href}`);
  }
  window.navigation.navigate(new URL(location, url).href, { history });
}
