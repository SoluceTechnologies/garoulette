import { promises as fs } from "node:fs";
import path from "node:path";
import {
  assertValidSlug,
  campaignDir,
  createCampaign,
  loadCampaign,
  replaceImages,
  savePrizes,
  saveSettings,
  writeDraws,
} from "@/features/campaign/lib/storage";
import {
  drawsFileSchema,
  prizesFileSchema,
  settingsSchema,
  themeSchema,
} from "@/features/campaign/schemas/campaign.schema";
import { decodeJson, safeUnzip } from "./zip";

export function deriveSlug(filename: string): string {
  return path
    .basename(filename)
    .replace(/\.zip$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCampaignFromZip(slug: string, buf: Buffer): Promise<{ slug: string }> {
  assertValidSlug(slug);
  const { json, images } = safeUnzip(buf);
  const settings = settingsSchema.parse(decodeJson(json, "settings.json"));
  const { prizes } = prizesFileSchema.parse(decodeJson(json, "prizes.json"));
  const draws = json.has("draws.json") ? drawsFileSchema.parse(decodeJson(json, "draws.json")).draws : [];
  await createCampaign(slug, settings); // throws "Campaign already exists" if taken
  await savePrizes(slug, prizes);
  await writeDraws(slug, draws);
  if (images.size > 0) await replaceImages(slug, images);
  return { slug };
}

export async function importThemeZip(slug: string, buf: Buffer): Promise<void> {
  assertValidSlug(slug);
  const { json, images } = safeUnzip(buf);
  const theme = themeSchema.parse(decodeJson(json, "theme.json"));
  const { settings } = await loadCampaign(slug);
  await saveSettings(slug, { ...settings, theme: { ...settings.theme, ...theme } });
  if (images.size > 0) {
    const dir = path.join(campaignDir(slug), "images");
    await fs.mkdir(dir, { recursive: true });
    for (const [name, bytes] of images) {
      await fs.writeFile(path.join(dir, name), bytes);
    }
  }
}
