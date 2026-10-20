import { routes } from "../routes.ts";
import { Document } from "./document.tsx";

export interface LayoutProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function Layout({ title, description, children }: LayoutProps) {
  return (
    <Document title={title} description={description}>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-rule bg-surface">
          <div className="mx-auto flex max-w-page flex-wrap items-baseline gap-x-6 gap-y-2 px-5 py-5">
            <a
              href={routes.home.href()}
              className="font-serif text-title font-bold text-ink no-underline"
            >
              Marginalia
            </a>
            <p className="m-0 mr-auto text-sm text-muted">
              Notes on building for the web, published irregularly.
            </p>
            <nav className="flex items-center gap-5 text-sm">
              <a href={routes.home.href()}>Archive</a>
              <a href={routes.feed.href()}>RSS</a>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-page grow px-5 py-10">{children}</main>

        <footer className="border-t border-rule bg-surface">
          <div className="mx-auto max-w-page px-5 py-6 text-sm text-muted">
            <p>
              Marginalia is a demo blog built on react-frame. Everything here is fiction, including
              the opinions.
            </p>
          </div>
        </footer>
      </div>
    </Document>
  );
}
