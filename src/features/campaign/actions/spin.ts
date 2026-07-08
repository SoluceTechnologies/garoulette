"use server";

import { z } from "zod";
import { action } from "@/lib/actions";
import { drawAndCommit, loadCampaign } from "../lib/storage";

export const spinAction = action
  .inputSchema(z.object({ slug: z.string().min(1) }))
  .action(async ({ parsedInput: { slug } }) => {
    const campaign = await loadCampaign(slug);

    const { expiresAt } = campaign.settings;
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      return { status: "expired" as const };
    }

    return drawAndCommit(slug);
  });
