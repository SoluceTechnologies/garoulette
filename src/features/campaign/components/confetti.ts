import confetti from "canvas-confetti";

export function fireConfetti(): void {
	confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
	setTimeout(() => confetti({ particleCount: 80, spread: 120, startVelocity: 45 }), 200);
}
