import { promises as fs } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertValidSlug,
  campaignDir,
  createCampaign,
  deleteCampaign,
  loadCampaign,
  resetDraws,
  saveImage,
  savePrizes,
  saveSettings,
} from "./storage";

const SLUG = "zz-test-campaign";

afterEach(async () => {
  await fs.rm(campaignDir(SLUG), { recursive: true, force: true });
});

describe("assertValidSlug", () => {
  it("rejects traversal and bad chars", () => {
    expect(() => assertValidSlug("../evil")).toThrow();
    expect(() => assertValidSlug("Foo Bar")).toThrow();
    expect(() => assertValidSlug("ok-slug-1")).not.toThrow();
  });
});

describe("campaign write helpers", () => {
  it("creates, edits, and deletes a campaign", async () => {
    await createCampaign(SLUG, { name: "Test" });
    let c = await loadCampaign(SLUG);
    expect(c.settings.name).toBe("Test");
    expect(c.prizes).toEqual([]);

    await createCampaign(SLUG, { name: "Dup" }).catch((e) => e);
    await expect(createCampaign(SLUG, { name: "Dup" })).rejects.toThrow();

    await saveSettings(SLUG, { name: "Renamed" });
    await savePrizes(SLUG, [{ id: "a", name: "Prize A", image: "a.webp", initialStock: 3, weight: 1 }]);
    c = await loadCampaign(SLUG);
    expect(c.settings.name).toBe("Renamed");
    expect(c.prizes).toHaveLength(1);

    await deleteCampaign(SLUG);
    await expect(loadCampaign(SLUG)).rejects.toThrow();
  });

  it("resets draws", async () => {
    await createCampaign(SLUG, { name: "T" });
    const drawsFile = path.join(campaignDir(SLUG), "draws.json");
    await fs.writeFile(drawsFile, JSON.stringify({ draws: [{ id: "1", prizeId: "a", date: "2026-01-01" }] }));
    await resetDraws(SLUG);
    const c = await loadCampaign(SLUG);
    expect(c.draws).toEqual([]);
  });

  it("saveImage sanitizes name, rejects bad ext", async () => {
    await createCampaign(SLUG, { name: "T" });
    const name = await saveImage(SLUG, "../My Logo!.PNG", Buffer.from("x"));
    expect(name).toMatch(/^[a-z0-9._-]+\.png$/);
    const savedPath = path.join(campaignDir(SLUG), "images", name);
    const contents = await fs.readFile(savedPath);
    expect(contents.length).toBeGreaterThan(0);
    expect(contents.toString()).toBe("x");
    await expect(saveImage(SLUG, "bad.exe", Buffer.from("x"))).rejects.toThrow();
  });
});
