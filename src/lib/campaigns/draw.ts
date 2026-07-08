import { computeStock } from "./stock";
import type { Draw, Prize } from "./types";

export type DrawResult = {
	prize: Prize;
	prizeIndex: number;
};

export function drawPrize(prizes: Prize[], draws: Draw[]): DrawResult | null {
	const stock = computeStock(prizes, draws);
	const totalWeight = stock.reduce((sum, p) => sum + p.effectiveWeight, 0);
	if (totalWeight === 0) return null;

	let threshold = Math.random() * totalWeight;
	for (const p of stock) {
		if (p.effectiveWeight === 0) continue;
		if (threshold < p.effectiveWeight) {
			return toResult(prizes, p.id);
		}
		threshold -= p.effectiveWeight;
	}

	// Floating-point fallback: last prize that still has stock.
	const last = [...stock].reverse().find((p) => p.effectiveWeight > 0);
	if (!last) return null;
	return toResult(prizes, last.id);
}

function toResult(prizes: Prize[], prizeId: string): DrawResult {
	const prizeIndex = prizes.findIndex((p) => p.id === prizeId);
	return { prize: prizes[prizeIndex], prizeIndex };
}
