import type { CSSProperties } from "react";
import type { Settings } from "@/features/campaign/schemas/campaign.schema";

export const DEFAULT_THEME = {
  primaryColor: "#FF6B35",
  secondaryColor: "#1A1A2E",
} as const;

export function themeStyle(settings: Settings): CSSProperties {
  const theme = settings.theme ?? {};
  const style: Record<string, string> = {
    "--primary": theme.primaryColor ?? DEFAULT_THEME.primaryColor,
    "--secondary": theme.secondaryColor ?? DEFAULT_THEME.secondaryColor,
  };
  if (theme.backgroundColor) {
    style["--background"] = theme.backgroundColor;
  }
  return style as CSSProperties;
}
