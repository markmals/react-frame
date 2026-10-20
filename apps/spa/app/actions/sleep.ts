export function sleep(milliseconds: number, signal: AbortSignal): Promise<void> {
  let { promise, resolve, reject } = Promise.withResolvers<void>();
  if (signal.aborted) {
    reject(signal.reason);
    return promise;
  }

  let timeout = setTimeout(() => {
    signal.removeEventListener("abort", handleAbort);
    resolve();
  }, milliseconds);

  function handleAbort() {
    clearTimeout(timeout);
    reject(signal.reason);
  }

  signal.addEventListener("abort", handleAbort, { once: true });
  return promise;
}
