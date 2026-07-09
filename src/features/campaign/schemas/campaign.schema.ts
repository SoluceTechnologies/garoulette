import { z } from "zod";

export const prizeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  image: z.string().min(1),
  initialStock: z.number().int().nonnegative(),
  weight: z.number().nonnegative(),
  color: z.string().optional(),
});
export type Prize = z.infer<typeof prizeSchema>;

export const prizesFileSchema = z.object({
  prizes: z.array(prizeSchema),
});

export const drawSchema = z.object({
  id: z.string(),
  prizeId: z.string(),
  date: z.string(),
});
export type Draw = z.infer<typeof drawSchema>;

export const drawsFileSchema = z.object({
  draws: z.array(drawSchema),
});

export const themeSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logo: z.string().optional(),
  font: z.string().optional(),
});

export const settingsSchema = z.object({
  name: z.string().min(1),
  theme: themeSchema.optional(),
  enabled: z.boolean().optional(),
  startAt: z.string().optional(),
  expiresAt: z.string().optional(),
  welcomeMessage: z.string().optional(),
  resetDelaySeconds: z.number().positive().optional(),
  spinDurationSeconds: z.number().positive().optional(),
});
export type Settings = z.infer<typeof settingsSchema>;
