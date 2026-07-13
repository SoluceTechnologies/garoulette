import { promises as fs } from "node:fs";
import path from "node:path";
import { campaignDir } from "@/features/campaign/lib/storage";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string; file: string[] }> },
) {
  const { slug, file } = await ctx.params;
  const rel = Array.isArray(file) ? file.join("/") : file;
  const dir = path.join(campaignDir(slug), "sound");
  const target = path.join(dir, rel);

  if (target !== dir && !target.startsWith(dir + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(target);
    const type = MIME[path.extname(target).toLowerCase()] ?? "application/octet-stream";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
