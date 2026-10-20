import { inList } from "remix/data-table";
import { getContext } from "remix/middleware/async-context";

import { Books } from "../data/schema.ts";
import { routes } from "../routes.ts";
import { BookCard } from "../ui/book-card.tsx";
import { Layout } from "../ui/layout.tsx";
import { getCurrentCart } from "../utils/context.ts";

const featuredSlugs = ["bbq", "heavy-metal", "three-ways"];

export function HomePage() {
  return (
    <Layout>
      <div className="card">
        <h1>Welcome to the Bookstore</h1>
        <p className="my-4">
          Discover your next favorite book from our curated collection of fiction, non-fiction, and
          more.
        </p>
        <p>
          <a href={routes.books.index.href()} className="btn">
            Browse Books
          </a>
        </p>
      </div>

      <h2 className="mt-8 mb-4">Featured Books</h2>
      <FeaturedBooks />
    </Layout>
  );
}

async function FeaturedBooks() {
  let { db } = getContext();
  let featuredBookRows = await db.findMany(Books, {
    where: inList("slug", featuredSlugs),
  });
  let featuredBooksBySlug = new Map(featuredBookRows.map((book) => [book.slug, book]));
  let featuredBooks = featuredSlugs.flatMap((slug) => {
    let book = featuredBooksBySlug.get(slug);
    return book ? [book] : [];
  });
  let cart = getCurrentCart();

  return (
    <div className="grid grid-cols-books gap-6">
      {featuredBooks.map((book) => {
        let inCart = cart.items.some((item) => item.slug === book.slug);
        return <BookCard key={book.id} book={book} inCart={inCart} />;
      })}
    </div>
  );
}
