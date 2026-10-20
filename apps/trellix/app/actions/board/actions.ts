"use server";

import { redirect } from "react-frame";
import * as s from "remix/data-schema";
import * as f from "remix/data-schema/form-data";
import { getContext } from "remix/middleware/async-context";

import { Boards, Columns, Items } from "../../data/schema.ts";
import type { Board } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { getCurrentAccountSafely, parseBoardId } from "../../utils/context.ts";
import { findOwnedBoard } from "./queries.ts";

const TextField = f.field(s.defaulted(s.string(), ""));

const BoardNameSchema = f.object({ boardId: TextField, name: TextField });
const NewColumnSchema = f.object({ boardId: TextField, id: TextField, name: TextField });
const ColumnNameSchema = f.object({ boardId: TextField, columnId: TextField, name: TextField });
const CardSchema = f.object({
  boardId: TextField,
  id: TextField,
  columnId: TextField,
  title: TextField,
  order: TextField,
});
const CardIdSchema = f.object({ boardId: TextField, id: TextField });

export async function renameBoard(formData: FormData) {
  let { boardId, name } = s.parse(BoardNameSchema, formData);
  let board = await loadBoard(boardId);
  if (!board || !requireText(board, name)) return;

  await getContext().db.update(Boards, board.id, { name });
}

export async function createColumn(formData: FormData) {
  let { boardId, id, name } = s.parse(NewColumnSchema, formData);
  let board = await loadBoard(boardId);
  if (!board || !requireText(board, name)) return;

  let { db } = getContext();
  let columnCount = await db.count(Columns, { where: { board_id: board.id } });

  await db.create(Columns, {
    // Without JavaScript the form posts no id, so the server names the column instead.
    id: id || crypto.randomUUID(),
    board_id: board.id,
    name,
    sort_order: columnCount + 1,
  });
}

export async function renameColumn(formData: FormData) {
  let { boardId, columnId, name } = s.parse(ColumnNameSchema, formData);
  let board = await loadBoard(boardId);
  if (!board || !requireText(board, name)) return;

  await getContext().db.updateMany(
    Columns,
    { name },
    { where: { id: columnId, board_id: board.id } },
  );
}

/** Trellix's item upsert: the same mutation creates a card and moves one between columns. */
export async function upsertCard(formData: FormData) {
  let { boardId, columnId, id, order, title } = s.parse(CardSchema, formData);
  let board = await loadBoard(boardId);
  if (!board || !requireText(board, title)) return;

  let sortOrder = Number(order);
  let { db } = getContext();
  let column = await db.findOne(Columns, { where: { id: columnId, board_id: board.id } });

  if (!column || !Number.isFinite(sortOrder)) {
    redirect(routes.board.index.href({ boardId: board.id }));
    return;
  }

  let cardId = id || crypto.randomUUID();
  let existing = await db.find(Items, cardId);

  if (existing && existing.board_id !== board.id) {
    redirect(routes.boards.index.href());
    return;
  }

  if (existing) {
    await db.update(Items, cardId, { title, column_id: column.id, sort_order: sortOrder });
    return;
  }

  await db.create(Items, {
    id: cardId,
    title,
    content: null,
    sort_order: sortOrder,
    column_id: column.id,
    board_id: board.id,
  });
}

export async function deleteCard(formData: FormData) {
  let { boardId, id } = s.parse(CardIdSchema, formData);
  let board = await loadBoard(boardId);
  if (!board) return;

  await getContext().db.deleteMany(Items, { where: { id, board_id: board.id } });
}

/**
 * A server function that throws takes the whole submission down before JavaScript loads, since
 * nothing renders an error page for a form post (see the findings). A refused mutation sends the
 * browser somewhere safe instead: to the login page, or back to the boards that are theirs.
 */
async function loadBoard(boardId: string): Promise<Board | null> {
  let account = getCurrentAccountSafely();

  if (!account) {
    redirect(routes.auth.login.index.href());
    return null;
  }

  let board = await findOwnedBoard(getContext().db, parseBoardId(boardId), account.id);

  if (!board) {
    redirect(routes.boards.index.href());
    return null;
  }

  return board;
}

function requireText(board: Board, value: string): boolean {
  if (value.trim()) return true;

  redirect(routes.board.index.href({ boardId: board.id }));
  return false;
}
