import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  type Draw,
  drawsFileSchema,
  prizesFileSchema,
  settingsSchema,
} from "@/features/campaign/schemas/campaign.schema";
import { type Availability, getAvailability } from "./availability";
import type { Campaign } from "@/features/campaign/types";
import { drawPrize } from "./draw";

const DATA_ROOT = path.join(process.cwd(), "data", "campaigns");

export function campaignDir(slug: string): string {
  return path.join(DATA_ROOT, slug);
}

async function readJson(file: string): Promise<unknown> {
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

async function readAndParse<T>(
  schema: z.ZodType<T>,
  file: string,
  label: string,
): Promise<T> {
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
      const settings = settingsSchema.parse(
        await readJson(path.join(dir, "settings.json")),
      );
      let prizeCount = 0;
      try {
        const { prizes } = prizesFileSchema.parse(
          await readJson(path.join(dir, "prizes.json")),
        );
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
  const settings = await readAndParse(
    settingsSchema,
    path.join(dir, "settings.json"),
    "settings.json",
  );
  const { prizes } = await readAndParse(
    prizesFileSchema,
    path.join(dir, "prizes.json"),
    "prizes.json",
  );
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

async function withCampaignLock<T>(
  slug: string,
  fn: () => Promise<T>,
): Promise<T> {
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
    const { prizes } = prizesFileSchema.parse(
      await readJson(path.join(campaignDir(slug), "prizes.json")),
    );
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
    await fs.writeFile(
      tmp,
      JSON.stringify({ draws: nextDraws }, null, 2),
      "utf8",
    );
    await fs.rename(tmp, file);

    const usedAfter = nextDraws.filter(
      (d) => d.prizeId === result.prize.id,
    ).length;
    const remaining = result.prize.initialStock - usedAfter;

    return {
      status: "win",
      prizeId: result.prize.id,
      prizeIndex: result.prizeIndex,
      remaining,
    };
  });
}
