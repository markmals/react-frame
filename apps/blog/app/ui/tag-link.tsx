import { postListHref, routes } from "../routes.ts";

export interface TagLinkProps {
  tag: string;
  count?: number;
}

/**
 * Moves the address bar to the tag's page but loads only the post list, by naming the frame the
 * archive pages mount. On a page without that frame — a post, for instance — the browser follows
 * `href` and navigates normally.
 */
export function TagLink({ tag, count }: TagLinkProps) {
  return (
    <a
      href={routes.tags.show.href({ tag })}
      data-target="post-list"
      data-src={postListHref({ tag })}
      className="inline-flex items-baseline gap-1 rounded-chip bg-chip px-3 py-1 text-sm text-ink no-underline hover:bg-rule"
    >
      <span>#{tag}</span>
      {count === undefined ? null : <span className="text-micro text-muted">{count}</span>}
    </a>
  );
}
