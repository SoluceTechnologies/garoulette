"use server";

import { redirect } from "next/navigation";
import { action } from "@/lib/actions";
import { verifyPassword } from "../lib/auth";
import { createSession } from "../lib/session";
import { loginSchema } from "../schemas/admin.schema";

export const loginAction = action.inputSchema(loginSchema).action(async ({ parsedInput: { password } }) => {
  const ok = await verifyPassword(password);
  if (!ok) throw new Error("Invalid password");
  await createSession();
  redirect("/admin");
});
