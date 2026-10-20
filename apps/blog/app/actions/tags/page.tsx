import { postListHref } from "../../routes.ts";
import { Archive } from "../../ui/archive.tsx";
import { Layout } from "../../ui/layout.tsx";

export interface TagPageProps {
  tag: string;
  count: number;
}

export function TagPage({ tag, count }: TagPageProps) {
  return (
    <Layout
      title={`#${tag}`}
      description={`${count} post${count === 1 ? "" : "s"} tagged #${tag} on Marginalia.`}
    >
      <Archive listSrc={postListHref({ tag })}>
        <section>
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">About this tag</h2>
          <p className="mt-3 text-sm text-muted">
            Everything filed under <strong>#{tag}</strong>. Picking another tag swaps the list
            without reloading the page around it.
          </p>
        </section>
      </Archive>
    </Layout>
  );
}
