"use server";

import { setTimeout as sleep } from "node:timers/promises";

import * as s from "remix/data-schema";
import * as f from "remix/data-schema/form-data";
import { getContext } from "remix/middleware/async-context";

import { Books } from "../../../data/schema.ts";
import { removeFromCart, updateCartItem as updateItem } from "../../../utils/cart.ts";
import { getCurrentCart } from "../../../utils/context.ts";
import { parseId } from "../../../utils/ids.ts";

const BookIdField = f.field(s.optional(s.string()));
const QuantityField = f.field(s.defaulted(s.string(), "1"));
const CartActionSchema = f.object({
  bookId: BookIdField,
});
const CartUpdateSchema = f.object({
  bookId: BookIdField,
  quantity: QuantityField,
});

export async function updateCartItem(formData: FormData) {
  let { db, session } = getContext();
  let { bookId, quantity } = s.parse(CartUpdateSchema, formData);
  await sleep(1000);

  let parsedBookId = parseId(bookId);
  let book = parsedBookId === undefined ? undefined : await db.find(Books, parsedBookId);
  if (!book) {
    throw new Error("Book not found");
  }

  let nextQuantity = parseInt(quantity, 10);
  session.set("cart", updateItem(getCurrentCart(session), book.id, nextQuantity));
}

export async function removeCartItem(formData: FormData) {
  let { db, session } = getContext();
  let { bookId } = s.parse(CartActionSchema, formData);
  if (process.env.NODE_ENV !== "test") {
    await sleep(1000);
  }

  let parsedBookId = parseId(bookId);
  let book = parsedBookId === undefined ? undefined : await db.find(Books, parsedBookId);
  if (!book) {
    throw new Error("Book not found");
  }

  session.set("cart", removeFromCart(getCurrentCart(session), book.id));
}
