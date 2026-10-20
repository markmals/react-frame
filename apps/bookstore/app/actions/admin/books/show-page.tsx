import type { Book } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { Layout } from "../../../ui/layout.tsx";

export function AdminBookNotFoundPage() {
  return (
    <Layout>
      <div className="card">
        <h1>Book Not Found</h1>
      </div>
    </Layout>
  );
}

export function AdminBookShowPage({ book }: { book: Book }) {
  return (
    <Layout>
      <h1>Book Details</h1>

      <div className="card">
        <p>
          <strong>Title:</strong> {book.title}
        </p>
        <p>
          <strong>Author:</strong> {book.author}
        </p>
        <p>
          <strong>Slug:</strong> {book.slug}
        </p>
        <p>
          <strong>Description:</strong> {book.description}
        </p>
        <p>
          <strong>Price:</strong> ${book.price.toFixed(2)}
        </p>
        <p>
          <strong>Genre:</strong> {book.genre}
        </p>
        <p>
          <strong>ISBN:</strong> {book.isbn}
        </p>
        <p>
          <strong>Published:</strong> {book.published_year}
        </p>
        <p>
          <strong>In Stock:</strong>{" "}
          <span className={`badge ${book.in_stock ? "badge-success" : "badge-warning"}`}>
            {book.in_stock ? "Yes" : "No"}
          </span>
        </p>

        <div className="mt-8">
          <a href={routes.admin.books.edit.href({ bookId: book.id })} className="btn">
            Edit
          </a>
          <a href={routes.admin.books.index.href()} className="btn btn-secondary ml-2">
            Back to List
          </a>
        </div>
      </div>
    </Layout>
  );
}
