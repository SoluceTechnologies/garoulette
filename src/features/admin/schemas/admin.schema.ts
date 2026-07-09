import { z } from "zod";
import { prizeSchema, settingsSchema } from "@/features/campaign/schemas/campaign.schema";

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, "Lowercase letters, digits and hyphens only");

export const createCampaignSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1),
});

export const saveSettingsSchema = z.object({
  slug: slugSchema,
  settings: settingsSchema,
});

export const savePrizesSchema = z.object({
  slug: slugSchema,
  prizes: z.array(prizeSchema),
});

export const slugOnlySchema = z.object({ slug: slugSchema });
