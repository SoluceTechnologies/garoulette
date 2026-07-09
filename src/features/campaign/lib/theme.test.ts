import { describe, expect, it } from "vitest";
import type { Settings } from "../schemas/campaign.schema";
import { themeStyle } from "./theme";

const base: Settings = { name: "x" };

describe("themeStyle", () => {
  it("omits --background when no backgroundColor", () => {
    const style = themeStyle(base) as Record<string, string>;
    expect(style["--background"]).toBeUndefined();
  });

  it("sets --background when backgroundColor present", () => {
    const style = themeStyle({
      ...base,
      theme: { backgroundColor: "#101010" },
    }) as Record<string, string>;
    expect(style["--background"]).toBe("#101010");
  });
});
