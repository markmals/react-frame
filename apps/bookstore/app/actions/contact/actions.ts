"use server";

import { redirect } from "react-frame";
import { getContext } from "remix/middleware/async-context";

import { routes } from "../../routes.ts";

export async function sendMessage() {
  getContext().session.flash("messageSent", true);
  redirect(routes.contact.index.href());
}
