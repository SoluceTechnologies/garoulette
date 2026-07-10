"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { verifySessionToken } from "./session";

export const requireAdmin = cache(async (): Promise<{ role: "admin" }> => {
  const token = (await cookies()).get("admin_session")?.value;
  const session = await verifySessionToken(token);
  if (!session) redirect("/admin");
  return session;
});
