import { Frame } from "react-frame";

import { listAuthors, listDrafts, listTags } from "../content.ts";
import { routes } from "../routes.ts";
import { TagLink } from "./tag-link.tsx";

export interface ArchiveProps {
  /** The `fragments.postList` URL the frame starts on; see `postListHref()`. */
  listSrc: string;
  children?: React.ReactNode;
}

/** The two-column archive shell shared by the home, tag, and author pages. */
export function Archive({ listSrc, children }: ArchiveProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-archive">
      {/* No <Suspense>: the list is the page's main content, so it belongs in the first flush,
          where readers and crawlers without JavaScript can see it. */}
      <div>
        <Frame name="post-list" src={listSrc} />
      </div>

      <aside className="flex flex-col gap-8">
        {children}
        <TagIndex />
        <AuthorIndex />
        <DraftIndex />
      </aside>
    </div>
  );
}

// Drafts are never listed with published posts. This panel is how a writer finds the preview
// link, and it renders nothing at all in a production build.
async function DraftIndex() {
  let drafts = await listDrafts();
  if (drafts.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-bold tracking-wide text-danger uppercase">Drafts in progress</h2>
      <ul className="mt-3 flex list-none flex-col gap-2 p-0 text-sm">
        {drafts.map((draft) => (
          <li key={draft.slug}>
            <a href={routes.posts.show.href({ slug: draft.slug })}>{draft.title}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function TagIndex() {
  let tags = await listTags();

  return (
    <section>
      <h2 className="text-sm font-bold tracking-wide text-muted uppercase">Tags</h2>
      <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <TagLink tag={tag} count={count} />
          </li>
        ))}
      </ul>
    </section>
  );
}

async function AuthorIndex() {
  let authors = await listAuthors();

  return (
    <section>
      <h2 className="text-sm font-bold tracking-wide text-muted uppercase">Writers</h2>
      <ul className="mt-3 flex list-none flex-col gap-2 p-0 text-sm">
        {authors.map((author) => (
          <li key={author.id}>
            <a href={routes.authors.show.href({ authorId: author.id })}>{author.name}</a>
            <span className="text-muted"> — {author.role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
