import { routes } from "../routes.ts";
import { Layout } from "./layout.tsx";

export interface NotFoundPageProps {
  title: string;
  children?: React.ReactNode;
}

export function NotFoundPage({ title, children }: NotFoundPageProps) {
  return (
    <Layout title={title}>
      <div className="mx-auto max-w-measure rounded-card border border-rule bg-surface p-8 shadow-raised">
        <p className="m-0 text-sm font-bold tracking-wide text-muted uppercase">404</p>
        <h1 className="mt-2 font-serif text-heading leading-tight font-bold">{title}</h1>
        <div className="mt-4 text-muted">{children}</div>
        <p className="mt-6">
          <a href={routes.home.href()}>Back to the archive</a>
        </p>
      </div>
    </Layout>
  );
}
