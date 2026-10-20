import { routes } from "../routes.ts";
import { Layout } from "../ui/layout.tsx";

export function AboutPage() {
  return (
    <Layout>
      <div className="card">
        <h1>About Our Bookstore</h1>
        <p className="my-4">
          Welcome to our online bookstore, a demo application built to showcase the capabilities of
          <strong>fetch-router</strong> - a powerful, type-safe routing library for web
          applications.
        </p>

        <h2 className="mt-6 mb-2">What This Demo Shows</h2>
        <ul className="ml-8 leading-loose">
          <li>
            <strong>Resource Routes:</strong> Full RESTful CRUD operations
          </li>
          <li>
            <strong>Nested Routes:</strong> Deep route hierarchies with type safety
          </li>
          <li>
            <strong>Custom Parameters:</strong> Flexible parameter naming (slug, orderId, etc.)
          </li>
          <li>
            <strong>HTTP Methods:</strong> GET, POST, PUT, DELETE properly used
          </li>
          <li>
            <strong>Middleware:</strong> Authentication and authorization
          </li>
          <li>
            <strong>Type Safety:</strong> End-to-end type checking for routes and handlers
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
