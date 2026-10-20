import { useFrame } from "react-frame/client";

import { routes } from "../routes.ts";

interface LayoutProps {
  children?: React.ReactNode;
  url: URL;
}

export function Layout({ children, url }: LayoutProps) {
  // Pages render outside any frame, so this is the page's own frame: while a navigation loads,
  // `src` is its destination. A submission to the same page keeps showing it instead.
  let page = useFrame();
  let showLoading = page.pending && new URL(page.src, url).pathname !== url.pathname;

  return (
    <div className="min-h-screen min-w-80">
      <div className="mx-auto w-full max-w-3xl px-4">
        <header className="flex items-center justify-between py-6">
          <a href={routes.home.href()} className="text-lg font-bold text-inherit no-underline">
            React Frame SPA
          </a>
          <nav aria-label="Main navigation" className="flex gap-2">
            <NavLink href={routes.home.href()} current={url.pathname === routes.home.href()}>
              Home
            </NavLink>
            <NavLink href={routes.about.href()} current={url.pathname === routes.about.href()}>
              About
            </NavLink>
            <NavLink href={routes.greet.href()} current={url.pathname === routes.greet.href()}>
              Greet
            </NavLink>
          </nav>
        </header>
        <main
          aria-busy={showLoading}
          className="min-h-72 rounded-2xl border border-line bg-white p-panel shadow-panel"
        >
          {showLoading ? <LoadingIndicator /> : children}
        </main>
      </div>
    </div>
  );
}

interface NavLinkProps {
  children?: React.ReactNode;
  current: boolean;
  href: string;
}

function NavLink({ children, current, href }: NavLinkProps) {
  return (
    <a
      href={href}
      aria-current={current ? "page" : undefined}
      className="rounded-full px-3 py-2 text-brand no-underline hover:bg-brand-tint aria-[current=page]:bg-brand-tint"
    >
      {children}
    </a>
  );
}

export function LoadingIndicator() {
  return (
    <div role="status" className="w-full p-8 text-center text-lg text-accent">
      Loading…
    </div>
  );
}
