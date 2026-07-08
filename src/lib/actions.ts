//import { headers } from "next/headers";
import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }
    return "An unknown error occurred";
  },
});

// export const authentificatedAction = action.use(async ({ next }) => {
//   //todo: faire de la session??? jwt?
//   //@ts-ignore
//   if (!session || session.user.role !== "user") {
//     throw new Error("Unauthorized.");
//   }

//   return next({
//     ctx: {
//       userId: session.user.id,
//       user: session.user,
//     },
//   });
// });
