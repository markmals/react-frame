import { createController } from "remix/router";

import { Books } from "../../../data/schema.ts";
import { requireAdmin } from "../../../middleware/admin.ts";
import { requireAuth } from "../../../middleware/auth.ts";
import { routes } from "../../../routes.ts";
import { parseId } from "../../../utils/ids.ts";
import { createBook, updateBook } from "./actions.ts";
import { AdminBookFormPage } from "./form.tsx";
import { AdminBooksIndexPage } from "./index-page.tsx";
import { AdminBookNotFoundPage, AdminBookShowPage } from "./show-page.tsx";

export default createController(routes.admin.books, {
  middleware: [requireAuth(), requireAdmin()],
  actions: {
    async index({ db, render }) {
      let allBooks = await db.findMany(Books, { orderBy: ["id", "asc"] });

      return render(<AdminBooksIndexPage books={allBooks} />);
    },

    async show({ db, params, render }) {
      let bookId = parseId(params.bookId);
      let book = bookId === undefined ? undefined : await db.find(Books, bookId);

      if (!book) {
        return render(<AdminBookNotFoundPage />, { status: 404 });
      }

      return render(<AdminBookShowPage book={book} />);
    },

    new({ render }) {
      return render(
        <AdminBookFormPage
          title="Add New Book"
          action={createBook}
          cancelHref={routes.admin.books.index.href()}
          submitLabel="Create Book"
        />,
      );
    },

    async edit({ db, params, render }) {
      let bookId = parseId(params.bookId);
      let book = bookId === undefined ? undefined : await db.find(Books, bookId);

      if (!book) {
        return render(<AdminBookNotFoundPage />, { status: 404 });
      }

      return render(
        <AdminBookFormPage
          title="Edit Book"
          action={updateBook.bind(null, book.id)}
          cancelHref={routes.admin.books.index.href()}
          submitLabel="Update Book"
          book={book}
        />,
      );
    },
  },
});
