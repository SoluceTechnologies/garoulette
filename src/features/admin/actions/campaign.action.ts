"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCampaign, deleteCampaign, saveSettings } from "@/features/campaign/lib/storage";
import { adminAction } from "@/lib/actions";
import { createCampaignSchema, saveSettingsSchema, slugOnlySchema } from "../schemas/admin.schema";

export const createCampaignAction = adminAction
  .inputSchema(createCampaignSchema)
  .action(async ({ parsedInput: { slug, name } }) => {
    await createCampaign(slug, { name });
    redirect(`/admin/campaigns/${slug}`);
  });

export const saveSettingsAction = adminAction
  .inputSchema(saveSettingsSchema)
  .action(async ({ parsedInput: { slug, settings } }) => {
    await saveSettings(slug, settings);
    revalidatePath(`/admin/campaigns/${slug}`);
    revalidatePath(`/campaign/${slug}`);
    return { ok: true };
  });

export const deleteCampaignAction = adminAction
  .inputSchema(slugOnlySchema)
  .action(async ({ parsedInput: { slug } }) => {
    await deleteCampaign(slug);
    revalidatePath("/admin/campaigns");
    redirect("/admin/campaigns");
  });
