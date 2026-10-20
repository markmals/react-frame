// Dates are formatted in UTC so a post's published date reads the same wherever the server runs.
const dayFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const minuteFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDay(date: Date): string {
  return dayFormat.format(date);
}

export function formatMinute(date: Date): string {
  return minuteFormat.format(date);
}
