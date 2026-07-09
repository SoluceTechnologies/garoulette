"use server";

import { revalidatePath } from "next/cache";
import { savePrizes } from "@/features/campaign/lib/storage";
import { adminAction } from "../lib/safe-action";
import { savePrizesSchema } from "../schemas/admin.schema";

export const savePrizesAction = adminAction
  .inputSchema(savePrizesSchema)
  .action(async ({ parsedInput: { slug, prizes } }) => {
    await savePrizes(slug, prizes);
    revalidatePath(`/admin/campaigns/${slug}`);
    revalidatePath(`/campaign/${slug}`);
    return { ok: true };
  });
