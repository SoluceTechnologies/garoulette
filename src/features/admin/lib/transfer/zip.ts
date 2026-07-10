import path from "node:path";
import { unzipSync } from "fflate";
import { ALLOWED_IMAGE_EXT, MAX_IMAGE_BYTES } from "@/features/campaign/lib/storage";

export function safeUnzip(buf: Buffer): {
  json: Map<string, Uint8Array>;
  images: Map<string, Uint8Array>;
} {
  const raw = unzipSync(new Uint8Array(buf));
  const json = new Map<string, Uint8Array>();
  const images = new Map<string, Uint8Array>();
  for (const [rawName, bytes] of Object.entries(raw)) {
    if (rawName.endsWith("/")) continue;
    const norm = rawName.replace(/\\/g, "/");
    const parts = norm.split("/").filter(Boolean);
    if (norm.startsWith("/") || parts.includes("..")) continue; // zip-slip guard
    if (parts.length === 1 && parts[0].endsWith(".json")) {
      json.set(parts[0], bytes);
    } else if (parts.length === 2 && parts[0] === "images") {
      const base = path.basename(parts[1]);
      const ext = path.extname(base).toLowerCase();
      if (!ALLOWED_IMAGE_EXT.has(ext)) throw new Error(`Unsupported image type: ${ext}`);
      if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Image too large (max 5MB)");
      images.set(base, bytes);
    }
  }
  return { json, images };
}

export function decodeJson(map: Map<string, Uint8Array>, name: string): unknown {
  const bytes = map.get(name);
  if (!bytes) throw new Error(`${name} missing from archive`);
  return JSON.parse(new TextDecoder().decode(bytes));
}
