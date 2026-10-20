export interface BoardCard {
  id: string;
  title: string;
  content: string | null;
  order: number;
  columnId: string;
}

export interface BoardColumnView {
  id: string;
  name: string;
  order: number;
}

/**
 * An in-flight card change. `useOptimistic` on the board page holds one per running mutation, so
 * every column renders the cards it will have once the mutations land, including cards on their
 * way in from another column.
 */
export type CardMutation =
  | { kind: "upsert"; id: string; columnId: string; title: string; order: number }
  | { kind: "delete"; id: string };

/** What a dragged card carries; `columnId` is the column it is leaving, so that frame reloads too. */
export interface CardTransfer {
  id: string;
  title: string;
  columnId: string;
}

export const CARD_CONTENT_TYPE = "application/react-frame-card";

/** The `<Frame name>` a column renders under, which drop handlers in other columns reload. */
export function columnFrameName(columnId: string): string {
  return `column:${columnId}`;
}

/** A submitted text field; `FormData` also holds files, which none of these forms send. */
export function readTextField(formData: FormData, name: string): string {
  let value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function readCardTransfer(data: string): CardTransfer | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }

  if (
    typeof parsed !== "object" ||
    parsed == null ||
    !("id" in parsed) ||
    !("title" in parsed) ||
    !("columnId" in parsed)
  ) {
    return null;
  }

  let { columnId, id, title } = parsed;

  return typeof id === "string" && typeof title === "string" && typeof columnId === "string"
    ? { id, title, columnId }
    : null;
}

/** Merges the pending mutations into one column's server cards, newest mutation per card winning. */
export function applyCardMutations(
  cards: BoardCard[],
  columnId: string,
  mutations: CardMutation[],
): BoardCard[] {
  let byId = new Map(cards.map((card) => [card.id, card]));

  for (let mutation of mutations) {
    if (mutation.kind === "delete" || mutation.columnId !== columnId) {
      byId.delete(mutation.id);
      continue;
    }

    byId.set(mutation.id, {
      id: mutation.id,
      title: mutation.title,
      content: byId.get(mutation.id)?.content ?? null,
      order: mutation.order,
      columnId,
    });
  }

  return [...byId.values()].sort((a, b) => a.order - b.order);
}
