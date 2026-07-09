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
};

/** The "ready / spinning" surface: welcome headline, the wheel, and the spin CTA. */
export function SpinStage({
  welcomeMessage,
  prizes,
  rotation,
  spinDurationMs,
  onSpinEnd,
  showCta,
  dimmed,
}: SpinStageProps) {
  return (
    <div
      className={`flex min-h-full w-full flex-1 flex-col items-center justify-center gap-6 px-6 py-14 transition-opacity duration-300 sm:gap-10 ${
        dimmed ? "opacity-40" : "opacity-100"
      }`}
    >
      {welcomeMessage && (
        <h1 className="max-w-7xl text-balance text-center font-black text-4xl text-foreground leading-[1.05] tracking-tight sm:text-6xl md:text-6xl">
          {welcomeMessage}
        </h1>
      )}

      <Wheel prizes={prizes} rotation={rotation} spinDurationMs={spinDurationMs} onSpinEnd={onSpinEnd} />

      <span
        className={`rounded-full bg-primary px-12 py-5 font-black text-primary-foreground text-xl uppercase tracking-wide shadow-[var(--shadow-pop)] transition-all duration-300 sm:text-2xl ${
          showCta ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        Tap to spin
      </span>
    </div>
  );
}
