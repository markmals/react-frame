"use client";

import { createContext, startTransition, use, useOptimistic } from "react";
import { useFrame, useFrames } from "react-frame/client";

import { upsertCard } from "./actions.ts";
import { columnFrameName, type CardMutation, type CardTransfer } from "./types.ts";

interface PendingCards {
  mutations: CardMutation[];
  add: (mutation: CardMutation) => void;
}

// A column's route answers requests of its own, so its component has to render without the board
// page around it. On its own there is nothing in flight, and nothing on screen to show it in.
const PendingCardsContext = createContext<PendingCards>({
  mutations: [],
  add() {},
});

/**
 * The board page's client shell. Pending card changes live here, above the column frames, because
 * a move leaves one column and joins another: both columns read the same list and render the card
 * where it is going before the server has heard about it. Every mutation runs in a transition that
 * ends with the frame reloads, so the optimistic card disappears exactly as the real one arrives.
 */
export function BoardShell({ color, children }: { color: string; children: React.ReactNode }) {
  let [mutations, add] = useOptimistic<CardMutation[], CardMutation>([], (pending, mutation) => [
    ...pending,
    mutation,
  ]);

  return (
    <PendingCardsContext value={{ mutations, add }}>
      <div className="flex h-full min-h-0 flex-col" style={{ backgroundColor: color }}>
        {children}
      </div>
    </PendingCardsContext>
  );
}

export function usePendingCards(): PendingCards {
  return use(PendingCardsContext);
}

/**
 * Moves a dragged card into the column this hook is called from, reloading the columns it left
 * and joined. Both the column (for drops on empty space) and its cards (for drops between cards)
 * land a card the same way.
 */
export function useMoveCard(boardId: number, columnId: string) {
  let frame = useFrame();
  let frames = useFrames();
  let { add } = usePendingCards();

  return (transfer: CardTransfer, order: number) => {
    let formData = new FormData();
    formData.set("boardId", String(boardId));
    formData.set("id", transfer.id);
    formData.set("columnId", columnId);
    formData.set("title", transfer.title);
    formData.set("order", String(order));

    startTransition(async () => {
      add({ kind: "upsert", id: transfer.id, columnId, title: transfer.title, order });
      await upsertCard(formData);

      let source =
        transfer.columnId === columnId ? undefined : frames.get(columnFrameName(transfer.columnId));

      await Promise.all([frame.reload(), source?.reload()]);
    });
  };
}
