export const STATUSES = ["backlog", "todo", "in_progress", "done", "canceled"] as const;
export const PRIORITIES = ["none", "urgent", "high", "medium", "low"] as const;

export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  canceled: "Canceled",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  none: "No priority",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// Ranks give `orderBy=status` and `orderBy=priority` a sortable column, in the order Linear
// walks a workflow (backlog first) and escalates urgency (urgent last, so `desc` puts it on top).
export const STATUS_RANK: Record<Status, number> = {
  backlog: 0,
  todo: 1,
  in_progress: 2,
  done: 3,
  canceled: 4,
};

export const PRIORITY_RANK: Record<Priority, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
};

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}
