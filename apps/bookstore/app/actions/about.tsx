import { routes } from "../routes.ts";
import { Layout } from "../ui/layout.tsx";

export function AboutPage() {
  return (
    <Layout>
      <div className="card">
        <h1>About Our Bookstore</h1>
        <p className="my-4">
          Welcome to our online bookstore, a port of the Remix 3 bookstore demo to React Server
          Components. Remix's router still handles every request, from typed routes to middleware
          and sessions. The pages are React components rendered on the server by{" "}
          <strong>react-server-frame</strong>.
        </p>

        <h2 className="mt-6 mb-2">What This Demo Shows</h2>
        <ul className="ml-8 leading-loose">
          <li>
            <strong>Typed Routes:</strong> Nested resources with custom parameters (slug, orderId,
            etc.), type checked from route to link
          </li>
          <li>
            <strong>Middleware:</strong> Authentication and authorization before every page and
            frame
          </li>
          <li>
            <strong>Server Components:</strong> Async components that load their own data, so the
            genre list and the book grid query in parallel
          </li>
          <li>
            <strong>Frames:</strong> The cart button and cart table are routes rendered in place,
            and each reloads on its own after a change
          </li>
          <li>
            <strong>Server Functions:</strong> Every form that changes data calls one, and still
            works before JavaScript loads
          </li>
          <li>
            <strong>Navigation:</strong> Links and the search form load new pages through the
            Navigation API, without reloading the document
          </li>
        </ul>

        <h2 className="mt-6 mb-2">Try It Out</h2>
        <p className="my-4">
          Explore the site to see all these features in action. You can browse books, create an
          account, add items to your cart, and even access the admin panel (login as
          admin@bookstore.com / admin123).
        </p>

        <p className="mt-8">
          <a href={routes.books.index.href()} className="btn">
            Explore Books
          </a>
          <a href={routes.auth.register.index.href()} className="btn btn-secondary ml-4">
            Create Account
          </a>
        </p>
      </div>
    </Layout>
  );
}
