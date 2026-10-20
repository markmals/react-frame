import { describe, expect, it } from "vite-plus/test";

import { applyCardMutations, readCardTransfer, type BoardCard } from "./types.ts";

const backlog = "column-backlog";

function card(id: string, order: number, columnId = backlog): BoardCard {
  return { id, title: id, content: null, order, columnId };
}

describe("applyCardMutations", () => {
  it("sorts the column's cards by their fractional order", () => {
    let merged = applyCardMutations([card("b", 2), card("a", 1), card("c", 1.5)], backlog, []);

    expect(merged.map((item) => item.id)).toEqual(["a", "c", "b"]);
  });

  it("adds a pending card in the position its order asks for", () => {
    let merged = applyCardMutations([card("a", 1), card("b", 2)], backlog, [
      { kind: "upsert", id: "new", columnId: backlog, title: "New card", order: 1.5 },
    ]);

    expect(merged.map((item) => item.id)).toEqual(["a", "new", "b"]);
    expect(merged[1]!.title).toBe("New card");
  });

  it("takes a card out of the column it is moving away from", () => {
    let merged = applyCardMutations([card("a", 1), card("b", 2)], backlog, [
      { kind: "upsert", id: "b", columnId: "column-done", title: "b", order: 1 },
    ]);

    expect(merged.map((item) => item.id)).toEqual(["a"]);
  });

  it("brings a card in from another column, keeping the dragged title", () => {
    let merged = applyCardMutations([card("a", 1)], backlog, [
      { kind: "upsert", id: "visitor", columnId: backlog, title: "From elsewhere", order: 0.5 },
    ]);

    expect(merged.map((item) => item.id)).toEqual(["visitor", "a"]);
    expect(merged[0]!.title).toBe("From elsewhere");
  });

  it("drops a deleted card", () => {
    let merged = applyCardMutations([card("a", 1), card("b", 2)], backlog, [
      { kind: "delete", id: "a" },
    ]);

    expect(merged.map((item) => item.id)).toEqual(["b"]);
  });

  it("lets the last mutation for a card win when several overlap", () => {
    let merged = applyCardMutations([card("a", 1)], backlog, [
      { kind: "upsert", id: "a", columnId: backlog, title: "a", order: 3 },
      { kind: "upsert", id: "b", columnId: backlog, title: "b", order: 2 },
      { kind: "delete", id: "a" },
    ]);

    expect(merged.map((item) => item.id)).toEqual(["b"]);
  });

  it("keeps the content the server already had for a card being moved", () => {
    let cards: BoardCard[] = [{ ...card("a", 1), content: "notes" }];
    let merged = applyCardMutations(cards, backlog, [
      { kind: "upsert", id: "a", columnId: backlog, title: "a", order: 5 },
    ]);

    expect(merged[0]!.content).toBe("notes");
  });
});

describe("readCardTransfer", () => {
  it("reads what a dragged card carries", () => {
    expect(readCardTransfer('{"id":"1","title":"Card","columnId":"c"}')).toEqual({
      id: "1",
      title: "Card",
      columnId: "c",
    });
  });

  it("refuses data from another kind of drag", () => {
    expect(readCardTransfer("")).toBeNull();
    expect(readCardTransfer('{"id":"1"}')).toBeNull();
    expect(readCardTransfer('{"id":1,"title":"Card","columnId":"c"}')).toBeNull();
  });
});
