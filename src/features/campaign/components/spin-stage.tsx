"use client";

import { Wheel, type WheelPrize } from "./wheel";

type SpinStageProps = {
  logoUrl?: string;
  welcomeMessage?: string;
  prizes: WheelPrize[];
  rotation: number;
  spinDurationMs: number;
  onSpinEnd: () => void;
  showCta: boolean;
  dimmed: boolean;
};

/** The "ready / spinning" surface: logo, welcome, the wheel, and the spin CTA. */
export function SpinStage({
  logoUrl,
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
      className={`flex min-h-full w-full flex-1 flex-col items-center justify-center gap-6 px-6 py-10 transition-opacity duration-300 sm:gap-8 ${
        dimmed ? "opacity-40" : "opacity-100"
      }`}
    >
      {logoUrl && (
        // biome-ignore lint/performance/noImgElement: campaign logo is a runtime volume file, not a build-time asset
        <img src={logoUrl} alt="" className="h-12 w-auto shrink-0 object-contain sm:h-16" />
      )}

      {welcomeMessage && (
        <h1 className="max-w-xl text-balance text-center font-black text-2xl text-foreground leading-tight tracking-tight sm:text-3xl">
          {welcomeMessage}
        </h1>
      )}

      <Wheel prizes={prizes} rotation={rotation} spinDurationMs={spinDurationMs} onSpinEnd={onSpinEnd} />

      <span
        className={`rounded-full bg-primary px-10 py-4 font-black text-lg text-primary-foreground uppercase tracking-wide shadow-[var(--shadow-pop)] transition-all duration-300 sm:text-xl ${
          showCta ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        Tap to spin
      </span>
    </div>
  );
}
