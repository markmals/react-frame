"use server";

import * as s from "remix/data-schema";
import * as f from "remix/data-schema/form-data";
import { getContext } from "remix/middleware/async-context";

import { Books } from "../../data/schema.ts";
import { addToCart, removeFromCart } from "../../utils/cart.ts";
import { getCurrentCart } from "../../utils/context.ts";
import { parseId } from "../../utils/ids.ts";

const BookIdField = f.field(s.optional(s.string()));
const BookIdSchema = f.object({
  bookId: BookIdField,
});

export async function toggleCart(formData: FormData) {
  let { db, session } = getContext();
  let { bookId } = s.parse(BookIdSchema, formData);
  let parsedBookId = parseId(bookId);
  let book = parsedBookId === undefined ? undefined : await db.find(Books, parsedBookId);
  if (!book) {
    throw new Error("Book not found");
  }

  let cart = getCurrentCart(session);
  let inCart = cart.items.some((item) => item.bookId === book.id);

  let next = inCart
    ? removeFromCart(cart, book.id)
    : addToCart(cart, book.id, book.slug, book.title, book.price, 1);

  session.set("cart", next);
}
