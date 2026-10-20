import { logout } from "../actions/auth/actions.ts";
import { routes } from "../routes.ts";
import { getCurrentUserSafely } from "../utils/context.ts";
import { Document } from "./document.tsx";

export interface LayoutProps {
  title?: string;
  children?: React.ReactNode;
}

export function Layout({ title, children }: LayoutProps) {
  let user = getCurrentUserSafely();

  return (
    <Document title={title}>
      <header>
        <div className="mx-auto flex max-w-page items-center justify-between px-5">
          <h1>
            <a href={routes.home.href()}>📚 Bookstore</a>
          </h1>
          <nav>
            <a href={routes.home.href()}>Home</a>
            <a href={routes.books.index.href()}>Books</a>
            <a href={routes.about.href()}>About</a>
            <a href={routes.contact.index.href()}>Contact</a>
            <a href={routes.cart.index.href()}>Cart</a>
            {user ? (
              <>
                <a href={routes.account.index.href()}>Account</a>
                {user.role === "admin" ? <a href={routes.admin.index.href()}>Admin</a> : null}
                <form action={logout} className="inline">
                  <button type="submit" className="btn btn-secondary ml-4">
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <a href={routes.auth.login.index.href()}>Login</a>
                <a href={routes.auth.register.index.href()}>Register</a>
              </>
            )}
          </nav>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-page px-5">{children}</div>
      </main>
      <footer>
        <div className="mx-auto max-w-page px-5">
          <p>&copy; {new Date().getFullYear()} Bookstore Demo. Built with Remix and React.</p>
        </div>
      </footer>
    </Document>
  );
}
