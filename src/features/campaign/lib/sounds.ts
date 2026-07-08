import { promises as fs } from "node:fs";
import path from "node:path";
import { campaignDir } from "./storage";

/** Conventional sound filenames. A campaign may drop its own copies in its
 *  `sound/` folder; otherwise the bundled defaults in `public/sounds/` are used. */
export const SOUND_FILES = {
  background: "son-de-fond.mp3",
  spin: "roulette-qui-tourne.mp3",
  result: "resultat-roulette.mp3",
} as const;

export type SoundUrls = {
  background: string;
  spin: string;
  result: string;
};

/**
 * Resolves each sound to the campaign's own file when present, falling back to
 * the bundled default under `/sounds/`.
 */
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
