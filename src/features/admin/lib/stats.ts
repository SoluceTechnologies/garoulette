import { computeStock } from "@/features/campaign/lib/stock";
import { loadCampaign } from "@/features/campaign/lib/storage";

export type PrizeStat = {
  id: string;
  name: string;
  initialStock: number;
  drawn: number;
  remaining: number;
};

export type CampaignStats = {
  totalDraws: number;
  prizes: PrizeStat[];
};

export async function campaignStats(slug: string): Promise<CampaignStats> {
  const { prizes, draws } = await loadCampaign(slug);
  const stock = computeStock(prizes, draws);
  return {
    totalDraws: draws.length,
    prizes: prizes.map((p) => {
      const drawn = draws.filter((d) => d.prizeId === p.id).length;
      const remaining = stock.find((x) => x.id === p.id)?.remaining ?? p.initialStock - drawn;
      return {
        id: p.id,
        name: p.name,
        initialStock: p.initialStock,
        drawn,
        remaining,
      };
    }),
  };
}
