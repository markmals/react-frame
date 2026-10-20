import { issueFiltersToSearch, type IssueFilters } from "../../data/filters.ts";
import { routes } from "../../routes.ts";

/**
 * Every navigation has a pair: the address the browser shows, and the frame route that renders
 * the new content. Links carry both, as `href` and `data-src`, so the shell stays put.
 */
export function listHref(filters: IssueFilters): string {
  return routes.issues.href() + issueFiltersToSearch(filters);
}

export function listFrameHref(filters: IssueFilters): string {
  return routes.frames.list.href() + issueFiltersToSearch(filters);
}

export function issueHref(issueId: number): string {
  return routes.issue.href({ issueId: String(issueId) });
}

export function issueFrameHref(issueId: number): string {
  return routes.frames.issue.href({ issueId: String(issueId) });
}

export function withParam(href: string, param: string): string {
  return `${href}${href.includes("?") ? "&" : "?"}${param}`;
}
