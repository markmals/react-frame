"use server";

import { redirect } from "react-server-frame";
import * as s from "remix/data-schema";
import { getContext } from "remix/middleware/async-context";

import { Books } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { getCurrentUser } from "../../../utils/context.ts";
import { saveUpload } from "../../../utils/uploads.ts";
import { BookSchema } from "./schemas.ts";

export async function createBook(formData: FormData) {
  let user = getCurrentUser();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }

  let { db } = getContext();
  let { author, description, genre, inStock, isbn, price, publishedYear, slug, title } = s.parse(
    BookSchema,
    formData,
  );
  let cover = formData.get("cover");
  let cover_url =
    cover instanceof File && cover.size > 0
      ? await saveUpload("cover", cover)
      : "/images/placeholder.jpg";

  await db.create(Books, {
    slug,
    title,
    author,
    description,
    price: parseFloat(price),
    genre,
    cover_url,
    image_urls: JSON.stringify([]),
    isbn,
    published_year: parseInt(publishedYear, 10),
    in_stock: inStock,
  });

  redirect(routes.admin.books.index.href());
}

export async function updateBook(bookId: number, formData: FormData) {
  let user = getCurrentUser();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }

  let { db } = getContext();
  let book = await db.find(Books, bookId);
  if (!book) {
    throw new Error("Book not found");
  }

  let { author, description, genre, inStock, isbn, price, publishedYear, slug, title } = s.parse(
    BookSchema,
    formData,
  );
  let cover = formData.get("cover");
  let cover_url =
    cover instanceof File && cover.size > 0 ? await saveUpload("cover", cover) : book.cover_url;

  await db.update(Books, book.id, {
    slug,
    title,
    author,
    description,
    price: parseFloat(price),
    genre,
    cover_url,
    isbn,
    published_year: parseInt(publishedYear, 10),
    in_stock: inStock,
  });

  redirect(routes.admin.books.index.href());
}

export async function deleteBook(bookId: number) {
  let user = getCurrentUser();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }

  let { db } = getContext();
  let book = await db.find(Books, bookId);
  if (book) {
    await db.delete(Books, book.id);
  }

  redirect(routes.admin.books.index.href());
}
