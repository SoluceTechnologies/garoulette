"use server";

import { z } from "zod";
import { action } from "@/lib/actions";
import { getAvailability } from "../lib/availability";
import { drawAndCommit, loadCampaign } from "../lib/storage";

export const spinAction = action
  .inputSchema(z.object({ slug: z.string().min(1) }))
  .action(async ({ parsedInput: { slug } }) => {
    const campaign = await loadCampaign(slug);

    const availability = getAvailability(campaign.settings);
    if (availability !== "active") {
      return { status: availability };
    }

    return drawAndCommit(slug);
  });
