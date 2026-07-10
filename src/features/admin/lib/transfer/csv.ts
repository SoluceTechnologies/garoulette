import { campaignStats } from "@/features/admin/lib/stats";

function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function buildStatsCsv(slug: string): Promise<string> {
  const stats = await campaignStats(slug);
  const lines = ["prize,initial,drawn,remaining"];
  for (const p of stats.prizes) {
    lines.push([csvCell(p.name), csvCell(p.initialStock), csvCell(p.drawn), csvCell(p.remaining)].join(","));
  }
  lines.push(`# totalDraws,${stats.totalDraws}`);
  return `${lines.join("\n")}\n`;
}
