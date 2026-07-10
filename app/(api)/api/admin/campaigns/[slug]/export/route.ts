import { requireAdmin } from "@/features/admin/lib/dal";
import { buildStatsCsv } from "@/features/admin/lib/transfer/csv";
import { buildCampaignZip, buildThemeZip } from "@/features/admin/lib/transfer/export";
import { slugSchema } from "@/features/admin/schemas/admin.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function download(body: Buffer | string, filename: string, contentType: string): Response {
  return new Response(typeof body === "string" ? body : new Uint8Array(body), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return Response.json({ error: "Invalid campaign slug" }, { status: 400 });
  const type = new URL(req.url).searchParams.get("type");
  try {
    if (type === "theme") return download(await buildThemeZip(parsed.data), `${parsed.data}-theme.zip`, "application/zip");
    if (type === "campaign") return download(await buildCampaignZip(parsed.data), `${parsed.data}.zip`, "application/zip");
    if (type === "stats") return download(await buildStatsCsv(parsed.data), `${parsed.data}-stats.csv`, "text/csv; charset=utf-8");
    return Response.json({ error: "Unknown export type" }, { status: 400 });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return new Response("Not found", { status: 404 });
    throw err;
  }
}
