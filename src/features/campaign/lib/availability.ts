import type { Settings } from "@/features/campaign/schemas/campaign.schema";

export type Availability = "active" | "disabled" | "notStarted" | "expired";

export function getAvailability(settings: Settings, now: number = Date.now()): Availability {
  if (settings.enabled === false) return "disabled";
  if (settings.startAt && now < new Date(settings.startAt).getTime()) return "notStarted";
  if (settings.expiresAt && now >= new Date(settings.expiresAt).getTime()) return "expired";
  return "active";
}
