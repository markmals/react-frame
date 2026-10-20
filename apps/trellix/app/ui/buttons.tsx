"use client";

import { useFormStatus } from "react-dom";

/** The primary form button; it reads `pendingLabel` while its form's action runs. */
export function PrimaryButton({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel: string;
}) {
  let { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="flex justify-center rounded-md bg-brand-blue px-3 py-1 text-sm leading-6 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function SaveButton({
  children,
  ref,
}: {
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="submit"
      // Safari only focuses a button on click when it has a tabIndex.
      tabIndex={0}
      className="rounded-lg bg-brand-blue p-2 text-left text-sm font-medium text-white"
    >
      {children}
    </button>
  );
}

export function CancelButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={0}
      onClick={onClick}
      className="rounded-lg p-2 text-left text-sm font-medium hover:bg-slate-200 focus:bg-slate-200"
    >
      {children}
    </button>
  );
}
