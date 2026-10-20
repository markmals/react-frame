import { Frame } from "react-frame";

import type { Book } from "../data/schema.ts";
import { routes } from "../routes.ts";

export interface BookCardProps {
  book: Book;
  inCart: boolean;
}

export function BookCard({ book }: BookCardProps) {
  return (
    <div className="book-card" data-test-slug={book.slug}>
      <img src={book.cover_url} alt={book.title} />
      <div className="book-card-body">
        <h3>{book.title}</h3>
        <p className="author">by {book.author}</p>
        <p className="price">${book.price.toFixed(2)}</p>
        <div className="flex items-center gap-2">
          <a href={routes.books.show.href({ slug: book.slug })} className="btn">
            View Details
          </a>

          <Frame src={routes.fragments.cartButton.href({ bookId: book.id })} />
        </div>
      </div>
    </div>
  );
}
