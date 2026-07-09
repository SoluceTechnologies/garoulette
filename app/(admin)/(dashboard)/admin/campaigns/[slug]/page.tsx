import { notFound } from "next/navigation";
import { DangerZone } from "@/features/admin/components/danger-zone";
import { PrizesEditor } from "@/features/admin/components/prizes-editor";
import { SettingsForm } from "@/features/admin/components/settings-form";
import { StatsTable } from "@/features/admin/components/stats-table";
import { campaignStats } from "@/features/admin/lib/stats";
import { loadCampaign } from "@/features/campaign/lib/storage";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({ params }: PageProps<"/admin/campaigns/[slug]">) {
  const { slug } = await params;
  let campaign: Awaited<ReturnType<typeof loadCampaign>>;
  try {
    campaign = await loadCampaign(slug);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw err;
  }
  const stats = await campaignStats(slug);

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <h1 className="font-bold text-2xl">{campaign.settings.name}</h1>
      <SettingsForm slug={slug} settings={campaign.settings} />
      <PrizesEditor slug={slug} prizes={campaign.prizes} />
      <StatsTable stats={stats} />
      <DangerZone slug={slug} />
    </div>
  );
}
