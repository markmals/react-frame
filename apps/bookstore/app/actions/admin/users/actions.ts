"use server";

import { redirect } from "react-frame";
import * as s from "remix/data-schema";
import { getContext } from "remix/middleware/async-context";

import { Users } from "../../../data/schema.ts";
import { routes } from "../../../routes.ts";
import { getCurrentUser } from "../../../utils/context.ts";
import { UserSchema } from "./schemas.ts";

export async function updateUser(userId: number, formData: FormData) {
  let user = getCurrentUser();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }

  let { db } = getContext();
  let targetUser = await db.find(Users, userId);
  let { email, name, role } = s.parse(UserSchema, formData);

  if (targetUser) {
    await db.update(Users, targetUser.id, {
      name,
      email,
      role,
    });
  }

  redirect(routes.admin.users.index.href());
}

export async function deleteUser(userId: number) {
  let user = getCurrentUser();
  if (user.role !== "admin") {
    throw new Error("Forbidden");
  }

  // The demo only hides the delete button for the signed-in admin; the route itself is
  // reachable, but a server function is a public endpoint, so the rule is enforced here too.
  if (userId === user.id) {
    throw new Error("Forbidden");
  }

  let { db } = getContext();
  let targetUser = await db.find(Users, userId);
  if (targetUser) {
    await db.delete(Users, targetUser.id);
  }

  redirect(routes.admin.users.index.href());
}
