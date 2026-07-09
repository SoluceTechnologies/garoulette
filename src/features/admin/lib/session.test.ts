import { afterEach, describe, expect, it, vi } from "vitest";

const SECRET = "0123456789012345678901234567890123";

afterEach(() => vi.unstubAllEnvs());

async function load() {
  vi.stubEnv("APP_URL", "http://localhost:3000");
  vi.stubEnv("APP_PASSWORD_HASH", "x");
  vi.stubEnv("SESSION_SECRET", SECRET);
  return import("./session");
}

describe("session token", () => {
  it("round-trips a signed session", async () => {
    const { signSession, verifySessionToken } = await load();
    const token = await signSession();
    expect(await verifySessionToken(token)).toEqual({ role: "admin" });
  });

  it("rejects a tampered token", async () => {
    const { signSession, verifySessionToken } = await load();
    const token = await signSession();
    expect(await verifySessionToken(`${token}x`)).toBeNull();
  });

  it("rejects undefined", async () => {
    const { verifySessionToken } = await load();
    expect(await verifySessionToken(undefined)).toBeNull();
  });
});
