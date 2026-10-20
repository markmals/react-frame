"use server";

import { redirect } from "react-frame";
import * as s from "remix/data-schema";
import { minLength } from "remix/data-schema/checks";
import * as f from "remix/data-schema/form-data";
import { getContext } from "remix/middleware/async-context";

import { Users } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { getCurrentUser } from "../../../utils/context.ts";
import { hashPassword } from "../../../utils/password-hash.ts";

const TextField = f.field(s.defaulted(s.string(), ""));
const PasswordField = f.field(
  s.defaulted(s.union([s.literal(""), s.string().pipe(minLength(8))]), ""),
);
const AccountSettingsSchema = f.object({
  name: TextField,
  email: TextField,
  password: PasswordField,
});

export async function updateSettings(formData: FormData) {
  let { db } = getContext();
  let user = getCurrentUser();
  let { email, name, password } = s.parse(AccountSettingsSchema, formData);

  let updateData = password
    ? { name, email, password_hash: await hashPassword(password) }
    : { name, email };
  await db.update(Users, user.id, updateData);

  redirect(routes.account.index.href());
}
