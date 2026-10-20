"use client";

import { useQueryClient } from "@tanstack/react-query";
import { startTransition, useActionState, useOptimistic, useRef } from "react";
import { useFrames } from "react-frame/client";

import { issueQueryKey } from "../../query/options.ts";
import { closeDropdownOnEscape, closeDropdownOnFocusOut } from "../../ui/dropdown.ts";
import { CheckIcon } from "../../ui/icons.tsx";

export interface PropertyMenuProps<value extends string> {
  /** The form field the options submit, which is also the issue column they change. */
  field: "status" | "priority";
  issueId: number;
  value: value;
  options: readonly value[];
  labels: Record<value, string>;
  renderIcon: (value: value) => React.ReactNode;
  /** The server function the form posts to, so the menu works before JavaScript loads. */
  submit: (formData: FormData) => Promise<void>;
  /** Names the control for screen readers, e.g. "Status" or "Priority of CVX-12". */
  menuLabel: string;
  /** Issue rows show the icon alone; the detail page spells the value out. */
  showValue?: boolean;
}

/**
 * The inline status and priority pickers. A `<details>` opens the list without JavaScript, each
 * option is a submit button, and with JavaScript the chosen value shows immediately through
 * `useOptimistic` while the server function and the cache invalidation run in one transition.
 * If the server function fails, React drops the optimistic value when the transition ends.
 */
export function PropertyMenu<value extends string>({
  field,
  issueId,
  value,
  options,
  labels,
  renderIcon,
  submit,
  menuLabel,
  showValue = false,
}: PropertyMenuProps<value>) {
  let queryClient = useQueryClient();
  let frames = useFrames();
  let disclosure = useRef<HTMLDetailsElement>(null);
  let [shown, showOptimistically] = useOptimistic(value);

  let [error, change, pending] = useActionState(
    async (_previousError: string | null, formData: FormData) => {
      let chosen = options.find((option) => option === formData.get(field));
      if (chosen !== undefined) showOptimistically(chosen);

      try {
        await submit(formData);
      } catch (failure) {
        return failure instanceof Error ? failure.message : `Could not change the ${field}.`;
      }

      // Invalidation inside the transition keeps the optimistic value on screen until the
      // refetched issue carries the same one, so the row never flickers back and forth.
      await queryClient.invalidateQueries({ queryKey: issueQueryKey });
      await frames.get("menu")?.reload();
      return null;
    },
    null,
  );

  return (
    <div className="relative z-10 flex items-center gap-1">
      <details ref={disclosure} onBlur={closeDropdownOnFocusOut} onKeyDown={closeDropdownOnEscape}>
        <summary
          aria-busy={pending}
          className="flex h-6 items-center gap-1.5 rounded-control px-1 text-muted hover:bg-active"
        >
          {renderIcon(shown)}
          {/* The icon carries no text, so the name comes from here; it stays visible when the
              detail page shows the value, and is screen-reader only in a list row. */}
          <span className="sr-only">{menuLabel}: </span>
          <span className={showValue ? "" : "sr-only"}>{labels[shown]}</span>
        </summary>
        <form
          // Without JavaScript the browser posts this to the page, which renders again after it.
          action={submit}
          onSubmit={(event) => {
            event.preventDefault();
            let formData = new FormData(
              event.currentTarget,
              (event.nativeEvent as SubmitEvent).submitter,
            );
            if (disclosure.current !== null) disclosure.current.open = false;
            // useActionState's dispatch is not a transition on its own: without this, neither
            // the optimistic value nor `pending` would render while the action runs.
            startTransition(() => change(formData));
          }}
          className="absolute top-full left-0 z-30 mt-1 w-menu rounded-md border border-line bg-canvas p-1 shadow-popover"
        >
          <input type="hidden" name="issueId" value={issueId} />
          {options.map((option) => (
            <button
              key={option}
              type="submit"
              name={field}
              value={option}
              className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left hover:bg-hover"
            >
              {renderIcon(option)}
              <span className="flex-1">{labels[option]}</span>
              {option === shown ? <CheckIcon /> : null}
            </button>
          ))}
        </form>
      </details>
      {error === null ? null : (
        <span role="alert" className="truncate text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
