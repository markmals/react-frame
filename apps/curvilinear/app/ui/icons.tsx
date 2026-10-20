import type { Priority, Status } from "../data/issue-fields.ts";

const STATUS_COLORS: Record<Status, string> = {
  backlog: "text-status-backlog",
  todo: "text-status-todo",
  in_progress: "text-status-progress",
  done: "text-status-done",
  canceled: "text-status-canceled",
};

const STATUS_SHAPES: Record<Status, React.ReactNode> = {
  backlog: (
    <circle
      cx="7"
      cy="7"
      r="6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="2.6 2.4"
    />
  ),
  todo: <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="2" />,
  in_progress: (
    <>
      <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path fill="currentColor" d="M 7,7 L7,3 A4,4 0 0,1 7,11 z" />
    </>
  ),
  done: (
    <>
      <circle cx="7" cy="7" r="7" fill="currentColor" />
      <path
        d="M4 7.3 L6.2 9.5 L10.1 4.9"
        fill="none"
        stroke="var(--color-canvas)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  canceled: (
    <>
      <circle cx="7" cy="7" r="7" fill="currentColor" />
      <path
        d="M4.6 4.6 L9.4 9.4 M9.4 4.6 L4.6 9.4"
        fill="none"
        stroke="var(--color-canvas)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  ),
};

export function StatusIcon({ status }: { status: Status }) {
  return (
    <svg
      viewBox="0 0 14 14"
      width="14"
      height="14"
      aria-hidden="true"
      className={`shrink-0 ${STATUS_COLORS[status]}`}
    >
      {STATUS_SHAPES[status]}
    </svg>
  );
}

const PRIORITY_SHAPES: Record<Priority, React.ReactNode> = {
  none: (
    <>
      <rect x="2" y="7" width="2" height="2" rx="1" />
      <rect x="7" y="7" width="2" height="2" rx="1" />
      <rect x="12" y="7" width="2" height="2" rx="1" />
    </>
  ),
  low: (
    <>
      <rect x="1" y="8" width="3" height="6" rx="1" />
      <rect x="6" y="5" width="3" height="9" rx="1" fillOpacity="0.3" />
      <rect x="11" y="2" width="3" height="12" rx="1" fillOpacity="0.3" />
    </>
  ),
  medium: (
    <>
      <rect x="1" y="8" width="3" height="6" rx="1" />
      <rect x="6" y="5" width="3" height="9" rx="1" />
      <rect x="11" y="2" width="3" height="12" rx="1" fillOpacity="0.3" />
    </>
  ),
  high: (
    <>
      <rect x="1" y="8" width="3" height="6" rx="1" />
      <rect x="6" y="5" width="3" height="9" rx="1" />
      <rect x="11" y="2" width="3" height="12" rx="1" />
    </>
  ),
  urgent: (
    <>
      <rect x="1" y="1" width="14" height="14" rx="3" />
      <path
        d="M8 4 v5"
        stroke="var(--color-canvas)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="7" y="10.6" width="2" height="2" rx="1" fill="var(--color-canvas)" />
    </>
  ),
};

export function PriorityIcon({ priority }: { priority: Priority }) {
  return (
    <svg
      viewBox="1 1 14 14"
      width="16"
      height="16"
      fill="currentColor"
      aria-hidden="true"
      className={priority === "urgent" ? "shrink-0 text-amber-600" : "shrink-0 text-muted"}
    >
      {PRIORITY_SHAPES[priority]}
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" className="shrink-0">
      <path
        d="M2.8 7.4 L5.6 10.2 L11.2 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" className="shrink-0">
      <path
        d="M7 2.5 V11.5 M2.5 7 H11.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" className="shrink-0">
      <path
        d="M3.4 3.4 L10.6 10.6 M10.6 3.4 L3.4 10.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" className="shrink-0">
      <path
        d="M2.6 3.8 H11.4 M5.4 3.8 V2.4 H8.6 V3.8 M4 3.8 L4.6 11.6 H9.4 L10 3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true" className="shrink-0">
      <path
        d="M3.8 5.6 L7 8.8 L10.2 5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" className="shrink-0">
      <circle cx="6.2" cy="6.2" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.2 9.2 L12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SortIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" className="shrink-0">
      <path
        d="M2 3.5 H9 M2 7 H7 M2 10.5 H5 M11 3 V11 M9.2 9 L11 11 L12.8 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
