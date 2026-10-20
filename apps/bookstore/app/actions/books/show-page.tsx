import { Frame } from "react-frame";

import type { Book } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { Layout } from "../../ui/layout.tsx";
import { ImageCarousel } from "./image-carousel.tsx";

export interface ShowPageProps {
  book: Book;
  imageUrls: string[];
}

export function ShowPage({ book, imageUrls }: ShowPageProps) {
  return (
    <Layout>
      <div className="grid grid-cols-book-detail gap-8">
        <div className="h-100 overflow-hidden rounded-lg shadow-cover">
          <ImageCarousel images={imageUrls} />
        </div>

        <div className="card">
          <h1>{book.title}</h1>
          <p className="author my-2 text-lead">by {book.author}</p>

          <p className="my-4">
            <span className="badge badge-info">{book.genre}</span>
            <span className={`badge ml-2 ${book.in_stock ? "badge-success" : "badge-warning"}`}>
              {book.in_stock ? "In Stock" : "Out of Stock"}
            </span>
          </p>

          <p className="price my-4 text-display">${book.price.toFixed(2)}</p>

          <p className="my-6 leading-prose">{book.description}</p>

          <div className="my-6 rounded bg-panel p-4">
            <p>
              <strong>ISBN:</strong> {book.isbn}
            </p>
            <p>
              <strong>Published:</strong> {book.published_year}
            </p>
          </div>

          {book.in_stock ? (
            <div className="mt-8">
              <Frame src={routes.fragments.cartButton.href({ bookId: book.id })} />
            </div>
          ) : (
            <p className="font-medium text-danger">This book is currently out of stock.</p>
          )}

          <p className="mt-6">
            <a href={routes.books.index.href()} className="btn btn-secondary">
              Back to Books
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}

export function BookNotFoundPage() {
  return (
    <Layout>
      <div className="card">
        <h1>Book Not Found</h1>
      </div>
    </Layout>
  );
}
