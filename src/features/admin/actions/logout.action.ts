"use server";

import { redirect } from "next/navigation";
import { action } from "@/lib/actions";
import { deleteSession } from "../lib/session";

export const logoutAction = action.action(async () => {
  await deleteSession();
  redirect("/admin");
});
