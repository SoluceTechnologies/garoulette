import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => vi.unstubAllEnvs());

describe("verifyPassword", () => {
  it("returns true for the correct password", async () => {
    const hash = bcrypt.hashSync("s3cret-pass", 12);
    vi.stubEnv("APP_PASSWORD_HASH", hash);
    vi.stubEnv("SESSION_SECRET", "0123456789012345678901234567890123");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    const { verifyPassword } = await import("./auth");
    expect(await verifyPassword("s3cret-pass")).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const hash = bcrypt.hashSync("s3cret-pass", 12);
    vi.stubEnv("APP_PASSWORD_HASH", hash);
    vi.stubEnv("SESSION_SECRET", "0123456789012345678901234567890123");
    vi.stubEnv("APP_URL", "http://localhost:3000");
    const { verifyPassword } = await import("./auth");
    expect(await verifyPassword("wrong")).toBe(false);
  });
});
