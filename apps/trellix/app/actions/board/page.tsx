import { Frame } from "react-frame";

import type { Board } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { Layout } from "../../ui/layout.tsx";
import { BoardShell } from "./board-shell.tsx";

/**
 * The board is three nested routes: the page holds the colour and the pending-card state, and
 * frames render the heading and the column strip, which in turn frames each column.
 */
export function BoardPage({ board }: { board: Board }) {
  return (
    <Layout title={`${board.name} | Trellix`}>
      <BoardShell color={board.color}>
        <Frame name="board-title" src={routes.board.title.href({ boardId: board.id })} />
        <Frame name="board-columns" src={routes.board.columns.href({ boardId: board.id })} />
      </BoardShell>
    </Layout>
  );
}

export function BoardNotFoundPage() {
  return (
    <Layout title="Board not found | Trellix">
      <div className="p-8">
        <h1 className="text-2xl font-bold">Board not found</h1>
        <p className="mt-4">
          <a href={routes.boards.index.href()} className="underline">
            Back to your boards
          </a>
        </p>
      </div>
    </Layout>
  );
}
