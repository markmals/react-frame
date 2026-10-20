const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60_000],
  ["hour", 3_600_000],
  ["day", 86_400_000],
  ["week", 604_800_000],
  ["month", 2_629_800_000],
  ["year", 31_557_600_000],
];

/** "just now", "5 minutes ago", "yesterday", and so on, for a note's last edit. */
export function relativeTime(timestamp: number, now = Date.now()) {
  let elapsed = timestamp - now;
  let unit = units.findLast(([, size]) => Math.abs(elapsed) >= size);
  if (!unit) return "just now";

  return formatter.format(Math.round(elapsed / unit[1]), unit[0]);
}
