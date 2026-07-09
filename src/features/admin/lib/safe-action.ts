import { action } from "@/lib/actions";
import { requireAdmin } from "./dal";

/** Authenticated action client: enforces admin session, injects it into ctx. */
export const adminAction = action.use(async ({ next }) => {
  const session = await requireAdmin();
  return next({ ctx: { session } });
});
