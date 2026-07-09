import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  type Draw,
  drawsFileSchema,
  type Prize,
  prizesFileSchema,
  type Settings,
  settingsSchema,
} from "@/features/campaign/schemas/campaign.schema";
import type { Campaign } from "@/features/campaign/types";
import { type Availability, getAvailability } from "./availability";
import { drawPrize } from "./draw";

const DATA_ROOT = path.join(process.cwd(), "data", "campaigns");

export function campaignDir(slug: string): string {
  return path.join(DATA_ROOT, slug);
}

const SLUG_RE = /^[a-z0-9-]+$/;

export function assertValidSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) {
    throw new Error(`Invalid campaign slug: ${slug}`);
  }
}

async function atomicWrite(file: string, data: string): Promise<void> {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, data, "utf8");
  await fs.rename(tmp, file);
}

async function readJson(file: string): Promise<unknown> {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

async function readAndParse<T>(schema: z.ZodType<T>, file: string, label: string): Promise<T> {
  const raw = await fs.readFile(file, "utf8");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`${label} contains invalid JSON (${file})`);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`${label} is invalid: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function readDraws(slug: string): Promise<Draw[]> {
  const file = path.join(campaignDir(slug), "draws.json");
  try {
    return (await readAndParse(drawsFileSchema, file, "draws.json")).draws;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export type CampaignSummary = {
  slug: string;
  name: string;
  prizeCount: number;
  primaryColor?: string;
  availability: Availability;
};

export async function listCampaigns(): Promise<CampaignSummary[]> {
  let entries: Awaited<ReturnType<typeof fs.readdir>>;
  try {
    entries = (await fs.readdir(DATA_ROOT, {
      withFileTypes: true,
    })) as unknown as Awaited<ReturnType<typeof fs.readdir>>;
  } catch {
    return [];
  }
  const result: CampaignSummary[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const dir = path.join(DATA_ROOT, entry.name as unknown as string);
      const settings = settingsSchema.parse(await readJson(path.join(dir, "settings.json")));
      let prizeCount = 0;
      try {
        const { prizes } = prizesFileSchema.parse(await readJson(path.join(dir, "prizes.json")));
        prizeCount = prizes.length;
      } catch {}
      result.push({
        slug: entry.name as unknown as string,
        name: settings.name,
        prizeCount,
        primaryColor: settings.theme?.primaryColor,
        availability: getAvailability(settings),
      });
    } catch {}
  }
  return result;
}

export async function loadCampaign(slug: string): Promise<Campaign> {
  const dir = campaignDir(slug);
  const settings = await readAndParse(settingsSchema, path.join(dir, "settings.json"), "settings.json");
  const { prizes } = await readAndParse(prizesFileSchema, path.join(dir, "prizes.json"), "prizes.json");
  const draws = await readDraws(slug);
  return { slug, settings, prizes, draws };
}

const locks = new Map<string, Promise<unknown>>();

async function acquireFileLock(lockFile: string, retries = 100): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const fh = await fs.open(lockFile, "wx");
      await fh.close();
      return;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  throw new Error(`Could not acquire lock: ${lockFile}`);
}

async function withCampaignLock<T>(slug: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(slug) ?? Promise.resolve();
  const run = (async () => {
    await prev.catch(() => {});
    const lockFile = path.join(campaignDir(slug), "draws.json.lock");
    await acquireFileLock(lockFile);
    try {
      return await fn();
    } finally {
      await fs.rm(lockFile, { force: true });
    }
  })();
  locks.set(
    slug,
    run.catch(() => {}),
  );
  return run;
}

export type CommitResult =
  | { status: "win"; prizeId: string; prizeIndex: number; remaining: number }
  | { status: "soldOut" };

export async function drawAndCommit(slug: string): Promise<CommitResult> {
  return withCampaignLock(slug, async () => {
    const { prizes } = prizesFileSchema.parse(await readJson(path.join(campaignDir(slug), "prizes.json")));
    const draws = await readDraws(slug);

    const result = drawPrize(prizes, draws);
    if (!result) return { status: "soldOut" };

    const draw: Draw = {
      id: randomUUID(),
      prizeId: result.prize.id,
      date: new Date().toISOString(),
    };
    const nextDraws = [...draws, draw];

    const file = path.join(campaignDir(slug), "draws.json");
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ draws: nextDraws }, null, 2), "utf8");
    await fs.rename(tmp, file);

    const usedAfter = nextDraws.filter((d) => d.prizeId === result.prize.id).length;
    const remaining = result.prize.initialStock - usedAfter;

    return {
      status: "win",
      prizeId: result.prize.id,
      prizeIndex: result.prizeIndex,
      remaining,
    };
  });
}

export async function saveSettings(slug: string, settings: Settings): Promise<void> {
  assertValidSlug(slug);
  const parsed = settingsSchema.parse(settings);
  await atomicWrite(path.join(campaignDir(slug), "settings.json"), JSON.stringify(parsed, null, 2));
}

export async function savePrizes(slug: string, prizes: Prize[]): Promise<void> {
  assertValidSlug(slug);
  const parsed = prizesFileSchema.parse({ prizes });
  await atomicWrite(path.join(campaignDir(slug), "prizes.json"), JSON.stringify(parsed, null, 2));
}

export async function createCampaign(slug: string, settings: Settings): Promise<void> {
  assertValidSlug(slug);
  const dir = campaignDir(slug);
  try {
    await fs.access(dir);
    throw new Error(`Campaign already exists: ${slug}`);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  await fs.mkdir(path.join(dir, "images"), { recursive: true });
  await saveSettings(slug, settings);
  await savePrizes(slug, []);
  await atomicWrite(path.join(dir, "draws.json"), JSON.stringify({ draws: [] }, null, 2));
}

export async function deleteCampaign(slug: string): Promise<void> {
  assertValidSlug(slug);
  await fs.rm(campaignDir(slug), { recursive: true, force: true });
}

export async function resetDraws(slug: string): Promise<void> {
  assertValidSlug(slug);
  await withCampaignLock(slug, async () => {
    await atomicWrite(path.join(campaignDir(slug), "draws.json"), JSON.stringify({ draws: [] }, null, 2));
  });
}

const ALLOWED_IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function saveImage(slug: string, originalName: string, bytes: Buffer): Promise<string> {
  assertValidSlug(slug);
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("Image too large (max 5MB)");
  }
  const ext = path.extname(originalName).toLowerCase();
  if (!ALLOWED_IMAGE_EXT.has(ext)) {
    throw new Error(`Unsupported image type: ${ext}`);
  }
  const base =
    path
      .basename(originalName, path.extname(originalName))
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image";
  const filename = `${base}${ext}`;
  await fs.mkdir(path.join(campaignDir(slug), "images"), { recursive: true });
  const dest = path.join(campaignDir(slug), "images", filename);
  const tmp = `${dest}.tmp`;
  await fs.writeFile(tmp, bytes);
  await fs.rename(tmp, dest);
  return filename;
}
