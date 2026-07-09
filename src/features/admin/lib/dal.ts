import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** Verify the admin session; redirect to login if absent/invalid. Memoised per request. */
export const requireAdmin = cache(async (): Promise<{ role: "admin" }> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) redirect("/admin/login");
  return session;
});
