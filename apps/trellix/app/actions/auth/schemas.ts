import * as s from "remix/data-schema";
import * as f from "remix/data-schema/form-data";

const TextField = f.field(s.defaulted(s.string(), ""));

export const CredentialsSchema = f.object({
  email: TextField,
  password: TextField,
});

export interface CredentialErrors {
  email?: string;
  password?: string;
}

/** Reads the errors `login()` and `signup()` flashed into the session for the page to render. */
export function readCredentialErrors(value: unknown): CredentialErrors | undefined {
  if (typeof value !== "object" || value == null) {
    return undefined;
  }

  let email = "email" in value ? value.email : undefined;
  let password = "password" in value ? value.password : undefined;

  return {
    email: typeof email === "string" ? email : undefined,
    password: typeof password === "string" ? password : undefined,
  };
}

/** Trellix's login and signup validation: an email that looks like one, and a password at all. */
export function validateCredentials(
  email: string,
  password: string,
  minimumLength: number,
): CredentialErrors | null {
  let errors: CredentialErrors = {};

  if (!email) {
    errors.email = "Email is required.";
  } else if (!email.includes("@")) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < minimumLength) {
    errors.password = `Password must be at least ${minimumLength} characters.`;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
