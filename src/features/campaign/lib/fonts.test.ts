import { describe, expect, it } from "vitest";
// Import from `./font-map`, not `./fonts`: `./fonts` calls `next/font/google`
// loader functions at module-evaluation time, which throws outside the
// Next.js build pipeline (see `font-map.ts` doc comment). The pure lookup
// logic under test here is identical to what `./fonts` re-exports.
import { FONT_OPTIONS, resolveFontVar } from "./font-map";

describe("resolveFontVar", () => {
  it("resolves a known font by exact name", () => {
    expect(resolveFontVar("Comfortaa")).toBe("var(--font-comfortaa)");
  });

  it("is case-insensitive", () => {
    expect(resolveFontVar("comfortaa")).toBe("var(--font-comfortaa)");
  });

  it("falls back to default for unknown or missing names", () => {
    expect(resolveFontVar("NotAFont")).toBe("var(--font-sans)");
    expect(resolveFontVar(undefined)).toBe("var(--font-sans)");
  });

  it("exposes options with matching values", () => {
    const values = FONT_OPTIONS.map((o) => o.value);
    expect(values).toContain("Comfortaa");
  });
});
