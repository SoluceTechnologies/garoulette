import type { Draw, Prize } from "../types";

export type PrizeStock = Prize & {
	remaining: number;
	effectiveWeight: number;
};

export function computeStock(prizes: Prize[], draws: Draw[]): PrizeStock[] {
	return prizes.map((prize) => {
		const used = draws.filter((d) => d.prizeId === prize.id).length;
		const remaining = prize.initialStock - used;
		return {
			...prize,
			remaining,
			effectiveWeight: remaining > 0 ? prize.weight : 0,
		};
	});
}
