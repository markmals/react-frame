import { ClientFrame, type ResolveFrame, ResolveFrameContext } from "react-frame/client";
import { describe, expect, it, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../test/render.tsx";
import { deleteCard, upsertCard } from "./actions.ts";
import { BoardShell } from "./board-shell.tsx";
import { Column } from "./column.tsx";
import { CARD_CONTENT_TYPE, columnFrameName, type BoardCard } from "./types.ts";

vi.mock(import("./actions.ts"), () => ({
  createColumn: vi.fn(),
  deleteCard: vi.fn(),
  renameBoard: vi.fn(),
  renameColumn: vi.fn(),
  upsertCard: vi.fn(),
}));

const BACKLOG = "column-backlog";
const DONE = "column-done";

function card(id: string, title: string, order: number, columnId = BACKLOG): BoardCard {
  return { id, title, content: null, order, columnId };
}

function columnSource(columnId: string) {
  return `/board/1/columns/${columnId}`;
}

async function renderColumns(columns: { id: string; name: string; cards: BoardCard[] }[]) {
  let resolveFrame = vi.fn<ResolveFrame>();

  render(
    <BoardShell color="#cbd5e1">
      <ResolveFrameContext value={resolveFrame}>
        {columns.map((column) => (
          <ClientFrame
            key={column.id}
            name={columnFrameName(column.id)}
            src={columnSource(column.id)}
          >
            <Column boardId={1} columnId={column.id} name={column.name} cards={column.cards} />
          </ClientFrame>
        ))}
      </ResolveFrameContext>
    </BoardShell>,
  );
  await vi.waitFor(() => expect(document.querySelectorAll("ul")).toHaveLength(columns.length));

  return resolveFrame;
}

/** The titles in one column's list, by the order the columns were rendered in. */
function cardTitles(columnIndex: number): string[] {
  let list = document.querySelectorAll("ul")[columnIndex];
  return [...(list?.querySelectorAll("h3") ?? [])].map((title) => title.textContent ?? "");
}

async function addCard(title: string) {
  let opener = page.getByText("Add a card").first();
  // The composer stays open after a save, so the summary that opens it is only there the first time.
  if (opener.query()?.checkVisibility()) {
    await opener.click();
  }

  await page.getByRole("textbox", { name: "New card title" }).first().fill(title);
  await page.getByRole("button", { name: "Save Card" }).first().click();
}

/**
 * Drags a card over `target` and drops it on its top or bottom half. The drop waits for the
 * indicator the card draws, which is also what tells the drop handler which edge it landed on.
 */
async function dropCardOn(target: Element, transfer: BoardCard, position: "top" | "bottom") {
  let dataTransfer = new DataTransfer();
  dataTransfer.setData(
    CARD_CONTENT_TYPE,
    JSON.stringify({ id: transfer.id, title: transfer.title, columnId: transfer.columnId }),
  );

  let rect = target.getBoundingClientRect();
  let clientY = position === "top" ? rect.top + 1 : rect.bottom - 1;
  let init = { bubbles: true, cancelable: true, dataTransfer, clientY };

  target.dispatchEvent(new DragEvent("dragover", init));
  await vi.waitFor(() =>
    expect(target.className).toContain(
      position === "top" ? "border-t-brand-red" : "border-b-brand-red",
    ),
  );

  target.dispatchEvent(new DragEvent("drop", init));
}

describe("Column", () => {
  it("shows a new card before the server answers and keeps it when the frame reloads", async () => {
    let saved = Promise.withResolvers<void>();
    vi.mocked(upsertCard).mockReturnValue(saved.promise);
    let reloaded = Promise.withResolvers<React.ReactNode>();
    let resolveFrame = await renderColumns([
      { id: BACKLOG, name: "Backlog", cards: [card("a", "Write the launch post", 1)] },
    ]);
    resolveFrame.mockReturnValue(reloaded.promise);

    await addCard("Record the demo video");

    await expect.element(page.getByText("Record the demo video")).toBeInTheDocument();
    expect(vi.mocked(upsertCard)).toHaveBeenCalledOnce();
    let submitted = vi.mocked(upsertCard).mock.calls[0]![0];
    expect(submitted.get("title")).toBe("Record the demo video");
    expect(submitted.get("columnId")).toBe(BACKLOG);
    expect(Number(submitted.get("order"))).toBe(2);

    saved.resolve();
    await vi.waitFor(() => expect(resolveFrame).toHaveBeenCalledOnce());
    expect(resolveFrame.mock.calls[0]![0].pathname).toBe(columnSource(BACKLOG));

    reloaded.resolve(
      <Column
        boardId={1}
        columnId={BACKLOG}
        name="Backlog"
        cards={[card("a", "Write the launch post", 1), card("b", "Record the demo video", 2)]}
      />,
    );

    await vi.waitFor(() =>
      expect(cardTitles(0)).toEqual(["Write the launch post", "Record the demo video"]),
    );
  });

  it("keeps several rapid saves apart, with no duplicates once they land", async () => {
    vi.mocked(upsertCard).mockResolvedValue(undefined);
    let reloaded = Promise.withResolvers<React.ReactNode>();
    let resolveFrame = await renderColumns([{ id: BACKLOG, name: "Backlog", cards: [] }]);
    resolveFrame.mockReturnValue(reloaded.promise);

    await addCard("First");
    await addCard("Second");
    await addCard("Third");

    await vi.waitFor(() => expect(cardTitles(0)).toEqual(["First", "Second", "Third"]));
    let orders = vi.mocked(upsertCard).mock.calls.map((call) => Number(call[0].get("order")));
    expect(orders).toEqual([1, 2, 3]);

    reloaded.resolve(
      <Column
        boardId={1}
        columnId={BACKLOG}
        name="Backlog"
        cards={[card("1", "First", 1), card("2", "Second", 2), card("3", "Third", 3)]}
      />,
    );

    await vi.waitFor(() => expect(cardTitles(0)).toEqual(["First", "Second", "Third"]));
  });

  it("takes a deleted card off the board while the server catches up", async () => {
    let deleted = Promise.withResolvers<void>();
    vi.mocked(deleteCard).mockReturnValue(deleted.promise);
    let reloaded = Promise.withResolvers<React.ReactNode>();
    let resolveFrame = await renderColumns([
      {
        id: BACKLOG,
        name: "Backlog",
        cards: [card("a", "Write the launch post", 1), card("b", "Record the demo video", 2)],
      },
    ]);
    resolveFrame.mockReturnValue(reloaded.promise);

    await page.getByRole("button", { name: 'Delete card "Record the demo video"' }).click();

    await vi.waitFor(() => expect(cardTitles(0)).toEqual(["Write the launch post"]));
    expect(vi.mocked(deleteCard).mock.calls[0]![0].get("id")).toBe("b");

    deleted.resolve();
    await vi.waitFor(() => expect(resolveFrame).toHaveBeenCalledOnce());
    reloaded.resolve(
      <Column
        boardId={1}
        columnId={BACKLOG}
        name="Backlog"
        cards={[card("a", "Write the launch post", 1)]}
      />,
    );

    await vi.waitFor(() => expect(cardTitles(0)).toEqual(["Write the launch post"]));
  });

  it("drops a card between two others at a fractional order", async () => {
    vi.mocked(upsertCard).mockResolvedValue(undefined);
    let resolveFrame = await renderColumns([
      {
        id: BACKLOG,
        name: "Backlog",
        cards: [card("a", "First", 1), card("b", "Second", 2), card("c", "Third", 3)],
      },
    ]);
    resolveFrame.mockReturnValue(Promise.withResolvers<React.ReactNode>().promise);

    let third = [...document.querySelectorAll("li")].find((item) =>
      item.textContent?.includes("Third"),
    )!;
    await dropCardOn(third, card("a", "First", 1), "top");

    await vi.waitFor(() => expect(cardTitles(0)).toEqual(["Second", "First", "Third"]));
    expect(Number(vi.mocked(upsertCard).mock.calls[0]![0].get("order"))).toBe(2.5);
  });

  it("moves a card between columns and reloads both frames", async () => {
    vi.mocked(upsertCard).mockResolvedValue(undefined);
    let resolveFrame = await renderColumns([
      { id: BACKLOG, name: "Backlog", cards: [card("a", "Ship drag and drop", 1)] },
      { id: DONE, name: "Done", cards: [card("z", "Pick the board colors", 1, DONE)] },
    ]);
    resolveFrame.mockReturnValue(Promise.withResolvers<React.ReactNode>().promise);

    let target = [...document.querySelectorAll("li")].find((item) =>
      item.textContent?.includes("Pick the board colors"),
    )!;
    await dropCardOn(target, card("a", "Ship drag and drop", 1), "top");

    await vi.waitFor(() => {
      expect(cardTitles(0)).toEqual([]);
      expect(cardTitles(1)).toEqual(["Ship drag and drop", "Pick the board colors"]);
    });

    let submitted = vi.mocked(upsertCard).mock.calls[0]![0];
    expect(submitted.get("columnId")).toBe(DONE);
    expect(Number(submitted.get("order"))).toBe(0.5);

    await vi.waitFor(() => expect(resolveFrame).toHaveBeenCalledTimes(2));
    expect(resolveFrame.mock.calls.map((call) => call[0].pathname).sort()).toEqual(
      [columnSource(BACKLOG), columnSource(DONE)].sort(),
    );
  });
});
