"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCampaignFromZip, deriveSlug, importThemeZip } from "@/features/admin/lib/transfer/import";
import { adminAction } from "@/lib/actions";
import { importCampaignSchema, importThemeSchema } from "../schemas/admin.schema";

export const importThemeAction = adminAction
  .inputSchema(importThemeSchema)
  .action(async ({ parsedInput: { slug, file } }) => {
    await importThemeZip(slug, Buffer.from(await file.arrayBuffer()));
    revalidatePath(`/admin/campaigns/${slug}`);
    revalidatePath(`/campaign/${slug}`);
    return { ok: true };
  });

export const importCampaignAction = adminAction
  .inputSchema(importCampaignSchema)
  .action(async ({ parsedInput: { file } }) => {
    const slug = deriveSlug(file.name);
    const { slug: created } = await createCampaignFromZip(slug, Buffer.from(await file.arrayBuffer()));
    revalidatePath("/admin/campaigns");
    redirect(`/admin/campaigns/${created}`);
  });
