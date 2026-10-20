// UTC everywhere, so a date rendered on the server matches the one the browser hydrates.
const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatShortDate(timestamp: number): string {
  return shortDate.format(timestamp);
}

export function formatLongDate(timestamp: number): string {
  return longDate.format(timestamp);
}

export function issueKey(issueId: number): string {
  return `CVX-${issueId}`;
}
