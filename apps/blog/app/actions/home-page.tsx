import { postListHref, routes } from "../routes.ts";
import { Archive } from "../ui/archive.tsx";
import { Layout } from "../ui/layout.tsx";

export function HomePage() {
  return (
    <Layout description="Notes on building for the web: rendering, routing, forms, and the operational details in between.">
      <Archive listSrc={postListHref()}>
        <section>
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">About</h2>
          <p className="mt-3 text-sm text-muted">
            Marginalia is a demo blog. Three writers, eight posts, and a comment section that works
            with JavaScript switched off.
          </p>
          <p className="mt-3 text-sm">
            <a href={routes.feed.href()}>Subscribe by RSS</a>
          </p>
        </section>
      </Archive>
    </Layout>
  );
}
