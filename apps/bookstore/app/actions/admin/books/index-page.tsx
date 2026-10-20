import type { Book } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";
import { deleteBook } from "./actions.ts";

export function AdminBooksIndexPage({ books }: { books: Book[] }) {
  return (
    <Layout>
      <h1>Manage Books</h1>

      <p className="mb-4">
        <a href={routes.admin.books.new.href()} className="btn">
          Add New Book
        </a>
        <a href={routes.admin.index.href()} className="btn btn-secondary ml-2">
          Back to Dashboard
        </a>
      </p>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.genre}</td>
                <td>${book.price.toFixed(2)}</td>
                <td>
                  <span className={`badge ${book.in_stock ? "badge-success" : "badge-warning"}`}>
                    {book.in_stock ? "Yes" : "No"}
                  </span>
                </td>
                <td className="actions">
                  <a
                    href={routes.admin.books.edit.href({ bookId: book.id })}
                    className="btn btn-secondary px-2 py-1 text-sm"
                  >
                    Edit
                  </a>
                  <form action={deleteBook.bind(null, book.id)} className="inline">
                    <button type="submit" className="btn btn-danger px-2 py-1 text-sm">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
