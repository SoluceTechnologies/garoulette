import { NewCampaignForm } from "@/features/admin/components/new-campaign-form";

export const dynamic = "force-dynamic";

export default function NewCampaignPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-bold text-2xl">New campaign</h1>
      <NewCampaignForm />
    </div>
  );
}
