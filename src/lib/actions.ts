import { createSafeActionClient } from "next-safe-action";
import { requireAdmin } from "@/features/admin/lib/dal";

export const action = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }
    return "An unknown error occurred";
  },
});

export const adminAction = action.use(async ({ next }) => {
  const session = await requireAdmin();
  return next({ ctx: { session } });
});
