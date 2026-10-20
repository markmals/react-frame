"use server";

import { getContext } from "remix/middleware/async-context";

export async function sendMessage() {
  getContext().session.flash("messageSent", true);
}
