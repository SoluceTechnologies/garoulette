import { notFound } from "next/navigation";
import { computeStock } from "@/features/campaign/lib/stock";
import { getAvailability } from "@/features/campaign/lib/availability";
import { loadCampaign } from "@/features/campaign/lib/storage";
import { resolveSoundUrls } from "@/features/campaign/lib/sounds";
import { prizeImageUrl } from "@/features/campaign/lib/images";
import { themeStyle } from "@/features/campaign/lib/theme";
import { CampaignScreen } from "@/features/campaign/components/campaign-screen";
import type { WheelPrize } from "@/features/campaign/components/wheel";

export const dynamic = "force-dynamic";

export default async function CampaignPage({
  params,
}: PageProps<"/campaign/[slug]">) {
  const { slug } = await params;

  let campaign: Awaited<ReturnType<typeof loadCampaign>>;
  try {
    campaign = await loadCampaign(slug);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") notFound();
    throw err;
  }

  const { settings } = campaign;
  const availability = getAvailability(settings);
  const stock = computeStock(campaign.prizes, campaign.draws);
  const soldOut = stock.every((p) => p.effectiveWeight === 0);
  const initialStatus =
    availability !== "active" ? availability : soldOut ? "soldOut" : "ready";

  const prizes: WheelPrize[] = campaign.prizes.map((p) => ({
    id: p.id,
    name: p.name,
    imageUrl: prizeImageUrl(slug, p.image),
    color: p.color,
  }));

  const logoUrl = settings.theme?.logo
    ? prizeImageUrl(slug, settings.theme.logo)
    : undefined;
  const soundUrls = await resolveSoundUrls(slug);

  return (
    <div className="flex min-h-full flex-1" style={themeStyle(settings)}>
      <CampaignScreen
        slug={slug}
        logoUrl={logoUrl}
        welcomeMessage={settings.welcomeMessage}
        resetDelaySeconds={settings.resetDelaySeconds ?? 6}
        spinDurationMs={(settings.spinDurationSeconds ?? 4.5) * 1000}
        prizes={prizes}
        soundUrls={soundUrls}
        initialStatus={initialStatus}
      />
    </div>
  );
}
