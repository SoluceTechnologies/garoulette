"use client";

import { Wheel, type WheelPrize } from "./wheel";

type SpinStageProps = {
  welcomeMessage?: string;
  prizes: WheelPrize[];
  rotation: number;
  spinDurationMs: number;
  onSpinEnd: () => void;
  showCta: boolean;
  dimmed: boolean;
  spinning: boolean;
  tapAnywhere: boolean;
  onSpin: () => void;
};

export function SpinStage({
  welcomeMessage,
  prizes,
  rotation,
  spinDurationMs,
  onSpinEnd,
  showCta,
  dimmed,
  spinning,
  tapAnywhere,
  onSpin,
}: SpinStageProps) {
  const ctaClassName = `rounded-full bg-primary px-12 py-5 font-black text-primary-foreground text-xl uppercase tracking-wide shadow-[var(--shadow-pop)] transition-all duration-300 sm:text-2xl ${
    showCta
      ? "translate-y-0 opacity-100"
      : "pointer-events-none translate-y-2 opacity-0"
  }`;
  return (
    <div
      className={`flex h-full w-full flex-1 flex-col items-center justify-center gap-4 px-6 py-6 transition-opacity duration-300 sm:gap-8 sm:py-10 ${
        dimmed ? "opacity-40" : "opacity-100"
      }`}
    >
      {welcomeMessage && (
        <h1 className="max-w-7xl text-balance text-center font-black text-4xl text-foreground leading-[1.05] tracking-tight sm:text-6xl md:text-6xl">
          {welcomeMessage}
        </h1>
      )}

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <Wheel
          prizes={prizes}
          rotation={rotation}
          spinDurationMs={spinDurationMs}
          onSpinEnd={onSpinEnd}
          spinning={spinning}
        />
      </div>

      {tapAnywhere ? (
        <span className={ctaClassName}>Tap to spin</span>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSpin();
          }}
          className={ctaClassName}
        >
          Spin
        </button>
      )}
    </div>
  );
}
