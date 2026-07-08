import { notFound } from "next/navigation";
import { computeStock, loadCampaign, prizeImageUrl, themeStyle } from "@/features/campaign";
import { CampaignScreen } from "@/features/campaign/components/campaign-screen";
import type { WheelPrize } from "@/features/campaign/components/wheel";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: PageProps<"/campaign/[slug]">) {
  const { slug } = await params;

  let campaign: Awaited<ReturnType<typeof loadCampaign>>;
  try {
    campaign = await loadCampaign(slug);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw err; // invalid JSON etc. -> error.tsx names the offending file
  }

  const { settings } = campaign;
  const expired = Boolean(settings.expiresAt && new Date(settings.expiresAt).getTime() < Date.now());
  const stock = computeStock(campaign.prizes, campaign.draws);
  const soldOut = stock.every((p) => p.effectiveWeight === 0);
  const initialStatus = expired ? "expired" : soldOut ? "soldOut" : "ready";

  const prizes: WheelPrize[] = campaign.prizes.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: prizeImageUrl(slug, p.image),
  }));

  const logoUrl = settings.theme?.logo ? prizeImageUrl(slug, settings.theme.logo) : undefined;

  return (
    <div className="flex min-h-full flex-1" style={themeStyle(settings)}>
      <CampaignScreen
        slug={slug}
        logoUrl={logoUrl}
        welcomeMessage={settings.welcomeMessage}
        resetDelaySeconds={settings.resetDelaySeconds ?? 6}
        prizes={prizes}
        initialStatus={initialStatus}
      />
    </div>
  );
}
