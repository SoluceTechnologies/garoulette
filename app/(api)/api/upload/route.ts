import { requireAdmin } from "@/features/admin/lib/dal";
import { slugSchema } from "@/features/admin/schemas/admin.schema";
import { saveImage } from "@/features/campaign/lib/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await requireAdmin();

  const formData = await req.formData();
  const slugValue = formData.get("slug");
  const file = formData.get("file");

  const slugResult = slugSchema.safeParse(slugValue);
  if (!slugResult.success) {
    return Response.json({ error: "Invalid campaign slug" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const filename = await saveImage(slugResult.data, file.name, bytes);
    return Response.json({ filename });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
