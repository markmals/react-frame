export function parseIssueId(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  let id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 && String(id) === value ? id : undefined;
}
