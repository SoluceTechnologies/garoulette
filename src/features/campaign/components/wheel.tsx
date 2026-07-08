"use client";

import { cn } from "@/lib/utils";

export type WheelPrize = {
	id: string;
	name: string;
	imageUrl: string;
};

const PALETTE = ["#E21B3C", "#1368CE", "#26890C", "#FFA602", "#9C27B0", "#0FB9B1"];

type WheelProps = {
	prizes: WheelPrize[];
	rotation: number;
	spinDurationMs: number;
	onSpinEnd: () => void;
};

export function Wheel({ prizes, rotation, spinDurationMs, onSpinEnd }: WheelProps) {
	const seg = 360 / prizes.length;

	// Hard-stop conic gradient: one solid wedge per prize, first wedge centered at top.
	const stops = prizes
		.map((_, i) => {
			const color = PALETTE[i % PALETTE.length];
			return `${color} ${i * seg}deg ${(i + 1) * seg}deg`;
		})
		.join(", ");

	return (
		<div className="relative aspect-square w-full max-w-[80vmin]">
			{/* Pointer at 12 o'clock */}
			<div className="-translate-x-1/2 absolute top-0 left-1/2 z-20 h-0 w-0 border-transparent border-t-[36px] border-r-[22px] border-l-[22px] border-t-black" />

			{/* Rotating wheel */}
			<div
				className="absolute inset-0 rounded-full border-8 border-black shadow-2xl"
				style={{
					background: `conic-gradient(from ${-seg / 2}deg, ${stops})`,
					transform: `rotate(${rotation}deg)`,
					transition: `transform ${spinDurationMs}ms cubic-bezier(0.12, 0.8, 0.16, 1)`,
				}}
				onTransitionEnd={(e) => {
					if (e.propertyName === "transform") onSpinEnd();
				}}
			>
				{prizes.map((prize, i) => (
					<div
						key={prize.id}
						className="absolute top-1/2 left-1/2 origin-left"
						style={{
							transform: `rotate(${i * seg - 90}deg) translateX(6%)`,
						}}
					>
						<div
							className="flex w-[42%] max-w-[42%] items-center gap-2 font-bold text-white text-sm drop-shadow"
							style={{ transform: "translateY(-50%)" }}
						>
							{/* biome-ignore lint/performance/noImgElement: prize images are runtime volume files, not build-time assets */}
							<img
								src={prize.imageUrl}
								alt=""
								className="h-8 w-8 shrink-0 rounded object-contain"
								onError={(e) => {
									(e.currentTarget as HTMLImageElement).style.visibility = "hidden";
								}}
							/>
							<span className="truncate">{prize.name}</span>
						</div>
					</div>
				))}
			</div>

			{/* Hub */}
			<div
				className={cn(
					"-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-10",
					"h-16 w-16 rounded-full border-4 border-black bg-white shadow-lg",
				)}
			/>
		</div>
	);
}
