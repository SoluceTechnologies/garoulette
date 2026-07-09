import type { CSSProperties } from "react";
import type { Settings } from "@/features/campaign/schemas/campaign.schema";

export const DEFAULT_THEME = {
  primaryColor: "#FF6B35",
  secondaryColor: "#1A1A2E",
} as const;

export function themeStyle(settings: Settings): CSSProperties {
  const theme = settings.theme ?? {};
  return {
    "--primary": theme.primaryColor ?? DEFAULT_THEME.primaryColor,
    "--secondary": theme.secondaryColor ?? DEFAULT_THEME.secondaryColor,
  } as CSSProperties;
}
