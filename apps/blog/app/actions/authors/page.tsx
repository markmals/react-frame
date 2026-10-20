import type { Author } from "../../content.ts";
import { postListHref } from "../../routes.ts";
import { Archive } from "../../ui/archive.tsx";
import { Layout } from "../../ui/layout.tsx";

export interface AuthorPageProps {
  author: Author;
  count: number;
}

export function AuthorPage({ author, count }: AuthorPageProps) {
  return (
    <Layout title={author.name} description={author.bio}>
      <Archive listSrc={postListHref({ authorId: author.id })}>
        <section>
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">About</h2>
          <p className="mt-3 font-serif text-lede font-bold">{author.name}</p>
          <p className="text-sm text-muted">{author.role}</p>
          <p className="mt-3 text-sm text-muted">{author.bio}</p>
          <p className="mt-3 text-sm text-muted">
            {count} post{count === 1 ? "" : "s"} published.
          </p>
        </section>
      </Archive>
    </Layout>
  );
}
