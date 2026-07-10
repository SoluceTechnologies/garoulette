import { NewCampaignForm } from "@/features/admin/components/forms/new-campaign.form";
import {
  Page,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/features/admin/components/layout/page";

export const dynamic = "force-dynamic";

export default function NewCampaignPage() {
  return (
    <Page>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>New campaign</PageTitle>
          <PageDescription>
            Create a prize wheel. You can tweak everything later.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <NewCampaignForm />
      </PageContent>
    </Page>
  );
}
