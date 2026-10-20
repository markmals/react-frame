import { ilike, or } from "remix/data-table";
import { getContext } from "remix/middleware/async-context";

import { Books } from "../data/schema.ts";
import { routes } from "../routes.ts";
import { BookCard } from "../ui/book-card.tsx";
import { Layout } from "../ui/layout.tsx";
import { getCurrentCart } from "../utils/context.ts";

interface SearchPageProps {
  query: string;
}

export function SearchPage({ query }: SearchPageProps) {
  return (
    <Layout>
      <h1>Search Results</h1>

      <div className="card mb-8">
        <form action={routes.search.href()} method="GET" className="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Search books..."
            defaultValue={query}
            className="flex-1 p-2"
          />
          <button type="submit" className="btn">
            Search
          </button>
        </form>
      </div>

      {query ? (
        <SearchResults query={query} />
      ) : (
        <div className="grid grid-cols-books gap-6">
          <p>No books found matching your search.</p>
        </div>
      )}
    </Layout>
  );
}

async function SearchResults({ query }: { query: string }) {
  let { db } = getContext();
  let pattern = `%${query.toLowerCase()}%`;
  let matchingBooks = await db.findMany(Books, {
    where: or(ilike("title", pattern), ilike("author", pattern), ilike("description", pattern)),
    orderBy: ["id", "asc"],
  });
  let cart = getCurrentCart();

  return (
    <>
      <p className="mb-4">
        Found {matchingBooks.length} result(s) for "{query}"
      </p>

      <div className="grid grid-cols-books gap-6">
        {matchingBooks.length > 0 ? (
          matchingBooks.map((book) => {
            let inCart = cart.items.some((item) => item.slug === book.slug);
            return <BookCard key={book.id} book={book} inCart={inCart} />;
          })
        ) : (
          <p>No books found matching your search.</p>
        )}
      </div>
    </>
  );
}
