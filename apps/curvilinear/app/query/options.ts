import { queryOptions } from "@tanstack/react-query";

import { issueFiltersToSearch, type IssueFilters } from "../data/filters.ts";
import type { CommentItem, IssueDetail, IssueListPayload } from "../data/payloads.ts";
import { routes } from "../routes.ts";

/**
 * Loads a JSON route. In the browser this is `fetch`; a server component passes a loader that
 * dispatches the same path through the router in-process, so prefetching costs no socket.
 */
export interface LoadJson {
  <payload>(path: string, signal?: AbortSignal): Promise<payload>;
}

export const fetchJson: LoadJson = async (path, signal) => {
  let response = await fetch(path, { signal, headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`${path} responded with ${response.status}`);
  }

  return response.json();
};

export function issueListQuery(filters: IssueFilters, loadJson: LoadJson = fetchJson) {
  let path = routes.api.issues.href() + issueFiltersToSearch(filters);

  return queryOptions({
    queryKey: ["issues", "list", path],
    queryFn: ({ signal }) => loadJson<IssueListPayload>(path, signal),
  });
}

export function issueQuery(issueId: number, loadJson: LoadJson = fetchJson) {
  let path = routes.api.issue.href({ issueId: String(issueId) });

  return queryOptions({
    queryKey: ["issues", "detail", issueId],
    queryFn: ({ signal }) => loadJson<IssueDetail>(path, signal),
  });
}

export function issueCommentsQuery(issueId: number, loadJson: LoadJson = fetchJson) {
  let path = routes.api.comments.href({ issueId: String(issueId) });

  return queryOptions({
    queryKey: ["issues", "comments", issueId],
    queryFn: ({ signal }) => loadJson<CommentItem[]>(path, signal),
  });
}

/** Every issue query, for invalidating after a mutation. */
export const issueQueryKey = ["issues"];
