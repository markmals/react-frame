"use client";

import { startTransition, useState } from "react";
import { useFrame } from "react-frame/client";

import { TrashIcon } from "../../ui/icons.tsx";
import { deleteCard } from "./actions.ts";
import { usePendingCards, useMoveCard } from "./board-shell.tsx";
import { CARD_CONTENT_TYPE, readCardTransfer, type BoardCard } from "./types.ts";

export interface CardProps {
  boardId: number;
  card: BoardCard;
  columnId: string;
  /** Orders of the neighbours, so a drop lands halfway between this card and the one it passed. */
  previousOrder: number;
  nextOrder: number;
  ref?: React.Ref<HTMLLIElement>;
}

export function Card({ boardId, card, columnId, nextOrder, previousOrder, ref }: CardProps) {
  let frame = useFrame();
  let { add } = usePendingCards();
  let moveCard = useMoveCard(boardId, columnId);
  let [acceptDrop, setAcceptDrop] = useState<"none" | "top" | "bottom">("none");

  return (
    <li
      ref={ref}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(CARD_CONTENT_TYPE)) return;
        event.preventDefault();
        event.stopPropagation();
        let rect = event.currentTarget.getBoundingClientRect();
        setAcceptDrop(event.clientY <= (rect.top + rect.bottom) / 2 ? "top" : "bottom");
      }}
      onDragLeave={() => setAcceptDrop("none")}
      onDrop={(event) => {
        event.stopPropagation();
        let transfer = readCardTransfer(event.dataTransfer.getData(CARD_CONTENT_TYPE));
        let droppedOrder = acceptDrop === "top" ? previousOrder : nextOrder;
        setAcceptDrop("none");

        if (transfer) moveCard(transfer, (droppedOrder + card.order) / 2);
      }}
      className={`-mb-hairline cursor-grab border-t-2 border-b-2 px-2 py-1 last:mb-0 active:cursor-grabbing ${
        acceptDrop === "top"
          ? "border-t-brand-red border-b-transparent"
          : acceptDrop === "bottom"
            ? "border-t-transparent border-b-brand-red"
            : "border-t-transparent border-b-transparent"
      }`}
    >
      <div
        draggable
        className="relative w-full rounded-lg border-slate-300 bg-white px-2 py-1 text-sm shadow shadow-slate-300"
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            CARD_CONTENT_TYPE,
            JSON.stringify({ id: card.id, title: card.title, columnId }),
          );
        }}
      >
        <h3 className="pr-6">{card.title}</h3>
        <div className="mt-2">{card.content || <>&nbsp;</>}</div>

        <form
          action={deleteCard}
          onSubmit={(event) => {
            event.preventDefault();
            let formData = new FormData(event.currentTarget);
            startTransition(async () => {
              add({ kind: "delete", id: card.id });
              await deleteCard(formData);
              await frame.reload();
            });
          }}
        >
          <input type="hidden" name="boardId" value={boardId} />
          <input type="hidden" name="id" value={card.id} />
          <button
            type="submit"
            aria-label={`Delete card "${card.title}"`}
            className="absolute top-2 right-2 hover:text-brand-red"
          >
            <TrashIcon />
          </button>
        </form>
      </div>
    </li>
  );
}
