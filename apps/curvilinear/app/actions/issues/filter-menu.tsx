"use client";

import {
  ORDER_DIRECTIONS,
  ORDER_FIELD_LABELS,
  ORDER_FIELDS,
  togglePriorityFilter,
  toggleStatusFilter,
  type IssueFilters,
} from "../../data/filters.ts";
import { PRIORITIES, PRIORITY_LABELS, STATUS_LABELS, STATUSES } from "../../data/issue-fields.ts";
import { closeDropdownOnEscape, closeDropdownOnFocusOut } from "../../ui/dropdown.ts";
import { CheckIcon, PlusIcon, PriorityIcon, SortIcon, StatusIcon } from "../../ui/icons.tsx";
import { listFrameHref, listHref } from "./links.ts";

/** Multi-select filter picker. Every option is a link to the list with that value toggled. */
export function FilterDropdown({ filters }: { filters: IssueFilters }) {
  return (
    <details
      className="relative"
      onBlur={closeDropdownOnFocusOut}
      onKeyDown={closeDropdownOnEscape}
    >
      <summary className="flex h-6 items-center gap-1 rounded-control border border-dashed border-line-strong px-1.5 text-muted hover:border-faint hover:text-ink">
        <PlusIcon />
        Filter
      </summary>
      <div className="absolute top-full left-0 z-30 mt-1 w-menu rounded-md border border-line bg-canvas p-1 shadow-popover">
        <p className="px-2 py-1 text-xs font-medium text-faint">Priority</p>
        {PRIORITIES.map((priority) => {
          let next = togglePriorityFilter(filters, priority);
          return (
            <a
              key={priority}
              href={listHref(next)}
              data-target="main"
              data-src={listFrameHref(next)}
              className="flex items-center gap-2 rounded-control px-2 py-1.5 hover:bg-hover"
            >
              <PriorityIcon priority={priority} />
              <span className="flex-1">{PRIORITY_LABELS[priority]}</span>
              {filters.priority.includes(priority) ? <CheckIcon /> : null}
            </a>
          );
        })}
        <hr className="my-1 border-line" />
        <p className="px-2 py-1 text-xs font-medium text-faint">Status</p>
        {STATUSES.map((status) => {
          let next = toggleStatusFilter(filters, status);
          return (
            <a
              key={status}
              href={listHref(next)}
              data-target="main"
              data-src={listFrameHref(next)}
              className="flex items-center gap-2 rounded-control px-2 py-1.5 hover:bg-hover"
            >
              <StatusIcon status={status} />
              <span className="flex-1">{STATUS_LABELS[status]}</span>
              {filters.status.includes(status) ? <CheckIcon /> : null}
            </a>
          );
        })}
      </div>
    </details>
  );
}

export function OrderDropdown({ filters }: { filters: IssueFilters }) {
  return (
    <details
      className="relative"
      onBlur={closeDropdownOnFocusOut}
      onKeyDown={closeDropdownOnEscape}
    >
      <summary
        aria-label="Ordering"
        className="flex size-6 items-center justify-center rounded-control text-muted hover:bg-active hover:text-ink"
      >
        <SortIcon />
      </summary>
      <div className="absolute top-full right-0 z-30 mt-1 w-menu rounded-md border border-line bg-canvas p-1 shadow-popover">
        <p className="px-2 py-1 text-xs font-medium text-faint">Order by</p>
        {ORDER_FIELDS.map((orderBy) => {
          let next = { ...filters, orderBy };
          return (
            <a
              key={orderBy}
              href={listHref(next)}
              data-target="main"
              data-src={listFrameHref(next)}
              className="flex items-center gap-2 rounded-control px-2 py-1.5 hover:bg-hover"
            >
              <span className="flex-1">{ORDER_FIELD_LABELS[orderBy]}</span>
              {filters.orderBy === orderBy ? <CheckIcon /> : null}
            </a>
          );
        })}
        <hr className="my-1 border-line" />
        {ORDER_DIRECTIONS.map((orderDirection) => {
          let next = { ...filters, orderDirection };
          return (
            <a
              key={orderDirection}
              href={listHref(next)}
              data-target="main"
              data-src={listFrameHref(next)}
              className="flex items-center gap-2 rounded-control px-2 py-1.5 hover:bg-hover"
            >
              <span className="flex-1">
                {orderDirection === "desc" ? "Descending" : "Ascending"}
              </span>
              {filters.orderDirection === orderDirection ? <CheckIcon /> : null}
            </a>
          );
        })}
      </div>
    </details>
  );
}
