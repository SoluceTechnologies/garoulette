"use client";

import type { WheelPrize } from "./wheel";

export function PrizeReveal({ prize }: { prize: WheelPrize }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl bg-card px-8 py-10 text-center shadow-[var(--shadow-pop)]">
        <p className="font-bold text-muted-foreground text-sm uppercase tracking-wide">
          You won
        </p>
        {prize.imageUrl && (
          // biome-ignore lint/performance/noImgElement: prize images are runtime volume files, not build-time assets
          <img
            src={prize.imageUrl}
            alt=""
            className="h-36 w-36 rounded-2xl bg-muted object-contain p-3"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        )}
        <p className="text-balance font-black text-3xl text-primary leading-tight">
          {prize.name}
        </p>
        <p className="text-muted-foreground text-sm">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
