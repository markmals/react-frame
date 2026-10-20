import { clear } from "idb-keyval";
import { run } from "react-frame/spa";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { notesStore } from "./data/notes.ts";
import { router } from "./router.tsx";
import { LoadingIndicator } from "./ui/app-shell.tsx";

let testerUrl = location.href;
let stop: (() => void) | undefined;

/** Starts the app as if the browser had loaded `path`. */
function start(path: string) {
  stop?.();
  history.replaceState(null, "", path);
  let container = document.createElement("div");
  document.body.append(container);
  let app = run(router, { container, fallback: <LoadingIndicator /> });
  stop = () => {
    app.dispose();
    container.remove();
  };
}

beforeEach(async () => {
  // Wiping the store drops the seed marker too, so every test starts from the welcome notes.
  await clear(notesStore);
});

afterEach(() => {
  stop?.();
  stop = undefined;
  history.replaceState(null, "", testerUrl);
});

function noteRows() {
  return page.getByRole("list", { name: "Notes" }).getByRole("listitem");
}

function noteTitles() {
  return noteRows()
    .elements()
    .map((row) => row.querySelector("a span")?.textContent ?? "");
}

function title() {
  return page.getByLabelText("Note title");
}

function body() {
  return page.getByLabelText("Note body");
}

function saveStatus() {
  return page.getByRole("status");
}

describe("notes", () => {
  it("seeds the welcome notes once and opens one through its frame", async () => {
    start("/");
    await expect.element(page.getByRole("heading", { name: "No note selected" })).toBeVisible();
    await vi.waitFor(() =>
      expect(noteTitles()).toEqual(["Welcome to Notes", "Formatting cheat sheet", "Grocery run"]),
    );

    await page.getByRole("link", { name: /Grocery run/ }).click();

    await expect.element(title()).toHaveValue("Grocery run");
    expect(location.pathname).toBe("/notes/grocery-run");
    await expect
      .element(page.getByRole("link", { name: /Grocery run/ }))
      .toHaveAttribute("aria-current", "page");
    // The list was not seeded a second time by the frame loads that just ran.
    expect(noteTitles()).toHaveLength(3);
  });

  it("creates a note, autosaves it, and still has it after a restart", async () => {
    start("/");
    await expect.element(page.getByRole("link", { name: /Welcome to Notes/ })).toBeVisible();

    await page.getByRole("button", { name: "New note" }).click();
    await expect.element(title()).toHaveValue("");
    let noteUrl = location.pathname;
    expect(noteUrl.startsWith("/notes/")).toBe(true);

    await title().fill("Trip plan");
    await expect.element(saveStatus()).toHaveTextContent("Saving…");
    await expect.element(saveStatus()).toHaveTextContent("Saved");

    await userEvent.click(body());
    await userEvent.keyboard("Pack the camera");
    await expect.element(saveStatus()).toHaveTextContent("Saved");
    await expect.element(page.getByRole("link", { name: /Pack the camera/ })).toBeVisible();

    // A fresh run of the app reads the note back out of IndexedDB.
    start(noteUrl);
    await expect.element(title()).toHaveValue("Trip plan");
    await expect.element(body().getByText("Pack the camera")).toBeVisible();
    expect(noteTitles()).toContain("Trip plan");
  });

  it("reloads the sidebar while saving without remounting the editor", async () => {
    start("/notes/grocery-run");
    await expect.element(title()).toHaveValue("Grocery run");
    await expect.element(page.getByRole("link", { name: /yesterday/ })).toBeVisible();
    let editorElement = body().element();

    await userEvent.click(body());
    await userEvent.keyboard(" Also milk");
    await expect.element(saveStatus()).toHaveTextContent("Saved");

    // The sidebar shows the new text and a fresh timestamp, so it really did load again.
    await expect.element(page.getByRole("link", { name: /Also milk/ })).toBeVisible();
    await expect.element(page.getByRole("link", { name: /just now/ })).toBeVisible();
    // The editor is the same DOM node it was, with the caret still in the text being typed.
    expect(body().element()).toBe(editorElement);
    expect(editorElement.contains(getSelection()?.anchorNode ?? null)).toBe(true);
    expect(getSelection()?.anchorNode?.textContent).toContain("Also milk");
  });

  it("filters the list from the URL without touching the open note", async () => {
    start("/notes/welcome");
    await expect.element(title()).toHaveValue("Welcome to Notes");

    // "lemons" only appears in the body of the grocery note.
    await page.getByLabelText("Search notes").fill("lemons");
    await page.getByRole("button", { name: "Search" }).click();

    await vi.waitFor(() => expect(noteTitles()).toEqual(["Grocery run"]));
    expect(location.search).toBe("?q=lemons");
    await expect.element(title()).toHaveValue("Welcome to Notes");

    await page.getByLabelText("Search notes").fill("nothing matches this");
    await page.getByRole("button", { name: "Search" }).click();
    await expect.element(page.getByText("No notes match “nothing matches this”.")).toBeVisible();

    // The new note has no query, so the box follows the address bar instead of staying behind.
    await page.getByRole("button", { name: "New note" }).click();
    await expect.element(page.getByLabelText("Search notes")).toHaveValue("");
    await vi.waitFor(() => expect(noteTitles()).toHaveLength(4));
  });

  it("keeps pinned notes at the top of the list", async () => {
    start("/");
    await vi.waitFor(() =>
      expect(noteTitles()).toEqual(["Welcome to Notes", "Formatting cheat sheet", "Grocery run"]),
    );

    await page.getByRole("button", { name: "Unpin Welcome to Notes" }).click();
    await expect.element(page.getByRole("button", { name: "Pin Welcome to Notes" })).toBeVisible();
    expect(noteTitles()).toEqual(["Welcome to Notes", "Formatting cheat sheet", "Grocery run"]);

    await page.getByRole("button", { name: "Pin Grocery run" }).click();
    await vi.waitFor(() =>
      expect(noteTitles()).toEqual(["Grocery run", "Welcome to Notes", "Formatting cheat sheet"]),
    );
  });

  it("deletes the open note after a confirmation and opens the next one", async () => {
    start("/notes/formatting");
    await expect.element(title()).toHaveValue("Formatting cheat sheet");

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await vi.waitFor(() => expect(page.getByRole("dialog").elements()).toHaveLength(0));
    expect(location.pathname).toBe("/notes/formatting");

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("button", { name: "Delete note" }).click();

    await vi.waitFor(() => expect(location.pathname).toBe("/notes/welcome"));
    await expect.element(title()).toHaveValue("Welcome to Notes");
    await vi.waitFor(() => expect(noteTitles()).toEqual(["Welcome to Notes", "Grocery run"]));
  });

  it("shows a not-found pane for a note id that is not there", async () => {
    start("/notes/gone");

    await expect.element(page.getByRole("heading", { name: "Note not found" })).toBeVisible();
    await expect.element(page.getByRole("link", { name: /Welcome to Notes/ })).toBeVisible();
  });

  it("turns formatting on and shows it on the toolbar button", async () => {
    start("/notes/grocery-run");
    await expect.element(title()).toHaveValue("Grocery run");

    await userEvent.click(body());
    await page.getByRole("button", { name: "Bold" }).click();
    await userEvent.keyboard("urgent");

    await expect
      .element(page.getByRole("button", { name: "Bold" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(body().element().querySelector("strong")?.textContent).toBe("urgent");

    await page.getByRole("button", { name: "Bold" }).click();
    await expect
      .element(page.getByRole("button", { name: "Bold" }))
      .toHaveAttribute("aria-pressed", "false");
  });
});
