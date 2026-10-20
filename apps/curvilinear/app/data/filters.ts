import { isPriority, isStatus, type Priority, type Status } from "./issue-fields.ts";

export const ORDER_FIELDS = ["priority", "status", "created", "modified"] as const;
export const ORDER_DIRECTIONS = ["desc", "asc"] as const;

export type OrderField = (typeof ORDER_FIELDS)[number];
export type OrderDirection = (typeof ORDER_DIRECTIONS)[number];

export const ORDER_FIELD_LABELS: Record<OrderField, string> = {
  priority: "Priority",
  status: "Status",
  created: "Created",
  modified: "Updated",
};

export interface IssueFilters {
  status: Status[];
  priority: Priority[];
  query: string;
  orderBy: OrderField;
  orderDirection: OrderDirection;
}

export const DEFAULT_ORDER_BY: OrderField = "created";
export const DEFAULT_ORDER_DIRECTION: OrderDirection = "desc";

/**
 * Reads the list's filter state out of a URL, the way the reference app's `useFilterState` does:
 * `status` and `priority` are comma-joined lists that tolerate repeated params, and values are
 * lower-cased. Unknown values are dropped so a hand-typed URL can't break the query.
 */
export function parseIssueFilters(searchParams: URLSearchParams): IssueFilters {
  let orderBy = searchParams.get("orderBy");
  let orderDirection = searchParams.get("orderDirection");

  return {
    status: readList(searchParams, "status").filter(isStatus),
    priority: readList(searchParams, "priority").filter(isPriority),
    query: searchParams.get("query")?.trim() ?? "",
    orderBy: isOrderField(orderBy) ? orderBy : DEFAULT_ORDER_BY,
    orderDirection: isOrderDirection(orderDirection) ? orderDirection : DEFAULT_ORDER_DIRECTION,
  };
}

/**
 * Serializes filters back to a canonical search string, omitting defaults and sorting list values,
 * so the same filter state always produces the same string: it is both the link href and the tail
 * of the TanStack Query key.
 */
export function issueFiltersToSearch(filters: IssueFilters): string {
  let searchParams = new URLSearchParams();

  if (filters.status.length > 0) {
    searchParams.set("status", sortedUnique(filters.status).join(","));
  }

  if (filters.priority.length > 0) {
    searchParams.set("priority", sortedUnique(filters.priority).join(","));
  }

  if (filters.query !== "") {
    searchParams.set("query", filters.query);
  }

  if (filters.orderBy !== DEFAULT_ORDER_BY) {
    searchParams.set("orderBy", filters.orderBy);
  }

  if (filters.orderDirection !== DEFAULT_ORDER_DIRECTION) {
    searchParams.set("orderDirection", filters.orderDirection);
  }

  let search = searchParams.toString();
  return search === "" ? "" : `?${search}`;
}

export function toggleStatusFilter(filters: IssueFilters, status: Status): IssueFilters {
  return { ...filters, status: toggle(filters.status, status) };
}

export function togglePriorityFilter(filters: IssueFilters, priority: Priority): IssueFilters {
  return { ...filters, priority: toggle(filters.priority, priority) };
}

function toggle<value extends string>(values: value[], value: value): value[] {
  return values.includes(value) ? values.filter((kept) => kept !== value) : [...values, value];
}

function readList(searchParams: URLSearchParams, name: string): string[] {
  return searchParams
    .getAll(name)
    .flatMap((value) => value.toLowerCase().split(","))
    .filter((value) => value !== "");
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function isOrderField(value: string | null): value is OrderField {
  return value !== null && (ORDER_FIELDS as readonly string[]).includes(value);
}

function isOrderDirection(value: string | null): value is OrderDirection {
  return value !== null && (ORDER_DIRECTIONS as readonly string[]).includes(value);
}
