import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }
    return "An unknown error occurred";
  },
});
