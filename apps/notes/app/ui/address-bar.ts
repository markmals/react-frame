import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  let listening = new AbortController();
  navigation.addEventListener("currententrychange", onChange, { signal: listening.signal });
  return () => listening.abort();
}

function readPathname() {
  return location.pathname;
}

function readQuery() {
  return new URLSearchParams(location.search).get("q") ?? "";
}

/**
 * The address bar, as the parts of it this app reads. Both hooks return strings so the store
 * snapshot stays stable between renders.
 *
 * A `data-target` link or form moves the address bar but only loads the named frame, so the page's
 * own frame state doesn't change and components outside that frame never re-render. The sidebar
 * still has to know which note is open, and the search box has to follow the query it submitted.
 */
export function useCurrentPath() {
  return useSyncExternalStore(subscribe, readPathname);
}

export function useCurrentQuery() {
  return useSyncExternalStore(subscribe, readQuery);
}
