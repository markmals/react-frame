import type { IssueFilters } from "../../data/filters.ts";
import { IssueListView } from "../issues/issue-list-view.tsx";
import { listFrameHref, listHref } from "../issues/links.ts";
import { NewIssueDialog } from "../issues/new-issue-dialog.tsx";

/**
 * The rows are rendered by the client component below, which owns that data; this frame only
 * lays the view out. The controller prefetched the query and the middleware hydrated it, so the
 * view never suspends for data. A <Suspense> here would only let server rendering stream the list
 * after the first flush, where it stays hidden until a script reveals it.
 */
export function ListFrame({
  composing,
  filters,
  titleMissing,
}: {
  composing: boolean;
  filters: IssueFilters;
  titleMissing: boolean;
}) {
  return (
    <>
      <IssueListView filters={filters} />
      {composing ? (
        <NewIssueDialog
          returnTo={listHref(filters)}
          returnToFrame={listFrameHref(filters)}
          titleMissing={titleMissing}
        />
      ) : null}
    </>
  );
}
