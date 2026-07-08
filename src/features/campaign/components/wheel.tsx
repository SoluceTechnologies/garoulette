"use client";

export type WheelPrize = {
  id: string;
  name: string;
  imageUrl: string;
  color?: string;
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
  const stops = prizes
    .map((prize, i) => `${prize.color ?? PALETTE[i % PALETTE.length]} ${i * seg}deg ${(i + 1) * seg}deg`)
    .join(", ");

  return (
    <div className="relative aspect-square w-full max-w-[min(80vmin,30rem)]">
      <div className="-translate-x-1/2 absolute top-[-4px] left-1/2 z-20 h-0 w-0 border-transparent border-t-[30px] border-t-foreground border-r-[18px] border-l-[18px]" />

      <div
        className="absolute inset-0 overflow-hidden rounded-full border-[6px] border-foreground shadow-[var(--shadow-pop)]"
        style={{
          background: `conic-gradient(from ${-seg / 2}deg, ${stops})`,
          transform: `rotate(${rotation}deg)`,
          transition: `transform ${spinDurationMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform") onSpinEnd();
        }}
      >
        {prizes.map((prize, i) => (
          <div
            key={prize.id}
            className="pointer-events-none absolute inset-0"
            style={{ transform: `rotate(${i * seg}deg)` }}
          >
            <div className="-translate-x-1/2 absolute top-[8%] left-1/2 flex w-[34%] flex-col items-center gap-1 text-center">
              {prize.imageUrl && (
                // biome-ignore lint/performance/noImgElement: prize images are runtime volume files, not build-time assets
                <img
                  src={prize.imageUrl}
                  alt=""
                  className="h-9 w-9 rounded object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <span className="font-bold text-white text-xs leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {prize.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-10 h-16 w-16 rounded-full border-[6px] border-foreground bg-card shadow-[var(--shadow-card)]" />
    </div>
  );
}
