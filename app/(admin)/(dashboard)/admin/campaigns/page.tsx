import Link from "next/link";
import { CampaignRowActions } from "@/features/admin/components/campaign-row-actions";
import { campaignStats } from "@/features/admin/lib/stats";
import { listCampaigns } from "@/features/campaign/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const campaigns = await listCampaigns();
  const withStats = await Promise.all(
    campaigns.map(async (c) => ({
      ...c,
      stats: await campaignStats(c.slug),
    })),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Campaigns</h1>
        <Link
          href="/admin/campaigns/new"
          className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground"
        >
          New campaign
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {withStats.map((c) => (
          <li
            key={c.slug}
            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4"
          >
            <div>
              <Link href={`/admin/campaigns/${c.slug}`} className="font-semibold text-lg underline">
                {c.name}
              </Link>
              <p className="text-muted-foreground text-sm">
                {c.slug} · {c.prizeCount} prizes · {c.stats.totalDraws} draws · {c.availability}
              </p>
            </div>
            <CampaignRowActions slug={c.slug} />
          </li>
        ))}
        {withStats.length === 0 && <li className="text-muted-foreground">No campaigns yet.</li>}
      </ul>
    </div>
  );
}
