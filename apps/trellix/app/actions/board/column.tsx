"use client";

import { useCallback, useState } from "react";
import { useFrame } from "react-frame/client";

import { renameColumn } from "./actions.ts";
import { usePendingCards, useMoveCard } from "./board-shell.tsx";
import { Card } from "./card.tsx";
import { EditableText } from "./editable-text.tsx";
import { NewCard } from "./new-card.tsx";
import {
  applyCardMutations,
  CARD_CONTENT_TYPE,
  readCardTransfer,
  type BoardCard,
} from "./types.ts";

export interface ColumnProps {
  boardId: number;
  columnId: string;
  name: string;
  cards: BoardCard[];
}

/**
 * One column, rendered by its own route. Its frame reloads on its own after a card is added,
 * deleted, renamed, or dropped, so the rest of the board keeps its scroll position and any
 * composer it had open.
 */
export function Column({ boardId, cards, columnId, name }: ColumnProps) {
  let frame = useFrame();
  let { mutations } = usePendingCards();
  let moveCard = useMoveCard(boardId, columnId);
  let [acceptDrop, setAcceptDrop] = useState(false);

  let items = applyCardMutations(cards, columnId, mutations);
  let lastCardId = items.at(-1)?.id;
  let keepVisible = useCallback((node: HTMLLIElement | null) => {
    node?.scrollIntoView({ block: "nearest" });
  }, []);

  return (
    <div
      className={`flex max-h-full w-80 shrink-0 flex-col overflow-hidden rounded-xl bg-slate-100 shadow-sm shadow-slate-400 ${
        acceptDrop ? "outline outline-2 outline-brand-red" : ""
      }`}
      onDragOver={(event) => {
        if (items.length > 0 || !event.dataTransfer.types.includes(CARD_CONTENT_TYPE)) return;
        event.preventDefault();
        setAcceptDrop(true);
      }}
      onDragLeave={() => setAcceptDrop(false)}
      onDrop={(event) => {
        let transfer = readCardTransfer(event.dataTransfer.getData(CARD_CONTENT_TYPE));
        setAcceptDrop(false);

        if (transfer) moveCard(transfer, 1);
      }}
    >
      <div className="p-2">
        <EditableText
          action={renameColumn}
          reload={() => frame.reload()}
          fieldName="name"
          value={name}
          inputLabel="Edit column name"
          buttonLabel={`Edit column "${name}" name`}
          inputClassName="w-full rounded-lg border border-slate-400 px-2 py-1 font-medium text-black"
          buttonClassName="block w-full rounded-lg border border-transparent px-2 py-1 text-left font-medium text-slate-600"
        >
          <input type="hidden" name="boardId" value={boardId} />
          <input type="hidden" name="columnId" value={columnId} />
        </EditableText>
      </div>

      <ul className="min-h-hairline grow overflow-auto">
        {items.map((card, index) => (
          <Card
            key={card.id}
            ref={card.id === lastCardId ? keepVisible : undefined}
            boardId={boardId}
            card={card}
            columnId={columnId}
            previousOrder={items[index - 1]?.order ?? 0}
            nextOrder={items[index + 1]?.order ?? card.order + 1}
          />
        ))}
      </ul>

      <NewCard
        boardId={boardId}
        columnId={columnId}
        nextOrder={items.length === 0 ? 1 : items[items.length - 1]!.order + 1}
      />
    </div>
  );
}
