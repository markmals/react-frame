import type { Book } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { BookCard } from "../../ui/book-card.tsx";
import { Layout } from "../../ui/layout.tsx";
import type { Cart } from "../../utils/cart.ts";

export interface GenrePageProps {
  genre: string;
  matchingBooks: Book[];
  cart: Cart;
}

export function GenrePage({ cart, genre, matchingBooks }: GenrePageProps) {
  return (
    <Layout>
      <h1>{genre.charAt(0).toUpperCase() + genre.slice(1)} Books</h1>
      <p className="my-4">
        <a href={routes.books.index.href()} className="btn btn-secondary">
          View All Books
        </a>
      </p>

      <div className="mt-8 grid grid-cols-books gap-6">
        {matchingBooks.map((book) => {
          let inCart = cart.items.some((item) => item.slug === book.slug);
          return <BookCard key={book.id} book={book} inCart={inCart} />;
        })}
      </div>
    </Layout>
  );
}

export function GenreNotFoundPage({ genre }: { genre: string }) {
  return (
    <Layout>
      <div className="card">
        <h1>Genre Not Found</h1>
        <p>No books found in the "{genre}" genre.</p>
        <p className="mt-4">
          <a href={routes.books.index.href()} className="btn">
            Browse All Books
          </a>
        </p>
      </div>
    </Layout>
  );
}
