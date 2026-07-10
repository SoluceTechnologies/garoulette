import { promises as fs } from "node:fs";
import path from "node:path";
import { zipSync } from "fflate";
import { assertValidSlug, campaignDir, loadCampaign } from "@/features/campaign/lib/storage";

async function readImageNames(slug: string): Promise<string[]> {
  const dir = path.join(campaignDir(slug), "images");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    return [];
  }
}

export async function buildCampaignZip(slug: string): Promise<Buffer> {
  assertValidSlug(slug);
  const { settings, prizes, draws } = await loadCampaign(slug);
  const enc = new TextEncoder();
  const files: Record<string, Uint8Array> = {
    "settings.json": enc.encode(JSON.stringify(settings, null, 2)),
    "prizes.json": enc.encode(JSON.stringify({ prizes }, null, 2)),
    "draws.json": enc.encode(JSON.stringify({ draws }, null, 2)),
  };
  const imgDir = path.join(campaignDir(slug), "images");
  for (const name of await readImageNames(slug)) {
    files[`images/${name}`] = new Uint8Array(await fs.readFile(path.join(imgDir, name)));
  }
  return Buffer.from(zipSync(files));
}

export async function buildThemeZip(slug: string): Promise<Buffer> {
  assertValidSlug(slug);
  const { settings } = await loadCampaign(slug);
  const theme = settings.theme ?? {};
  const enc = new TextEncoder();
  const files: Record<string, Uint8Array> = {
    "theme.json": enc.encode(JSON.stringify(theme, null, 2)),
  };
  if (theme.logo) {
    const base = path.basename(theme.logo);
    try {
      files[`images/${base}`] = new Uint8Array(await fs.readFile(path.join(campaignDir(slug), "images", base)));
    } catch {}
  }
  return Buffer.from(zipSync(files));
}
