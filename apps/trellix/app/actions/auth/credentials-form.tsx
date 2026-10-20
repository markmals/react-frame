import type { CredentialErrors } from "./schemas.ts";

export interface CredentialsFormProps {
  action: (formData: FormData) => void | Promise<void>;
  errors?: CredentialErrors;
  headingId: string;
  passwordAutoComplete: "current-password" | "new-password";
  submitLabel: string;
}

export function CredentialsForm({
  action,
  errors,
  headingId,
  passwordAutoComplete,
  submitLabel,
}: CredentialsFormProps) {
  return (
    <form className="space-y-6" action={action}>
      <div>
        <label htmlFor="email" className="block text-sm leading-6 font-medium text-gray-900">
          Email address{" "}
          {errors?.email ? (
            <span id="email-error" className="text-brand-red">
              {errors.email}
            </span>
          ) : null}
        </label>
        <div className="mt-2">
          <input
            autoFocus
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            aria-describedby={errors?.email ? "email-error" : headingId}
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-gray-300 ring-inset focus:ring-2 focus:ring-brand-blue focus:ring-inset sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm leading-6 font-medium text-gray-900">
          Password{" "}
          {errors?.password ? (
            <span id="password-error" className="text-brand-red">
              {errors.password}
            </span>
          ) : null}
        </label>
        <div className="mt-2">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={passwordAutoComplete}
            aria-describedby={errors?.password ? "password-error" : headingId}
            required
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-gray-300 ring-inset focus:ring-2 focus:ring-brand-blue focus:ring-inset sm:text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="flex w-full justify-center rounded-md bg-brand-blue px-1 py-1 text-sm leading-6 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        {submitLabel}
      </button>
    </form>
  );
}
