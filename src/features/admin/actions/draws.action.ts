"use server";

import { revalidatePath } from "next/cache";
import { resetDraws } from "@/features/campaign/lib/storage";
import { adminAction } from "@/lib/actions";
import { slugOnlySchema } from "../schemas/admin.schema";

export const resetDrawsAction = adminAction.inputSchema(slugOnlySchema).action(async ({ parsedInput: { slug } }) => {
  await resetDraws(slug);
  revalidatePath(`/admin/campaigns/${slug}`);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/campaign/${slug}`);
  return { ok: true };
});
