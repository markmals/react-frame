import { getContext } from "remix/middleware/async-context";

import { Books } from "../../data/schema.ts";
import { routes } from "../../routes.ts";
import { BookCard } from "../../ui/book-card.tsx";
import { Layout } from "../../ui/layout.tsx";
import { getCurrentCart } from "../../utils/context.ts";

// The genre list and the book grid load their own data. As sibling async components they start
// together instead of one query waiting on the other; the page still renders once both resolve.
export function IndexPage() {
  return (
    <Layout>
      <h1>Browse Books</h1>

      <div className="card mb-8">
        <form action={routes.search.href()} method="GET" className="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search books by title, author, or description..."
            className="flex-1 p-2"
          />
          <button type="submit" className="btn">
            Search
          </button>
        </form>
      </div>

      <div className="card mb-8">
        <h3>Browse by Genre</h3>
        <GenreLinks />
      </div>

      <AllBooks />
    </Layout>
  );
}

async function GenreLinks() {
  let { db } = getContext();
  let genreRows = await db.query(Books).select("genre").distinct().orderBy("genre", "asc").all();

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {genreRows.map(({ genre }) => (
        <a key={genre} href={routes.books.genre.href({ genre })} className="btn btn-secondary">
          {genre}
        </a>
      ))}
    </div>
  );
}

async function AllBooks() {
  let { db } = getContext();
  let allBooks = await db.findMany(Books, { orderBy: ["id", "asc"] });
  let cart = getCurrentCart();

  return (
    <div className="grid grid-cols-books gap-6">
      {allBooks.map((book) => {
        let inCart = cart.items.some((item) => item.slug === book.slug);
        return <BookCard key={book.id} book={book} inCart={inCart} />;
      })}
    </div>
  );
}
