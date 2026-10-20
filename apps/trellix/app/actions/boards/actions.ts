"use server";

import { redirect } from "react-frame";
import * as s from "remix/data-schema";
import * as f from "remix/data-schema/form-data";
import { getContext } from "remix/middleware/async-context";

import { Boards } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { getCurrentAccountSafely, parseBoardId } from "../../utils/context.ts";

const NewBoardSchema = f.object({
  name: f.field(s.defaulted(s.string(), "")),
  color: f.field(s.defaulted(s.string(), "#cbd5e1")),
});

export async function createBoard(formData: FormData) {
  let account = getCurrentAccountSafely();
  let { color, name } = s.parse(NewBoardSchema, formData);

  if (!account || !name.trim()) {
    redirect(account ? routes.boards.index.href() : routes.auth.login.index.href());
    return;
  }

  let board = await getContext().db.create(
    Boards,
    { name, color, account_id: account.id },
    { returnRow: true },
  );

  redirect(routes.board.index.href({ boardId: board.id }));
}

export async function deleteBoard(formData: FormData) {
  let account = getCurrentAccountSafely();
  let boardId = parseBoardId(formData.get("boardId"));

  if (!account) {
    redirect(routes.auth.login.index.href());
    return;
  }

  if (boardId === undefined) {
    redirect(routes.boards.index.href());
    return;
  }

  // Scoping the delete by account_id is the ownership check: another account's board matches no row.
  await getContext().db.deleteMany(Boards, {
    where: { id: boardId, account_id: account.id },
  });
}
