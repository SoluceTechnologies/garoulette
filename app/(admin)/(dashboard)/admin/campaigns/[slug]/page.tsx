import { notFound } from "next/navigation";
import { CampaignTabs } from "@/features/admin/components/campaigns/campaign-tabs";
import { CopyPublicLinkButton } from "@/features/admin/components/campaigns/copy-public-link-button";
import { DangerZone } from "@/features/admin/components/campaigns/danger-zone";
import { StatsTable } from "@/features/admin/components/campaigns/stats.table";
import { PrizesEditor } from "@/features/admin/components/forms/prizes.form";
import { SettingsForm } from "@/features/admin/components/forms/settings.form";
import {
  Page,
  PageActions,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/features/admin/components/layout/page";
import { campaignStats } from "@/features/admin/lib/stats";
import { loadCampaign } from "@/features/campaign/lib/storage";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({
  params,
}: PageProps<"/admin/campaigns/[slug]">) {
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
    <Page>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>{campaign.settings.name}</PageTitle>
          <PageDescription>/campaign/{slug}</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <CopyPublicLinkButton slug={slug} />
        </PageActions>
      </PageHeader>
      <PageContent>
        <CampaignTabs
          settings={
            <div className="flex flex-col gap-8">
              <SettingsForm slug={slug} settings={campaign.settings} />
              <DangerZone slug={slug} />
            </div>
          }
          prizes={<PrizesEditor slug={slug} prizes={campaign.prizes} />}
          stats={<StatsTable stats={stats} />}
        />
      </PageContent>
    </Page>
  );
}
