import type { Database } from "remix/data-table";

import { Boards } from "../../data/schema.ts";
import type { Board } from "../../data/schema.ts";

/** Every board page and board mutation loads the board this way, so ownership is checked once. */
export function findOwnedBoard(
  db: Database,
  boardId: number | undefined,
  accountId: string,
): Promise<Board | null> {
  if (boardId === undefined) {
    return Promise.resolve(null);
  }

  return db.findOne(Boards, { where: { id: boardId, account_id: accountId } });
}
