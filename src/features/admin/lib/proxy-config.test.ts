import { describe, expect, it } from "vitest";
import { config } from "../../../../proxy";

describe("proxy matcher", () => {
  it("guards /admin paths only", () => {
    expect(config.matcher).toContain("/admin/:path*");
  });
});
