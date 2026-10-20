"use client";

import { startTransition, useOptimistic } from "react";
import { useFrame } from "react-frame/client";

import type { Board } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { TrashIcon } from "../../ui/icons.tsx";
import { deleteBoard } from "./actions.ts";

/**
 * The board list is its own route so deleting a board reloads just this frame. The deleted board
 * leaves the list through `useOptimistic` while the server function and the reload run.
 */
export function BoardList({ boards }: { boards: Board[] }) {
  let frame = useFrame();
  let [visibleBoards, hideBoard] = useOptimistic(boards, (current, deletedId: number) =>
    current.filter((board) => board.id !== deletedId),
  );

  if (visibleBoards.length === 0) {
    return <p className="text-slate-500">No boards yet. Create one above to get started.</p>;
  }

  return (
    <nav className="flex flex-wrap gap-8">
      {visibleBoards.map((board) => (
        <div
          key={board.id}
          className="relative h-40 w-60 rounded border-b-8 bg-white p-4 shadow hover:shadow-lg"
          style={{ borderColor: board.color }}
        >
          <a href={routes.board.index.href({ boardId: board.id })} className="font-bold">
            {board.name}
          </a>

          <form
            action={deleteBoard}
            onSubmit={(event) => {
              event.preventDefault();
              let formData = new FormData(event.currentTarget);
              startTransition(async () => {
                hideBoard(board.id);
                await deleteBoard(formData);
                await frame.reload();
              });
            }}
          >
            <input type="hidden" name="boardId" value={board.id} />
            <button
              type="submit"
              aria-label={`Delete board "${board.name}"`}
              className="absolute top-4 right-4 hover:text-brand-red"
            >
              <TrashIcon />
            </button>
          </form>
        </div>
      ))}
    </nav>
  );
}
