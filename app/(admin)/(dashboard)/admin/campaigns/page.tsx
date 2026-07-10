import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CampaignsTable } from "@/features/admin/components/campaigns/campaigns.table";
import { StatCards } from "@/features/admin/components/campaigns/stat-cards";
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
import { listCampaigns } from "@/features/campaign/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const campaigns = await listCampaigns();
  const rows = await Promise.all(
    campaigns.map(async (c) => {
      const stats = await campaignStats(c.slug);
      return {
        slug: c.slug,
        name: c.name,
        prizeCount: c.prizeCount,
        availability: c.availability,
        totalDraws: stats.totalDraws,
      };
    }),
  );

  const totals = {
    campaigns: rows.length,
    active: rows.filter((c) => c.availability === "active").length,
    prizes: rows.reduce((sum, c) => sum + c.prizeCount, 0),
    draws: rows.reduce((sum, c) => sum + c.totalDraws, 0),
  };

  return (
    <Page>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Campaigns</PageTitle>
          <PageDescription>Manage your prize wheels.</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <Button
            render={
              <Link href="/admin/campaigns/new">
                <Plus data-icon="inline-start" />
                New campaign
              </Link>
            }
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        <StatCards {...totals} />
        <CampaignsTable campaigns={rows} />
      </PageContent>
    </Page>
  );
}
