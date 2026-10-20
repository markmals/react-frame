"use client";

import { startTransition, useOptimistic, useRef, useState } from "react";

import { readTextField } from "./types.ts";

export interface EditableTextProps {
  /** Hidden fields the mutation needs, such as the board or column id. */
  children: React.ReactNode;
  fieldName: string;
  value: string;
  action: (formData: FormData) => Promise<void>;
  /** Reloads the frame showing this text once the mutation lands. */
  reload: () => Promise<void>;
  buttonClassName: string;
  buttonLabel: string;
  inputClassName: string;
  inputLabel: string;
}

/**
 * Trellix's inline rename: the text swaps for an input in place. It's a `<details>` so the input
 * is in the page the server sent and a rename still works before JavaScript loads; the new text
 * shows through `useOptimistic` while the server function and the frame reload run.
 */
export function EditableText({
  action,
  buttonClassName,
  buttonLabel,
  children,
  fieldName,
  inputClassName,
  inputLabel,
  reload,
  value,
}: EditableTextProps) {
  let [editing, setEditing] = useState(false);
  let [text, setText] = useOptimistic(value);
  let inputRef = useRef<HTMLInputElement>(null);

  function save(formData: FormData) {
    let next = readTextField(formData, fieldName);

    startTransition(async () => {
      setText(next);
      await action(formData);
      await reload();
    });
  }

  return (
    <details
      open={editing}
      className="group"
      onToggle={(event) => {
        setEditing(event.currentTarget.open);
        // Whether it just opened or closed, the input starts again from the saved text.
        if (inputRef.current) inputRef.current.value = text;
        if (event.currentTarget.open) inputRef.current?.select();
      }}
    >
      <summary aria-label={buttonLabel} className={`${buttonClassName} group-open:hidden`}>
        {text || <span className="text-slate-400 italic">Edit</span>}
      </summary>

      <form
        action={action}
        onSubmit={(event) => {
          event.preventDefault();
          let formData = new FormData(event.currentTarget);
          setEditing(false);
          save(formData);
        }}
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget)) return;

          let input = inputRef.current;
          let changed = input != null && input.value !== text && input.value.trim() !== "";
          let formData = changed ? new FormData(event.currentTarget) : null;

          setEditing(false);
          if (formData) save(formData);
        }}
      >
        {children}
        <input
          required
          ref={inputRef}
          type="text"
          name={fieldName}
          aria-label={inputLabel}
          defaultValue={text}
          className={inputClassName}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
        />
        <button type="submit" className="sr-only">
          Save
        </button>
      </form>
    </details>
  );
}
