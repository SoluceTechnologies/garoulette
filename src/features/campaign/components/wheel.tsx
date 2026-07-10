"use client";

export type WheelPrize = {
  id: string;
  name: string;
  imageUrl?: string;
  color?: string;
};

const PALETTE = [
  "#E21B3C",
  "#1368CE",
  "#26890C",
  "#FFA602",
  "#9C27B0",
  "#0FB9B1",
];

type WheelProps = {
  prizes: WheelPrize[];
  rotation: number;
  spinDurationMs: number;
  onSpinEnd: () => void;
  spinning: boolean;
};

export function Wheel({
  prizes,
  rotation,
  spinDurationMs,
  onSpinEnd,
  spinning,
}: WheelProps) {
  const seg = 360 / prizes.length;
  const stops = prizes
    .map(
      (prize, i) =>
        `${prize.color ?? PALETTE[i % PALETTE.length]} ${i * seg}deg ${(i + 1) * seg}deg`,
    )
    .join(", ");

  return (
    <div
      className={`relative aspect-square w-full max-w-[min(100vmin,43rem)] transition-transform duration-700 ease-out ${
        spinning ? "scale-105 sm:scale-110" : "scale-100"
      }`}
    >
      <div className="-translate-y-1/2 -left-4 absolute top-1/2 z-20 h-0 w-0 border-transparent border-b-[28px] border-l-[48px] border-l-foreground border-t-[28px] drop-shadow-[var(--shadow-card)]" />
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
            style={{ transform: `rotate(${i * seg + 90}deg)` }}
          >
            <div className="absolute inset-y-0 left-[8%] flex w-[34%] items-center justify-start gap-2">
              {prize.imageUrl && (
                <img
                  src={prize.imageUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded object-contain sm:h-9 sm:w-9"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              )}
              <span
                className={`line-clamp-2 min-w-0 flex-1 wrap-break-words font-bold text-sm text-white leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-lg md:text-2xl ${
                  prize.imageUrl ? "hidden sm:block" : ""
                }`}
              >
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
