import { promises as fs } from "node:fs";
import path from "node:path";
import { campaignDir } from "./storage";

export const SOUND_FILES = {
  background: "background.mp3",
  spin: "spin.mp3",
  result: "result.mp3",
} as const;

export type SoundUrls = {
  background: string;
  spin: string;
  result: string;
};

export async function resolveSoundUrls(slug: string): Promise<SoundUrls> {
  const dir = path.join(campaignDir(slug), "sound");

  const pick = async (file: string): Promise<string> => {
    try {
      await fs.access(path.join(dir, file));
      return `/campaign/${encodeURIComponent(slug)}/sound/${file}`;
    } catch {
      return `/sounds/${file}`;
    }
  };

  const [background, spin, result] = await Promise.all([
    pick(SOUND_FILES.background),
    pick(SOUND_FILES.spin),
    pick(SOUND_FILES.result),
  ]);

  return { background, spin, result };
}
