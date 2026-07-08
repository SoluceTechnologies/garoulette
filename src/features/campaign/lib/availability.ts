import type { Settings } from "../types";

export type Availability = "active" | "disabled" | "notStarted" | "expired";

/**
 * A campaign is active when it's enabled and the current time falls within its
 * [startAt, expiresAt) window. Missing bounds are treated as open-ended.
 */
export function getAvailability(settings: Settings, now: number = Date.now()): Availability {
  if (settings.enabled === false) return "disabled";
  if (settings.startAt && now < new Date(settings.startAt).getTime()) return "notStarted";
  if (settings.expiresAt && now >= new Date(settings.expiresAt).getTime()) return "expired";
  return "active";
}
