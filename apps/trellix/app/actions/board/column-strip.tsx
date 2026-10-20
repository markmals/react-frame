"use client";

import { startTransition, useCallback, useOptimistic, useRef, useState } from "react";
import { useFrame } from "react-frame/client";

import { CancelButton, SaveButton } from "../../ui/buttons.tsx";
import { PlusIcon } from "../../ui/icons.tsx";
import { createColumn } from "./actions.ts";
import { readTextField } from "./types.ts";

interface PendingColumn {
  id: string;
  name: string;
}

/**
 * The horizontal strip of columns. `children` are the columns' frames, rendered on the server, so
 * a new column can't be one until it exists: it shows as a plain placeholder until the strip
 * reloads and the server hands back a real column frame in its place.
 */
export function ColumnStrip({
  boardId,
  children,
  startOpen,
}: {
  boardId: number;
  children: React.ReactNode;
  startOpen: boolean;
}) {
  let frame = useFrame();
  let [pendingColumns, addColumn] = useOptimistic<PendingColumn[], PendingColumn>(
    [],
    (pending, column) => [...pending, column],
  );
  let [composing, setComposing] = useState(startOpen);
  let inputRef = useRef<HTMLInputElement>(null);

  let scrollIntoView = useCallback((node: HTMLElement | null) => {
    node?.scrollIntoView({ block: "nearest", inline: "end" });
  }, []);

  return (
    <div className="flex h-full min-h-0 grow items-start gap-4 overflow-x-auto px-8 pb-4">
      {children}

      {pendingColumns.map((column) => (
        <div
          key={column.id}
          ref={scrollIntoView}
          className="flex max-h-full w-80 shrink-0 flex-col overflow-hidden rounded-xl bg-slate-100 shadow-sm shadow-slate-400"
        >
          <div className="p-2">
            <span className="block rounded-lg border border-transparent px-2 py-1 text-left font-medium text-slate-600">
              {column.name}
            </span>
          </div>
          <div className="min-h-hairline grow" />
        </div>
      ))}

      <details
        open={composing}
        onToggle={(event) => {
          setComposing(event.currentTarget.open);
          if (event.currentTarget.open) inputRef.current?.focus();
        }}
        className="group shrink-0"
      >
        <summary
          aria-label="Add new column"
          className="flex h-16 w-16 items-center justify-center rounded-xl bg-black/10 text-white group-open:hidden hover:bg-white/10"
        >
          <PlusIcon size="xl" />
        </summary>

        <form
          action={createColumn}
          className="flex max-h-full w-80 shrink-0 flex-col gap-5 overflow-hidden rounded-xl bg-slate-100 p-2 shadow"
          onSubmit={(event) => {
            event.preventDefault();
            let formData = new FormData(event.currentTarget);
            let id = crypto.randomUUID();
            formData.set("id", id);
            let name = readTextField(formData, "name");

            if (inputRef.current) inputRef.current.value = "";

            startTransition(async () => {
              addColumn({ id, name });
              await createColumn(formData);
              await frame.reload();
            });
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setComposing(false);
          }}
        >
          <input type="hidden" name="boardId" value={boardId} />
          <input
            required
            ref={inputRef}
            type="text"
            name="name"
            aria-label="New column name"
            className="w-full rounded-lg border border-slate-400 px-2 py-1 font-medium text-black"
          />
          <div className="flex justify-between">
            <SaveButton>Save Column</SaveButton>
            <CancelButton onClick={() => setComposing(false)}>Cancel</CancelButton>
          </div>
        </form>
      </details>

      {/* Matches the strip's padding on the right of the last column while scrolled to the end. */}
      <div className="h-1 w-8 shrink-0" />
    </div>
  );
}
