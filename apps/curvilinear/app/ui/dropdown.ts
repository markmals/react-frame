/**
 * `<details>` dropdowns open without JavaScript but have no light dismiss, so these put the
 * missing half back: focus leaving the dropdown closes it, and so does Escape.
 */
export function closeDropdownOnFocusOut(event: React.FocusEvent<HTMLDetailsElement>) {
  let next = event.relatedTarget;

  if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
    event.currentTarget.open = false;
  }
}

export function closeDropdownOnEscape(event: React.KeyboardEvent<HTMLDetailsElement>) {
  if (event.key !== "Escape" || !event.currentTarget.open) return;

  event.currentTarget.open = false;
  event.currentTarget.querySelector("summary")?.focus();
}
