import { run } from "react-frame/spa";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { clearGreetings } from "./greetings.ts";
import { router } from "./router.tsx";
import { LoadingIndicator } from "./ui/app-shell.tsx";

let testerUrl = location.href;
let stop: (() => void) | undefined;

/** Starts the app as if the browser had loaded `path`. */
function start(path: string) {
  history.replaceState(null, "", path);
  let container = document.createElement("div");
  document.body.append(container);
  let app = run(router, { container, fallback: <LoadingIndicator /> });
  stop = () => {
    app.dispose();
    container.remove();
  };
}

afterEach(async () => {
  stop?.();
  await clearGreetings();
  history.replaceState(null, "", testerUrl);
});

function heading(name: string) {
  return page.getByRole("heading", { name });
}

describe("SPA", () => {
  it("loads the route for the URL it starts at, showing the fallback first", async () => {
    start("/about");

    await expect.element(page.getByRole("status")).toBeInTheDocument();
    await expect.element(heading("URLs in, rendered UI out")).toBeVisible();
    expect(location.pathname).toBe("/about");
    await expect
      .element(page.getByRole("link", { name: "About" }))
      .toHaveAttribute("aria-current", "page");
  });

  it("navigates between routes and cancels a superseded load", async () => {
    let log = vi.spyOn(console, "log");
    start("/");
    await expect.element(heading("A client-only React app")).toBeVisible();

    await page.getByRole("link", { name: "About" }).click();
    await expect.element(page.getByRole("status")).toBeInTheDocument();
    await page.getByRole("link", { name: "Home", exact: true }).click();

    await expect.element(page.getByRole("status")).not.toBeInTheDocument();
    await vi.waitFor(() => expect(navigation.transition).toBeNull());
    await expect.element(heading("A client-only React app")).toBeVisible();
    expect(location.pathname).toBe("/");
    // The About route started, then its request was aborted before it could respond.
    expect(log).toHaveBeenCalledWith("[SPA] → GET /about");
    expect(log.mock.calls.some(([line]) => String(line).includes("GET /about ("))).toBe(false);
  });

  it("pushes new form destinations and replaces submissions to the active URL", async () => {
    start("/");
    await expect.element(heading("A client-only React app")).toBeVisible();

    await page.getByLabelText("What should we call you?").fill("Ada");
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect.element(page.getByRole("status")).toBeInTheDocument();
    await expect.element(heading("Hello, Ada!")).toBeVisible();
    expect(location.pathname).toBe("/greet");

    await page.getByLabelText("Try another name").fill("Grace");
    await page.getByRole("button", { name: "Submit again" }).click();
    await expect.element(page.getByRole("button", { name: "Submitting…" })).toBeDisabled();
    expect(page.getByRole("status").elements()).toHaveLength(0);
    await expect.element(heading("Hello, Ada!")).toBeVisible();
    await expect.element(heading("Hello, Grace!")).toBeVisible();
    await expect.element(page.getByRole("button", { name: "Submit again" })).toBeEnabled();

    navigation.back();
    await expect.element(heading("A client-only React app")).toBeVisible();
    expect(location.pathname).toBe("/");
  });

  it("reads Submitting… for its own submission, not for a plain reload of the page", async () => {
    start("/greet");
    await expect.element(page.getByText("No greetings yet.")).toBeVisible();

    await page.getByRole("link", { name: "Greet" }).click();
    await vi.waitFor(() => expect(navigation.transition).not.toBeNull());
    // Check partway through: the greetings frame takes 300 ms, so the page is still loading.
    let { promise: elapsed, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 100);
    await elapsed;
    expect(navigation.transition).not.toBeNull();
    expect(page.getByRole("button", { name: "Submitting…" }).elements()).toHaveLength(0);
    await vi.waitFor(() => expect(navigation.transition).toBeNull());
  });

  it("shows greetings in a frame that loads again with the page and reloads on its own", async () => {
    start("/greet");
    await expect.element(page.getByText("No greetings yet.")).toBeVisible();

    await page.getByLabelText("Try another name").fill("Ada");
    await page.getByRole("button", { name: "Submit again" }).click();
    await expect.element(heading("Hello, Ada!")).toBeVisible();
    await expect.element(page.getByRole("listitem")).toHaveTextContent("Ada");

    await page.getByLabelText("Try another name").fill("half-typed");
    await page.getByRole("button", { name: "Clear" }).click();
    await expect.element(page.getByRole("button", { name: "Clearing…" })).toBeDisabled();
    await expect.element(page.getByText("No greetings yet.")).toBeVisible();
    await expect.element(page.getByLabelText("Try another name")).toHaveValue("half-typed");
  });
});
