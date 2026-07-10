import path from "node:path";
import { unzipSync } from "fflate";
import { ALLOWED_IMAGE_EXT, MAX_IMAGE_BYTES } from "@/features/campaign/lib/storage";

const MAX_JSON_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

export function safeUnzip(buf: Buffer): {
  json: Map<string, Uint8Array>;
  images: Map<string, Uint8Array>;
} {
  let total = 0;
  const raw = unzipSync(new Uint8Array(buf), {
    filter(file) {
      const originalSize = file.originalSize ?? 0;
      total += originalSize;
      if (total > MAX_TOTAL_BYTES) throw new Error("Archive too large");
      const norm = file.name.replace(/\\/g, "/");
      if (norm.endsWith(".json") && originalSize > MAX_JSON_BYTES) {
        throw new Error("JSON entry too large");
      }
      return true;
    },
  });
  const json = new Map<string, Uint8Array>();
  const images = new Map<string, Uint8Array>();
  for (const [rawName, bytes] of Object.entries(raw)) {
    if (rawName.endsWith("/")) continue;
    const norm = rawName.replace(/\\/g, "/");
    const parts = norm.split("/").filter(Boolean);
    if (norm.startsWith("/") || parts.includes("..")) continue;
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
