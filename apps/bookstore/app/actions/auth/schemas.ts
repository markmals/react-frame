import * as s from "remix/data-schema";
import { minLength } from "remix/data-schema/checks";
import * as f from "remix/data-schema/form-data";

export const authCardClass = "mx-auto my-8 max-w-125";

const TextField = f.field(s.defaulted(s.string(), ""));

export const RegistrationSchema = f.object({
  name: TextField,
  email: TextField,
  password: f.field(s.string().pipe(minLength(8))),
});

export const ForgotPasswordSchema = f.object({
  email: TextField,
});

export const ResetPasswordSchema = f.object({
  password: f.field(s.string().pipe(minLength(8))),
  confirmPassword: f.field(s.string().pipe(minLength(8))),
});

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
