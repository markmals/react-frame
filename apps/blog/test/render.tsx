import { createRoot, type Root } from "react-dom/client";
import { afterEach } from "vite-plus/test";

let mounted: { root: Root; container: HTMLElement }[] = [];

afterEach(() => {
  for (let { root, container } of mounted) {
    root.unmount();
    container.remove();
  }
  mounted = [];
});

/** Renders a client component into the test page; it's unmounted after each test. */
export function render(element: React.ReactNode) {
  let container = document.createElement("div");
  document.body.append(container);
  let root = createRoot(container);
  root.render(element);
  mounted.push({ root, container });
}
