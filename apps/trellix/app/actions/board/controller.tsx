import { createController } from "remix/router";

import { Columns, Items } from "../../data/schema.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { routes } from "../../routes.ts";
import { getCurrentAccount, parseBoardId } from "../../utils/context.ts";
import { BoardTitle } from "./board-title.tsx";
import { Column } from "./column.tsx";
import { BoardColumnsSection } from "./columns-section.tsx";
import { BoardNotFoundPage, BoardPage } from "./page.tsx";
import { findOwnedBoard } from "./queries.ts";

// Frames load through the router, so each section re-checks that the signed-in account owns the
// board: a frame request is a request like any other.
export default createController(routes.board, {
  middleware: [requireAuth()],
  actions: {
    async index({ auth, db, params, render }) {
      let board = await findOwnedBoard(
        db,
        parseBoardId(params.boardId),
        getCurrentAccount(auth).id,
      );

      if (!board) {
        return render(<BoardNotFoundPage />, { status: 404 });
      }

      return render(<BoardPage board={board} />, { headers: { "Cache-Control": "no-store" } });
    },

    async title({ auth, db, params, render }) {
      let board = await findOwnedBoard(
        db,
        parseBoardId(params.boardId),
        getCurrentAccount(auth).id,
      );

      if (!board) {
        return render(<p className="p-8">Board not found</p>, sectionInit({ status: 404 }));
      }

      return render(<BoardTitle boardId={board.id} name={board.name} />, sectionInit());
    },

    async columns({ auth, db, params, render }) {
      let board = await findOwnedBoard(
        db,
        parseBoardId(params.boardId),
        getCurrentAccount(auth).id,
      );

      if (!board) {
        return render(<p className="p-8">Board not found</p>, sectionInit({ status: 404 }));
      }

      let columns = await db.findMany(Columns, {
        where: { board_id: board.id },
        orderBy: ["sort_order", "asc"],
      });

      return render(
        <BoardColumnsSection
          boardId={board.id}
          columns={columns.map((column) => ({
            id: column.id,
            name: column.name,
            order: column.sort_order,
          }))}
        />,
        sectionInit(),
      );
    },

    async column({ auth, db, params, render }) {
      let board = await findOwnedBoard(
        db,
        parseBoardId(params.boardId),
        getCurrentAccount(auth).id,
      );
      let column = board
        ? await db.findOne(Columns, { where: { id: params.columnId, board_id: board.id } })
        : null;

      if (!board || !column) {
        return render(<p className="p-2">Column not found</p>, sectionInit({ status: 404 }));
      }

      let items = await db.findMany(Items, {
        where: { column_id: column.id },
        orderBy: ["sort_order", "asc"],
      });

      return render(
        <Column
          boardId={board.id}
          columnId={column.id}
          name={column.name}
          cards={items.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            order: item.sort_order,
            columnId: item.column_id,
          }))}
        />,
        sectionInit(),
      );
    },
  },
});

function sectionInit(init?: ResponseInit): ResponseInit {
  let headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return { ...init, headers };
}
