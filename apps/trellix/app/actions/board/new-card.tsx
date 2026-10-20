"use client";

import { startTransition, useRef, useState } from "react";
import { useFrame } from "react-frame/client";

import { CancelButton, SaveButton } from "../../ui/buttons.tsx";
import { PlusIcon } from "../../ui/icons.tsx";
import { upsertCard } from "./actions.ts";
import { usePendingCards } from "./board-shell.tsx";
import { readTextField } from "./types.ts";

/**
 * The card composer. It stays open after a save, like Trellix, so cards can be typed one after
 * another; each save runs in its own transition and leaves its own optimistic card behind.
 */
export function NewCard({
  boardId,
  columnId,
  nextOrder,
}: {
  boardId: number;
  columnId: string;
  nextOrder: number;
}) {
  let frame = useFrame();
  let { add } = usePendingCards();
  let [composing, setComposing] = useState(false);
  let textAreaRef = useRef<HTMLTextAreaElement>(null);
  let saveRef = useRef<HTMLButtonElement>(null);
  // Saves can outrun re-renders, so orders are handed out from here as well as from the render.
  let issuedOrderRef = useRef(0);

  return (
    <details
      open={composing}
      onToggle={(event) => {
        setComposing(event.currentTarget.open);
        if (event.currentTarget.open) textAreaRef.current?.focus();
      }}
      className="group p-2 pt-1"
    >
      <summary className="flex items-center gap-2 rounded-lg p-2 text-left font-medium text-slate-500 group-open:hidden hover:bg-slate-200">
        <PlusIcon /> Add a card
      </summary>

      <form
        action={upsertCard}
        className="flex flex-col gap-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          let formData = new FormData(event.currentTarget);
          let id = crypto.randomUUID();
          let title = readTextField(formData, "title");
          let order = Math.max(nextOrder, issuedOrderRef.current + 1);
          issuedOrderRef.current = order;

          formData.set("id", id);
          formData.set("order", String(order));

          if (textAreaRef.current) {
            textAreaRef.current.value = "";
            textAreaRef.current.style.height = "";
            textAreaRef.current.focus();
          }

          startTransition(async () => {
            add({ kind: "upsert", id, columnId, title, order });
            await upsertCard(formData);
            await frame.reload();
          });
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setComposing(false);
        }}
      >
        <input type="hidden" name="boardId" value={boardId} />
        <input type="hidden" name="columnId" value={columnId} />
        <input type="hidden" name="order" value={nextOrder} />

        <textarea
          required
          ref={textAreaRef}
          name="title"
          aria-label="New card title"
          placeholder="Enter a title for this card"
          className="h-14 w-full resize-none rounded-lg border-slate-300 px-2 py-1 text-sm shadow shadow-slate-300 outline-none placeholder:text-sm placeholder:text-slate-500"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              saveRef.current?.click();
            }
            if (event.key === "Escape") setComposing(false);
          }}
          onChange={(event) => {
            let element = event.currentTarget;
            element.style.height = `${element.scrollHeight}px`;
          }}
        />

        <div className="flex justify-between">
          <SaveButton ref={saveRef}>Save Card</SaveButton>
          <CancelButton onClick={() => setComposing(false)}>Cancel</CancelButton>
        </div>
      </form>
    </details>
  );
}
